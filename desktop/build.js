/*
 * Buduje aplikację na komputer: dist/KadrStudio.exe (Windows, jeden plik z wbudowanym edytorem).
 *   npm run build:desktop      (najpierw: npm run build:web)
 * Kroki: blob Single Executable Application (Node.js) z plikami z docs/ → ikona i opis (resedit) → tryb okienkowy.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const B = path.join(__dirname, 'build');
const NODE_VERSION = process.versions.node;
const FUSE = 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2';
const step = (n, t) => console.log(`${n}/5 ${t}`);

fs.rmSync(B, { recursive: true, force: true });
fs.mkdirSync(B, { recursive: true });

step(1, 'Pliki edytora (docs/)');
const assets = {};
(function addDir(dir, prefix) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) addDir(p, `${prefix}/${f.name}`);
    else if (f.name !== 'sw.js' && f.name !== '.nojekyll') assets[`${prefix}/${f.name}`] = p;
  }
})(path.join(ROOT, 'docs'), 'docs');
console.log(`   ${Object.keys(assets).length} plików`);

step(2, 'Blob aplikacji (Node.js SEA)');
const seaConfig = { main: path.join(__dirname, 'main.js'), output: path.join(B, 'sea.blob'), disableExperimentalSEAWarning: true, useSnapshot: false, useCodeCache: false, assets };
fs.writeFileSync(path.join(B, 'sea-config.json'), JSON.stringify(seaConfig, null, 2));
execFileSync(process.execPath, ['--experimental-sea-config', path.join(B, 'sea-config.json')], { stdio: 'inherit' });

(async () => {
  step(3, `Node.js ${NODE_VERSION} dla Windows`);
  const nodeExe = await getWindowsNode();
  const target = path.join(B, 'KadrStudio.exe');
  step(4, 'Ikona, opis i wbudowanie edytora w plik');
  await brandExe(nodeExe, target, fs.readFileSync(path.join(B, 'sea.blob')));
  step(5, 'Tryb okienkowy (bez czarnego okna konsoli)');
  setWindowsGuiSubsystem(target);
  const out = path.join(ROOT, 'dist', 'KadrStudio.exe');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.copyFileSync(target, out);
  console.log(`Gotowe: dist/KadrStudio.exe (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
})().catch(e => { console.error(e); process.exit(1); });

/** Pobiera oficjalny node.exe tej samej wersji (pakiet node-win-x64 z rejestru npm). */
async function getWindowsNode() {
  const dir = path.join(__dirname, '.cache', `node-win-x64-${NODE_VERSION}`);
  const exe = path.join(dir, 'package', 'bin', 'node.exe');
  if (fs.existsSync(exe)) return exe;
  fs.mkdirSync(dir, { recursive: true });
  execFileSync('npm', ['pack', `node-win-x64@${NODE_VERSION}`, '--silent'], { cwd: dir, stdio: ['ignore', 'ignore', 'inherit'] });
  const tgz = fs.readdirSync(dir).find(f => f.endsWith('.tgz'));
  execFileSync('tar', ['xzf', tgz], { cwd: dir });
  return exe;
}

async function brandExe(src, dst, blob) {
  const ResEdit = await import('resedit');
  const exe = ResEdit.NtExecutable.from(fs.readFileSync(src), { ignoreCert: true });
  const res = ResEdit.NtExecutableResource.from(exe);
  const ico = ResEdit.Data.IconFile.from(fs.readFileSync(path.join(__dirname, 'icon.ico')));
  const groups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
  const gid = groups.length ? groups[0].id : 1;
  const glang = groups.length ? groups[0].lang : 1033;
  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, gid, glang, ico.icons.map(i => i.data));
  const vi = ResEdit.Resource.VersionInfo.fromEntries(res.entries)[0] || ResEdit.Resource.VersionInfo.createEmpty();
  vi.setFileVersion(1, 1, 0, 0, 1033);
  vi.setProductVersion(1, 1, 0, 0, 1033);
  const langs = vi.getAllLanguagesForStringValues();
  const lang = langs[0] || { lang: 1033, codepage: 1200 };
  vi.setStringValues(lang, {
    CompanyName: 'Kadr Studio', FileDescription: 'Kadr Studio – edytor wideo', ProductName: 'Kadr Studio',
    InternalName: 'KadrStudio', OriginalFilename: 'KadrStudio.exe', FileVersion: '1.1.0', ProductVersion: '1.1.0', LegalCopyright: 'Kadr Studio'
  });
  vi.outputToResourceEntries(res.entries);
  res.entries = res.entries.filter(e => !(e.type === 10 && e.id === 'NODE_SEA_BLOB'));
  res.entries.push({ type: 10, id: 'NODE_SEA_BLOB', lang: 0, codepage: 0, bin: blob.buffer.slice(blob.byteOffset, blob.byteOffset + blob.byteLength) });
  res.outputResource(exe);
  const out = Buffer.from(exe.generate());
  const off = out.indexOf(FUSE + ':0');
  if (off < 0 || out.indexOf(FUSE + ':0', off + 1) >= 0) throw new Error('Nie znaleziono bezpiecznika SEA w node.exe');
  out.write('1', off + FUSE.length + 1, 'latin1');
  fs.writeFileSync(dst, out);
}

/** Zmienia podsystem PE z konsolowego (3) na okienkowy (2) – brak czarnego okna. */
function setWindowsGuiSubsystem(file) {
  const fd = fs.openSync(file, 'r+');
  const buf = Buffer.alloc(4);
  fs.readSync(fd, buf, 0, 4, 0x3c);
  const pe = buf.readUInt32LE(0);
  const sig = Buffer.alloc(4);
  fs.readSync(fd, sig, 0, 4, pe);
  if (sig.toString('binary') !== 'PE\0\0') throw new Error('To nie jest plik PE');
  const subsystemOffset = pe + 24 + 68;
  const cur = Buffer.alloc(2);
  fs.readSync(fd, cur, 0, 2, subsystemOffset);
  if (cur.readUInt16LE(0) !== 3 && cur.readUInt16LE(0) !== 2) throw new Error('Nieoczekiwany podsystem PE: ' + cur.readUInt16LE(0));
  const two = Buffer.alloc(2); two.writeUInt16LE(2, 0);
  fs.writeSync(fd, two, 0, 2, subsystemOffset);
  fs.closeSync(fd);
}
