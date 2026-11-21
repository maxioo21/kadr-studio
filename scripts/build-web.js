/*
 * Buduje wersję do pobrania / GitHub Pages w folderze docs/:
 * index.html (pełna strona), manifest, service worker (działa offline), ikony.
 * Wymaga: node scripts/fonts.js (raz) oraz Playwright (ikony).
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const VERSION = require(path.join(ROOT, 'package.json')).version;

const src = fs.readFileSync(path.join(ROOT, 'src', 'kadr.html'), 'utf8');
const fontsLink = /<link rel="preconnect" href="https:\/\/fonts.googleapis.com">\s*<link rel="preconnect" href="https:\/\/fonts.gstatic.com" crossorigin>\s*<link rel="stylesheet" href="https:\/\/fonts.googleapis.com[^"]+">/;
if (!fontsLink.test(src)) throw new Error('Nie znaleziono linku do czcionek w src/kadr.html');
const body = src.replace(fontsLink, '<link rel="stylesheet" href="fonts/fonts.css">');
const head = `<!doctype html><html lang="pl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="FakeTok – darmowy edytor wideo: efekty, przejścia, filtry, napisy, usuwanie tła AI i eksport do MP4.">
<meta name="theme-color" content="#0c0d11">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon-192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<style>:root{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>
</head><body>`;
fs.writeFileSync(path.join(DOCS, 'index.html'), head + body + '</body></html>');

fs.copyFileSync(path.join(ROOT, 'src', 'icon.svg'), path.join(DOCS, 'icon.svg'));
fs.writeFileSync(path.join(DOCS, 'manifest.webmanifest'), JSON.stringify({
  name: 'FakeTok', short_name: 'FakeTok', description: 'Edytor wideo: efekty, przejścia, filtry, napisy i usuwanie tła',
  lang: 'pl', start_url: './', scope: './', display: 'standalone', background_color: '#0c0d11', theme_color: '#0c0d11',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }
  ]
}, null, 2));

const files = [];
(function walk(d, pre) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const rel = pre + f.name; if (f.isDirectory()) walk(path.join(d, f.name), rel + '/'); else if (f.name !== 'sw.js' && f.name !== '.nojekyll') files.push(rel); } })(DOCS, '');
fs.writeFileSync(path.join(DOCS, 'sw.js'), `/* FakeTok – praca offline */
const CACHE = 'faketok-${VERSION}-${Date.now().toString(36)}';
const FILES = ${JSON.stringify(['./', ...files])};
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
});
`);
fs.writeFileSync(path.join(DOCS, '.nojekyll'), '');

(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch(); const page = await browser.newPage();
  const shot = async (svgFile, px, out) => {
    const svg = fs.readFileSync(path.join(ROOT, 'src', svgFile), 'utf8');
    await page.setViewportSize({ width: px, height: px });
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${px}" height="${px}" `)}</body></html>`);
    const buf = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: px, height: px } });
    if (out) fs.writeFileSync(out, buf); return buf;
  };
  await shot('icon.svg', 192, path.join(DOCS, 'icon-192.png'));
  await shot('icon.svg', 512, path.join(DOCS, 'icon-512.png'));
  await shot('icon-maskable.svg', 512, path.join(DOCS, 'icon-maskable-512.png'));
  // ikony dla Androida i Windows
  const sizes = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  for (const [dpi, px] of Object.entries(sizes)) { const d = path.join(ROOT, 'android', 'res', `mipmap-${dpi}`); fs.mkdirSync(d, { recursive: true }); await shot('icon.svg', px, path.join(d, 'ic_launcher.png')); }
  const icoSizes = [16, 24, 32, 48, 64, 128, 256]; const pngs = [];
  for (const px of icoSizes) pngs.push(await shot('icon.svg', px));
  await browser.close();
  const header = Buffer.alloc(6 + 16 * icoSizes.length); header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(icoSizes.length, 4);
  let off = header.length;
  icoSizes.forEach((px, i) => { const e = 6 + i * 16; header.writeUInt8(px >= 256 ? 0 : px, e); header.writeUInt8(px >= 256 ? 0 : px, e + 1); header.writeUInt16LE(1, e + 4); header.writeUInt16LE(32, e + 6); header.writeUInt32LE(pngs[i].length, e + 8); header.writeUInt32LE(off, e + 12); off += pngs[i].length; });
  fs.mkdirSync(path.join(ROOT, 'desktop', 'build'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'desktop', 'icon.ico'), Buffer.concat([header, ...pngs]));
  console.log(`Gotowe: docs/ (${files.length + 1} plików w pamięci offline)`);
})();
