// İstanbul kıyı çizgisi: Natural Earth 10m verisinden, kutuya kırpılmış ve İstanbul harita koordinatına projeksiyonlu.
const fs = require('fs');
const w = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const [sx, sy] = w.transform.scale, [tx, ty] = w.transform.translate;
const arcs = w.arcs.map(a => { let x = 0, y = 0; return a.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; }); });
const arc = i => i >= 0 ? arcs[i] : arcs[~i].slice().reverse();
const ring = idx => { const out = []; idx.forEach((i, k) => { const a = arc(i); out.push(...(k ? a.slice(1) : a)); }); return out; };
const PR = (lat, lon) => [((lon - 28.45) * 151), ((41.30 - lat) * 200)];
const B = { lo0: 27.9, lo1: 30.0, la0: 40.55, la1: 41.55 };
const g = w.objects.countries.geometries.find(x => x.id === '792');
const polys = g.type === 'Polygon' ? [g.arcs] : g.arcs;
let d = '';
for (const p of polys) {
  const r = ring(p[0]); if (!r.some(([lo, la]) => lo > 28 && lo < 29.9 && la > 40.6 && la < 41.5)) continue;
  const out = []; let last = null;
  for (let [lo, la] of r) { lo = Math.max(B.lo0, Math.min(B.lo1, lo)); la = Math.max(B.la0, Math.min(B.la1, la)); const [x, y] = PR(la, lo); if (last && Math.abs(x - last[0]) < .12 && Math.abs(y - last[1]) < .12) continue; out.push(x.toFixed(2) + ' ' + y.toFixed(2)); last = [x, y]; }
  d += 'M' + out.join('L') + 'Z';
}
const s = fs.readFileSync(process.argv[3], 'utf8').replace(/;\n?$/, '');
const geo = JSON.parse(s.slice('const GEO = '.length)); geo.ist = d;
fs.writeFileSync(process.argv[3], 'const GEO = ' + JSON.stringify(geo) + ';\n');
console.log('ist path', d.length);
