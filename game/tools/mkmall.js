// AVM verisi: metinagaoglu/Turkiye-AVM-Listesi (avmler.json), ilçe ataması HDX COD-AB-TUR sınırlarıyla. Veri dosyaları JSON olarak okunur.
const fs = require('fs');
const [avmF, topoF, csvF, outF] = process.argv.slice(2);
const K = 1200, LON0 = 25.6, LAT0 = 42.2, CX = Math.cos(39 * Math.PI / 180);
const prj = (lon, lat) => [(lon - LON0) * CX * K, (LAT0 - lat) * K];
const avm = JSON.parse(fs.readFileSync(avmF, 'utf8'));
const topo = JSON.parse(fs.readFileSync(topoF, 'utf8')); const tf = topo.transform;
const arcs = topo.arcs.map(a => { let x = 0, y = 0; return a.map(p => { if (tf) { x += p[0]; y += p[1]; return prj(x * tf.scale[0] + tf.translate[0], y * tf.scale[1] + tf.translate[1]); } return prj(p[0], p[1]); }); });
const arcPts = i => i >= 0 ? arcs[i] : arcs[~i].slice().reverse();
const ringPts = r => { const o = []; r.forEach((ai, k) => { const p = arcPts(ai); o.push(...(k ? p.slice(1) : p)); }); return o; };
const lines = fs.readFileSync(csvF, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean); const hdr = lines[0].split(',');
const info = {}; for (const l of lines.slice(1)) { const v = l.split(','); const o = {}; hdr.forEach((h, i) => o[h] = v[i]); info[o.id] = o; }
const dists = []; for (const g of Object.values(topo.objects)[0].geometries) { const r = info[g.properties.id]; if (!r) continue; const polys = g.type === 'Polygon' ? [g.arcs] : g.arcs; dists.push({ plate: r.plate_code, name: r.name === 'Gazi Osmanpaşa' ? 'Gaziosmanpaşa' : r.name, rings: polys.map(p => p.map(ringPts)) }); }
function inside(rings, x, y) { let c = false; for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
const clean = n => n.replace(/\s+/g, ' ').replace(/ Alışveriş ve Yaşam Merkezi| Alışveriş ve Eğlence Merkezi| Alışveriş Merkezi| Alışveriş Mer.*$| AVM Alışveriş.*$/i, '').replace(/\s*-\s*$/, '').trim();
const out = [], seen = new Set();
for (const r of avm) {
  const m = /center=(-?\d+\.\d+),(-?\d+\.\d+)/.exec(r.map_link || ''); if (!m) continue;
  const lat = +m[1], lon = +m[2]; const plate = String(r.city_id).padStart(2, '0'); const [x, y] = prj(lon, lat);
  let d = dists.find(D => D.plate === plate && D.rings.some(rs => inside(rs, x, y))); if (!d) d = dists.find(D => D.rings.some(rs => inside(rs, x, y)));
  if (!d) { console.error('ilçe yok', r.name); continue; }
  let n = clean(r.name); if (!/avm|park|center|mall|outlet|plaza|city|çarşı/i.test(n) && n.split(' ').length < 3) n += ' AVM';
  const key = n.toLowerCase(); if (seen.has(key)) continue; seen.add(key);
  const shops = (r.shop || '').split(',').filter(s => s.trim() && !/Mağazalar/.test(s)).length;
  const size = shops > 120 || /mall of|forum|cevahir|akbatı|marmara park|istinye|zorlu|emaar|ankamall|optimum|vialand|kentpark|cepa/i.test(n) ? 3 : shops > 50 ? 2 : 1;
  out.push({ id: 'm' + r.id, n, p: d.plate, dn: d.name, x: Math.round(x), y: Math.round(y), s: size });
}
fs.writeFileSync(outF, '/* AVM listesi: metinagaoglu/Turkiye-AVM-Listesi verisinden; konum ve ilçe eşleşmesi otomatik. */\nconst MALLS = ' + JSON.stringify(out) + ';\n');
const by = {}; out.forEach(m => by[m.p] = (by[m.p] || 0) + 1);
console.log('malls', out.length, 'size3', out.filter(m => m.s === 3).length, JSON.stringify(by));
console.log(out.filter(m => m.p === '34').slice(0, 12).map(m => m.n + '@' + m.dn + ':' + m.s).join(' | '));
