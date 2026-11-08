// İl/ilçe sınırları: HDX COD-AB-TUR (OCHA, CC BY-IGO), ttezer/turkiye-harita-verisi paketinden. Veri dosyaları JSON/CSV olarak okunur, paket kodu çalıştırılmaz.
const fs = require('fs');
const [topoF, csvF, pcsvF, outF, tolS] = process.argv.slice(2);
const TOL = +(tolS || 1.2), K = 1200, LON0 = 25.6, LAT0 = 42.2, CX = Math.cos(39 * Math.PI / 180);
const prj = (lon, lat) => [(lon - LON0) * CX * K, (LAT0 - lat) * K];
const topo = JSON.parse(fs.readFileSync(topoF, 'utf8'));
function csv(f) { const t = fs.readFileSync(f, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean); const h = t[0].split(','); return t.slice(1).map(l => { const v = []; let cur = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === ',' && !q) { v.push(cur); cur = ''; } else cur += ch; } v.push(cur); const o = {}; h.forEach((k, i) => o[k] = v[i]); return o; }); }
const drows = csv(csvF), info = {}; drows.forEach(r => info[r.id] = r);
const prows = csv(pcsvF), pinfo = {}; prows.forEach(r => pinfo[r.plate_code] = r);
// arkları çöz (transform varsa delta)
const tf = topo.transform;
const arcs = topo.arcs.map(a => { let x = 0, y = 0; return a.map(p => { if (tf) { x += p[0]; y += p[1]; return prj(x * tf.scale[0] + tf.translate[0], y * tf.scale[1] + tf.translate[1]); } return prj(p[0], p[1]); }); });
function dp(pts, tol) { if (pts.length < 3) return pts; const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1; const st = [[0, pts.length - 1]];
  while (st.length) { const [a, b] = st.pop(); const [ax, ay] = pts[a], [bx, by] = pts[b]; const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-9; let md = -1, mi = -1;
    for (let i = a + 1; i < b; i++) { const d = L > 1e-9 ? Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / L : Math.hypot(pts[i][0] - ax, pts[i][1] - ay); if (d > md) { md = d; mi = i; } }
    if (md > tol) { keep[mi] = 1; st.push([a, mi], [mi, b]); } }
  return pts.filter((_, i) => keep[i]); }
const sarcs = arcs.map(a => { let s = dp(a, TOL).map(p => [Math.round(p[0]), Math.round(p[1])]); s = s.filter((p, i) => i === 0 || p[0] !== s[i - 1][0] || p[1] !== s[i - 1][1]); return s; });
const arcPts = i => i >= 0 ? sarcs[i] : sarcs[~i].slice().reverse();
function ringPts(r) { const out = []; r.forEach((ai, k) => { const p = arcPts(ai); out.push(...(k ? p.slice(1) : p)); }); return out; }
function pathOf(rings) { return rings.filter(r => r.length > 2).map(r => { let s = 'M' + r[0][0] + ' ' + r[0][1]; let px = r[0][0], py = r[0][1], seg = '';
  for (let i = 1; i < r.length; i++) { const dx = r[i][0] - px, dy = r[i][1] - py; seg += (dx < 0 || !seg ? '' : ' ') + dx + (dy < 0 ? '' : ' ') + dy; px = r[i][0]; py = r[i][1]; } return s + 'l' + seg + 'z'; }).join(''); }
function area(r) { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return a / 2; }
function inside(rs, x, y) { let c = false; for (const r of rs) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
function segD(x, y, rs) { let m = 1e18; for (const r of rs) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [ax, ay] = r[j], [bx, by] = r[i]; const dx = bx - ax, dy = by - ay; const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1))); m = Math.min(m, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return m; }
function labelPt(rs) { // en büyük halka içinde, kenara en uzak ızgara noktası
  const big = rs.slice().sort((a, b) => Math.abs(area(b)) - Math.abs(area(a)))[0]; const xs = big.map(p => p[0]), ys = big.map(p => p[1]);
  const bb = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; let best = null, bd = -1; const N = 14;
  for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) { const x = bb[0] + (bb[2] - bb[0]) * i / N, y = bb[1] + (bb[3] - bb[1]) * j / N; if (!inside([big], x, y)) continue; const d = segD(x, y, [big]) - Math.hypot(x - (bb[0] + bb[2]) / 2, y - (bb[1] + bb[3]) / 2) * .15; if (d > bd) { bd = d; best = [x, y]; } }
  return (best || [(bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2]).map(Math.round); }
const CENTRAL = { '01': 'Seyhan,Yüreğir,Çukurova,Sarıçam', '06': 'Çankaya,Keçiören,Yenimahalle,Mamak,Etimesgut,Altındağ,Sincan,Gölbaşı,Pursaklar', '07': 'Muratpaşa,Konyaaltı,Kepez,Döşemealtı,Aksu', '09': 'Efeler', '10': 'Altıeylül,Karesi', '16': 'Osmangazi,Nilüfer,Yıldırım,Gürsu,Kestel', '20': 'Pamukkale,Merkezefendi', '21': 'Bağlar,Kayapınar,Sur,Yenişehir', '25': 'Yakutiye,Palandöken,Aziziye', '26': 'Odunpazarı,Tepebaşı', '27': 'Şahinbey,Şehitkamil', '31': 'Antakya,Defne', '33': 'Yenişehir,Mezitli,Toroslar,Akdeniz', '34': 'Beşiktaş,Şişli,Kadıköy,Üsküdar,Beyoğlu,Fatih,Bakırköy,Ataşehir', '35': 'Konak,Karşıyaka,Bornova,Buca,Bayraklı,Çiğli,Karabağlar,Balçova,Narlıdere,Gaziemir', '38': 'Melikgazi,Kocasinan,Talas', '41': 'İzmit,Başiskele,Kartepe,Körfez,Derince', '42': 'Selçuklu,Meram,Karatay', '44': 'Battalgazi,Yeşilyurt', '45': 'Şehzadeler,Yunusemre', '46': 'Onikişubat,Dulkadiroğlu', '47': 'Artuklu', '48': 'Menteşe', '52': 'Altınordu', '54': 'Adapazarı,Serdivan,Erenler', '55': 'İlkadım,Atakum,Canik', '59': 'Süleymanpaşa', '61': 'Ortahisar', '63': 'Haliliye,Eyyübiye,Karaköprü', '65': 'İpekyolu,Tuşba,Edremit' };
const FIX = { 'Gazi Osmanpaşa': 'Gaziosmanpaşa' };
const geoms = Object.values(topo.objects)[0].geometries;
const byProv = {};
for (const g of geoms) { const r = info[g.properties.id]; if (!r) continue; const plate = r.plate_code; const polys = g.type === 'Polygon' ? [g.arcs] : g.arcs; (byProv[plate] = byProv[plate] || []).push({ r, polys }); }
const P = {}, DS = {}; let all = [1e9, 1e9, -1e9, -1e9];
const slug = s => s.toLocaleLowerCase('tr').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u').replace(/â/g, 'a').replace(/î/g, 'i').replace(/[^a-z0-9]/g, '');
for (const plate of Object.keys(byProv).sort()) {
  const list = byProv[plate]; const pr = pinfo[plate]; const cset = new Set((CENTRAL[plate] || pr.name).split(','));
  // il dış sınırı: il içinde tek kez geçen yönlü arkları zincirle
  const used = new Map(); for (const d of list) for (const poly of d.polys) for (const ring of poly) for (const ai of ring) { const k = ai >= 0 ? ai : ~ai; used.set(k, (used.get(k) || 0) + 1); }
  const outer = []; for (const d of list) for (const poly of d.polys) for (const ring of poly) for (const ai of ring) if (used.get(ai >= 0 ? ai : ~ai) === 1) outer.push(ai);
  const key = p => p[0] + ',' + p[1]; const startMap = new Map(); outer.forEach(ai => { const p = arcPts(ai); const k = key(p[0]); (startMap.get(k) || startMap.set(k, []).get(k)).push(ai); });
  const done = new Set(), prings = [];
  for (const ai of outer) { if (done.has(ai)) continue; const ring = []; let cur = ai, guard = 0; while (cur !== undefined && !done.has(cur) && guard++ < 5000) { done.add(cur); const p = arcPts(cur); ring.push(...(ring.length ? p.slice(1) : p)); const nx = (startMap.get(key(p[p.length - 1])) || []).find(a => !done.has(a)); cur = nx; } prings.push(ring); }
  const pts = prings.flat(); const bb = [Math.min(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[0])), Math.max(...pts.map(p => p[1]))];
  all = [Math.min(all[0], bb[0]), Math.min(all[1], bb[1]), Math.max(all[2], bb[2]), Math.max(all[3], bb[3])];
  // iç sınırlar: il içinde iki kez geçen arklar (ağ)
  const inner = [...used].filter(([, c]) => c > 1).map(([k]) => sarcs[k]);
  const mesh = inner.filter(a => a.length > 1).map(a => 'M' + a.map(p => p[0] + ' ' + p[1]).join('L')).join('');
  P[plate] = { n: pr.name, d: pathOf(prings), m: mesh, c: labelPt(prings), bb };
  DS[plate] = list.map(d => { const rings = d.polys.map(poly => poly.map(ringPts)).flat(); const nm = FIX[d.r.name] || d.r.name; const ap = rings.flat(); const bw = Math.max(...ap.map(p => p[0])) - Math.min(...ap.map(p => p[0])), bh = Math.max(...ap.map(p => p[1])) - Math.min(...ap.map(p => p[1])); return [nm, ...labelPt(rings), cset.has(nm) ? 1 : 0, pathOf(rings), slug(nm), Math.round(bw), Math.round(bh)]; });
}
const out = '/* İl ve ilçe sınırları: OCHA / HDX COD-AB-TUR (CC BY-IGO), ttezer/turkiye-harita-verisi üzerinden. Basitleştirilmiş, oyun içi kullanım. */\nconst TRD = ' + JSON.stringify({ vb: all, k: K, p: P, ds: DS }) + ';\n';
fs.writeFileSync(outF, out);
console.log('prov', Object.keys(P).length, 'dist', Object.values(DS).reduce((a, x) => a + x.length, 0), 'vb', all.join(' '), 'bytes', out.length, 'pts', sarcs.reduce((a, x) => a + x.length, 0));
