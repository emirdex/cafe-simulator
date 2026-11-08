// İl şekilleri: turkey-map-react (MIT, Erdi Gökçe) verisi, ilçe adları: memleketim-tr-cities (MIT). Dosyalar metin olarak okunur, kod çalıştırılmaz.
const fs = require('fs');
const [idxF, geoF, distF, outF] = process.argv.slice(2);
const idx = fs.readFileSync(idxF, 'utf8'), geo = fs.readFileSync(geoF, 'utf8');
const dists = JSON.parse(fs.readFileSync(distF, 'utf8'));
const re = /"id":\s*"([^"]+)",\s*"plateNumber":\s*(\d+),\s*"name":\s*"([^"]+)",\s*"path":\s*"([^"]+)"/g;
const prov = {}; let m;
while ((m = re.exec(idx))) prov[m[1]] = { plate: String(m[2]).padStart(2, '0'), n: m[3], d: m[4] };
const gre = /(\w+):\s*\{\s*region:\s*'([^']+)',\s*centroid:\s*\{\s*x:\s*([\d.]+),\s*y:\s*([\d.]+)\s*\}[\s\S]*?population:\s*(\d+)/g;
while ((m = gre.exec(geo))) if (prov[m[1]]) Object.assign(prov[m[1]], { c: [+m[3], +m[4]], pop: +m[5], region: m[2] });
function rings(d) { const t = d.match(/[MCLz]|-?[\d.]+(?:e-?\d+)?/gi); const rs = []; let cur = null, i = 0, cmd = ''; const num = () => +t[i++];
  while (i < t.length) { if (/[MCLz]/i.test(t[i])) cmd = t[i++]; if (cmd === 'M') { cur = [[num(), num()]]; rs.push(cur); cmd = 'L'; } else if (cmd === 'L') cur.push([num(), num()]); else if (cmd === 'C') { num(); num(); num(); num(); cur.push([num(), num()]); } else if (/z/i.test(cmd)) { cmd = ''; } else i++; }
  return rs; }
function inside(rs, x, y) { let c = false; for (const r of rs) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const CENTRAL = { '01': 'Seyhan,Yüreğir,Çukurova,Sarıçam', '06': 'Çankaya,Keçiören,Yenimahalle,Mamak,Etimesgut,Altındağ,Sincan,Gölbaşı,Pursaklar', '07': 'Muratpaşa,Konyaaltı,Kepez,Döşemealtı,Aksu', '09': 'Efeler', '10': 'Altıeylül,Karesi', '16': 'Osmangazi,Nilüfer,Yıldırım,Gürsu,Kestel', '20': 'Pamukkale,Merkezefendi', '21': 'Bağlar,Kayapınar,Sur,Yenişehir', '25': 'Yakutiye,Palandöken,Aziziye', '26': 'Odunpazarı,Tepebaşı', '27': 'Şahinbey,Şehitkamil', '31': 'Antakya,Defne', '33': 'Yenişehir,Mezitli,Toroslar,Akdeniz', '35': 'Konak,Karşıyaka,Bornova,Buca,Bayraklı,Çiğli,Karabağlar,Balçova,Narlıdere,Gaziemir', '38': 'Melikgazi,Kocasinan,Talas', '41': 'İzmit,Başiskele,Kartepe,Körfez,Derince', '42': 'Selçuklu,Meram,Karatay', '44': 'Battalgazi,Yeşilyurt', '45': 'Şehzadeler,Yunusemre', '46': 'Onikişubat,Dulkadiroğlu', '47': 'Artuklu', '48': 'Menteşe', '52': 'Altınordu', '54': 'Adapazarı,Serdivan,Erenler', '55': 'İlkadım,Atakum,Canik', '59': 'Süleymanpaşa', '61': 'Ortahisar', '63': 'Haliliye,Eyyübiye,Karaköprü', '65': 'İpekyolu,Tuşba,Edremit' };
const P = {}, DS = {}; let all = [];
for (const k in prov) { const p = prov[k]; const rs = rings(p.d); const pts = rs.flat(); const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
  const bb = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; all.push(bb);
  const d2 = p.d.replace(/-?\d+\.\d+/g, v => (+v).toFixed(1)).replace(/ C /g, 'C').replace(/ L /g, 'L').replace(/ z/g, 'z').replace(/M /g, 'M');
  P[p.plate] = { id: k, n: p.n, d: d2, c: p.c, bb: bb.map(v => +v.toFixed(1)), pop: p.pop };
  const names = dists.filter(x => x.plate === p.plate).map(x => x.name);
  const cset = new Set((CENTRAL[p.plate] || 'Merkez').split(',')); const central = names.filter(n => cset.has(n)); const rural = names.filter(n => !cset.has(n));
  const area = (bb[2] - bb[0]) * (bb[3] - bb[1]); const step = Math.sqrt(area / Math.max(40, names.length * 14)); const cand = [];
  for (let y = bb[1] + step / 2; y < bb[3]; y += step) for (let x = bb[0] + step / 2; x < bb[2]; x += step) { const jx = x + (rnd() - .5) * step * .7, jy = y + (rnd() - .5) * step * .7; if (inside(rs, jx, jy)) cand.push([jx, jy]); }
  if (!cand.length) cand.push(p.c.slice());
  const chosen = []; const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const span = Math.max(bb[2] - bb[0], bb[3] - bb[1]);
  // merkez ilçeler: merkeze yakın, birbirinden ayrık
  const near = cand.filter(c => dist(c, p.c) < span * .16).sort((a, b) => dist(a, p.c) - dist(b, p.c));
  for (const n of central) { let best = null, bd = -1; for (const c of (near.length ? near : cand)) { if (chosen.some(ch => ch.p === c)) continue; const md = chosen.length ? Math.min(...chosen.map(ch => dist(ch.p, c))) : 1e9; const sc = Math.min(md, span * .08) - dist(c, p.c) * .4; if (sc > bd) { bd = sc; best = c; } } chosen.push({ n, p: best || p.c, c: 1 }); }
  if (!central.length) chosen.push({ n: p.n + ' Merkez', p: p.c, c: 1 });
  for (const n of rural) { let best = null, bd = -1; for (const c of cand) { const md = Math.min(...chosen.map(ch => dist(ch.p, c))); if (md > bd) { bd = md; best = c; } } chosen.push({ n, p: best, c: 0 }); }
  DS[p.plate] = chosen.map(ch => [ch.n, +ch.p[0].toFixed(1), +ch.p[1].toFixed(1), ch.c]);
}
const vb = [Math.min(...all.map(b => b[0])), Math.min(...all.map(b => b[1])), Math.max(...all.map(b => b[2])), Math.max(...all.map(b => b[3]))].map(v => +v.toFixed(1));
fs.writeFileSync(outF, '/* İl sınırları: turkey-map-react (MIT, © 2020 Erdi Gökçe). İlçe adları: memleketim-tr-cities (MIT). İlçe konumları yaklaşık, oyun içi yerleşimdir. */\nconst TRD = ' + JSON.stringify({ vb, p: P, ds: DS }) + ';\n');
console.log('provinces', Object.keys(P).length, 'districts', Object.values(DS).reduce((a, x) => a + x.length, 0), 'vb', vb.join(' '), 'bytes', fs.statSync(outF).size);
