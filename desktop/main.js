/*
 * Kadr Studio – aplikacja na komputer (Windows).
 * Uruchamia mały lokalny serwer z plikami edytora i otwiera go we własnym oknie
 * (Microsoft Edge lub Chrome w trybie aplikacji, bez pasków przeglądarki).
 * Nic nie jest wysyłane do internetu – filmy zostają na komputerze.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const isWin = process.platform === 'win32';
const dataDir = path.join(process.env.LOCALAPPDATA || process.env.APPDATA || path.join(os.homedir(), '.config'), 'KadrStudio');
fs.mkdirSync(dataDir, { recursive: true });
const logFile = path.join(dataDir, 'log.txt');
const log = (...a) => { try { fs.appendFileSync(logFile, `${new Date().toISOString()} ${a.join(' ')}\n`); } catch { /* */ } };
function showError(msg) {
  log('BŁĄD', msg);
  if (isWin) {
    const text = String(msg).replace(/["'\\\r\n]/g, ' ').slice(0, 400);
    spawn('mshta', [`javascript:alert("Kadr Studio: ${text}");close()`], { windowsHide: true, detached: true, stdio: 'ignore' }).unref();
  } else console.error(msg);
}
process.on('uncaughtException', e => { showError(e && e.stack || e); setTimeout(() => process.exit(1), 3000); });

let sea = null;
try { sea = require('node:sea'); if (!sea.isSea()) sea = null; } catch { sea = null; }
const DOCS = path.join(__dirname, '..', 'docs');
function readFile(rel) {
  if (sea) { try { return Buffer.from(sea.getAsset('docs/' + rel)); } catch { return null; } }
  const p = path.normalize(path.join(DOCS, rel));
  if (!p.startsWith(DOCS)) return null;
  try { return fs.readFileSync(p); } catch { return null; }
}
const MIME = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', wasm: 'application/wasm', json: 'application/json', webmanifest: 'application/manifest+json', svg: 'image/svg+xml', png: 'image/png', woff2: 'font/woff2', txt: 'text/plain; charset=utf-8' };

const PORTS = Array.from({ length: 15 }, (_, i) => 47811 + i);
let lastAlive = 0;

function probe(port) {
  return new Promise(resolve => {
    const req = http.get({ host: '127.0.0.1', port, path: '/__kadr', timeout: 700 }, res => { let b = ''; res.on('data', d => { b += d; }); res.on('end', () => resolve(b === 'kadr-studio')); });
    req.on('error', () => resolve(false)); req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}
function serve(port) {
  return new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      const url = decodeURIComponent((req.url || '/').split('?')[0]);
      if (url === '/__kadr') { res.end('kadr-studio'); return; }
      if (url === '/__alive') { lastAlive = Date.now(); res.writeHead(204); res.end(); return; }
      const rel = url === '/' ? 'index.html' : url.replace(/^\/+/, '');
      const data = readFile(rel);
      if (!data) { res.writeHead(404); res.end('Brak pliku'); return; }
      res.writeHead(200, { 'Content-Type': MIME[rel.split('.').pop()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(data);
    });
    srv.once('error', reject);
    srv.listen(port, '127.0.0.1', () => resolve(srv));
  });
}
function findBrowser() {
  if (!isWin) {
    for (const p of ['/usr/bin/microsoft-edge', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']) if (fs.existsSync(p)) return p;
    return null;
  }
  const roots = [process.env['ProgramFiles(x86)'], process.env.ProgramFiles, process.env.LOCALAPPDATA].filter(Boolean);
  for (const r of ['Microsoft\\Edge\\Application\\msedge.exe', 'Google\\Chrome\\Application\\chrome.exe', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe'])
    for (const root of roots) { const p = path.join(root, r); if (fs.existsSync(p)) return p; }
  return null;
}
function openWindow(port) {
  const url = `http://127.0.0.1:${port}/`;
  const browser = findBrowser();
  if (browser) {
    const child = spawn(browser, [`--app=${url}`, `--user-data-dir=${path.join(dataDir, 'okno')}`, '--start-maximized', '--window-size=1440,900',
      '--no-first-run', '--no-default-browser-check', '--disable-features=Translate,msEdgeSidebarV2', '--autoplay-policy=no-user-gesture-required', '--lang=pl'], { stdio: 'ignore' });
    child.on('error', e => log('Nie udało się otworzyć okna:', e.message));
    log('Okno:', browser); return child;
  }
  log('Brak Edge/Chrome – otwieram domyślną przeglądarkę');
  if (isWin) spawn('cmd', ['/c', 'start', '', url], { stdio: 'ignore', windowsHide: true });
  else spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [url], { stdio: 'ignore' });
  return null;
}

(async () => {
  log('Start', process.version, sea ? '(exe)' : '(dev)');
  for (const p of PORTS) if (await probe(p)) { openWindow(p); setTimeout(() => process.exit(0), 1500); return; }
  let port = null;
  for (const p of PORTS) { try { await serve(p); port = p; break; } catch { /* zajęty */ } }
  if (!port) throw new Error('Nie udało się uruchomić aplikacji (porty zajęte).');
  log('Serwer na porcie', port);
  if (process.argv.includes('--no-window')) return;
  const started = Date.now();
  const child = openWindow(port);
  if (child) child.on('exit', () => { if (Date.now() - started > 8000) { log('Okno zamknięte'); process.exit(0); } });
  setInterval(() => {
    const idle = Date.now() - (lastAlive || started);
    if (idle > (lastAlive ? 180000 : 300000)) { log('Brak okna – zamykam'); process.exit(0); }
  }, 5000);
})();
