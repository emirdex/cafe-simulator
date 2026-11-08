// world-atlas TopoJSON verisini (Natural Earth, kamu malı) sadece veri olarak okuyup SVG yolu üretir.
const fs = require('fs');
const w = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const [sx, sy] = w.transform.scale, [tx, ty] = w.transform.translate;
const arcs = w.arcs.map(a => { let x = 0, y = 0; return a.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; }); });
const arc = i => i >= 0 ? arcs[i] : arcs[~i].slice().reverse();
const ring = idx => { const out = []; idx.forEach((i, k) => { const a = arc(i); out.push(...(k ? a.slice(1) : a)); }); return out; };
const PT = (lat, lon) => [((lon - 25.6) * 7.77), ((42.3 - lat) * 10)];
function toPath(g, minLen) {
  const polys = g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : [];
  let d = '';
  for (const poly of polys) {
    const r = ring(poly[0]); if (r.length < minLen) continue;
    let last = null; const out = [];
    for (const [lon, lat] of r) { const [x, y] = PT(lat, lon); if (last && Math.abs(x - last[0]) < .3 && Math.abs(y - last[1]) < .3) continue; out.push(x.toFixed(1) + ' ' + y.toFixed(1)); last = [x, y]; }
    if (out.length >= 3) d += 'M' + out.join('L') + 'Z';
  }
  return d;
}
const want = { '792': 'tr', '300': 'gr', '100': 'bg', '268': 'ge', '051': 'am', '364': 'ir', '368': 'iq', '760': 'sy', '196': 'cy', '031': 'az', '642': 'ro', '422': 'lb', '807': 'mk', '643': 'ru', '804': 'ua' };
const res = {};
for (const g of w.objects.countries.geometries) { const k = want[g.id]; if (k) res[k] = toPath(g, k === 'tr' ? 4 : 12); }
fs.writeFileSync(process.argv[3], 'const GEO = ' + JSON.stringify(res) + ';\n');
console.log(Object.entries(res).map(([k, v]) => k + ':' + v.length).join(' '));
