/* Pobiera czcionki Google (tylko alfabet łaciński + polskie znaki) do docs/fonts, żeby aplikacja działała offline. */
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'docs', 'fonts');
const FAMILIES = 'family=Inter:wght@400;500;600;700;800&family=Unbounded:wght@500;700&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&family=Montserrat:wght@500;800;900&family=Bebas+Neue&family=Anton&family=Pacifico&family=Lobster&family=Permanent+Marker&family=Bangers&family=Playfair+Display:ital,wght@1,700&family=Caveat:wght@700&family=Rubik+Mono+One&family=Poppins:wght@600;800;900&family=Oswald:wght@600&family=Bungee&family=Righteous&family=Monoton&family=Press+Start+2P&family=Archivo+Black&family=Dancing+Script:wght@700&display=swap';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
(async () => {
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
  const css = await (await fetch('https://fonts.googleapis.com/css2?' + FAMILIES, { headers: { 'User-Agent': UA } })).text();
  const blocks = css.split('/* ').slice(1).map(b => ({ subset: b.slice(0, b.indexOf(' */')), body: b.slice(b.indexOf('*/') + 2) }));
  let out = '/* Czcionki: Google Fonts (licencja SIL Open Font License) */\n';
  let n = 0;
  for (const b of blocks) {
    if (b.subset !== 'latin' && b.subset !== 'latin-ext') continue;
    const fam = /font-family: '([^']+)'/.exec(b.body)[1], w = /font-weight: (\d+)/.exec(b.body)[1], st = /font-style: (\w+)/.exec(b.body)[1];
    const url = /url\((https:[^)]+)\)/.exec(b.body)[1];
    const file = `${fam.replace(/\s+/g, '')}-${w}${st === 'italic' ? 'i' : ''}-${b.subset}.woff2`;
    if (!fs.existsSync(path.join(OUT, file))) fs.writeFileSync(path.join(OUT, file), Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer()));
    out += b.body.replace(url, file).trim() + '\n'; n++;
  }
  fs.writeFileSync(path.join(OUT, 'fonts.css'), out);
  console.log(`Czcionki: ${n} plików`);
})();
