(function () {
'use strict';
const K = window.KZ;
const { DISTRICTS, TYPES, ARCH, PRODUCTS, SEGS, EQUIP, DECOR, CONCEPTS, WAGES, BANKS, SUPPLY, AGENCIES } = K;
const fmt = K.fmt, fmtK = K.fmtK;
const SAVE = 'kafe-zinciri-v1';
const W = 844, H = 390;
const MS_PER_HOUR = 2500; // 1 oyun günü = 1 dakika

let st = null;
const ui = { view: 'home', sel: null, type: 'kafe', setup: null, branch: null, btab: 'ozet', rep: null, confirm: null, startName: 'Demli Kafe', rotateOk: false, homeIdx: 0, settings: false, ffwd: false };
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Hesap cüzdanı: kalıcı satın almalar, Altın ve açılan görünümler kayıttan bağımsız saklanır; yeni oyunda kaybolmaz.
const WALLET = 'kafe-zinciri-cuzdan';
function walletOf(S) { return { gold: S.gold || 0, patron: !!S.patron, fast: !!S.fast, akademi: !!S.akademi, noads: !!S.noads, skins: S.skins || {}, themes: S.themes || {}, locs: S.locs || {}, owned: Object.fromEntries(Object.entries(S.owned || {}).filter(([k]) => /^(patron|hizli|akademi|noads|starter|zincir|skin_|theme_|loc_)/.test(k))), firstDone: !!S.firstDone, goalGold: S.goalGold || {}, ads: st && st.ads ? st.ads : null }; }
function saveWallet() { try { if (st) localStorage.setItem(WALLET, JSON.stringify(walletOf(K.iapState(st)))); } catch (e) {} }
function carryWallet(ns) { try { const w = JSON.parse(localStorage.getItem(WALLET) || 'null'); if (!w) return; const S = K.iapState(ns); Object.assign(S, { gold: Math.max(0, w.gold || 0), goalGold: w.goalGold || {}, patron: w.patron, fast: w.fast, akademi: w.akademi, noads: w.noads, skins: w.skins || {}, themes: w.themes || {}, locs: w.locs || {}, firstDone: w.firstDone }); Object.assign(S.owned, w.owned || {}); if (w.ads) ns.ads = w.ads; } catch (e) {} }
/* ---------- güvenilir saat ----------
   Uygulamada saat internetten alınır (telefon saatini ileri almak işe yaramaz).
   Bağlantı yoksa çevrimdışı ilerleme verilmez; tarayıcı sürümü cihaz saatini kullanır. */
const TT = { base: null, perf: 0, ok: !window.KZ_NATIVE, syncing: null };
function nowT() { return TT.base != null ? TT.base + (performance.now() - TT.perf) : Date.now(); }
function syncTime() {
  if (!window.KZ_NATIVE || !window.KZNetTime) { TT.ok = true; return Promise.resolve(true); }
  if (TT.syncing) return TT.syncing;
  return TT.syncing = window.KZNetTime().then(t => { TT.syncing = null; if (!t) { TT.ok = false; return false; } TT.base = t; TT.perf = performance.now(); TT.ok = true; return true; }, () => { TT.syncing = null; TT.ok = false; return false; });
}
K.setClock(nowT); syncTime();
let lastSavePerf = performance.now();
function save() { const pn = performance.now(), fg = pn - lastSavePerf; lastSavePerf = pn; saveWallet(); try { if (st && TT.ok && !TT.syncing) st.savedAt = nowT(); else if (st && st.savedAt) st.savedAt += Math.max(0, Math.min(fg, 6 * 3600e3)); localStorage.setItem(SAVE, JSON.stringify(st)); ui.lastSave = Date.now(); } catch (e) {} }
function loadSave() { try { const s = localStorage.getItem(SAVE); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function clearSave() { try { localStorage.removeItem(SAVE); } catch (e) {} }

/* ---------- ikonlar ---------- */
const I = p => '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>';
const IC = {
  home: I('<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
  map: I('<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>'),
  shop: I('<path d="M4 9h16l-1-4H5L4 9z"/><path d="M5 9v10h14V9"/><path d="M10 19v-5h4v5"/>'),
  fin: I('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  bank: I('<path d="M3 9 12 4l9 5"/><path d="M5 10v7M9 10v7M15 10v7M19 10v7M3 20h18"/>'),
  mkt: I('<path d="M4 10v4l11 5V5L4 10z"/><path d="M15 9a3 3 0 0 1 0 6"/>'),
  sup: I('<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>'),
  co: I('<path d="M4 20V8l5-3v15M9 20V3l7 4v13M16 20v-9l4 2v7M2 20h20"/>'),
  menu: I('<path d="M6 3v18M4 3v5a2 2 0 0 0 4 0V3M17 3c-2 0-3 2-3 5s1 4 3 4v9"/>'),
  staff: I('<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.5c3 0 5.5 1.6 5.5 4.5"/>'),
  news: I('<path d="M4 5h13v14H6a2 2 0 0 1-2-2z"/><path d="M17 9h3v8a2 2 0 0 1-2 2"/><path d="M8 9h5M8 13h5"/>'),
  gear: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.6 15H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9.7 4.4V4a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>'),
  next: I('<path d="M9 6l6 6-6 6"/>'),
  phone: '<svg viewBox="0 0 64 64"><rect x="20" y="8" width="24" height="44" rx="4"/><path d="M14 40c-4 6-2 12 6 14M50 24c4-6 2-12-6-14"/></svg>'
};

const TIC = {
  kafe: I('<path d="M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 11h2a2.5 2.5 0 0 1 0 5h-2"/><path d="M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3"/>'),
  metro: I('<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14"/><circle cx="9" cy="14" r=".8"/><circle cx="15" cy="14" r=".8"/><path d="M8 21l2-4M16 21l-2-4"/>'),
  avm: I('<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
  pub: I('<path d="M6 7h10v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path d="M16 10h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2"/><path d="M6 7c0-2 2-3 3.5-2.5C10.5 3 13 3 14 4.5 15.5 4 17 5.5 16 7"/>'),
  rooftop: I('<path d="M3 12a9 9 0 0 1 18 0z"/><path d="M12 12v8M9 20h6"/>')
};
/* ---------- küçük görseller ---------- */
function stars(r) { const f = Math.round(r); let s = ''; for (let i = 1; i <= 5; i++) s += i <= f ? '★' : '☆'; return '<span class="stars">' + s + '</span> <span class="num muted">' + r.toFixed(1) + '</span>'; }
function spark(vals, h) {
  h = h || 34;
  if (vals.length < 2) return '<svg class="spark" viewBox="0 0 100 ' + h + '"></svg>';
  const max = Math.max(...vals), min = Math.min(0, ...vals), n = vals.length, rng = Math.max(1, max - min);
  const pts = vals.map((v, i) => [i / (n - 1) * 100, h - 3 - (v - min) / rng * (h - 6)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return '<svg class="spark" style="height:' + h + 'px" viewBox="0 0 100 ' + h + '" preserveAspectRatio="none"><path class="a" d="' + d + ' L100 ' + h + ' L0 ' + h + ' Z"/><path class="l" d="' + d + '" vector-effect="non-scaling-stroke"/></svg>';
}
function meter(label, v, max, txt) { const p = Math.max(0, Math.min(100, v / max * 100)); return '<div class="meter"><span>' + label + '</span><div class="bar"><i style="width:' + p + '%"></i></div><span class="num">' + (txt != null ? txt : Math.round(v)) + '</span></div>'; }
function celToast(n) { const box = $('#toasts'); if (!box) return; const t = document.createElement('div'); t.className = 'toast cel' + (n.big ? ' big' : ''); t.innerHTML = `<span class="celic">${I('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>')}</span><span><b>${esc(n.t)}</b><small>${esc(n.s)}</small></span>`; box.appendChild(t); setTimeout(() => t.remove(), n.big ? 3800 : 2800); }
// kutlama bildirimleri tek tek ve olay/rapor penceresi kapalıyken gösterilir (üst üste binmesin)
const noteQ = []; let noteBusy = false;
function drainNotes() { if (!st || !st.notes || !st.notes.length) return; noteQ.push(...st.notes.splice(0)); if (noteQ.length > 4) noteQ.splice(0, noteQ.length - 4); pumpNotes(); }
function pumpNotes() { if (noteBusy || !noteQ.length) return; if (!st || blocking() || ui.setup || ui.settings || ui.shop || ui.offline) { setTimeout(pumpNotes, 900); return; } noteBusy = true; const n = noteQ.shift(); celToast(n); sfx('coin'); setTimeout(() => { noteBusy = false; pumpNotes(); }, n.big ? 3600 : 2600); }
function toast(m) { const box = $('#toasts'); if (!box) return; const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; box.appendChild(t); setTimeout(() => t.remove(), 3500); }
function res(r) { if (r && r.msg) toast(r.msg); render(); save(); }
function typeName(t) { return TYPES[t].n; }
function statusPill(b) { if (b.status === 'hazirlik') return '<span class="pill warn">Ruhsat: ' + b.daysLeft + ' gün</span>'; if (b.closedUntil >= st.day) return '<span class="pill warn">Bugün kapalı</span>'; if (b.lossMonths >= 2) return '<span class="pill bad">' + b.lossMonths + ' aydır zararda</span>'; return '<span class="pill ok">Açık</span>'; }


/* ---------- marka ---------- */
const BRAND_COLORS = {
  orman:  { n: 'Orman',     paint: '#14302a', awn: '#1d3b4f', sign: ['#f3dc9e', '#d4b26a', '#a8823e'], sw: '#1f5a46' },
  gece:   { n: 'Gece mavisi', paint: '#14213d', awn: '#283a63', sign: ['#f3dc9e', '#d4b26a', '#a8823e'], sw: '#1f3466' },
  bordo:  { n: 'Bordo',     paint: '#3a1520', awn: '#5c1f2e', sign: ['#f6e3c4', '#e0c08c', '#b88f52'], sw: '#6b2234' },
  kahve:  { n: 'Espresso',  paint: '#2e1d14', awn: '#5a3a26', sign: ['#f6e3c4', '#e7c38f', '#b8884f'], sw: '#5a3a26' },
  terra:  { n: 'Terracotta', paint: '#5a2e1e', awn: '#a8542f', sign: ['#fff2dc', '#f7d9a8', '#d9a86a'], sw: '#b5603a' },
  krem:   { n: 'Krem',      paint: '#e9dfcb', awn: '#2f2a24', sign: ['#3a2c1e', '#2a1f15', '#1a120b'], sw: '#e9dfcb', light: true },
  siyah:  { n: 'Siyah',     paint: '#141414', awn: '#262626', sign: ['#ffffff', '#e8e8e8', '#bdbdbd'], sw: '#1b1b1b' },
  mint:   { n: 'Mint',      paint: '#2f6b5c', awn: '#e8e1cf', sign: ['#ffffff', '#f3efe4', '#d9d2c0'], sw: '#3e8c78' },
  // mağazadan alınan cepheler
  ahsap:  { n: 'Ahşap bistro', paint: '#5b3a22', awn: '#8a5a32', sign: ['#fff2d6', '#f2d29c', '#c99a5a'], sw: '#7a4e2c', premium: true, deco: 'ahsap' },
  neon:   { n: 'Neon gece', paint: '#120c1c', awn: '#ff4f9a', sign: ['#ffd1ea', '#ff7cc0', '#ff3f98'], sw: '#ff4f9a', premium: true, deco: 'neon' },
  mermer: { n: 'Mermer lüks', paint: '#e9e5dd', awn: '#1d1d1f', sign: ['#f6e3a8', '#d4b26a', '#9a7432'], sw: '#e9e5dd', light: true, premium: true, deco: 'mermer' },
  nostalji: { n: 'Nostaljik Beyoğlu', paint: '#6e1c1c', awn: '#efe4cc', sign: ['#fff4dc', '#ecd3a0', '#c49a52'], sw: '#8a2424', premium: true, deco: 'nostalji' }
};
function brandAllowed(k) { const c = BRAND_COLORS[k]; return !!c && (!c.premium || !!(st && st.iap && st.iap.skins && st.iap.skins[k])); }
const BRAND_FONTS = { klasik: { n: 'Klasik', f: "'Fraunces', Georgia, serif" }, modern: { n: 'Modern', f: "'Plus Jakarta Sans', system-ui, sans-serif" }, el: { n: 'El yazısı', f: "'Caveat', 'Segoe Script', cursive" } };
const BRAND_ICONS = {
  fincan: '<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3.5c0 1.3 1 1.3 1 2.6M12 3.5c0 1.3 1 1.3 1 2.6"/>',
  cekirdek: '<ellipse cx="12" cy="12" rx="6" ry="8.5" transform="rotate(30 12 12)"/><path d="M9 6c3 3 3 9 6 12"/>',
  yaprak: '<path d="M5 19C5 10 11 4 20 4c0 9-6 15-15 15z"/><path d="M5 19l9-9"/>',
  tac: '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>',
  yildiz: '<path d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.7 19.7l1.1-6.1-4.5-4.2 6.1-.8z"/>',
  kruvasan: '<path d="M3 15c2-6 6-9 9-9s7 3 9 9c-2 1-4 1-5-1-1 2-3 3-4 3s-3-1-4-3c-1 2-3 2-5 1z"/>',
  ay: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  kalp: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'
};
function brandOf(b) { b = b || {}; return { color: BRAND_COLORS[b.color] ? b.color : 'orman', icon: BRAND_ICONS[b.icon] ? b.icon : 'fincan', font: BRAND_FONTS[b.font] ? b.font : 'klasik' }; }
function curBrand() { return brandOf(st ? st.brand : ui.brand); }
/* ---------- sahne: gerçekçi kafe cephesi ---------- */
function signFit(name) {
  const t = (name || '').trim() || 'Kafe Adı';
  const n = t.length; const fs = Math.max(11, Math.min(21, 21 - Math.max(0, n - 12) * .8)); const ls = Math.max(.4, 1.6 - Math.max(0, n - 12) * .12);
  return { t: esc(t), fs, ls };
}
// tadilattaki boş dükkan: henüz şube yokken gösterilir
function renovFacade(o) {
  const id = o.id || 'r', night = o.night !== false;
  const sky1 = night ? '#0b1430' : '#7fa7cf', sky2 = night ? '#1f2450' : '#cfe0ec', far = night ? '#151d3a' : '#9fb3c8';
  const wall = night ? '#2c2a33' : '#c9b9a0', wall2 = night ? '#34313b' : '#d7c8b0';
  let farB = '';
  [[0, 40, 70], [60, 70, 50], [500, 30, 60], [548, 60, 52]].forEach(([x, y, w], i) => {
    farB += `<rect x="${x}" y="${y}" width="${w}" height="${270 - y}" fill="${far}"/>`;
    for (let wy = y + 10; wy < 250; wy += 16) for (let wx = x + 8; wx < x + w - 8; wx += 14) if (((wx * 13 + wy * 7 + i) % 7) < 3) farB += `<rect x="${wx}" y="${wy}" width="6" height="8" fill="#e9c46f" opacity=".7"/>`;
  });
  let upper = '';
  for (let i = 0; i < 6; i++) { const x = 118 + i * 64, lit = night && ((i * 5 + 3) % 4 !== 0);
    upper += `<rect x="${x}" y="28" width="38" height="56" fill="${lit ? '#e8b864' : '#141a26'}" opacity="${lit ? .85 : 1}"/><rect x="${x - 4}" y="24" width="46" height="5" fill="${wall2}"/><rect x="${x + 18}" y="28" width="2" height="56" fill="#0d1c18" opacity=".6"/><rect x="${x}" y="50" width="38" height="2" fill="#0d1c18" opacity=".6"/><rect x="${x - 6}" y="84" width="50" height="3" fill="#1b1b1e"/>${[0, 1, 2, 3, 4, 5, 6].map(k => `<rect x="${x - 4 + k * 7}" y="72" width="1.4" height="12" fill="#1b1b1e"/>`).join('')}<rect x="${x - 6}" y="71" width="50" height="2" fill="#1b1b1e"/>`; }
  const paper = (x, w, tear) => `<rect x="${x}" y="184" width="${w}" height="68" fill="#b08d5e"/>${Array.from({ length: Math.floor(w / 26) }, (_, i) => `<rect x="${x + i * 26}" y="184" width="1" height="68" fill="#8a6b43" opacity=".6"/>`).join('')}<path d="${tear}" fill="#0d1119"/>`;
  const tiles = Array.from({ length: 16 }, (_, i) => `<line x1="${i * 40}" y1="262" x2="${i * 40 - 16}" y2="290" stroke="#2c2c31" stroke-width="1"/>`).join('');
  const stripes = (x, y, w, h) => `<g clip-path="url(#${id}bar${x})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f2efe8"/>${Array.from({ length: Math.ceil(w / 10) + 2 }, (_, i) => `<path d="M${x + i * 10 - 6} ${y + h} l6 ${-h} h5 l-6 ${h}z" fill="#d6452f"/>`).join('')}</g><clipPath id="${id}bar${x}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1"/></clipPath>`;
  return `<svg viewBox="0 0 600 320" preserveAspectRatio="${o.par || 'xMidYMid slice'}" role="img" aria-label="Tadilattaki boş dükkan">
  <defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky1}"/><stop offset="1" stop-color="${sky2}"/></linearGradient>
  <radialGradient id="${id}bulb" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe7a8" stop-opacity=".55"/><stop offset="1" stop-color="#ffe7a8" stop-opacity="0"/></radialGradient></defs>
  <rect width="600" height="320" fill="url(#${id}sky)"/>${night ? '<circle cx="540" cy="22" r="9" fill="#f4ecd6" opacity=".9"/>' : ''}${farB}
  <rect x="96" y="8" width="408" height="256" fill="${wall}"/><rect x="96" y="8" width="408" height="4" fill="${wall2}"/>${upper}
  <rect x="90" y="100" width="420" height="10" fill="${wall2}"/><rect x="90" y="110" width="420" height="3" fill="#000" opacity=".2"/>
  <rect x="108" y="116" width="384" height="148" fill="#4a4a4e"/>
  <path d="M120 130 q30 -6 60 4 t70 -2 M300 140 q40 8 90 -3 M140 170 q20 4 40 -2" stroke="#5c5c61" stroke-width="5" fill="none" opacity=".7"/>
  <rect x="148" y="122" width="304" height="30" rx="2" fill="none" stroke="#2a2a2d" stroke-width="2" stroke-dasharray="6 5"/>
  <circle cx="160" cy="137" r="1.6" fill="#77777c"/><circle cx="440" cy="137" r="1.6" fill="#77777c"/>
  <g transform="rotate(-7 250 138)"><rect x="196" y="125" width="112" height="26" rx="1.5" fill="#c9a571"/><rect x="196" y="125" width="112" height="26" rx="1.5" fill="none" stroke="#9a7a4a" stroke-width="1"/>
    <text x="252" y="143" text-anchor="middle" fill="#2a2018" style="font-family:'Comic Sans MS','Marker Felt',cursive;font-size:15px;letter-spacing:1px">YAKINDA!</text></g>
  <line x1="306" y1="129" x2="318" y2="122" stroke="#2a2a2d" stroke-width="1"/>
  <rect x="120" y="180" width="166" height="76" fill="#222226"/><rect x="328" y="180" width="154" height="76" fill="#222226"/>
  ${paper(124, 158, 'M206 184 L282 184 L282 214 Q262 222 248 210 Q232 220 220 205 Q210 200 206 184 Z')}
  ${paper(332, 146, 'M332 220 Q346 214 356 226 Q370 216 380 232 Q396 228 404 252 L332 252 Z')}
  <g opacity=".95"><ellipse cx="248" cy="200" rx="34" ry="18" fill="url(#${id}bulb)"/><line x1="248" y1="184" x2="248" y2="196" stroke="#555"/><circle cx="248" cy="198" r="2.4" fill="#fff4cf"/>
    <path d="M264 214 l8 -26 M272 214 l8 -26 M266 205 h9 M269 196 h9" stroke="#a8a8ac" stroke-width="1.2"/></g>
  <g><rect x="338" y="236" width="9" height="10" rx="1" fill="#d7d7da"/><rect x="338" y="236" width="9" height="3" fill="#6aa0c8"/><rect x="350" y="240" width="8" height="8" rx="1" fill="#cfcfd2"/><path d="M362 252 l14 -14 l18 0 l4 14z" fill="#e6e1d6" opacity=".7"/></g>
  <g fill="#f3efe4"><text x="168" y="226" text-anchor="middle" transform="rotate(-4 168 226)" style="font-family:var(--f-body);font-size:10px;letter-spacing:2px;font-weight:600" fill="#3a2a18">TADİLAT</text>
    <text x="378" y="208" text-anchor="middle" transform="rotate(3 378 208)" style="font-family:var(--f-body);font-size:8px;letter-spacing:1.5px;font-weight:600" fill="#3a2a18">KİRALIK</text></g>
  <path d="M332 186 L476 250 M476 186 L332 250" stroke="#e8e0c8" stroke-width="5" opacity=".75"/>
  <rect x="288" y="184" width="38" height="72" fill="#8a6f4c"/><path d="M290 186 h34 M290 204 h34 M290 222 h34 M290 240 h34" stroke="#6e5639" stroke-width="1.2"/><path d="M290 186 L324 254" stroke="#6e5639" stroke-width="2"/>
  <g stroke="#9aa3ad" stroke-width="2.4"><line x1="104" y1="140" x2="104" y2="264"/><line x1="150" y1="140" x2="150" y2="264"/><line x1="98" y1="160" x2="158" y2="160"/><line x1="98" y1="210" x2="158" y2="210"/><line x1="104" y1="160" x2="150" y2="210" stroke-width="1.5"/></g>
  <rect x="96" y="206" width="64" height="5" fill="#a9824f"/><rect x="96" y="156" width="64" height="5" fill="#a9824f"/>
  <rect x="0" y="262" width="600" height="58" fill="#2b2b30"/>${tiles}
  <rect x="0" y="262" width="600" height="3" fill="#3a3a40"/>
  <g><rect x="168" y="246" width="4" height="22" fill="#666"/><rect x="250" y="246" width="4" height="22" fill="#666"/>${stripes(160, 240, 102, 10)}</g>
  <g><path d="M466 268 l8 -26 l8 26z" fill="#e8642c"/><rect x="469" y="252" width="10" height="3" fill="#f2efe8"/><rect x="462" y="266" width="24" height="3" fill="#c4521f"/></g>
  <g><ellipse cx="412" cy="268" rx="17" ry="6" fill="#bfae8a"/><ellipse cx="434" cy="270" rx="12" ry="4.5" fill="#a8977a"/><rect x="388" y="254" width="14" height="14" rx="2" fill="#d9d4c7"/><rect x="388" y="254" width="14" height="4" fill="#4d7ea8"/></g>
  <rect x="0" y="290" width="600" height="30" fill="#232327"/>${Array.from({ length: 8 }, (_, i) => `<rect x="${20 + i * 80}" y="303" width="40" height="3" fill="#cfcfcf" opacity=".5"/>`).join('')}
</svg>`;
}
function skinDeco(k) {
  if (k === 'ahsap') return Array.from({ length: 27 }, (_, i) => `<rect x="${110 + i * 14.3}" y="116" width="1.2" height="148" fill="#3e2615" opacity=".45"/>`).join('');
  if (k === 'mermer') return '<path d="M120 130 q40 20 80 6 t90 18 M260 200 q50 -18 110 4 t110 -10 M130 240 q60 -10 120 8" fill="none" stroke="#b9b2a4" stroke-width="1.4" opacity=".7"/>';
  if (k === 'neon') return '<rect x="110" y="118" width="380" height="144" fill="none" stroke="#ff4f9a" stroke-width="2.4" opacity=".9"/><rect x="110" y="118" width="380" height="144" fill="none" stroke="#ff9ccb" stroke-width="8" opacity=".18"/><rect x="116" y="124" width="368" height="132" fill="none" stroke="#5fe1ff" stroke-width="1.2" opacity=".7"/>';
  if (k === 'nostalji') return '<rect x="110" y="118" width="380" height="144" fill="none" stroke="#d9b56a" stroke-width="2" opacity=".85"/><rect x="116" y="124" width="368" height="132" fill="none" stroke="#d9b56a" stroke-width=".8" opacity=".6"/><g fill="#d9b56a"><circle cx="118" cy="126" r="3"/><circle cx="482" cy="126" r="3"/></g>';
  return '';
}
function facade(o) {
  const night = o.night, open = o.open, occ = Math.max(0, Math.min(1, o.occ || 0)), id = o.id || 'f';
  const sg = signFit(o.name);
  const sky1 = night ? '#0b1430' : '#7fa7cf', sky2 = night ? '#1f2450' : '#cfe0ec';
  const wall = night ? '#2c2a33' : '#c9b9a0', wall2 = night ? '#34313b' : '#d7c8b0';
  const far = night ? '#151d3a' : '#9fb3c8';
  const BR = brandOf(o.brand || curBrand()), BC = BRAND_COLORS[BR.color];
  const paint = BC.paint, trim = BC.light ? '#2a221a' : '#0d1c18';
  const glassA = open ? (o.pub ? '#f0a070' : '#ffe1a6') : (night ? '#1a2130' : '#5d6b78');
  const glassB = open ? (o.pub ? '#8c3a2c' : '#c27a36') : (night ? '#0d1119' : '#3c4752');
  let farB = '';
  [[0, 40, 70], [60, 70, 50], [500, 30, 60], [548, 60, 52]].forEach(([x, y, w], i) => {
    farB += `<rect x="${x}" y="${y}" width="${w}" height="${270 - y}" fill="${far}"/>`;
    for (let wy = y + 10; wy < 250; wy += 16) for (let wx = x + 8; wx < x + w - 8; wx += 14) if (((wx * 13 + wy * 7 + i) % 7) < (night ? 3 : 2)) farB += `<rect x="${wx}" y="${wy}" width="6" height="8" fill="${night ? '#e9c46f' : '#dfe8ef'}" opacity="${night ? .75 : .45}"/>`;
  });
  let upper = '';
  for (let i = 0; i < 6; i++) {
    const x = 118 + i * 64; const lit = night && ((i * 5 + 3) % 4 !== 0);
    upper += `<rect x="${x}" y="28" width="38" height="56" fill="${lit ? '#e8b864' : night ? '#141a26' : '#6e8396'}" opacity="${lit ? .85 : 1}"/><rect x="${x - 4}" y="24" width="46" height="5" fill="${wall2}"/><rect x="${x + 18}" y="28" width="2" height="56" fill="${trim}" opacity=".6"/><rect x="${x}" y="50" width="38" height="2" fill="${trim}" opacity=".6"/>`;
    upper += `<rect x="${x - 6}" y="84" width="50" height="3" fill="#1b1b1e"/>${[0, 1, 2, 3, 4, 5, 6].map(k => `<rect x="${x - 4 + k * 7}" y="72" width="1.4" height="12" fill="#1b1b1e"/>`).join('')}<rect x="${x - 6}" y="71" width="50" height="2" fill="#1b1b1e"/>`;
  }
  const lamps = [170, 212, 254].map(x => `<line x1="${x}" y1="182" x2="${x}" y2="193" stroke="#2a1a10" stroke-width="1"/><path d="M${x - 5} 197 Q${x} 189 ${x + 5} 197 Z" fill="#2a1a10"/><circle cx="${x}" cy="198" r="${open ? 6 : 0}" fill="#fff1c4" opacity=".35"/><circle cx="${x}" cy="197.5" r="1.8" fill="${open ? '#fff7dc' : '#555'}"/>`).join('');
  const cups = Array.from({ length: 9 }, (_, i) => `<rect x="${136 + i * 15}" y="${i % 2 ? 210 : 202}" width="6" height="5" rx="1" fill="#f1e7d6" opacity=".9"/>`).join('');
  const seats = [[352, 0], [366, 1], [400, 2], [414, 3], [446, 4], [460, 5]];
  const filled = Math.round(occ * seats.length);
  const people = seats.map(([x, k]) => k < filled ? `<circle cx="${x}" cy="226" r="4.2" fill="#2b1c14"/><path d="M${x - 6} 242 Q${x} 228 ${x + 6} 242 Z" fill="#3a271c"/>` : '').join('');
  const tables = [359, 407, 453].map(x => `<ellipse cx="${x}" cy="240" rx="11" ry="2.6" fill="#5a3b27"/><rect x="${x - 1}" y="240" width="2" height="11" fill="#3a2618"/>`).join('');
  const awnStripes = Array.from({ length: 16 }, (_, i) => `<rect x="${110 + i * 24}" y="156" width="12" height="22" fill="#efe5cf"/>`).join('');
  const scallop = Array.from({ length: 31 }, (_, i) => `<circle cx="${113 + i * 12.5}" cy="176" r="6.4" fill="${i % 2 ? '#efe5cf' : BC.awn}"/>`).join('');
  const tiles = Array.from({ length: 16 }, (_, i) => `<line x1="${i * 40}" y1="262" x2="${i * 40 - 16}" y2="290" stroke="${night ? '#2c2c31' : '#8a8780'}" stroke-width="1"/>`).join('');
  return `<svg viewBox="0 0 600 320" preserveAspectRatio="${o.par || 'xMidYMid slice'}" role="img" aria-label="${o.label || 'Kafe cephesi'}">
  <defs>
    <linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky1}"/><stop offset="1" stop-color="${sky2}"/></linearGradient>
    <linearGradient id="${id}gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${glassA}"/><stop offset="1" stop-color="${glassB}"/></linearGradient>
    <linearGradient id="${id}gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BC.sign[0]}"/><stop offset=".55" stop-color="${BC.sign[1]}"/><stop offset="1" stop-color="${BC.sign[2]}"/></linearGradient>
    <radialGradient id="${id}glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}spill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf7a" stop-opacity="${open && night ? .32 : 0}"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></linearGradient>
    <clipPath id="${id}awn"><path d="M114 156 H486 L494 178 H106 Z"/></clipPath>
    <clipPath id="${id}wl"><rect x="124" y="184" width="158" height="68"/></clipPath>
    <clipPath id="${id}wr"><rect x="332" y="184" width="146" height="68"/></clipPath>
  </defs>
  <rect width="600" height="320" fill="url(#${id}sky)"/>
  ${night ? '<circle cx="540" cy="22" r="9" fill="#f4ecd6" opacity=".9"/>' : ''}
  ${farB}
  <rect x="96" y="8" width="408" height="256" fill="${wall}"/>
  <rect x="96" y="8" width="408" height="4" fill="${wall2}"/>
  ${upper}
  <rect x="90" y="100" width="420" height="10" fill="${wall2}"/><rect x="90" y="110" width="420" height="3" fill="#000" opacity=".2"/>
  <rect x="108" y="116" width="384" height="148" fill="${paint}"/>${skinDeco(BC.deco)}
  <rect x="108" y="116" width="384" height="148" fill="none" stroke="#c9a45c" stroke-width=".8" opacity=".55"/>
  <rect x="148" y="122" width="304" height="30" rx="2" fill="${BC.light ? '#f6f0e3' : '#0b0f0e'}" stroke="url(#${id}gold)" stroke-width="1.4"/>
  <rect x="152" y="126" width="296" height="22" rx="1" fill="none" stroke="${BC.sign[1]}" stroke-width=".4" opacity=".6"/>
  ${(() => { const fsz = BR.font === 'el' ? sg.fs * 1.18 : sg.fs; const tw = Math.min(250, sg.t.length * fsz * (BR.font === 'el' ? .42 : .56)); const ix = 300 - tw / 2 - 13; return `<g transform="translate(${ix - 8} ${129}) scale(.68)" fill="none" stroke="url(#${id}gold)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${BRAND_ICONS[BR.icon]}</g><text id="signText" x="${300 + 6}" y="${143.5 - (20 - fsz) * .35}" text-anchor="middle" fill="url(#${id}gold)" style="font-family:${BRAND_FONTS[BR.font].f};font-weight:${BR.font === 'el' ? 700 : 600};font-size:${fsz}px;letter-spacing:${BR.font === 'el' ? 0 : sg.ls}px">${sg.t}</text>`; })()}
  ${[176, 424].map(x => `<rect x="${x - 3}" y="114" width="6" height="5" fill="#1a1a1a"/><path d="M${x - 5} 119 h10 l-3 4 h-4z" fill="#2a2a2a"/>${night ? `<ellipse cx="${x}" cy="128" rx="22" ry="12" fill="url(#${id}glow)"/>` : ''}`).join('')}
  <g clip-path="url(#${id}awn)"><rect x="100" y="156" width="400" height="24" fill="${BC.awn}"/>${awnStripes}</g>
  ${scallop}
  <rect x="120" y="180" width="166" height="76" fill="${trim}"/>
  <rect x="328" y="180" width="154" height="76" fill="${trim}"/>
  <rect x="124" y="184" width="158" height="68" fill="url(#${id}gl)"/>
  <rect x="332" y="184" width="146" height="68" fill="url(#${id}gl)"/>
  <g clip-path="url(#${id}wl)">
    <rect x="124" y="184" width="158" height="68" fill="#000" opacity="${open ? 0 : .35}"/>
    <rect x="130" y="208" width="140" height="2" fill="#5a3b27"/><rect x="130" y="216" width="140" height="2" fill="#5a3b27"/>${cups}
    ${open ? '<circle cx="222" cy="224" r="4.4" fill="#2b1c14"/><path d="M214 244 Q222 228 230 244 Z" fill="#1e3a2f"/>' : ''}
    <rect x="124" y="232" width="158" height="20" fill="#3b2619"/><rect x="124" y="231" width="158" height="3" fill="#6a4630"/>
    <rect x="146" y="220" width="30" height="12" rx="1.5" fill="#b8bcc2"/><rect x="149" y="223" width="24" height="3" fill="#5b5f66"/><rect x="152" y="228" width="3" height="4" fill="#2a2a2a"/><rect x="167" y="228" width="3" height="4" fill="#2a2a2a"/>
    <rect x="248" y="222" width="20" height="10" rx="1" fill="#e9dfcc" opacity=".85"/>
    ${lamps}
    <path d="M124 184 L170 184 L132 252 L124 252 Z" fill="#fff" opacity=".07"/>
  </g>
  <g clip-path="url(#${id}wr)">
    <rect x="332" y="184" width="146" height="68" fill="#000" opacity="${open ? 0 : .35}"/>
    ${[372, 430].map(x => `<line x1="${x}" y1="184" x2="${x}" y2="194" stroke="#2a1a10"/><circle cx="${x}" cy="196" r="${open ? 6 : 0}" fill="#fff1c4" opacity=".35"/><circle cx="${x}" cy="196" r="2" fill="${open ? '#fff7dc' : '#555'}"/>`).join('')}
    <rect x="338" y="200" width="22" height="16" fill="#2d4a3e" opacity=".8"/><rect x="342" y="203" width="14" height="10" fill="#c9b48a" opacity=".6"/>
    ${people}${tables}
    <circle cx="470" cy="236" r="8" fill="#2f6b45"/><circle cx="464" cy="230" r="6" fill="#3d8456"/><rect x="465" y="242" width="10" height="10" fill="#7a4e33"/>
    <path d="M332 184 L374 184 L340 252 L332 252 Z" fill="#fff" opacity=".07"/>
  </g>
  <rect x="202" y="184" width="2" height="68" fill="${trim}"/><rect x="404" y="184" width="2" height="68" fill="${trim}"/>
  <rect x="124" y="196" width="158" height="1.6" fill="${trim}"/><rect x="332" y="196" width="146" height="1.6" fill="${trim}"/>
  <text x="163" y="192.5" text-anchor="middle" fill="#d4b26a" style="font-family:var(--f-body);font-size:5px;letter-spacing:1.4px">KAHVE</text>
  <text x="243" y="192.5" text-anchor="middle" fill="#d4b26a" style="font-family:var(--f-body);font-size:5px;letter-spacing:1.4px">TATLI</text>
  <text x="368" y="192.5" text-anchor="middle" fill="#d4b26a" style="font-family:var(--f-body);font-size:5px;letter-spacing:1.4px">KAHVALTI</text>
  <text x="442" y="192.5" text-anchor="middle" fill="#d4b26a" style="font-family:var(--f-body);font-size:5px;letter-spacing:1.4px">2027</text>
  <rect x="288" y="180" width="38" height="84" fill="${trim}"/>
  <rect x="292" y="186" width="30" height="44" fill="url(#${id}gl)"/><rect x="292" y="234" width="30" height="26" fill="#1c3b33"/>
  <rect x="318" y="226" width="2" height="12" rx="1" fill="#d4b26a"/>
  <rect x="297" y="203" width="20" height="9" rx="1" fill="${open ? '#2f7a4f' : '#7a2e2e'}"/><text x="307" y="209.6" text-anchor="middle" fill="#fff" style="font-family:var(--f-body);font-size:5px;font-weight:600">${open ? 'AÇIK' : 'KAPALI'}</text>
  <rect x="116" y="252" width="174" height="12" fill="${trim}"/><rect x="324" y="252" width="160" height="12" fill="${trim}"/>
  <rect x="0" y="262" width="600" height="30" fill="${night ? '#38383e' : '#a29e95'}"/>${tiles}
  <path d="M124 262 L282 262 L300 292 L104 292 Z" fill="url(#${id}spill)"/><path d="M332 262 L478 262 L500 292 L318 292 Z" fill="url(#${id}spill)"/>
  <rect x="0" y="290" width="600" height="5" fill="${night ? '#55555c' : '#c9c5bc'}"/>
  <rect x="0" y="295" width="600" height="25" fill="${night ? '#17181c' : '#3f4249'}"/>
  ${[30, 130, 230, 330, 430, 530].map(x => `<rect x="${x}" y="309" width="44" height="2.4" fill="${night ? '#6a6a70' : '#e5e2dc'}"/>`).join('')}
  ${[100, 500].map(x => `<rect x="${x - 9}" y="246" width="18" height="16" fill="#3e3a36"/><rect x="${x - 10}" y="244" width="20" height="3" fill="#57514b"/><circle cx="${x}" cy="236" r="11" fill="#2d6a45"/><circle cx="${x - 6}" cy="230" r="7" fill="#3a8253"/><circle cx="${x + 6}" cy="232" r="6" fill="#28603e"/>`).join('')}
  <path d="M58 290 L66 252 L84 252 L92 290" fill="#1b1d1c" stroke="#5a4632" stroke-width="2"/><rect x="66" y="256" width="18" height="22" fill="#20251f"/>
  <text x="75" y="263" text-anchor="middle" fill="#efe9dc" style="font-family:var(--f-display);font-size:5.5px">Günün</text><text x="75" y="270" text-anchor="middle" fill="#efe9dc" style="font-family:var(--f-display);font-size:5.5px">kahvesi</text><line x1="69" y1="274" x2="81" y2="274" stroke="#d4b26a" stroke-width=".6"/>
  ${o.front ? `<ellipse cx="545" cy="270" rx="15" ry="3.5" fill="#2a2a2a"/><rect x="544" y="270" width="2" height="18" fill="#2a2a2a"/><rect x="537" y="288" width="16" height="2" fill="#2a2a2a"/>${[522, 568].map(x => `<rect x="${x - 6}" y="262" width="2" height="26" fill="#3a3a3a"/><rect x="${x - 6}" y="274" width="13" height="2" fill="#3a3a3a"/><rect x="${x + 5}" y="274" width="2" height="14" fill="#3a3a3a"/>`).join('')}` : ''}
  <rect x="28" y="168" width="4" height="122" fill="#1d1f24"/><path d="M22 160 h16 l-3 10 h-10z" fill="#1d1f24"/><rect x="25" y="162" width="10" height="7" fill="${night ? '#ffe3a0' : '#d9dde2'}"/>
  ${night ? `<circle cx="30" cy="166" r="40" fill="url(#${id}glow)"/>` : ''}
  ${o.wx === 'kar' ? `<path d="M110 158 Q160 150 210 155 Q300 147 390 155 Q440 150 490 158 L488 161 H112 Z" fill="#f3f6fb"/><path d="M90 101 Q300 95 510 101 L510 104 H90 Z" fill="#f3f6fb" opacity=".9"/>` : ''}
  ${o.queue ? `<g clip-path="url(#${id}wl)">${Array.from({ length: Math.min(5, o.queue) }, (_, i) => { const x = 260 - i * 15, c = ['#5b4a3c', '#3d4f63', '#5a4a5e', '#46584a', '#6a5236'][i]; return `<g class="qp" style="animation-delay:-${((performance.now() / 1000) + i * .7) % 2.4}s"><circle cx="${x}" cy="222" r="4.4" fill="#22170f"/><path d="M${x - 6.5} 252 L${x - 5} 229 Q${x} 226 ${x + 5} 229 L${x + 6.5} 252 Z" fill="${c}"/></g>`; }).join('')}</g>` : ''}
  ${o.walkers ? (() => { const now = performance.now() / 1000; return Array.from({ length: o.walkers }, (_, i) => { const c = ['#a85a3c', '#3d6a8c', '#6d6a35', '#7a4a6a', '#2f6d60', '#9b7a32'][i % 6]; const dur = 9 + (i * 3.7) % 6, dir = i % 2 ? 'wl' : 'wr', enter = i % 3 === 0 && o.open; const del = -((now + i * 2.9) % dur);
    const look = !enter && i % 3 === 1; const cw = o.wx === 'kar' || o.wx === 'yagmur' ? ['#2f3a48', '#4a3a2e', '#3a4a3a', '#5a2f35', '#2e3f55', '#4b4b4b'][i % 6] : c;
    const umb = o.wx === 'yagmur' && i % 2 === 0 ? `<path d="M-11 266 Q0 252 11 266 Z" fill="${['#2b4a6e', '#7a2e2e', '#2d2d2d'][i % 3]}"/><rect x="-.6" y="266" width="1.2" height="10" fill="#222"/>` : '';
    const hat = o.wx === 'kar' ? `<rect x="-4.5" y="264.5" width="9" height="3" rx="1.5" fill="#c94a4a"/>` : '';
    return `<g class="walker ${enter ? 'went' : look ? 'wlook' : dir}" style="animation-duration:${look ? dur + 4 : dur}s;animation-delay:${del}s"><g class="wbob" style="animation-delay:${del}s">${umb}${hat}<circle cx="0" cy="270" r="4" fill="#161616"/><rect x="-4" y="274" width="8" height="12" rx="2.5" fill="${cw}"/><rect x="-3" y="285" width="2" height="6" fill="#161616" class="lg1"/><rect x="1" y="285" width="2" height="6" fill="#161616" class="lg2"/></g></g>`; }).join(''); })() : ''}
</svg>`;
}

/* ---------- şube tipine göre sahne ---------- */
function walkLayer(n, y, o) {
  if (!n) return ''; o = o || {}; const now = performance.now() / 1000; const sc = o.scale || 1;
  return `<g transform="translate(0 ${y - 270 * sc}) scale(${sc})">${Array.from({ length: n }, (_, i) => { const dur = (o.fast ? 6 : 9) + (i * 3.7) % 6, del = -((now + i * 2.3 + (o.seed || 0)) % dur);
    const c = (o.wx === 'kar' || o.wx === 'yagmur') ? ['#2f3a48', '#4a3a2e', '#3a4a3a', '#5a2f35', '#2e3f55', '#4b4b4b'][i % 6] : ['#a85a3c', '#3d6a8c', '#6d6a35', '#7a4a6a', '#2f6d60', '#9b7a32', '#2b2b30', '#8a4f6a'][i % 8];
    const umb = o.wx === 'yagmur' && i % 2 === 0 ? `<path d="M-11 266 Q0 252 11 266 Z" fill="${['#2b4a6e', '#7a2e2e', '#2d2d2d'][i % 3]}"/><rect x="-.6" y="266" width="1.2" height="10" fill="#222"/>` : '';
    const hat = o.wx === 'kar' ? '<rect x="-4.5" y="264.5" width="9" height="3" rx="1.5" fill="#c94a4a"/>' : '';
    const bag = o.bags && i % 2 ? `<rect x="4" y="278" width="5" height="7" rx="1" fill="${['#e9c46a', '#e07a5f', '#81b29a'][i % 3]}"/>` : o.brief && i % 3 === 0 ? '<rect x="4" y="279" width="6" height="5" rx="1" fill="#2a2a2a"/>' : '';
    const cls = o.look && i % 3 === 1 ? 'wlook' : i % 2 ? 'wl' : 'wr';
    return `<g class="walker ${cls}" style="animation-duration:${cls === 'wlook' ? dur + 4 : dur}s;animation-delay:${del.toFixed(2)}s"><g class="wbob" style="animation-delay:${del.toFixed(2)}s">${umb}${hat}<circle cx="0" cy="270" r="4" fill="#161616"/><rect x="-4" y="274" width="8" height="12" rx="2.5" fill="${c}"/>${bag}<rect x="-3" y="285" width="2" height="6" fill="#161616" class="lg1"/><rect x="1" y="285" width="2" height="6" fill="#161616" class="lg2"/></g></g>`; }).join('')}</g>`;
}
function typeScene(type, name, o) {
  o = o || {}; const night = !!o.night, open = !!o.open, id = o.id || 'ts', sg = signFit(name);
  const sign = (x, y, w, h, fill, col, fs) => `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="3" fill="${fill}" stroke="${col}" stroke-width="1.2"/><text x="${x}" y="${y + fs * .35}" text-anchor="middle" fill="${col}" style="font-family:var(--f-display);font-weight:600;font-size:${fs}px">${sg.t}</text>`;
  const ppl = (n, y, x0, x1, seed) => Array.from({ length: n }, (_, i) => { const x = x0 + ((i * 97 + (seed || 0) * 41) % (x1 - x0)); const c = ['#a85a3c', '#3d6a8c', '#6d6a35', '#7a4a6a', '#2f6d60', '#9b7a32'][i % 6]; return `<circle cx="${x}" cy="${y}" r="4" fill="#161616"/><rect x="${x - 4}" y="${y + 4}" width="8" height="12" rx="2.5" fill="${c}"/>`; }).join('');
  if (type === 'metro') {
    let tiles = ''; for (let y = 0; y < 200; y += 14) for (let x = (y / 14) % 2 ? -10 : 0; x < 600; x += 20) tiles += `<rect x="${x}" y="${y}" width="19" height="13" fill="${night ? '#c9cfd6' : '#e3e7ea'}" stroke="#b7bec6" stroke-width=".5"/>`;
    return `<svg viewBox="0 0 600 320" preserveAspectRatio="${o.par || 'xMidYMid slice'}" role="img" aria-label="Metro kiosku">
      <rect width="600" height="320" fill="#d7dce1"/>${tiles}
      <rect x="0" y="40" width="600" height="18" fill="#c0392b"/><text x="30" y="53" fill="#fff" style="font-family:var(--f-body);font-weight:700;font-size:11px;letter-spacing:2px">M  METRO · ÇIKIŞ →</text>
      <rect x="0" y="200" width="600" height="120" fill="#8c8f94"/><rect x="0" y="200" width="600" height="4" fill="#f2c94c"/>
      ${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 55}" y="208" width="50" height="110" fill="none" stroke="#7d8085" stroke-width="1"/>`).join('')}
      <rect x="190" y="70" width="220" height="132" rx="6" fill="#14302a"/>
      ${sign(300, 88, 190, 26, '#0b0f0e', '#d4b26a', sg.fs * .85)}
      <rect x="202" y="108" width="196" height="44" fill="${open ? '#ffe1a6' : '#5d6b78'}"/>
      <rect x="215" y="128" width="26" height="16" rx="2" fill="#b8bcc2"/><rect x="255" y="118" width="70" height="2" fill="#5a3b27"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${258 + i * 13}" y="111" width="6" height="7" rx="1" fill="#f1e7d6"/>`).join('')}
      <rect x="196" y="152" width="208" height="10" fill="#6a4630"/><rect x="196" y="162" width="208" height="40" fill="#1c3b33"/>
      <text x="300" y="186" text-anchor="middle" fill="#d4b26a" style="font-family:var(--f-body);font-size:9px;letter-spacing:2px">TAKE AWAY</text>
      ${open ? `<g class="qp">${ppl(Math.min(5, (o.queue || 0) + 1), 168, 120, 190, 3)}</g>` : ''}
      ${walkLayer(o.walkers || 0, 236, { fast: true, brief: true, seed: 1 })}
      ${walkLayer(Math.round((o.walkers || 0) * .6), 262, { fast: true, scale: 1.25, brief: true, seed: 4 })}</svg>`;
  }
  if (type === 'avm') {
    return `<svg viewBox="0 0 600 320" preserveAspectRatio="${o.par || 'xMidYMid slice'}" role="img" aria-label="AVM şubesi">
      <defs><linearGradient id="${id}fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9e6e1"/><stop offset="1" stop-color="#cfcac2"/></linearGradient></defs>
      <rect width="600" height="320" fill="#f4f1ec"/>
      <rect x="0" y="0" width="600" height="40" fill="#e6e1d8"/>${Array.from({ length: 10 }, (_, i) => `<rect x="${20 + i * 60}" y="14" width="34" height="6" rx="3" fill="#fff8e6"/>`).join('')}
      <rect x="0" y="40" width="80" height="200" fill="#d9d3c9"/><rect x="520" y="40" width="80" height="200" fill="#d9d3c9"/>
      <rect x="10" y="80" width="60" height="120" fill="#bcd3dc" opacity=".7"/><rect x="530" y="80" width="60" height="120" fill="#e3c9d6" opacity=".7"/>
      <rect x="80" y="40" width="440" height="200" fill="#1d1d1f"/>
      ${sign(300, 64, 300, 30, '#111', '#d4b26a', sg.fs)}
      <rect x="96" y="90" width="408" height="140" fill="${open ? '#ffe7b8' : '#6c7682'}" opacity=".95"/>
      ${[150, 220, 290, 360, 430].map(x => `<line x1="${x}" y1="90" x2="${x}" y2="104" stroke="#2a1a10"/><circle cx="${x}" cy="106" r="3" fill="${open ? '#fff7dc' : '#555'}"/>`).join('')}
      <rect x="110" y="170" width="160" height="10" fill="#5a3b27"/><rect x="110" y="180" width="160" height="50" fill="#3b2619"/>
      ${[330, 400, 470].map(x => `<ellipse cx="${x}" cy="200" rx="18" ry="4" fill="#5a3b27"/><rect x="${x - 1}" y="200" width="2" height="26" fill="#3a2618"/>`).join('')}
      ${open ? ppl(3, 178, 320, 490, 1) : ''}
      <rect x="0" y="240" width="600" height="80" fill="url(#${id}fl)"/>${Array.from({ length: 8 }, (_, i) => `<line x1="${i * 90}" y1="240" x2="${i * 90 - 60}" y2="320" stroke="#c4bdb2"/>`).join('')}
      ${walkLayer(o.walkers || 0, 262, { bags: true, look: true, seed: 2 })}
      ${walkLayer(Math.round((o.walkers || 0) * .5), 290, { bags: true, scale: 1.2, seed: 6 })}</svg>`;
  }
  if (type === 'pub') {
    let bricks = ''; for (let y = 0; y < 270; y += 10) for (let x = (y / 10) % 2 ? -12 : 0; x < 600; x += 24) bricks += `<rect x="${x}" y="${y}" width="23" height="9" fill="${(x + y) % 7 ? '#4a2622' : '#55302a'}"/>`;
    return `<svg viewBox="0 0 600 320" preserveAspectRatio="${o.par || 'xMidYMid slice'}" role="img" aria-label="Pub">
      <defs><filter id="${id}neon" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <rect width="600" height="320" fill="#1b0f10"/>${bricks}
      <rect x="110" y="40" width="380" height="40" rx="6" fill="#120709"/>
      <text x="300" y="${68 - (20 - sg.fs) * .35}" text-anchor="middle" fill="#ff7aa2" filter="url(#${id}neon)" style="font-family:var(--f-display);font-weight:600;font-size:${sg.fs + 2}px">${sg.t}</text>
      <rect x="120" y="100" width="360" height="170" fill="#1a0c0d" stroke="#6b3a2a" stroke-width="3"/>
      <rect x="132" y="112" width="150" height="120" fill="${open ? '#f2a05a' : '#2a1a1a'}"/><rect x="318" y="112" width="150" height="120" fill="${open ? '#f2a05a' : '#2a1a1a'}"/>
      ${open ? '<rect x="132" y="112" width="150" height="120" fill="#7a2a1a" opacity=".35"/><rect x="318" y="112" width="150" height="120" fill="#7a2a1a" opacity=".35"/>' : ''}
      ${[150, 175, 200, 225, 250].map((x, i) => `<rect x="${x}" y="150" width="7" height="${i % 2 ? 18 : 22}" rx="2" fill="${['#3a7a3a', '#7a4a1a', '#2a5a7a', '#8a6a1a', '#5a2a3a'][i]}"/>`).join('')}<rect x="140" y="172" width="134" height="3" fill="#2a1408"/>
      ${open ? ppl(3, 196, 330, 460, 4) : ''}
      <rect x="284" y="112" width="32" height="158" fill="#2a1414"/><circle cx="310" cy="190" r="2" fill="#d4b26a"/>
      <text x="300" y="300" text-anchor="middle" fill="#ffb38a" filter="url(#${id}neon)" style="font-family:var(--f-body);font-weight:700;font-size:10px;letter-spacing:3px">CANLI MÜZİK · MAÇ YAYINI</text>
      <rect x="0" y="270" width="600" height="50" fill="#1a1416" opacity=".8"/>
      ${walkLayer(o.walkers || 0, 284, { wx: o.wx, look: true, seed: 3 })}</svg>`;
  }
  if (type === 'rooftop') {
    let sky = ''; [[0, 120, 60], [50, 100, 40], [92, 130, 70], [170, 90, 50], [225, 115, 60], [290, 80, 45], [340, 110, 70], [415, 95, 55], [475, 120, 40], [520, 85, 80]].forEach(([x, y, w]) => { sky += `<rect x="${x}" y="${y}" width="${w}" height="${200 - y}" fill="${night ? '#141a35' : '#5d6f8f'}"/>`; for (let wy = y + 8; wy < 195; wy += 12) for (let wx = x + 6; wx < x + w - 5; wx += 10) if ((wx * 7 + wy * 3) % 5 < 2) sky += `<rect x="${wx}" y="${wy}" width="4" height="5" fill="#e9c46f" opacity="${night ? .85 : .3}"/>`; });
    const bulbs = Array.from({ length: 24 }, (_, i) => { const x = 20 + i * 24, y = 40 + Math.sin(i / 23 * Math.PI) * 22; return `<circle class="twk" style="animation-delay:-${(i * .37) % 3}s" cx="${x}" cy="${y}" r="3" fill="#ffe7a0"/><circle cx="${x}" cy="${y}" r="7" fill="#ffd27a" opacity="${night ? .25 : .08}"/>`; }).join('');
    return `<svg viewBox="0 0 600 320" preserveAspectRatio="${o.par || 'xMidYMid slice'}" role="img" aria-label="Rooftop">
      <defs><linearGradient id="${id}sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${night ? '#0d1030' : '#ff9a6b'}"/><stop offset=".6" stop-color="${night ? '#3a2350' : '#ffcf8a'}"/><stop offset="1" stop-color="${night ? '#6b3a5a' : '#ffe2b0'}"/></linearGradient></defs>
      <rect width="600" height="320" fill="url(#${id}sk)"/>${night ? '' : '<circle cx="470" cy="150" r="30" fill="#fff1c4" opacity=".9"/>'}
      ${sky}
      <path d="M20 40 Q300 80 580 40" fill="none" stroke="#2a2a2a" stroke-width="1"/>${bulbs}
      <rect x="0" y="200" width="600" height="120" fill="#3a2e28"/>${Array.from({ length: 14 }, (_, i) => `<rect x="${i * 44}" y="200" width="42" height="120" fill="#4a3a30" opacity="${i % 2 ? .6 : 1}"/>`).join('')}
      <rect x="0" y="192" width="600" height="4" fill="#c9c2b6"/>${Array.from({ length: 30 }, (_, i) => `<rect x="${i * 20 + 4}" y="176" width="2" height="18" fill="#c9c2b6"/>`).join('')}<rect x="0" y="174" width="600" height="3" fill="#c9c2b6"/>
      ${sign(300, 228, 220, 28, '#0b0f0e', '#d4b26a', sg.fs * .9)}
      ${[90, 190, 410, 510].map(x => `<ellipse cx="${x}" cy="262" rx="20" ry="5" fill="#ebe3d3"/><rect x="${x - 1}" y="262" width="2" height="30" fill="#2a2a2a"/><path d="M${x - 30} 230 Q${x} 205 ${x + 30} 230 Z" fill="#efe5cf"/><rect x="${x - 1}" y="226" width="2" height="36" fill="#d8cfbf"/>`).join('')}
      ${open ? `<g class="qp">${ppl(5, 252, 60, 540, 5)}</g>` : ''}
      ${walkLayer(Math.round((o.walkers || 0) * .5), 296, { wx: o.wx, seed: 5, scale: 1.1 })}</svg>`;
  }
  return facade(Object.assign({ name }, o));
}
function sceneSVG(b, hour) {
  const night = hour < 7 || hour >= 19;
  const W = st ? homeWx() : { k: 'gunes' };
  if (!b) return facade({ name: st ? st.name : '', night, open: false, id: 'h', par: 'xMidYMax slice', walkers: night ? 2 : 4, wx: W.k, seed: hour });
  const T = TYPES[b.type];
  const open = b.status === 'acik' && hour >= T.open && hour < T.close && b.closedUntil < st.day;
  const occ = b.tables ? b.occ.reduce((a, o) => a + o.t, 0) / b.tables : 0;
  const hourCust0 = b.hist && b.hist.length ? (b.hist[b.hist.length - 1].cust || 0) / 15 : 8;
  if (b.type !== 'kafe') { const indoor = b.type === 'metro' || b.type === 'avm'; const base = b.type === 'metro' ? (night ? 2 : 7) : b.type === 'avm' ? (open ? 6 : 1) : b.type === 'pub' ? (night ? 5 : 2) : 3; const wf = indoor ? 1 : W.k === 'kar' ? .6 : W.k === 'yagmur' ? .75 : 1; return typeScene(b.type, st.name, { night, open, id: 'h' + b.type, par: 'xMidYMid slice', walkers: Math.max(1, Math.round((base + (open ? Math.min(3, hourCust0 / 8) : 0)) * wf)), wx: indoor ? 'gunes' : W.k, queue: open ? Math.round(Math.min(4, hourCust0 / 6)) : 0 }); }
  const hourCust = b.hist && b.hist.length ? (b.hist[b.hist.length - 1].cust || 0) / 15 : 8; const qn = open ? Math.round(Math.min(5, hourCust / 6 + ((b.today.queueLost || 0) > 5 ? 2 : 0))) : 0;
  return facade({ name: st.name, night, open, occ, front: b.useFront, id: 'h', par: 'xMidYMax slice', walkers: Math.max(night ? 1 : 3, Math.round((night ? (open ? 3 : 1) : Math.min(9, Math.round(hourCust / 4) + 4)) * (W.k === 'kar' ? .6 : W.k === 'yagmur' ? .75 : 1))), queue: qn, wx: W.k, seed: hour, label: esc(b.name) + ' şubesi' });
}

function wxOverlay() {
  if (!st) return ''; const W = homeWx(), night = st.hour < 7 || st.hour >= 19, now = performance.now() / 1000; const hb = st.branches[ui.homeIdx || 0];
  if (hb && (hb.type === 'metro' || hb.type === 'avm')) return `<span class="wxchip">${esc(W.pn)} · dışarıda ${K.WX_N[W.k].toLocaleLowerCase('tr-TR')} · ${W.t}°</span>`;
  let h = `<div class="wxl wx-${W.k} ${night ? 'nt' : ''}" aria-hidden="true"><div class="wxtint"></div>`;
  if (W.k === 'yagmur') { h += Array.from({ length: 70 }, (_, i) => { const dur = .55 + (i * 7 % 10) / 30; return `<i class="rd" style="left:${(i * 37) % 101}%;animation-duration:${dur}s;animation-delay:-${((now + i * .13) % dur).toFixed(2)}s;opacity:${.35 + (i % 4) * .12}"></i>`; }).join('') + '<div class="wet"></div>'; }
  if (W.k === 'kar') { h += Array.from({ length: 55 }, (_, i) => { const dur = 5 + (i * 7 % 9) * .5, sz = 2 + (i % 3); return `<i class="sf" style="left:${(i * 29) % 101}%;width:${sz}px;height:${sz}px;animation-duration:${dur}s,${2 + i % 3}s;animation-delay:-${((now + i * .41) % dur).toFixed(2)}s,-${(i % 5) * .4}s"></i>`; }).join('') + '<div class="snowg"></div>'; }
  if ((W.k === 'gunes' || W.k === 'sicak') && !night) h += '<div class="sunglow"></div>';
  return h + `</div><span class="wxchip">${esc(W.pn)} · ${K.WX_N[W.k]} · ${W.t}°</span>`;
}

/* ---------- iskelet ---------- */
function shell() {
  $('#root').innerHTML = `<div class="page"><div class="device" id="device"><div class="clip" id="clip"><div class="screen" id="screen"></div></div></div></div>
  <div class="rotate" id="rotate"><div>${IC.phone}<h2>Telefonu yan çevir</h2><p>Oyun yatay ekranda oynanır.</p><button data-a="rotateok">Dikey devam et</button></div></div>`;
  fit();
}
function safeArea() {
  let p = document.getElementById('saprobe');
  if (!p) { p = document.createElement('div'); p.id = 'saprobe'; p.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)'; document.body.appendChild(p); }
  const c = getComputedStyle(p); return { t: parseFloat(c.paddingTop) || 0, r: parseFloat(c.paddingRight) || 0, b: parseFloat(c.paddingBottom) || 0, l: parseFloat(c.paddingLeft) || 0 };
}
let lastFit = null;
function fit() {
  const dev = $('#device'), clip = $('#clip'), scr = $('#screen'); if (!dev) return;
  const sa = safeArea(); const vw = window.innerWidth - sa.l - sa.r, vh = window.innerHeight - sa.t - sa.b;
  // klavye açıkken yükseklik düşer: oyunu küçültme, eski ölçekte kal
  const ae = document.activeElement, typing = ae && (ae.tagName === 'TEXTAREA' || (ae.tagName === 'INPUT' && !/^(checkbox|radio|range|button)$/.test(ae.type)));
  if (typing && lastFit && lastFit.vw === vw && vh < lastFit.vh * .85) return;
  lastFit = { vw, vh };
  const portraitPhone = vh > vw && vw < 760;
  const bleed = (vh <= 520 && vw > vh) || portraitPhone || !!window.KZ_NATIVE;
  $('#rotate').classList.toggle('show', portraitPhone && !ui.rotateOk);
  dev.classList.toggle('bleed', bleed);
  let s;
  if (bleed) s = Math.min(vw / W, vh / H);
  else s = Math.min((vw - 56) / W, (vh - 56) / H, 2.4);
  s = Math.max(.3, s);
  clip.style.width = Math.round(W * s) + 'px'; clip.style.height = Math.round(H * s) + 'px';
  scr.style.transform = 'scale(' + s + ')';
}
window.addEventListener('resize', fit);

function render() {
  applyTheme(themeId());
  const scr = $('#screen'); if (!scr) return;
  if (!st) { scr.innerHTML = startView(); return; }
  const prev = scr.querySelector('.view'); const scroll = prev ? prev.scrollTop : 0; const sideEl = scr.querySelector('.side'); const sideScroll = sideEl ? sideEl.scrollTop : 0;
  const V = { home: vHome, map: vMap, branches: vBranches, branch: vBranch, finance: vFinance, bank: vBank, marketing: vMarketing, supply: vSupply, company: vCompany }[ui.view] || vHome;
  const _tb = scr.querySelector('#toasts'); const _keepT = _tb ? [..._tb.children] : [];
  scr.innerHTML = hud() + `<div class="body"><div class="view" ${ui.view === 'home' || ui.view === 'map' ? 'style="overflow:hidden"' : ''}>${V()}</div></div>` + tabs() + `<div id="layer"></div><div class="toasts" id="toasts"></div>`;
  const v = scr.querySelector('.view'); if (v && ui._keepScroll) v.scrollTop = scroll;
  const sd = scr.querySelector('.side'); if (sd && ui._keepScroll) sd.scrollTop = sideScroll;
  ui._keepScroll = false;
  const _nb = scr.querySelector('#toasts'); if (_nb) _keepT.forEach(t => { t.classList.add('kept'); _nb.appendChild(t); });
  renderLayer(); drainNotes();
}
// kaydırma/dokunma sırasında ekranı baştan çizme: sadece üst çubuk güncellenir, tam çizim sonra yapılır
['touchstart', 'touchmove', 'pointerdown', 'wheel'].forEach(ev => window.addEventListener(ev, () => { ui._touchAt = performance.now(); }, { passive: true, capture: true }));
window.addEventListener('scroll', () => { ui._touchAt = performance.now(); }, { passive: true, capture: true });
function hudOnly() { const h = $('#screen .hud2'); if (h) h.outerHTML = hud(); }
function liveRender(dayChanged) {
  const busy = performance.now() - (ui._touchAt || 0) < 1500;
  if (busy || (!dayChanged && ui.view !== 'home')) { hudOnly(); ui._pendingLive = ui._pendingLive || busy || dayChanged; return; }
  ui._pendingLive = false;
  const ae = document.activeElement;
  if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'SELECT') && $('#screen').contains(ae)) { const h = $('#screen .hud2'); if (h) h.outerHTML = hud(); return; }
  if (ui.setup || ui.confirm || ui.settings) return;
  ui._keepScroll = true; render();
}

function homeWx() { const b = st && st.branches[ui.homeIdx || 0]; const code = b ? DISTRICTS[b.d].p : '34'; return Object.assign({ code, pn: K.PROV[code].n }, K.wxOf(st, code)); }
function wIcon() {
  const W = homeWx(), night = st.hour < 7 || st.hour >= 19;
  if (W.k === 'kar') return I('<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5"/>');
  const c = { rain: W.k === 'yagmur', winter: W.k === 'bulut' };
  if (c.rain) return I('<path d="M7 15a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 6.5 4.5 4.5 0 0 1 17.5 15z"/><path d="M8 19l1-2M12 21l1-3M16 19l1-2"/>');
  if (night) return I('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>');
  if (c.winter) return I('<path d="M7 16a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 7.5 4.5 4.5 0 0 1 17.5 16z"/>');
  return I('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>');
}
function hud() {
  const dt = K.dateOf(st.day); const rep = Math.round(K.reputation(st)); const c = K.counts(st);
  const sp = st.paused ? 0 : 1; const full = prefs().cashFull;
  return `<header class="hud2">
    <div class="hbrand"><span class="mono bmono" style="background:${BRAND_COLORS[curBrand().color].sw}"><svg viewBox="0 0 24 24">${BRAND_ICONS[curBrand().icon]}</svg></span><div><b>${esc(st.name)}</b><small>Gün ${st.day + 1} · ${c.all} şube</small></div></div>
    <div class="hsp"></div>
    <div class="hchip" title="${(() => { const W = homeWx(); return esc(W.pn) + ': ' + K.WX_N[W.k] + ', ' + W.t + '°C'; })()}"><span class="hic">${wIcon()}</span><div><b class="num">${String(st.hour).padStart(2, '0')}:00</b><small>${K.DAYS[dt.getUTCDay()]} ${dt.getUTCDate()} ${K.MONTHS[dt.getUTCMonth()].slice(0, 3)}</small></div></div>
    <div class="hpill cash ${st.cash < 0 ? 'neg' : ''}" ${monetOn() ? 'data-a="shop" role="button" title="Mağaza"' : ''}><span class="coin2">₺</span><b class="num">${full ? fmt(st.cash).replace(' ₺', '') : fmtK(st.cash).replace(' ₺', '')}</b></div>
    <div class="hpill rep" title="Marka itibarı"><span class="star">${I('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>')}</span><b class="num">${rep}</b></div>
    <div class="hspeed" role="group" aria-label="Oyun hızı">
      <button class="${sp === 0 ? 'on' : ''}" data-a="speed" data-v="0" aria-label="Duraklat">${I('<rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/>')}</button>
      <button class="${sp && !(st.speed === 2 && st.iap && st.iap.fast) ? 'on' : ''}" data-a="speed" data-v="1" aria-label="Oynat">${I('<path d="M8 5l11 7-11 7z"/>')}</button>${st.iap && st.iap.fast ? `<button class="${sp && st.speed === 2 ? 'on' : ''}" data-a="speed" data-v="2" aria-label="2 kat hız">${I('<path d="M4 5l8 7-8 7zM12 5l8 7-8 7z"/>')}</button>` : ''}
    </div>
    ${monetOn() ? '' : '<!--'}<button class="ibtn shopb2" data-a="shop" aria-label="Mağaza">${I('<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>')}</button>${monetOn() ? '' : '-->'}
    <button class="ibtn" data-a="settings" aria-label="Ayarlar">${IC.gear}</button>
  </header>`;
}
function avgRating() { const o = st.branches.filter(b => b.status === 'acik'); if (!o.length) return '–'; return (o.reduce((a, b) => a + b.rating, 0) / o.length).toFixed(1); }
function tabs() {
  const items = [['home', 'Ana ekran', IC.home], ['map', 'Harita', IC.map], ['branches', 'Şubeler', IC.shop], ['finance', 'Finans', IC.fin], ['bank', 'Banka', IC.bank], ['marketing', 'Pazarlama', IC.mkt], ['supply', 'Tedarik', IC.sup], ['company', 'Şirket', IC.co]];
  const v = ui.view === 'branch' ? 'branches' : ui.view;
  const prom = K.promoOffer(st) && !st.bank.promo;
  return `<nav class="tabs">${items.map(([k, n, ic]) => `<button class="${v === k ? 'on' : ''}" data-a="nav" data-v="${k}">${ic}${n}${k === 'bank' && prom ? '<span class="badge">1</span>' : ''}</button>`).join('')}</nav>`;
}

/* ---------- başlangıç ---------- */
function startArt() { return facade({ name: ui.startName, night: true, open: true, occ: .5, front: true, id: 's', walkers: 3, seed: 2, label: 'Kafenin tabelası', brand: ui.brand }); }
function startView() {
  const saved = loadSave(); ui.brand = brandOf(ui.brand); const B = ui.brand;
  const sb = saved ? brandOf(saved.brand) : null;
  return `<div class="start">
    <div class="art" id="startArt">${startArt()}</div>
    <div class="form bform">
      <div class="brandline"><span class="mono bmono" style="background:${BRAND_COLORS[B.color].sw}"><svg viewBox="0 0 24 24">${BRAND_ICONS[B.icon]}</svg></span><span class="lbl">Marka stüdyosu</span></div>
      <h1>Tabelanı tasarla</h1>
      <label class="fl" for="nm">Kafenin adı</label>
      <input type="text" id="nm" maxlength="24" value="${esc(ui.startName)}" autocomplete="off" spellcheck="false">
      <div class="bgrp"><span class="fl">Marka rengi <b>${BRAND_COLORS[B.color].n}</b></span><div class="swatches">${Object.entries(BRAND_COLORS).filter(([k, c]) => !c.premium).map(([k, c]) => `<button class="swt ${B.color === k ? 'on' : ''}" data-a="brand" data-k="color" data-v="${k}" aria-label="${c.n}" style="--sw:${c.sw};--sg:${c.sign[1]}"><i></i></button>`).join('')}</div></div>
      <div class="bgrp"><span class="fl">Logo</span><div class="icons">${Object.entries(BRAND_ICONS).map(([k, path]) => `<button class="ico ${B.icon === k ? 'on' : ''}" data-a="brand" data-k="icon" data-v="${k}" aria-label="${k}"><svg viewBox="0 0 24 24">${path}</svg></button>`).join('')}</div></div>
      <div class="bgrp"><span class="fl">Tabela yazısı</span><div class="fonts">${Object.entries(BRAND_FONTS).map(([k, f]) => `<button class="fnt ${B.font === k ? 'on' : ''}" data-a="brand" data-k="font" data-v="${k}" style="font-family:${f.f}">${f.n}</button>`).join('')}</div></div>
      <button class="gold go3" data-a="newgame">Dükkanı aç ${IC.next}</button>
      ${saved ? `<button class="savecard" data-a="continue"><span class="sv-ic" style="background:${BRAND_COLORS[sb.color].sw}"><svg viewBox="0 0 24 24">${BRAND_ICONS[sb.icon]}</svg></span><span class="sv-t"><small>Kayıtlı oyun</small><b>${esc(saved.name)}</b><small>Gün ${saved.day + 1} · ${saved.branches.length} şube · ${fmtK(saved.cash)}</small></span><span class="sv-go">Devam ${IC.next}</span></button>` : ''}
    </div>
  </div>`;
}

/* ---------- ana ekran ---------- */
function vHome() {
  const bs = st.branches; const n = bs.length;
  if (ui.homeIdx >= n) ui.homeIdx = 0;
  const b = n ? bs[ui.homeIdx] : null;
  const loans = st.bank.loans.reduce((a, l) => a + l.pay, 0);
  const fixed = bs.reduce((a, x) => a + x.rent + x.staff * WAGES[x.wage].cost * st.world.wageIdx, 0) + loans;
  const monthRev = st.month.rev + bs.reduce((a, x) => a + x.today.rev, 0);
  const lastLog = st.log[0];
  const prom = K.promoOffer(st) && !st.bank.promo;
  const nextL = n ? bs[bs.length - 1].d : '';
  const t = b ? b.today : null; const yd = b && b.yesterday; const showY = !!(t && !t.cust && yd); const sat = t && t.cust ? Math.round(t.satSum / t.cust) : (b && b.lastSat ? Math.round(b.lastSat) : null);
  const act = (a, v, ic, title, sub, alert) => `<button class="arow" data-a="${a}" data-v="${v}"><span class="ic">${ic}</span><span class="tx"><b>${title}</b><small class="${alert ? 'alert' : ''}">${sub}</small></span><span class="chev">›</span></button>`;
  return `<div class="home2">
    <div class="hl">
      ${!b ? `<div class="scene empty0"><div class="e0bg">${renovFacade({ id: 'h' })}</div><div class="e0"><span class="lbl">Henüz bir mülkün yok</span><h2>İlk dükkanını tut</h2><p>Başlangıç için önerdiğimiz semtlerden birine bak ya da haritadan kendin seç.</p><div class="recs">${K.START_REC.map(r => `<button class="rec" data-a="gomap" data-v="${r.d}"><span class="rst">${I('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>')}</span><span><b>${esc(DISTRICTS[r.d].n)}</b><small>${esc(K.PROV[DISTRICTS[r.d].p].n)} · ${esc(r.why)}</small></span></button>`).join('')}</div></div></div>` : `<div class="scene" id="hscene">${sceneSVG(b, st.hour)}${wxOverlay()}
        <span class="chip">${b ? esc(TYPES[b.type].n) + ' · ' + (b.mall ? esc((K.mallById(st, b.mall) || {}).n || '') : esc(K.PROV[DISTRICTS[b.d].p].n) + ' · ' + esc(DISTRICTS[b.d].n)) + (b.status === 'hazirlik' ? ' · ruhsat ' + b.daysLeft + ' gün' : '') : ''}</span>
        ${b ? `<button class="gold go" style="height:30px;font-size:11.5px" data-a="branch" data-v="${b.id}">Şubeyi yönet</button>` : ''}
        ${b && b.status === 'hazirlik' ? (K.iapState(st).tickets ? `<button class="adbtn onscene tk" data-a="ticket" data-v="${b.id}">Ruhsat bileti kullan · ${K.iapState(st).tickets}</button>` : adBtn('ruhsat', 'Reklam izle · ruhsatı 3 gün hızlandır', b.id, 'onscene')) : ''}
        ${n > 1 ? `<div class="nav"><button data-a="hprev" aria-label="Önceki mülk">‹</button><span class="pdots">${st.branches.map((x, i) => `<i class="${i === ui.homeIdx ? 'on' : ''}" title="${esc(x.name)} · ${TYPES[x.type].n}"></i>`).join('')}</span><button data-a="hnext" aria-label="Sonraki mülk">›</button></div>` : ''}
        ${ramChip(b)}${adBtn('gunluk', 'Günlük ödül · ' + fmtK(K.dailyGift(st)), '', 'onscene gift')}
        <div id="coins"></div>
      </div>`}
      ${!b ? '' : `<div class="kpis k3">
        ${showY ? `<div><span class="lbl">Dün ciro</span><b class="num">${fmtK(yd.rev)}</b><small>Bugün başlamadı</small></div>
        <div><span class="lbl">Dün müşteri</span><b class="num">${Math.round(yd.cust)}</b><small>${yd.lost >= 1 ? Math.round(yd.lost) + ' kişi kaçtı' : 'Kaçan yok'}</small></div>` : `<div><span class="lbl">Bugün ciro</span><b class="num">${t ? fmtK(t.rev) : '—'}</b><small>${b && b.yesterday ? 'Dün ' + fmtK(b.yesterday.rev) : b ? 'İlk gün' : 'Henüz satış yok'}</small></div>
        <div><span class="lbl">Müşteri</span><b class="num">${t ? Math.round(t.cust) : '—'}</b><small>${t && t.lost >= 1 ? Math.round(t.lost) + ' kişi kaçtı' : 'Kaçan yok'}</small></div>`}
        <div><span class="lbl">Puan</span><b class="num">${b ? '★ ' + b.rating.toFixed(1) : '—'}</b><small>${sat != null ? 'Memnuniyet ' + sat : '—'}</small></div>
      </div>`}
    </div>
    <div class="hr">
      <div class="kasa2">
        <div class="kt"><span class="lbl">Kasa</span><b class="num">${fmt(st.cash)}</b><small>Bu ay ciro ${fmtK(monthRev)}</small></div>
        <div class="ks">${spark((st.cashHist || []).slice(-30).concat([st.cash]), 46)}</div>
      </div>
      <div class="arows">
        ${act(b ? 'qbranch' : 'nav', b ? 'menu' : 'map', IC.menu, 'Menü & fiyat', b ? Object.values(b.menu).filter(m => m.on).length + ' ürün' : 'Önce şube aç')}
        ${act(b ? 'qbranch' : 'nav', b ? 'personel' : 'map', IC.staff, 'Personel', b ? b.staff + ' kişi' : 'Önce şube aç', b && b.staff < K.minStaff(b.concept, b.tables))}
        ${prom ? act('nav', 'bank', IC.bank, 'Banka', 'Promosyon teklifi', prom) : ''}
        ${act('nav', 'marketing', IC.mkt, 'Pazarlama', st.mkt.followers.toLocaleString('tr-TR') + ' takipçi')}
        ${act('nav', 'company', IC.news, 'Gelişmeler', lastLog ? esc(lastLog.m) : '—')}
      </div>
      <button class="cta" data-a="gomap" data-v=""><span><span class="h">${n ? 'Yeni şube aç' : 'İlk dükkanını bul'}</span></span><span class="arrow">›</span></button>
    </div>
  </div>`;
}

/* ---------- harita: il ve ilçe sınırları ---------- */
const TRV = [TRD.vb[0] - 160, TRD.vb[1] - 160, TRD.vb[2] - TRD.vb[0] + 320, TRD.vb[3] - TRD.vb[1] + 320];
const MAR = 1.68; const DIMS = { tr: { w: TRV[2], h: TRV[2] / MAR, x0: TRV[0], y0: TRV[1] + TRV[3] / 2 - TRV[2] / MAR / 2 } };
const dims = () => DIMS.tr;
const MVDEF = { tr: { x: TRV[0], y: DIMS.tr.y0, w: TRV[2] } };
function mapView() { ui.mvs = ui.mvs || {}; if (!ui.mvs.tr) ui.mvs.tr = Object.assign({}, MVDEF.tr); return ui.mvs.tr; }
function setMV(v) { ui.mvs = ui.mvs || {}; ui.mvs.tr = v; }
const PROFF = { luks: '#66558c', premium: '#85703f', normal: '#2d6386', dusuk: '#364257' };
const PROFC = { luks: '#c7a7e8', premium: '#d4b26a', normal: '#6fb3d9', dusuk: '#7d8aa0' };
const TR_LABEL = new Set(['34', '06', '35', '07', '16', '26', '42', '38', '55', '61', '25', '21', '27', '01', '48', '20', '44', '63', '65', '58', '10', '17', '22', '37', '33', '31', '03', '19', '52']);
function provPaths(sel, dim) {
  return K.PROVINCES.map(P => { const g = TRD.p[P.code]; if (!g || (dim && sel === P.code)) return ''; const own = st.branches.filter(b => DISTRICTS[b.d].p === P.code).length;
    const cls = ['prv', own ? 'own' : '', sel === P.code ? 'sel' : '', dim ? 'dim' : ''].join(' ');
    return `<path class="${cls}" d="${g.d}" data-a="prov" data-v="${P.code}" tabindex="${dim ? -1 : 0}" role="button" aria-label="${esc(P.n)}"><title>${esc(P.n)}</title></path>`; }).join('');
}
function trMapSVG() {
  const mv = mapView(), D = dims(), h = mv.w * D.h / D.w, u = mv.w / 630;
  const lbl = K.PROVINCES.map(P => { const g = TRD.p[P.code]; if (!g) return ''; const own = st.branches.filter(b => DISTRICTS[b.d].p === P.code).length;
    const fs = (P.tier === 'm' ? 8.6 : 7) * u; const [x, y] = g.c;
    const rec = !st.branches.length && K.START_REC.some(r => DISTRICTS[r.d].p === P.code);
    return `<g class="plbl ${own ? 'own' : ''} ${rec ? 'rec' : ''} ${ui.prov === P.code ? 'sel' : ''}">${own ? `<circle cx="${x}" cy="${y - fs * 1.1}" r="${3.4 * u}" class="pob"/>` : ''}${rec ? `<path class="pstar" transform="translate(${x - 5 * u} ${y - fs * 1.1 - 5 * u}) scale(${10 * u / 24})" d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>` : ''}<text x="${x}" y="${y + fs * .35}" text-anchor="middle" style="font-size:${fs}px;stroke-width:${2.2 * u}px">${esc(P.n)}</text></g>`; }).join('');
  return `<svg class="mapsvg trmap2" id="mapsvg" viewBox="${mv.x.toFixed(1)} ${mv.y.toFixed(1)} ${mv.w.toFixed(1)} ${h.toFixed(1)}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Türkiye il haritası">
    <rect class="sea" x="${TRV[0] - 9000}" y="${TRV[1] - 9000}" width="${TRV[2] + 18000}" height="${TRV[3] + 18000}"/>
    <g class="provs">${provPaths(ui.prov, false)}</g>
    <g class="lbls">${lbl}</g>
    <text class="water" x="${TRV[0] + TRV[2] * .45}" y="${TRV[1] + 420}" text-anchor="middle" style="font-size:${10 * u}px;letter-spacing:${4 * u}px">KARADENİZ</text>
    <text class="water" x="${TRV[0] + TRV[2] * .35}" y="${TRV[1] + TRV[3] - 120}" text-anchor="middle" style="font-size:${10 * u}px;letter-spacing:${4 * u}px">AKDENİZ</text>
  </svg>`;
}
function provMapSVG(code) {
  const mv = mapView(), D = dims(), h = mv.w * D.h / D.w, u = mv.w / 630;
  const geo = TRD.ds[code]; const ids = K.provDistricts(code);
  const regions = ids.filter(id => DISTRICTS[id].g != null).map(id => { const d = DISTRICTS[id]; const locked = K.districtLock(st, id).length > 0, own = st.branches.filter(b => b.d === id).length, sel = ui.sel === id;
    return `<path class="dreg ${d.prof} ${locked ? 'locked' : ''} ${sel ? 'sel' : ''} ${own ? 'own' : ''}" d="${geo[d.g][4]}" data-a="sel" data-v="${id}" tabindex="0" role="button" aria-label="${esc(d.n)}"><title>${esc(d.n)} · ${K.PROFILE[d.prof].n}</title></path>`; }).join('');
  const sorted = ids.slice().sort((a, b) => (ui.sel === a) - (ui.sel === b));
  const labels = sorted.map(id => { const d = DISTRICTS[id]; const locked = K.districtLock(st, id).length > 0, own = st.branches.filter(b => b.d === id).length, sel = ui.sel === id;
    const fs = (d.spot ? 8 : d.central ? 10 : 9) * u; const gr = d.g != null ? geo[d.g] : null;
    const fits = !gr || sel || own || (gr[6] > d.n.length * fs * .56 && gr[7] > fs * 1.4);
    if (d.spot && !(u < 2.6 || sel)) return '';
    if (!d.spot && !fits) return '';
    if (d.spot) return `<g class="dspot ${d.prof} ${locked ? 'locked' : ''} ${sel ? 'sel' : ''}" data-a="sel" data-v="${id}" tabindex="0" role="button" aria-label="${esc(d.n)}"><circle cx="${d.mx}" cy="${d.my}" r="${10 * u}" fill="transparent"/><circle class="sd" cx="${d.mx}" cy="${d.my}" r="${3.2 * u}" style="stroke-width:${1.4 * u}px"/><text x="${d.mx + 6 * u}" y="${d.my + fs * .35}" style="font-size:${fs}px;stroke-width:${2.6 * u}px">${locked ? '🔒︎ ' : ''}${esc(d.n)}</text></g>`;
    return `<g class="dlbl ${locked ? 'locked' : ''} ${sel ? 'sel' : ''} ${own ? 'own' : ''}">${own ? `<circle cx="${d.mx}" cy="${d.my - fs * 1.15}" r="${3.2 * u}" class="pob"/>` : ''}<text x="${d.mx}" y="${d.my + fs * .35}" text-anchor="middle" style="font-size:${fs}px;stroke-width:${2.6 * u}px">${esc(d.n)}</text></g>`; }).join('');
  const recIds = st.branches.length ? [] : K.START_REC.map(r => r.d).filter(id => DISTRICTS[id].p === code);
  const recs = recIds.map(id => { const d = DISTRICTS[id]; const r = 7 * u; return `<g class="drec" data-a="sel" data-v="${id}"><circle cx="${d.mx}" cy="${d.my - 13 * u}" r="${r}"/><path transform="translate(${d.mx - r * .62} ${d.my - 13 * u - r * .64}) scale(${r * 1.24 / 24})" d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></g>`; }).join('');
  return `<svg class="mapsvg trmap2 provmap" id="mapsvg" viewBox="${mv.x.toFixed(1)} ${mv.y.toFixed(1)} ${mv.w.toFixed(1)} ${h.toFixed(1)}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(K.PROV[code].n)} il haritası">
    <rect class="sea" x="${TRV[0] - 9000}" y="${TRV[1] - 9000}" width="${TRV[2] + 18000}" height="${TRV[3] + 18000}"/>
    <g class="provs">${provPaths(code, true)}</g>
    <g class="dregs">${regions}</g>
    <path class="pfocus" d="${TRD.p[code].d}"/>
    <g class="lbls">${labels}</g>
    <g class="malls">${mallPins(code, u)}</g><g class="recg">${recs}</g></svg>`;
}
// AVM simgeleri: ekranda sabit boyut, büyük dokunma alanı; birbirine yakın olanlar sayılı balonda toplanır
function mallPins(code, u) {
  const ms = K.allMalls(st).filter(m => m.p === code); const R = 11 * u, gap = 30 * u; const groups = [];
  for (const m of ms) { const g = groups.find(g => Math.hypot(g.x - m.x, g.y - m.y) < gap); if (g) { g.ms.push(m); g.x = (g.x * (g.ms.length - 1) + m.x) / g.ms.length; g.y = (g.y * (g.ms.length - 1) + m.y) / g.ms.length; } else groups.push({ x: m.x, y: m.y, ms: [m] }); }
  return groups.map(g => {
    if (g.ms.length > 1) { const vac = g.ms.some(m => K.mallVac(st, m.id).n), own = g.ms.some(m => st.branches.some(b => b.mall === m.id)), nw = g.ms.some(m => m.isNew && st.day - m.openDay < 60); const r = R * (1 + Math.min(.5, g.ms.length * .06));
      return `<g class="mclus ${own ? 'own' : ''} ${nw ? 'new' : ''}" data-a="mclus" data-v="${Math.round(g.x)},${Math.round(g.y)}" data-k="${g.ms.map(m => m.id).join('|')}" tabindex="0" role="button" aria-label="${g.ms.length} AVM"><title>${g.ms.map(m => m.n).join(', ')}</title><circle cx="${g.x}" cy="${g.y}" r="${r + 8 * u}" fill="transparent"/><circle class="cb" cx="${g.x}" cy="${g.y}" r="${r}"/><text x="${g.x}" y="${g.y + r * .36}" style="font-size:${r * 1.0}px">${g.ms.length}</text>${vac ? `<circle class="vdot" cx="${g.x + r * .75}" cy="${g.y - r * .75}" r="${3 * u}"/>` : ''}</g>`; }
    const m = g.ms[0], own = st.branches.some(b => b.mall === m.id), v = K.mallVac(st, m.id), sel = ui.mall === m.id;
    return `<g class="mpin ${own ? 'own' : ''} ${sel ? 'sel' : ''} ${m.isNew && st.day - m.openDay < 60 ? 'new' : ''}" data-a="mall" data-v="${m.id}" tabindex="0" role="button" aria-label="${esc(m.n)}"><title>${esc(m.n)} · ${v.n ? v.n + ' boş yer' : 'dolu'}</title><circle cx="${m.x}" cy="${m.y}" r="${R + 9 * u}" fill="transparent"/><rect x="${m.x - R}" y="${m.y - R}" width="${2 * R}" height="${2 * R}" rx="${R * .45}"/><g transform="translate(${m.x - R * .62} ${m.y - R * .66}) scale(${R * 1.24 / 24})"><path d="M6 8h12l-1 12H7z M9 8V6a3 3 0 0 1 6 0v2"/></g>${v.n ? `<circle class="vdot" cx="${m.x + R * .85}" cy="${m.y - R * .85}" r="${3 * u}"/>` : ''}${u < 1.6 || sel ? `<text class="mlbl" x="${m.x}" y="${m.y + R + 9 * u}" style="font-size:${7.5 * u}px;stroke-width:${2.2 * u}px">${esc(m.n)}</text>` : ''}</g>`;
  }).join('');
}
function provView(code) { const bb = TRD.p[code].bb, D = dims(); const bw = bb[2] - bb[0], bh = bb[3] - bb[1]; const w = Math.max(bw * 1.12, bh * 1.22 * D.w / D.h, 900); return [(bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2, w]; }
function vMap() {
  const lv = ui.mapLevel || 'tr', ist = false, pv = lv === 'prov' && ui.prov;
  const title = pv ? esc(K.PROV[ui.prov].n) : 'Türkiye';
  const legend = pv || ist ? `<div class="maplegend prof">${['luks', 'premium', 'normal', 'dusuk'].map(k => `<span><i style="background:${PROFF[k]}"></i>${K.PROFILE[k].n}</span>`).join('')}<span><i class="l"></i>Kilitli</span></div>` : `<div class="maplegend"><span><i class="pf"></i>İl</span><span><i class="pfo"></i>Şuben var</span><span class="muted">İle dokun, ilçelerini gör</span></div>`;
  return `<div class="mapwrap"><div class="card mapcard" id="mapcard"><span class="maplabel">${ist || pv ? '<button class="btn sm ghost" data-a="level" data-v="tr">‹ Türkiye</button> ' : ''}${title}</span>${pv ? provMapSVG(ui.prov) : trMapSVG()}
      <div class="mapzoom"><button data-a="mz" data-v="in" aria-label="Yakınlaştır">+</button><button data-a="mz" data-v="out" aria-label="Uzaklaştır">−</button><button data-a="mz" data-v="reset" aria-label="Haritayı sığdır">⤢</button></div>
      ${legend}</div>
    <div class="side">${ui.mall ? mallPanel(ui.mall) : ui.mallGroup ? mallGroupPanel(ui.mallGroup) : ui.sel ? districtPanel(ui.sel) : ui.prov ? provPanel(ui.prov) : `<div class="card"><h2>Bir il seç</h2><p class="muted" style="margin:4px 0 0">81 ilin her birinde dükkan açabilirsin. Haritada ile dokun; il haritası açılır ve ilçeleri profillerine göre renkli görünür.</p></div>`}</div></div>`;
}
function provPanel(code) {
  const P = K.PROV[code]; const ds = K.provDistricts(code);
  const tierN = { m: 'Metropol', b: 'Büyükşehir', k: 'İl' }[P.tier];
  const groups = ['luks', 'premium', 'normal', 'dusuk'].map(k => [k, ds.filter(id => (DISTRICTS[id].prof || 'normal') === k)]).filter(g => g[1].length);
  return `<div class="dcardp"><div class="dhead"><button class="ibtn" data-a="prov" data-v="" aria-label="Türkiye">${I('<path d="M15 6l-6 6 6 6"/>')}</button><div><span class="lbl">${P.code} · ${tierN}</span><h2>${esc(P.n)}</h2></div><span class="etag">${ds.length} ${code === '34' ? 'semt' : 'ilçe'}</span></div>
    <div class="chips">${P.stu > .08 ? '<span class="pill acc">Üniversite şehri</span>' : ''}${P.tour > .1 ? '<span class="pill acc">Turizm</span>' : ''}${groups.map(([k, l]) => `<span class="pill"><i class="pdot" style="background:${PROFC[k]}"></i>${l.length} ${K.PROFILE[k].n}</span>`).join('')}</div></div>
  ${groups.map(([k, l]) => `<div class="dgrp"><span class="lbl"><i class="pdot" style="background:${PROFC[k]}"></i>${K.PROFILE[k].n}</span><div class="dlist">${l.map(id => { const d = DISTRICTS[id], lk = K.districtLock(st, id).length > 0, own = st.branches.filter(b => b.d === id).length;
    return `<button class="dcard ${lk ? 'locked' : ''}" data-a="sel" data-v="${id}"><div><b>${esc(d.n)}${d.central ? ' <small class="cen">merkez</small>' : ''}${!st.branches.length && K.START_REC.some(r => r.d === id) ? ' <small class="cen recb">önerilen</small>' : ''}</b><small>Kira ${fmtK(d.rent * st.world.refIdx)}/m² · trafik ${d.traffic >= 1000 ? 'yüksek' : d.traffic >= 650 ? 'orta' : 'düşük'}</small></div><span class="${lk ? 'pill' : own ? 'pill acc' : 'pill ok'}">${lk ? 'Kilitli' : own ? own + ' şube' : 'Açık'}</span></button>`; }).join('')}</div></div>`).join('')}`;
}
function ring(v, label, txt) { const p = Math.max(0, Math.min(1, v)); const C = 2 * Math.PI * 15; return `<div class="rg"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" class="rt"/><circle cx="18" cy="18" r="15" class="rf" stroke-dasharray="${(C * p).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 18 18)"/></svg><b class="num">${txt}</b><small>${label}</small></div>`; }
function curListings() { if (ui.mall) return K.mallListings(st, ui.mall) || []; if (!ui.sel || !K.DISTRICTS[ui.sel]) return []; return K.getListings(st, ui.sel, ui.type); }
const MALL_IC = '<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>';
function mallPanel(mid) {
  const m = K.mallById(st, mid); if (!m) { ui.mall = null; return ''; } const did = K.mallDid(st, m), d = DISTRICTS[did]; const v = K.mallVac(st, mid); const S = K.MALL_SIZE[m.s];
  const lock = K.typeLock(st, 'avm', did); const ls = lock.length ? [] : K.mallListings(st, mid); const isNew = m.isNew && st.day - m.openDay < 60; const opening = m.isNew && st.day < m.openDay;
  const own = st.branches.filter(b => b.mall === mid);
  let h = `<div class="dcardp mallp"><div class="dhead"><button class="ibtn" data-a="mallback" aria-label="Geri">${I('<path d="M15 6l-6 6 6 6"/>')}</button><div><span class="lbl">${esc(K.PROV[m.p].n)} · ${esc(d.n)} · AVM</span><h2>${esc(m.n)}</h2></div>${isNew ? '<span class="etag newm">Yeni açılış</span>' : ''}</div>
    <div class="mallkpi"><div><span class="lbl">Büyüklük</span><b>${S.n}</b></div><div><span class="lbl">Ziyaretçi</span><b>${m.s === 3 ? 'Çok yüksek' : m.s === 2 ? 'Yüksek' : 'Orta'}</b></div><div><span class="lbl">Hafta sonu</span><b class="pos">+%60</b></div><div><span class="lbl">Boş yer</span><b>${lock.length ? '—' : v.n}</b></div></div>
    <p class="muted" style="margin:0;font-size:10.5px">${opening ? 'AVM ' + (m.openDay - st.day) + ' gün sonra açılıyor; şimdi kiralarsan açılışta hazır olursun. ' : ''}${isNew ? 'Açılış döneminde ziyaretçi %25 fazla, ilk 6 ay kira yarı fiyatına. ' : ''}AVM'de hava etkilemez, cumartesi ve pazar ziyaretçi artar. Kiranın yanında cirodan pay ödenir.${own.length ? ' Burada ' + own.length + ' şuben var.' : ''}</p></div>`;
  if (lock.length) return h + `<div class="lockbox"><b>AVM'de dükkan açmak için</b><ul>${lock.map(x => '<li>' + esc(x) + '</li>').join('')}</ul></div>`;
  if (!ls.length) return h + `<div class="lockbox calm"><b>Şu an boş yer yok</b><p style="margin:4px 0 0">Dükkanlar dönem dönem el değiştiriyor. Yaklaşık ${Math.max(1, v.until - st.day)} gün sonra tekrar bak.</p></div>`;
  return h + `<div class="row between"><span class="muted" style="font-size:10.5px">${ls.length} boş yer</span><button class="btn sm" data-a="compare">Karşılaştır</button></div>` + ls.map(listingCard).join('');
}
function mallGroupPanel(ids) {
  const ms = ids.map(id => K.mallById(st, id)).filter(Boolean);
  return `<div class="dcardp"><div class="dhead"><button class="ibtn" data-a="mgback" aria-label="Geri">${I('<path d="M15 6l-6 6 6 6"/>')}</button><div><span class="lbl">${esc(K.PROV[ms[0].p].n)} · bu bölge</span><h2>${ms.length} AVM</h2></div></div><p class="muted" style="margin:0;font-size:10.5px">Birini seç ya da haritada yakınlaş.</p></div>${mallCards(ms)}`;
}
function mallCards(ms) { return `<div class="malll">${ms.map(m => { const v = K.mallVac(st, m.id); return `<button class="mallc" data-a="mall" data-v="${m.id}"><span class="mic">${I(MALL_IC)}</span><span class="mt"><b>${esc(m.n)}</b><small>${esc(m.dn)} · ${K.MALL_SIZE[m.s].n} · ${v.n ? v.n + ' boş yer' : 'şu an dolu'}${m.isNew && st.day - m.openDay < 60 ? ' · açılış indirimi' : ''}</small></span><span class="chev">›</span></button>`; }).join('')}</div>`; }
function mallList(did) {
  const ms = K.mallsIn(st, did);
  if (!ms.length) return `<div class="lockbox calm"><b>Bu ilçede AVM yok</b><p style="margin:4px 0 0">Haritada çanta simgeli noktalar AVM'leri gösterir. İstanbul, Ankara ve İzmir'de zaman zaman yeni AVM açılır.</p></div>`;
  return `<div class="malll">${ms.map(m => { const v = K.mallVac(st, m.id); return `<button class="mallc" data-a="mall" data-v="${m.id}"><span class="mic">${I(MALL_IC)}</span><span class="mt"><b>${esc(m.n)}</b><small>${K.MALL_SIZE[m.s].n} · ${v.n ? v.n + ' boş yer' : 'şu an dolu'}${m.isNew && st.day - m.openDay < 60 ? ' · açılış indirimi' : ''}</small></span><span class="chev">›</span></button>`; }).join('')}</div>`;
}
function districtPanel(id) {
  const d = DISTRICTS[id], lock = K.districtLock(st, id); const comps = K.comps(st, id);
  const lvl = v => v < .34 ? 'Düşük' : v < .67 ? 'Orta' : 'Yüksek';
  const elitTag = K.PROFILE[d.prof || K.profileOf(d)].n;
  const rc = !st.branches.length && K.START_REC.find(r => r.d === id);
  let h = `<div class="dcardp">${rc ? `<div class="recbar">${I('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>')}<span><b>Başlangıç için önerilen</b> · ${esc(rc.why)}. Kurulumda tahmini kârı kontrol etmeyi unutma.</span></div>` : ''}
    <div class="dhead"><button class="ibtn" data-a="sel" data-v="" aria-label="Geri">${I('<path d="M15 6l-6 6 6 6"/>')}</button><div><span class="lbl">${esc(K.PROV[d.p].n)}${d.side ? ' · ' + d.side + ' yakası' : ''}</span><h2>${esc(d.n)}</h2></div><span class="etag">${elitTag}</span></div>
    <div class="dkpi"><div><span class="lbl">Kira</span><b class="num">${fmtK(d.rent * st.world.refIdx)}</b><small>m² / ay</small></div><div><span class="lbl">Semt profili</span><b class="num">${d.elit}<small>/10</small></b><div class="elbar">${Array.from({ length: 10 }, (_, i) => `<i class="${i < d.elit ? 'f' : ''}"></i>`).join('')}</div></div></div>
    <div class="rings">${ring(d.traffic / 1400, 'Yaya trafiği', lvl(d.traffic / 1400))}${ring(d.stu / .6, 'Öğrenci', Math.round(d.stu * 100) + '%')}${ring(d.off / .7, 'Ofis', Math.round(d.off * 100) + '%')}${ring(d.comp, 'Rekabet', lvl(d.comp))}</div>
    <div class="rivs"><span class="lbl">Yakındaki kafeler</span><div class="rivl">${comps.map(c => `<span class="riv ${c.tier === 'premium' ? 'prem' : ''}"><i>${esc(c.n.slice(0, 1))}</i><span>${esc(c.n)}<small class="rp">${c.price}${c.promo ? ' · kampanya' : ''}</small></span><b>★ ${(+c.rating).toFixed(1)}${c.tr ? `<em class="${c.tr > 0 ? 'up' : 'dn'}">${c.tr > 0 ? '▲' : '▼'}</em>` : ''}</b></span>`).join('')}</div></div>
  </div>`;
  if (lock.length) return h + `<div class="lockbox"><b>Bu semt kilitli</b><ul>${lock.map(x => '<li>' + esc(x) + '</li>').join('')}</ul></div>`;
  const req = { kafe: 'Açık', metro: '2 kafe', avm: '3 kafe', pub: '5 kafe', rooftop: 'Pub şart' }; const shortN = { kafe: 'Kafe', metro: 'Metro', avm: 'AVM', pub: 'Pub', rooftop: 'Rooftop' };
  h += `<div class="typesel" role="radiogroup" aria-label="İşletme tipi">${Object.keys(TYPES).map(t => { const lk = K.typeLock(st, t, id).length > 0; return `<button role="radio" aria-checked="${ui.type === t}" class="tcard ${ui.type === t ? 'on' : ''} ${lk ? 'locked' : ''}" data-a="type" data-v="${t}"><span class="ti">${TIC[t]}</span><b>${shortN[t]}</b><small>${lk ? '<svg viewBox="0 0 24 24" class="lk"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>' + req[t] : (ui.type === t ? 'Seçili' : 'Açık')}</small></button>`; }).join('')}</div>`;
  const tl = K.typeLock(st, ui.type, id);
  if (tl.length) return h + `<div class="lockbox"><b>${TYPES[ui.type].n} açmak için</b><ul>${tl.map(x => '<li>' + esc(x) + '</li>').join('')}</ul><p style="margin:6px 0 0">${TYPES[ui.type].desc}</p></div>${ui.type === 'avm' ? mallList(id) : ''}`;
  if (ui.type === 'avm') return h + mallList(id);
  const ls = K.getListings(st, id, ui.type);
  h += `<div class="row between"><span class="muted" style="font-size:10.5px">${ls.length} ilan</span><div class="row"><button class="btn sm" data-a="compare">Karşılaştır</button><button class="btn sm" data-a="refreshL">Yeni ilanlar · 5.000 ₺</button>${adBtn('ilan', 'Ücretsiz yenile', '', 'sm')}</div></div>`;
  return h + ls.map(listingCard).join('');
}
const LI = {
  area: I('<path d="M4 4h16v16H4z"/><path d="M4 9h5V4M15 20v-5h5"/>'), table: I('<path d="M3 9h18M6 9v10M18 9v10M8 5h8"/>'), dep: I('<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/>'), walk: I('<circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2-6 3 3v3M9 12l2-4 4 2 2 3"/>'),
  ok: I('<path d="M5 12l4.5 4.5L19 7"/>'), warn: I('<path d="M12 8v5M12 16.5v.5"/><circle cx="12" cy="12" r="9"/>'), no: I('<path d="M7 7l10 10M17 7 7 17"/>')
};
function compareSheet() {
  if (!ui.mall && !DISTRICTS[ui.sel]) { ui.cmp = null; return ''; }
  const ls = curListings(); const d = DISTRICTS[ui.sel];
  const rows = ls.map(L => { const A = ARCH[L.arch]; const ch = K.defaultChoice(st, L); const f = fcGet(L, ch); const cost = K.setupCost(st, L, ch).total;
    const tr = A.tm >= 1.05 ? 'Çok yüksek' : A.tm >= .9 ? 'Yüksek' : A.tm >= .7 ? 'Orta' : 'Düşük'; return { L, A, f, cost, tr }; });
  const best = rows.filter(r => r.f && r.f.profit > 0).sort((a, b) => a.f.payback - b.f.payback)[0];
  return `<div class="sheet cmp" role="dialog" aria-modal="true" aria-label="İlan karşılaştırma"><header class="sth"><div><span class="lbl">${esc(K.PROV[d.p].n)} · ${esc(d.n)} · ${typeName(ui.type)}</span><h2>İlanları karşılaştır</h2></div><button class="ibtn" data-a="closecmp" aria-label="Kapat"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></header>
    <div class="tw"><table class="t cmpt"><thead><tr><th>İlan</th><th class="r">m²</th><th class="r">Masa</th><th class="r">Kira/ay</th><th class="r">Kira/m²</th><th>Trafik</th><th class="r">Yakın rakip</th><th class="r">Açılış</th><th class="r">Tahmini kâr/ay</th><th class="r">Geri dönüş</th><th></th></tr></thead><tbody>
    ${rows.map(r => `<tr class="${best && best.L.id === r.L.id ? 'best' : ''}"><td><b>${esc(r.L.nm || r.A.n)}</b>${r.L.inspected ? ' <span class="pill ok">İncelendi</span>' : ''}${r.L.blocked ? ' <span class="pill bad">İzin yok</span>' : ''}</td><td class="r num">${r.L.area}</td><td class="r num">${r.L.tables}${r.L.hasFront ? '+' + r.L.frontTables : ''}</td><td class="r num">${fmtK(r.L.rent)}</td><td class="r num">${fmt(r.L.rent / r.L.area)}</td><td>${r.tr}</td><td class="r num">${(r.L.nearby || []).length}</td><td class="r num">${fmtK(r.cost)}</td><td class="r num ${r.f && r.f.profit < 0 ? 'neg' : 'pos'}">${r.f ? fmtK(r.f.profit) : '—'}</td><td class="r num">${r.f && r.f.profit > 0 ? Math.ceil(r.f.payback) + ' ay' : '—'}</td><td><button class="btn sm ${best && best.L.id === r.L.id ? 'pri' : ''}" data-a="rentcmp" data-v="${r.L.id}">Seç</button></td></tr>`).join('')}
    </tbody></table></div><small class="muted" style="font-size:10px">Tahminler varsayılan kurulumla (standart dekor, orta ekipman) hesaplandı. İncelenmemiş ilanlarda gizli kusurlar hesaba katılmaz, sapma ±%25'e çıkabilir.</small></div>`;
}
function listingCard(L) {
  const A = ARCH[L.arch]; const feats = [];
  const f = (k, t) => feats.push(`<li class="${k}"><span>${LI[k === 'ok' ? 'ok' : k === 'warn' ? 'warn' : 'no']}</span>${t}</li>`);
  if (L.hasFront) { if (L.flic) f('ok', 'Ön alan ruhsata işli'); else f('warn', 'Ön alan ruhsatta yok · apartmana ' + fmtK(L.aptFee) + '/ay'); }
  L.smoke ? f('ok', 'Sigara içilebilir alan var') : f('no', 'Sigara içilebilir alan yok');
  if (A.devren) f('ok', 'Devren: ekipman ve ruhsat hazır');
  if (A.kiosk) f('warn', 'Sadece take away');
  if (L.ciro) f('warn', 'Ciro payı %' + Math.round(L.ciro * 100));
  if (L.aidat) f('warn', 'Aidat ' + fmtK(L.aidat) + '/ay');
  if (A.school) f('warn', 'Okul yakını · öğrenci ağırlıklı');
  if (A.growing) f('warn', 'Site dolmadı · ilk 6 ay kira %50');
  if (A.seasonal) f('warn', 'Mevsimsel: yaz yoğun, kış sakin');
  if (A.wknd && A.wknd < 1) f('warn', 'Hafta sonu sakin');
  const traffic = A.tm >= 1.05 ? ['Çok yüksek', 4] : A.tm >= .9 ? ['Yüksek', 3] : A.tm >= .7 ? ['Orta', 2] : ['Düşük', 1];
  const est = K.listingEstimate(L);
  return `<article class="lst ${L.blocked ? 'blocked' : ''}">
    <header><div><span class="lbl">${esc(TYPES[L.type].n)} · ilan</span><h3>${esc(L.nm || A.n)}</h3></div><div class="lrent"><b class="num">${fmt(L.rent)}</b><small>aylık kira</small></div></header>
    <div class="lfacts">
      <div><span class="fi">${LI.area}</span><b class="num">${L.area} m²</b><small>Alan</small></div>
      <div><span class="fi">${LI.table}</span><b class="num">${L.tables || '—'}${L.hasFront ? '<em>+' + L.frontTables + '</em>' : ''}</b><small>Masa</small></div>
      <div><span class="fi">${LI.dep}</span><b class="num">${fmtK(L.deposit)}</b><small>Depozito</small></div>
      <div><span class="fi">${LI.walk}</span><b>${traffic[0]}</b><small>Yaya trafiği</small><span class="tbars">${[1, 2, 3, 4].map(i => `<i class="${i <= traffic[1] ? 'f' : ''}"></i>`).join('')}</span></div>
    </div>
    <ul class="lfeat">${feats.join('')}</ul>
    <div class="lnear"><span class="lbl">500 m içinde</span>${L.nearby.length ? L.nearby.map(c => `<span class="nb2 ${c.tier === 'premium' ? 'prem' : ''}">${esc(c.n)}</span>`).join('') : '<span class="muted" style="font-size:10.5px">Rakip yok</span>'}${L.havaParasi ? `<span class="hp">Hava parası <b class="num">${fmtK(L.havaParasi)}</b></span>` : ''}</div>
    ${L.inspected ? `<div class="insp"><span class="lbl">İnceleme raporu</span><p>${esc(L.hint)}</p><div class="potb"><span>Tahmini potansiyel</span><div class="bar"><i style="margin-left:${Math.max(0, est[0] - 50)}%;width:${est[1] - est[0]}%"></i></div><b class="num">%${est[0]}–${est[1]}</b></div>${L.badPast ? '<small class="neg">Eski işletmenin yorumları kötü</small>' : ''}</div>` : ''}
    ${L.blocked ? `<div class="insp blk">${esc(L.blocked)}</div>` : ''}
    <footer>${L.inspected ? '<span class="pill ok">İncelendi</span>' : `${!L.blocked ? adBtn('incele', 'Ücretsiz incelet', L.id, 'sm') : ''}<button class="btn" data-a="inspect" data-v="${L.id}" ${L.blocked ? 'disabled' : ''}>İncelet<small class="num">15 B ₺</small></button>`}<button class="gold" data-a="rent" data-v="${L.id}" ${L.blocked ? 'disabled' : ''}>Kirala ve kur ${IC.next}</button></footer>
  </article>`;
}

/* ---------- kurulum ---------- */
function opt(k, v, on, title, price, desc, dis) { return `<button class="oc ${on ? 'on' : ''}" data-a="ch" data-k="${k}" data-v="${v}" ${dis ? 'disabled' : ''} aria-pressed="${on}"><span class="ock"></span><b>${title}</b>${price != null ? `<span class="ocp num">${price}</span>` : ''}${desc ? `<small>${desc}</small>` : ''}</button>`; }
const FC = {};
function fcKey(L, ch) { return L.id + (L.inspected ? 'i' : '') + JSON.stringify([ch.concept, ch.decor, ch.equip, ch.kitchen, ch.staff, ch.wage, ch.bank, ch.valor, ch.useFront]) + st.branches.length + Math.round(st.world.refIdx * 100); }
function fcGet(L, ch) { const k = fcKey(L, ch); if (!(k in FC)) { try { FC[k] = K.forecast(st, L, ch); } catch (e) { FC[k] = null; } } return FC[k]; }
function fcBlock(f) {
  if (!f) return '';
  const pb = f.payback; const tone = f.profit < 0 ? 'neg' : pb > 18 ? 'warn' : 'pos';
  return `<div class="fcb ${tone}"><div class="fch"><span class="lbl">Tahmini aylık</span><span class="fcu">${f.sure ? 'İncelenmiş ilan · ±%10' : 'İlan incelenmedi · ±%25'}</span></div>
    <div class="fcg"><div><small>Ciro</small><b class="num">${fmtK(f.rev)}</b></div><div><small>İşletme kârı</small><b class="num ${f.profit < 0 ? 'neg' : 'pos'}">${fmtK(f.profit)}</b></div><div><small>Kendini çıkarır</small><b class="num">${f.profit > 0 ? (pb < 1 ? '1 ay' : Math.ceil(pb) + ' ay') : 'Çıkarmaz'}</b></div></div>
    <small class="fcn">Günde ~${Math.round(f.cust)} müşteri${f.lost > 3 ? ', ~' + Math.round(f.lost) + ' kişi kaçar (personel ya da masa yetmez)' : ''}. İlk ay ve kış daha düşük olabilir.</small></div>`;
}
function bestLoan(short) {
  const buf = st.branches.reduce((a, b) => a + b.rent + b.staff * WAGES[b.wage].cost * st.world.wageIdx, 0) + (ui.setup ? ui.setup.L.rent + ui.setup.ch.staff * WAGES[ui.setup.ch.wage].cost * st.world.wageIdx : 0);
  const amt = Math.ceil((short + buf) / 10000) * 10000;
  const offs = K.loanOffers(st); const ok = offs.filter(o => o.ok && o.lim >= amt).map(o => ({ o, q: loanQuote(o, amt) })).sort((a, b) => a.q.r - b.q.r);
  if (ok.length) return { amt, o: ok[0].o, q: ok[0].q };
  const mx = offs.filter(o => o.ok).reduce((m, o) => Math.max(m, o.lim), 0);
  return { amt, why: offs.some(o => o.ok) ? 'En yüksek kredi limitin ' + fmt(mx) + '; ' + fmt(amt) + ' gerekiyor.' : (offs[0] ? offs[0].why : 'Kredi alınamıyor.') };
}
function setupSheet() {
  const { L, ch } = ui.setup; const A = ARCH[L.arch];
  const cost = K.setupCost(st, L, ch); const wait = K.waitDays(st, L); const cs = K.conceptsFor(L); const minS = K.minStaff(ch.concept, L.tables);
  const after = st.cash - cost.total; const wageM = ch.staff * WAGES[ch.wage].cost * st.world.wageIdx;
  const permits = K.permitsFor(st, L, ch);
  const grp = { 'Kira ve depozito': 0, 'Dükkan kurulumu': 0, 'Ruhsat ve izinler': 0 };
  const pn = permits.map(p => p.n);
  for (const l of cost.lines) { if (/Depozito|kira|ihale|Hava parası/i.test(l.n)) grp['Kira ve depozito'] += l.v; else if (pn.includes(l.n)) grp['Ruhsat ve izinler'] += l.v; else grp['Dükkan kurulumu'] += l.v; }
  const used = Math.min(100, cost.total / Math.max(1, st.cash) * 100);
  const fc = fcGet(L, ch); const loanOpt = after < 0 ? bestLoan(-after) : null;
  const cdesc = { takeaway: 'Hızlı devir, düşük sepet', self: 'Dengeli personel ve sepet', garson: 'Sepet +%18, garson gerekir', karma: 'Sepet +%8, az garson' };
  return `<div class="sheet su" role="dialog" aria-modal="true">
    <header class="suh"><div class="suhl"><span class="sui">${TIC[L.type] || TIC.kafe}</span><div><span class="lbl">${esc(K.PROV[DISTRICTS[L.did].p].n)} · ${esc(DISTRICTS[L.did].n)} · ${typeName(L.type)}</span><h2>${esc(A.n)}</h2></div></div>
      <div class="suchips"><span>${L.area} m²</span><span>${L.tables || 0}${L.hasFront ? '+' + L.frontTables : ''} masa</span><span>${fmtK(L.rent)}/ay</span></div>
      <button class="ibtn" data-a="closesetup" aria-label="Vazgeç"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></header>
    <div class="sugrid"><div class="suleft" id="suleft">
      <section class="sus"><div class="sush"><span class="n">1</span><b>Şube adı</b></div><input type="text" id="bname" maxlength="30" value="${esc(ch.name)}"></section>
      <section class="sus"><div class="sush"><span class="n">2</span><b>Servis konsepti</b><small>${L.tables <= 4 ? 'Masa az, oturmalı konsept kapalı' : ''}</small></div>
        <div class="ocs c4">${Object.keys(CONCEPTS).map(c => opt('concept', c, ch.concept === c, CONCEPTS[c].n, null, cdesc[c], !cs.includes(c))).join('')}</div></section>
      <section class="sus"><div class="sush"><span class="n">3</span><b>Tadilat ve dekor</b><small>Lüks semtte basit dekor müşteri kaçırır</small></div>
        <div class="ocs c3">${Object.keys(DECOR).map(k => opt('decor', k, ch.decor === k, DECOR[k].n, fmtK(DECOR[k].m2 * L.area * (A.devren ? .4 : 1)), { basit: 'Memnuniyet −', standart: 'Dengeli', premium: 'Memnuniyet +, Instagram etkisi' }[k])).join('')}</div></section>
      <section class="sus"><div class="sush"><span class="n">4</span><b>Ekipman</b><small>Hız, kalite ve arıza sıklığı</small></div>
        <div class="ocs ${A.devren ? 'c4' : 'c3'}">${A.devren ? opt('equip', 'devren', ch.equip === 'devren', 'Devren gelen', '0 ₺', 'Hazır, orta seviye') : ''}${Object.keys(EQUIP).map(k => opt('equip', k, ch.equip === k, EQUIP[k].n, fmtK(EQUIP[k].cost), { giris: 'Yavaş, sık arıza', orta: 'Dengeli', pro: 'Hızlı, kaliteli kahve' }[k])).join('')}</div>
        ${!A.kiosk ? `<label class="tgl"><input type="checkbox" data-a="chk" data-k="kitchen" ${ch.kitchen ? 'checked' : ''}><span class="tgs"></span><span><b>Mutfak ekle</b><small>Kahvaltı ve burger için · 250.000 ₺</small></span></label>` : ''}</section>
      ${L.hasFront ? `<section class="sus"><div class="sush"><span class="n">5</span><b>Ön alan</b><span class="pill ${L.flic ? 'ok' : 'warn'}">${L.flic ? 'Ruhsata işli' : 'Ruhsata işli değil'}</span></div>
        <label class="tgl"><input type="checkbox" data-a="chk" data-k="useFront" ${ch.useFront ? 'checked' : ''}><span class="tgs"></span><span><b>${L.frontTables} dış masa kullan</b><small>${L.flic ? 'Belediyeye işgaliye ödenir, sigara içilebilir alan olur' : 'Apartmana ' + fmt(L.aptFee) + '/ay ödenir; anlaşma bozulabilir'}</small></span></label></section>` : ''}
      <section class="sus"><div class="sush"><span class="n">${L.hasFront ? 6 : 5}</span><b>Personel</b><small>En az ${minS} önerilir${st.branches.length === 0 ? ' · ilk şubede sen de kasadasın' : ''}</small></div>
        <div class="staffrow"><div class="stepper big"><button data-a="staff" data-v="-1" aria-label="Azalt">−</button><span>${ch.staff}</span><button data-a="staff" data-v="1" aria-label="Artır">+</button></div>
          <div class="ocs c3 sm">${Object.keys(WAGES).map(k => opt('wage', k, ch.wage === k, WAGES[k].n, null, { asgari: 'Moral düşük', piyasa: 'Normal', ustu: 'Moral yüksek' }[k])).join('')}</div></div>
        <div class="sunote">Aylık maaş + SGK <b class="num">${fmt(wageM)}</b></div></section>
      <section class="sus"><div class="sush"><span class="n">${L.hasFront ? 7 : 6}</span><b>POS anlaşması</b><small>Kartlı ödemelerin %85'i POS'tan geçer</small></div>
        <div class="ocs c4 sm">${Object.keys(BANKS).map(k => opt('bank', k, ch.bank === k, BANKS[k].n, null, '%' + (BANKS[k].pos0 * 100).toFixed(2) + ' · %' + (BANKS[k].pos30 * 100).toFixed(2))).join('')}</div>
        <div class="ocs c2 sm" style="margin-top:6px">${opt('valor', '0', ch.valor === '0', 'Blokesiz', '%' + (BANKS[ch.bank].pos0 * 100).toFixed(2), 'Para ertesi gün hesapta')}${opt('valor', '30', ch.valor === '30', '30 gün valör', '%' + (BANKS[ch.bank].pos30 * 100).toFixed(2), 'Komisyon düşük, nakit gecikir')}</div></section>
    </div>
    <aside class="suright">
      <div class="sumc"><span class="lbl">Açılış maliyeti</span><b class="num total">${fmt(cost.total)}</b>
        <div class="budget"><div class="bar"><i class="${after < 0 ? 'over' : ''}" style="width:${used}%"></i></div><div class="row between"><small>Kasanın %${Math.round(cost.total / Math.max(1, st.cash) * 100)}'i</small><small class="${after < 0 ? 'neg' : ''}">Kalan ${fmtK(after)}</small></div></div>
        ${fcBlock(fc)}
        <ul class="sumg">${Object.entries(grp).map(([k, v]) => `<li><span>${k}</span><b class="num">${fmtK(v)}</b></li>`).join('')}<li class="mo"><span>Aylık sabit (kira + maaş)</span><b class="num">${fmtK(L.rent + wageM)}</b></li></ul>
        <details class="sudet"><summary>Kalem kalem dök</summary>${cost.lines.map(l => `<div class="ln"><span>${esc(l.n)}</span><span class="num">${fmt(l.v)}</span></div>`).join('')}</details>
        <div class="suwait"><span class="wi">${wait ? '⏱' : '✓'}</span><span>${wait === 0 ? 'Ruhsatlar anında tamamlanır' : `Ruhsatlar <b>${wait} gün</b> sürer (~${Math.round(wait * 15)} sn)`}</span></div>
      </div>
      <div class="sufoot">${after < 0 && loanOpt && loanOpt.o ? `<button class="sucta2 loanc" data-a="loanopen"><span class="t"><b>Kredi çek ve aç</b><small class="num">${fmt(loanOpt.amt)} ${loanOpt.o.n.replace(' kredisi', '')} · ${loanOpt.o.n_} ay · taksit ${fmtK(loanOpt.q.pay)}/ay</small></span><span class="go2">${IC.next}</span></button>` : `<button class="sucta2" data-a="confirmopen" ${after < 0 ? 'disabled' : ''}><span class="t"><b>${after < 0 ? 'Nakit yetersiz' : wait ? 'Kirala, ruhsatları başlat' : 'Kirala ve aç'}</b><small class="num">${fmt(cost.total)}</small></span><span class="go2">${IC.next}</span></button>`}</div>
      ${after < 0 ? (loanOpt && loanOpt.o ? `<small class="muted" style="font-size:10px">Eksik ${fmt(-after)} + 1 aylık sabit gider tamponu. Faiz aylık %${(loanOpt.q.r * 100).toFixed(2)}${fc && fc.profit > 0 ? `; tahmini kâr taksiti ${loanOpt.q.pay < fc.profit ? 'karşılar' : '<b class="neg">karşılamaz</b>'}` : ''}.</small>` : `<small class="muted" style="font-size:10px">${loanOpt ? esc(loanOpt.why) : 'Kredi limiti yetersiz.'} Daha ucuz seçeneklere geçebilirsin.</small>`) : ''}
    </aside></div></div>`;
}

/* ---------- şubeler ---------- */
function vBranches() {
  if (!st.branches.length) return `<div class="empty"><div class="emptyart">${renovFacade({ id: 'e', par: 'xMidYMax slice' })}</div><div class="emptytx"><span class="lbl">Şubeler</span><h1>Henüz bir dükkanın yok</h1><p>Haritadan bir il seç, kirası uygun bir semtin ilanlarına bak ve ilk şubeni aç.</p><button class="gold" data-a="gomap" data-v="">İlk dükkanını bul ${IC.next}</button></div></div>`;
  const night = st.hour < 7 || st.hour >= 19;
  const tot = st.branches.reduce((a, b) => a + (b.lastMonth ? b.lastMonth.profit : 0), 0);
  return `<div class="vhead"><div><h1>Şubeler</h1><p>${st.branches.length} şube · geçen ay toplam net <b class="num ${tot < 0 ? 'neg' : 'pos'}">${fmtK(tot)}</b></p></div><button class="gold" data-a="gomap" data-v="">Yeni şube ${IC.next}</button></div>
  <div class="bgrid">${st.branches.map(b => { const y = b.yesterday, lm = b.lastMonth, T = TYPES[b.type];
    const open = b.status === 'acik' && st.hour >= T.open && st.hour < T.close && b.closedUntil < st.day;
    return `<button class="bc2 t-${b.type}" data-a="branch" data-v="${b.id}">
      <div class="bth">${b.type === 'kafe' ? facade({ name: st.name, night, open, occ: b.tables ? b.occ.reduce((a, o) => a + o.t, 0) / b.tables : 0, id: 'bc' + b.id, par: 'xMidYMax slice' }) : typeScene(b.type, st.name, { night, open, id: 'bc' + b.id })}
        <span class="btype">${TIC[b.type]}${T.n}</span><span class="bst">${statusPill(b)}</span></div>
      <div class="bcb"><div class="row between"><div style="min-width:0"><b class="bn">${esc(b.name)}</b><small>${esc(K.PROV[DISTRICTS[b.d].p].n)} · ${esc(DISTRICTS[b.d].n)}</small></div><span class="rt">★ ${b.rating.toFixed(1)}</span></div>
        <div class="bcs"><div><span class="lbl">Dün ciro</span><b class="num">${y ? fmtK(y.rev) : '—'}</b></div><div><span class="lbl">Müşteri</span><b class="num">${y ? Math.round(y.cust) : '—'}</b></div><div><span class="lbl">Geçen ay</span><b class="num ${lm ? (lm.profit < 0 ? 'neg' : 'pos') : ''}">${lm ? fmtK(lm.profit) : '—'}</b></div></div>
        ${spark(b.hist.map(h => h.rev), 24)}</div></button>`; }).join('')}
    <button class="bc2 add" data-a="gomap" data-v=""><span class="plus">+</span><b>Yeni şube aç</b><small>Haritadan il ve semt seç</small></button></div>`;
}
function vBranch() {
  const b = st.branches.find(x => x.id === ui.branch); if (!b) { ui.view = 'branches'; return vBranches(); }
  const tb = [['ozet', 'Özet'], ['menu', 'Menü ve fiyat'], ['personel', 'Personel'], ['dukkan', 'Dükkan ve POS']];
  const body = { ozet: bOzet, menu: bMenu, personel: bPersonel, dukkan: bDukkan }[ui.btab](b);
  return `<div class="bhd"><button class="ibtn" data-a="nav" data-v="branches" aria-label="Şubeler">${I('<path d="M15 6l-6 6 6 6"/>')}</button>
    <div class="bht"><h1>${esc(b.name)}</h1><div class="bmeta"><span>${typeName(b.type)}</span><span>${esc(K.PROV[DISTRICTS[b.d].p].n)} · ${esc(DISTRICTS[b.d].n)}</span><span>${esc(b.archN || ARCH[b.arch].n)}</span><span class="num">${b.area} m²</span></div></div>
    <div class="bhr">${statusPill(b)}<span class="rate"><span class="stars">${'★'.repeat(Math.round(b.rating))}<i>${'★'.repeat(5 - Math.round(b.rating))}</i></span><b class="num">${b.rating.toFixed(1)}</b></span></div></div>
    <div class="segt" role="tablist">${tb.map(([k, n]) => `<button role="tab" aria-selected="${ui.btab === k}" class="${ui.btab === k ? 'on' : ''}" data-a="btab" data-v="${k}">${n}</button>`).join('')}</div>${body}`;
}
const SEGC = { ogrenci: '#86a8e7', ofis: '#d4b26a', uzaktan: '#7ee8c6', grup: '#f7b267', aile: '#ff8fb1', elit: '#c7a7e8', turist: '#4fc3f7', beyazyaka: '#ffb38a', macsever: '#9be15d' };
function floorSVG(b) {
  const n = b.tables, fr = b.useFront ? b.frontTables : 0, occ = b.occ.reduce((a, o) => a + o.t, 0);
  const cols = Math.max(3, Math.min(8, Math.ceil(Math.sqrt(n * 2.2)))), rows = Math.max(1, Math.ceil(n / cols));
  const W = 300, top = 40, rh = 32, Hh = Math.max(110, top + rows * rh + 16), cw = (W - 30) / cols;
  let t = '';
  for (let i = 0; i < n; i++) {
    const c = i % cols, r = Math.floor(i / cols), x = 15 + cw * (c + .5), y = top + rh * (r + .5);
    const f = Math.max(0, Math.min(1, occ - i)), busy = f > .01, rr = Math.min(7, rh * .24);
    t += `<g class="tb2 ${busy ? 'busy' : ''}"><circle cx="${x - rr - 3}" cy="${y}" r="2.4" class="ch"/><circle cx="${x + rr + 3}" cy="${y}" r="2.4" class="ch"/><circle cx="${x}" cy="${y}" r="${rr}" class="tt"/>${busy ? `<circle cx="${x - rr - 3}" cy="${y}" r="2.6" class="pp"/>${f > .5 ? `<circle cx="${x + rr + 3}" cy="${y}" r="2.6" class="pp"/>` : ''}<circle cx="${x}" cy="${y}" r="1.6" class="cup"/>` : ''}</g>`;
  }
  let out = '';
  if (fr) { out = `<rect x="6" y="${Hh + 4}" width="${W - 12}" height="22" rx="6" class="terr"/><text x="12" y="${Hh + 18}" class="fl">DIŞ ALAN</text>`; for (let i = 0; i < fr; i++) { const x = 70 + i * ((W - 90) / Math.max(1, fr)), y = Hh + 15, f = Math.max(0, Math.min(1, occ - n - i)); out += `<circle cx="${x}" cy="${y}" r="5" class="tt ${f > .01 ? 'b' : ''}"/>${f > .01 ? `<circle cx="${x + 8}" cy="${y}" r="2.4" class="pp"/>` : ''}`; } }
  const H2 = fr ? Hh + 30 : Hh;
  const queue = Math.min(8, Math.round(b.today.queueLost / 6));
  return `<svg class="floor2" viewBox="0 0 ${W} ${H2}" role="img" aria-label="Salon yerleşimi">
    <rect x="4" y="4" width="${W - 8}" height="${Hh - 8}" rx="10" class="fl0"/>
    <rect x="${W / 2 - 60}" y="10" width="120" height="12" rx="4" class="bar2"/><text x="${W / 2}" y="18.5" text-anchor="middle" class="fl">BAR · ${b.staff} PERSONEL</text>
    ${Array.from({ length: Math.min(b.staff, 6) }, (_, i) => `<circle cx="${W / 2 - 45 + i * 18}" cy="26" r="2.6" class="st2"/>`).join('')}
    <rect x="${W - 34}" y="${Hh - 9}" width="22" height="5" rx="2" class="door"/>
    ${Array.from({ length: queue }, (_, i) => `<circle cx="${W - 40 - i * 7}" cy="${Hh - 14}" r="2.4" class="q"/>`).join('')}
    ${n ? t : `<text x="${W / 2}" y="${Hh / 2 + 10}" text-anchor="middle" class="fl">MASA YOK · TAKE AWAY</text>`}${out}</svg>`;
}
function bOzet(b) {
  if (b.status === 'hazirlik') return `<div class="mksec" style="align-items:flex-start"><h3>Ruhsat süreci devam ediyor</h3><p class="muted" style="margin:0;font-size:11.5px">İzinler ${b.daysLeft} gün içinde tamamlanacak. Bu sürede menüyü ve personeli ayarlayabilirsin.</p>${K.iapState(st).tickets ? `<button class="adbtn tk" data-a="ticket" data-v="${b.id}">Ruhsat bileti kullan · ${K.iapState(st).tickets}</button>` : ''}${adBtn('ruhsat', 'Reklam izle · 3 gün hızlandır', b.id)}</div>`;
  const t = b.today, y = b.yesterday, lm = b.lastMonth;
  const occT = b.occ.reduce((a, o) => a + o.t, 0), totalT = b.tables + (b.useFront ? b.frontTables : 0);
  const sat = t.cust ? t.satSum / t.cust : (b.lastSat || 0);
  const segs = Object.entries(b._w || {}).sort((a, c) => c[1] - a[1]);
  const d = (cur, prev) => prev ? (cur >= prev ? `<span class="dl up">▲ %${Math.round((cur / prev - 1) * 100)}</span>` : `<span class="dl dn">▼ %${Math.round((1 - cur / prev) * 100)}</span>`) : '<span class="dl">ilk gün</span>';
  const kp = (ic, l, v, sub) => `<div class="kp"><span class="kic">${ic}</span><div><span class="lbl">${l}</span><b class="num">${v}</b>${sub}</div></div>`;
  return `<div class="boz">
    <div class="bozl"><section class="mksec salon"><header><h3>Salon</h3><span class="pill ${occT >= totalT * .9 && totalT ? 'warn' : 'acc'}">${Math.round(occT)}/${totalT} masa dolu</span></header>
      ${floorSVG(b)}
      <div class="slegend"><span><i class="lb"></i>Dolu masa</span><span><i class="lf"></i>Boş masa</span><span>Saatte ${Math.round(K.staffCap(st, b))} servis kapasitesi</span>${t.queueLost > 0 ? `<span class="neg">${Math.round(t.queueLost)} kişi sırada bekleyip gitti</span>` : ''}</div></section>${revCard(b)}</div>
    <div class="bozr">
      <div class="kps">
        ${!t.cust && y ? kp(IC.fin, 'Dün ciro', fmtK(y.rev), '<small>Bugün başlamadı</small>') : kp(IC.fin, 'Bugün ciro', fmtK(t.rev), y && y.rev && st.hour >= 14 ? d(t.rev, y.rev) : '<small>Gün sürüyor</small>')}
        ${!t.cust && y ? kp(IC.staff, 'Dün müşteri', Math.round(y.cust), `<small>${Math.round(y.lost)} kişi kaçtı</small>`) : kp(IC.staff, 'Müşteri', Math.round(t.cust), `<small>${Math.round(t.lost)} kişi kaçtı</small>`)}
        ${kp(I('<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>'), 'Memnuniyet', sat ? Math.round(sat) : '—', `<small>${b.smoke ? 'Sigara alanı var' : 'Sigara alanı yok'}</small>`)}
        ${kp(IC.bank, 'Geçen ay kâr', lm ? fmtK(lm.profit) : '—', `<small>Bu ay ${fmtK(b.mAcc.rev + t.rev)} ciro</small>`)}
      </div>
      <section class="mksec"><header><h3>Kim geliyor?</h3></header>
        <div class="stackbar">${segs.map(([k, v]) => `<i style="width:${v * 100}%;background:${SEGC[k]}" title="${SEGS[k].n}"></i>`).join('')}</div>
        <div class="seglg">${segs.map(([k, v]) => `<span><i style="background:${SEGC[k]}"></i>${SEGS[k].n}<b class="num">%${Math.round(v * 100)}</b></span>`).join('')}</div></section>
      <section class="mksec"><header><h3>Geçen ay ciro neden değişti?</h3>${lm ? '<span class="muted" style="font-size:10px">' + fmtK(lm.rev) + ' ciro</span>' : ''}</header>${whyBlock(lm && lm.why)}</section>
      ${rivCard(b)}
      <section class="mksec"><header><h3>Son 30 gün</h3><span class="muted" style="font-size:10px">Ort. ${b.hist.length ? fmtK(b.hist.reduce((a, h) => a + h.rev, 0) / b.hist.length) : '—'}/gün</span></header>${spark(b.hist.map(h => h.rev), 40)}</section>
    </div></div>`;
}
function impTxt(x) { if (!x) return ''; const f = (v, n) => { const k = Math.round(v * 100); return `<span class="${k < 0 ? 'neg' : k > 0 ? 'pos' : ''}">${n} ${k > 0 ? '+' : ''}${k}%</span>`; }; return `<span class="imp">${f(x.cust, 'müşteri')} · ${f(x.gp, 'kâr')}</span>`; }
function rivCard(b) {
  const cs = K.comps(st, b.d).slice().sort((x, y) => K.compStrength(y) - K.compStrength(x)).slice(0, 4); if (!cs.length) return '';
  return `<section class="mksec rivc"><header><h3>Yakın rakipler</h3><span class="muted" style="font-size:10px">Haftalık değişir</span></header>${cs.map(c => { const h = c.hist || [c.rating]; const d = h.length > 1 ? h[h.length - 1] - h[0] : 0;
    return `<div class="rr"><b>${esc(c.n)}</b><span class="rp">${c.price}${c.promo ? ' · indirimde' : ''}</span><span class="rs">★ ${(+c.rating).toFixed(1)}</span><span class="rd ${d > .02 ? 'pos' : d < -.02 ? 'neg' : 'muted'}">${d > .02 ? '▲' : d < -.02 ? '▼' : '•'} ${Math.abs(d).toFixed(2)}</span></div>`; }).join('')}</section>`;
}
const REVK = { fiyat: 'Fiyat', bekleme: 'Bekleme', kalite: 'Kahve ve lezzet', dekor: 'Mekan', sigara: 'Sigara alanı', ekip: 'Ekip' };
function revCard(b) {
  const rs = (b.reviews || []).slice(0, 4); const sm = K.reviewSummary(b);
  const tags = Object.entries(sm.c).map(([k, v]) => [k, v.pos - v.neg, v]).sort((a, c) => Math.abs(c[1]) - Math.abs(a[1])).slice(0, 4);
  return `<section class="mksec revs"><header><h3>Müşteri yorumları</h3>${sm.n ? `<span class="muted" style="font-size:10px">Son ${sm.n} yorum · ort. ★ ${sm.avg.toFixed(1)}</span>` : ''}</header>
    ${tags.length ? `<div class="rtags">${tags.map(([k, n, v]) => `<span class="wy ${n < 0 ? 'neg' : 'pos'}">${REVK[k]} ${v.pos ? '👍' + v.pos : ''}${v.neg ? ' 👎' + v.neg : ''}</span>`).join('')}</div>` : ''}
    ${rs.length ? rs.map(r => `<div class="rv"><div class="rvh"><b>${esc(r.n)}</b><span class="rst">${'★'.repeat(r.s)}<i>${'★'.repeat(5 - r.s)}</i></span><small>${st.day - r.day === 0 ? 'bugün' : (st.day - r.day) + ' gün önce'}</small></div><p>${esc(r.t)}</p></div>`).join('') : '<p class="muted" style="margin:0;font-size:11px">Yorumlar ilk müşterilerle birlikte gelecek.</p>'}</section>`;
}
function bMenu(b) {
  const T = TYPES[b.type];
  const it = b.mAcc.it || {}, li = b.lastItems || {}; const src = Object.keys(it).length && b.mAcc.days >= 5 ? it : li; const srcL = src === it ? 'Bu ay' : 'Geçen ay';
  const tot = Object.values(src).reduce((a, r) => a + r[1], 0);
  const ranks = T.menu.filter(id => b.menu[id].on && src[id]).map(id => [id, src[id][1] - src[id][2]]).sort((a, c) => a[1] - c[1]);
  const weak = new Set(ranks.length >= 5 ? ranks.slice(0, 2).filter(x => tot && src[x[0]][1] / tot < .05).map(x => x[0]) : []);
  const i5 = K.priceImpact(st, b, { _all: .05 }), i10 = K.priceImpact(st, b, { _all: .1 });
  const sg = {}; for (const id of T.menu) { const r = K.suggestPrice(st, b, id); if (r) sg[id] = r; } const nSg = Object.keys(sg).length;
  return `<div class="card"><div class="row between" style="margin-bottom:6px;gap:10px"><span class="muted" style="font-size:11px">Fiyatı yazarken etkisi anında görünür. ${srcL} satışları ürün bazında.</span><div class="row">${nSg ? `<button class="btn sm pri" data-a="sugall">Önerilen fiyatları uygula (${nSg})</button>` : ''}<button class="btn sm zb" data-a="raise" data-v=".05">%5 zam ${impTxt(i5)}</button><button class="btn sm zb" data-a="raise" data-v=".1">%10 zam ${impTxt(i10)}</button></div></div>
  <div class="tw"><table class="t mnu"><thead><tr><th>Ürün</th><th>Menüde</th><th class="r">Maliyet</th><th class="r">Semt ort.</th><th class="r">Fiyatın</th><th class="r">Marj</th><th>Algı</th><th class="r">${srcL} adet</th><th class="r">Ciro payı</th><th class="r">Brüt katkı</th><th>Etki</th></tr></thead><tbody>
  ${T.menu.map(id => { const P = PRODUCTS[id], m = b.menu[id], c = K.unitCost(st, id), ref = K.localRef(st, b, id), pc = K.perception(st, b, id), net = m.price / (1 + T.kdv), mg = (net - c) / net, locked = P.needs && !b.kitchen; const r = src[id];
    const offImp = m.on && !locked ? K.priceImpact(st, b, { [id]: false }) : null;
    return `<tr class="${weak.has(id) ? 'weak' : ''}"><td>${esc(P.n)}${locked ? ' <span class="pill">Mutfak gerekir</span>' : ''}${weak.has(id) ? ' <span class="pill warn">Az satıyor</span>' : ''}</td><td><input type="checkbox" data-a="toggle" data-v="${id}" ${m.on && !locked ? 'checked' : ''} ${locked ? 'disabled' : ''} aria-label="${esc(P.n)} menüde"></td><td class="r num">${fmt(c)}</td><td class="r num muted">${fmt(ref)}</td><td class="r"><div class="prc"><input class="price" type="number" min="5" step="5" id="pr-${b.id}-${id}" data-a="price" data-v="${id}" value="${m.price}"><button class="pen ${ui.pedit === id ? 'on' : ''}" data-a="pedit" data-v="${id}" aria-label="Fiyatı kaydırarak ayarla"><svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg></button>${sg[id] ? `<button class="sugp ${sg[id].price > m.price ? 'up' : 'dn'}" data-a="sugp" data-v="${id}" data-p="${sg[id].price}" title="Önerilen fiyatı uygula">${sg[id].price > m.price ? '↑' : '↓'} ${fmt(sg[id].price)}</button>` : ''}</div></td><td class="r num ${mg < .35 ? 'neg' : ''}">%${Math.round(mg * 100)}</td><td><span class="pill ${pc[1]}">${pc[0]}</span></td>
      <td class="r num">${r ? Math.round(r[0]).toLocaleString('tr-TR') : '—'}</td><td class="r num">${r && tot ? '%' + Math.round(r[1] / tot * 100) : '—'}</td><td class="r num ${r && r[1] - r[2] < 0 ? 'neg' : ''}">${r ? fmtK(r[1] / (1 + T.kdv) - r[2]) : '—'}</td>
      <td class="impc" id="imp-${id}">${offImp && weak.has(id) ? '<small class="muted">Çıkarırsan</small> ' + impTxt(offImp) : ''}</td></tr>${ui.pedit === id ? priceSlider(b, id, ref) : ''}`; }).join('')}
  </tbody></table></div></div>`;
}
function priceSlider(b, id, ref) {
  const m = b.menu[id], lo = Math.max(5, Math.round(ref * .6 / 5) * 5), hi = Math.round(ref * 1.6 / 5) * 5;
  const v = ui.pval != null ? ui.pval : m.price;
  return `<tr class="pslide"><td colspan="11"><div class="psl">
    <button class="btn sm" data-a="pstep" data-v="-5">−5</button>
    <div class="pstrack"><input type="range" id="ps-${id}" data-a="pslide" data-v="${id}" min="${lo}" max="${hi}" step="5" value="${Math.min(hi, Math.max(lo, v))}" aria-label="${esc(PRODUCTS[id].n)} fiyatı"><div class="psmarks"><span>${fmt(lo)}</span><span>Semt ort. ${fmt(ref)}</span><span>${fmt(hi)}</span></div></div>
    <button class="btn sm" data-a="pstep" data-v="5">+5</button>
    <div class="psval"><b class="num" id="psv-${id}">${fmt(v)}</b><span id="psp-${id}">${psPerc(v, ref)}</span></div>
    <button class="btn sm pri" data-a="papply" data-v="${id}">Uygula</button><button class="btn sm ghost" data-a="pedit" data-v="${id}">Vazgeç</button>
  </div></td></tr>`;
}
function psPerc(v, ref) { const r = v / ref; const p = r < .85 ? ['Ucuz', 'ok'] : r < 1.12 ? ['Makul', 'ok'] : r < 1.35 ? ['Pahalı', 'warn'] : ['Fahiş', 'bad']; return `<span class="pill ${p[1]}">${p[0]}</span>`; }
function psLive(b, id, v) {
  ui.pval = v; const ref = K.localRef(st, b, id);
  const a = $('#psv-' + id), pc = $('#psp-' + id), inp = $('#pr-' + b.id + '-' + id), cell = $('#imp-' + id), rg = $('#ps-' + id);
  if (a) a.textContent = fmt(v); if (pc) pc.innerHTML = psPerc(v, ref); if (inp) inp.value = v; if (rg && +rg.value !== v) rg.value = v;
  if (cell) cell.innerHTML = v !== b.menu[id].price ? impTxt(K.priceImpact(st, b, { [id]: v })) : '';
}
function bPersonel(b) {
  const minS = K.minStaff(b.concept, b.tables), cs = K.conceptsFor({ arch: b.arch, tables: b.tables, type: b.type });
  return `<div class="grid g2"><div class="card stack"><h3>Kadro</h3>
    <div class="row between"><span>Personel sayısı</span><div class="stepper"><button data-a="bstaff" data-v="-1" aria-label="Azalt">−</button><span>${b.staff}</span><button data-a="bstaff" data-v="1" aria-label="Artır">+</button></div></div>
    <span class="muted" style="font-size:10.5px">İşe alım 5.000 ₺. Çıkarmada ~${fmtK(WAGES[b.wage].cost * st.world.wageIdx * .6)} tazminat. Önerilen en az ${minS}.</span>
    <div class="seg">${Object.keys(WAGES).map(k => `<button class="${b.wage === k ? 'on' : ''}" data-a="bwage" data-v="${k}">${WAGES[k].n}</button>`).join('')}</div>
    <dl class="kv"><dt>Aylık maaş + SGK</dt><dd>${fmt(b.staff * WAGES[b.wage].cost * st.world.wageIdx)}</dd><dt>Saatlik servis kapasitesi</dt><dd>${Math.round(K.staffCap(st, b))}</dd></dl>${meter('Moral', b.moral, 100)}${b.moral < 85 ? adBtn('moral', 'Reklam izle · ekibe ikram, moral +12', b.id, 'sm') : ''}</div>
  ${mgrCard(b)}
  <div class="card stack"><h3>Servis konsepti</h3><span class="muted" style="font-size:10.5px">Değiştirmek 60.000 ₺ tutar, şube bir gün kapanır.</span>
    <div class="seg">${Object.keys(CONCEPTS).map(c => `<button class="${b.concept === c ? 'on' : ''}" data-a="bconcept" data-v="${c}" ${cs.includes(c) ? '' : 'disabled'}>${CONCEPTS[c].n}</button>`).join('')}</div>
    ${ui.confirm && ui.confirm.k === 'concept' ? `<div class="hint">${CONCEPTS[ui.confirm.v].n} konseptine geçilsin mi?<div class="row" style="margin-top:5px"><button class="btn sm pri" data-a="doconcept">Evet</button><button class="btn sm" data-a="cancelconfirm">Vazgeç</button></div></div>` : ''}</div></div>`;
}
function mgrCard(b) {
  const M = b.manager;
  if (M) { const L = K.MGR_LVL[M.lvl]; const ini = M.n.split(' ').map(x => x[0]).join('');
    return `<div class="card stack mgr on"><div class="mgrh"><span class="mav">${ini}</span><div><span class="lbl">Şube müdürü</span><b>${esc(M.n)}</b><small>${L.n} · ${fmtK(M.wage * st.world.wageIdx)}/ay · ${st.day - M.since} gündür görevde</small></div></div>
      <ul class="mgrfx"><li>Arıza, istifa, kötü yorum gibi küçük olayları kendisi çözer</li><li>Kapasite ve servis kalitesi artar, denetimlerde daha güvenli</li><li>Ekip morali +${L.moral}</li></ul>
      <div class="row between"><span>Fiyatları enflasyona göre güncelle</span><button class="mtgl ${M.autoPrice ? 'on' : ''}" data-a="autoprice" role="switch" aria-checked="${M.autoPrice}" aria-label="Otomatik fiyat"><i></i></button></div>
      ${ui.confirm && ui.confirm.k === 'firemgr' ? `<div class="hint">${esc(M.n)} görevden alınsın mı? Bir aylık maaş tazminat ödenir.<div class="row" style="margin-top:5px"><button class="btn sm danger" data-a="firemgr2">Evet</button><button class="btn sm" data-a="cancelconfirm">Vazgeç</button></div></div>` : '<div><button class="btn sm" data-a="firemgr">Görevden al</button></div>'}</div>`; }
  const cands = K.managerCandidates(st, b);
  return `<div class="card stack mgr"><h3>Şube müdürü</h3><span class="muted" style="font-size:10.5px">Birden fazla şuben olunca her şubeye yetişemezsin. Müdür küçük olayları senin yerine çözer, ekibi toparlar. İşe alım 15.000 ₺.</span>
    <div class="mgrc">${cands.map(c => { const L = K.MGR_LVL[c.lvl]; const ini = c.n.split(' ').map(x => x[0]).join(''); return `<button class="mgro" data-a="hiremgr" data-v="${c.lvl}"><span class="mav">${ini}</span><span class="mt"><b>${esc(c.n)}</b><small>${L.n} · ${fmtK(c.wage * st.world.wageIdx)}/ay</small><small class="muted">${L.desc}</small></span><span class="mgo">Ata ${IC.next}</span></button>`; }).join('')}</div></div>`;
}
function bDukkan(b) {
  const bank = BANKS[b.bank], rate = Math.max(.008, (b.valor === '30' ? bank.pos30 : bank.pos0) - (b.posDisc || 0)); const sp = K.salePrice(st, b), early = st.day - b.contractStart < 365;
  return `<div class="grid g2"><div class="card stack"><h3>Dükkan</h3>
    <div class="seg">${Object.keys(DECOR).map(k => `<button class="${b.decor === k ? 'on' : ''}" data-a="bdecor" data-v="${k}" ${b.decor === k ? 'disabled' : ''}>${DECOR[k].n}${b.decor === k ? '' : ' · ' + fmtK(DECOR[k].m2 * b.area * .8)}</button>`).join('')}</div>
    <div class="seg">${Object.keys(EQUIP).map(k => `<button class="${b.equip === k ? 'on' : ''}" data-a="bequip" data-v="${k}" ${b.equip === k ? 'disabled' : ''}>${EQUIP[k].n}${b.equip === k ? '' : ' · ' + fmtK(EQUIP[k].cost * .85)}</button>`).join('')}</div>
    ${ARCH[b.arch].kiosk ? '' : `<div class="row between"><span>Mutfak</span>${b.kitchen ? '<span class="pill ok">Var</span>' : '<button class="btn sm" data-a="bkitchen">Kur · 250.000 ₺</button>'}</div>`}
    ${b.hasFront ? `<div class="row between"><span>Ön alan ${b.flic ? '<span class="pill ok">Ruhsata işli</span>' : '<span class="pill warn">' + fmtK(b.aptFee) + '/ay</span>'}</span><button class="btn sm" data-a="bfront">${b.useFront ? 'Masaları içeri al' : 'Dış masaları kullan'}</button></div>` : ''}
    <dl class="kv"><dt>Kira</dt><dd>${fmt(b.rent)}</dd><dt>Depozito</dt><dd>${fmt(b.deposit)}</dd><dt>Sigara alanı</dt><dd>${b.smoke ? 'Var' : 'Yok'}</dd><dt>Sözleşme</dt><dd>${K.dateLabel(b.contractStart)}</dd></dl></div>
  <div class="card stack"><h3>POS · ${bank.n}</h3><dl class="kv"><dt>Valör</dt><dd>${b.valor === '30' ? '30 gün' : 'Blokesiz'}</dd><dt>Komisyon</dt><dd>%${(rate * 100).toFixed(2)}</dd></dl>
    <div class="row"><button class="btn sm" data-a="postalk">Komisyon pazarlığı</button><button class="btn sm" data-a="bvalor">${b.valor === '30' ? 'Blokesize geç' : '30 gün valöre geç'}</button></div>
    <h3 style="margin-top:4px">Devren sat</h3><span class="muted" style="font-size:10.5px">Tahmini bedel ${fmt(sp)}. ${early ? 'İlk yılda çıktığın için depozito yanar.' : 'Depozito iade edilir.'}</span>
    ${ui.confirm && ui.confirm.k === 'sell' && ui.confirm.v === b.id ? `<div class="hint">Devredilsin mi? Geri alınamaz.<div class="row" style="margin-top:5px"><button class="btn sm danger" data-a="dosell">Evet, devret</button><button class="btn sm" data-a="cancelconfirm">Vazgeç</button></div></div>` : '<div><button class="btn sm danger" data-a="sell">Şubeyi devret</button></div>'}</div></div>`;
}

/* ---------- finans ---------- */
function vFinance() {
  const reps = st.reports, last = reps[reps.length - 1], pend = st.pending.reduce((a, p) => a + p.amt, 0);
  const sel = ui.rep != null && reps[ui.rep] ? reps[ui.rep] : last;
  const dt = K.dateOf(st.day), dim = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)).getUTCDate(), dom = dt.getUTCDate(), pr = Math.max(0, (dom - 1 + st.hour / 24) / dim);
  const bs = st.branches;
  const rev = st.month.rev + bs.reduce((a, b) => a + b.today.rev, 0), cogs = st.month.cogs + bs.reduce((a, b) => a + b.today.cogs, 0);
  const rent = bs.reduce((a, b) => a + b.rent, 0), wages = bs.reduce((a, b) => a + b.staff * WAGES[b.wage].cost * st.world.wageIdx, 0), util = bs.reduce((a, b) => a + K.utilCost(st, b), 0);
  const lines = [['Hammadde ve fire', cogs], ['Kira', rent * pr], ['Maaş ve SGK', wages * pr], ['Fatura ve giderler', util * pr + rev * .045], ['POS komisyonu', st.month.pos]];
  const costs = lines.reduce((a, l) => a + l[1], 0); const net = rev - costs;
  const maxL = Math.max(1, rev, ...lines.map(l => l[1]));
  const change = last && last.rev && dom >= 5 && pr > 0 ? (rev / pr / last.rev - 1) : null;
  return `<div class="fin">
    <div class="bkhero fhero">
      <div class="mstat"><span class="lbl">Nakit</span><b class="num big ${st.cash < 0 ? 'neg' : ''}">${fmt(st.cash)}</b><small class="muted">KMH limiti ${fmtK(K.kmhLimit(st))}</small></div>
      <div class="mstat"><span class="lbl">Bu ay ciro</span><b class="num">${fmtK(rev)}</b><small class="${change == null ? 'muted' : change >= 0 ? 'pos' : 'neg'}">${change == null ? 'Ayın ' + dom + '. günü' : (change >= 0 ? '▲ %' : '▼ %') + Math.abs(Math.round(change * 100)) + ' gün başına, geçen aya göre'}</small></div>
      <div class="mstat"><span class="lbl">Bekleyen valör</span><b class="num">${fmtK(pend)}</b><small class="muted">POS'ta bloke</small></div>
      <div class="mstat"><span class="lbl">Geçen ay işletme kârı</span><b class="num ${last ? (last.profit < 0 ? 'neg' : 'pos') : ''}">${last ? fmtK(last.profit) : '—'}</b><small class="muted">${last ? last.label : 'İlk ay sürüyor'}</small></div>
    </div>
    <div class="grid g2">
      <section class="mksec"><header><h3>Bu ay, şu ana kadar</h3><span class="pill acc">${dom}/${dim} gün</span></header>
        <div class="pl"><div class="plr inc"><span>Ciro</span><div class="bar"><i style="width:${rev / maxL * 100}%"></i></div><b class="num">${fmtK(rev)}</b></div>
          ${lines.map(l => `<div class="plr"><span>${l[0]}</span><div class="bar"><i style="width:${l[1] / maxL * 100}%"></i></div><b class="num">${l[1] >= 1 ? '−' + fmtK(l[1]) : '0 ₺'}</b></div>`).join('')}
          <div class="plnet"><span>Tahmini net (vergi öncesi)</span><b class="num ${net < 0 ? 'neg' : 'pos'}">${fmtK(net)}</b></div></div>
        <small class="muted">Kira, maaş ve faturalar ay sonunda ödenir; burada günlere bölünmüş hali görünür. KDV ve vergi ay kapanışında hesaplanır.</small></section>
      ${reps.length ? `<section class="mksec"><header><h3>Aylık ciro ve net</h3><select data-a="repsel" aria-label="Ay">${reps.map((r, i) => `<option value="${i}" ${r === sel ? 'selected' : ''}>${r.label}</option>`).join('')}</select></header>${finChart(reps)}</section>` :
      `<section class="mksec fempty"><span class="pic">${IC.fin}</span><h3>İlk Z raporun ay sonunda</h3><p class="muted">Ay kapandığında kira, maaş, KDV ve vergi ödenir; aylık grafik ve ayrıntılı rapor burada belirir.</p></section>`}
    </div>
    ${sel ? `<div class="grid g2"><section class="mksec"><header><h3>Z raporu · ${sel.label}</h3></header>${zReport(sel)}</section><section class="mksec"><header><h3>Şube bazında</h3></header><div class="tw"><table class="t"><thead><tr><th>Şube</th><th class="r">Ciro</th><th class="r">Müşteri</th><th class="r">Net katkı</th><th>Ciro neden değişti</th></tr></thead><tbody>${sel.branches.map(x => `<tr><td>${esc(x.name)}</td><td class="r num">${fmtK(x.rev)}</td><td class="r num">${Math.round(x.cust).toLocaleString('tr-TR')}</td><td class="r num ${x.profit < 0 ? 'neg' : 'pos'}">${fmtK(x.profit)}</td><td class="wycell">${x.why && x.why.pct ? whyBlock(x.why, true) : '<span class="muted">—</span>'}</td></tr>`).join('')}</tbody></table></div></section></div>` : ''}
  </div>`;
}
function finChart(reps) {
  const rs = reps.slice(-12), Wd = 380, Hd = 170, pl = 54, pb = 18, pt = 12;
  const top = Math.max(1, ...rs.map(r => r.rev)), minP = Math.min(0, ...rs.map(r => r.profit));
  const sc = v => pt + (Hd - pb - pt) * (1 - (v - minP) / (top - minP)); const bw = (Wd - pl - 6) / rs.length, z = sc(0);
  return `<svg class="chart" viewBox="0 0 ${Wd} ${Hd}" style="width:100%">${[minP, 0, top].filter((v, i, a) => a.indexOf(v) === i).map(v => `<line class="grid" x1="${pl}" x2="${Wd}" y1="${sc(v)}" y2="${sc(v)}"/><text x="${pl - 4}" y="${sc(v) + 3}" text-anchor="end">${fmtK(v).replace(' ₺', '')}</text>`).join('')}
    ${rs.map((r, i) => { const x = pl + i * bw + bw * .12, w = bw * .76, ry = sc(r.rev), py = r.profit >= 0 ? sc(r.profit) : z; return `<rect class="rv" x="${x}" y="${ry}" width="${w}" height="${Math.max(0, z - ry)}" rx="2"/><rect class="${r.profit >= 0 ? 'pp' : 'pn'}" x="${x + w * .25}" y="${py}" width="${w * .5}" height="${Math.max(1, Math.abs(sc(r.profit) - z))}" rx="1.5"/><text x="${x + w / 2}" y="${Hd - 4}" text-anchor="middle">${r.label.slice(0, 3)}</text>`; }).join('')}</svg>`;
}
function zReport(r) {
  const L = (n, v, neg, cls) => `<div class="ln ${cls || ''}"><span>${n}</span><span>${neg && v ? '−' : ''}${fmt(v)}</span></div>`;
  const cat = r.cat || {}; const CN = K.CAT_N; const catLines = Object.keys(cat).filter(k => cat[k] > 0).map(k => L(k === 'muhasebe' ? 'Muhasebe' : (CN[k] || k), cat[k], 1)).join('');
  const legacyOther = r.cat ? '' : L('Diğer giderler', r.other, 1);
  return `<div class="receipt"><div class="rh"><b>${esc(st.name)}</b><span class="sub">Z RAPORU · ${r.label}</span></div>${L('Ciro', r.rev)}${r.dividends ? L('Ortaklık temettüsü', r.dividends) : ''}${L('Hammadde, ambalaj ve fire', r.cogs, 1)}${L('Kira ve ciro payı', r.rent, 1)}${L('Maaş ve SGK', r.wages, 1)}${L('Fatura, aidat, ön alan', r.util, 1)}${r.opex ? L('Sarf, temizlik, bakım', r.opex, 1) : ''}${L('POS komisyonu', r.pos, 1)}${L('KDV', r.kdv, 1)}${r.supply ? L('Tedarik sözleşmeleri', r.supply, 1) : ''}${r.mkt ? L('Pazarlama', r.mkt, 1) : ''}${catLines}${legacyOther}${L('Gelir vergisi', r.tax, 1)}
    <div class="ln tot"><span>İşletme kârı</span><span class="${r.profit < 0 ? 'neg' : 'pos'}">${fmt(r.profit)}</span></div>
    ${r.invest ? `<div class="ln inv"><span>Yatırım harcaması <small>kurulum, tadilat, ekipman</small></span><span>−${fmt(r.invest)}</span></div>` : ''}${r.loans ? `<div class="ln sub"><span>Kredi taksitleri</span><span>−${fmt(r.loans)}</span></div>` : ''}
    ${r.cashFlow != null ? `<div class="ln cf"><span>Nakit değişimi</span><span class="${r.cashFlow < 0 ? 'neg' : 'pos'}">${r.cashFlow < 0 ? '−' : '+'}${fmt(Math.abs(r.cashFlow))}</span></div>` : ''}<div class="ln sub"><span>Ay sonu nakit</span><span>${fmt(r.cashEnd)}</span></div></div>`;
}
function whyBlock(w, compact) {
  if (!w) return '<p class="muted" style="margin:0;font-size:11px">Ay kapanınca burada ciroyu nelerin etkilediği görünecek.</p>';
  if (w.first) return '<p class="muted" style="margin:0;font-size:11px">İlk tam ay. Karşılaştırma gelecek ay başlar.</p>';
  const items = Object.entries(w.pct).filter(([k, v]) => Math.abs(v) >= .01).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, compact ? 3 : 6);
  const mx = Math.max(.05, ...items.map(x => Math.abs(x[1])));
  const nm = k => k === 'diger' ? 'Diğer ve rastlantı' : K.DRV_N[k];
  if (compact) return items.map(([k, v]) => `<span class="wy ${v < 0 ? 'neg' : 'pos'}">${nm(k)} ${v < 0 ? '−' : '+'}%${Math.round(Math.abs(v) * 100)}</span>`).join('');
  return `<div class="why"><div class="whyh"><span>Ciro değişimi</span><b class="num ${w.chg < 0 ? 'neg' : 'pos'}">${w.chg < 0 ? '▼' : '▲'} %${Math.round(Math.abs(w.chg) * 100)}</b></div>${items.map(([k, v]) => `<div class="wr"><span>${nm(k)}</span><div class="wb"><i class="${v < 0 ? 'n' : 'p'}" style="width:${Math.abs(v) / mx * 50}%;${v < 0 ? 'right:50%' : 'left:50%'}"></i></div><b class="num ${v < 0 ? 'neg' : 'pos'}">${v < 0 ? '−' : '+'}%${Math.round(Math.abs(v) * 100)}</b></div>`).join('')}</div>`;
}
/* ---------- banka ---------- */
function gauge(score) {
  const t = Math.max(0, Math.min(1, (score - 300) / 1600)); const a0 = Math.PI, a1 = Math.PI * (1 - t);
  const R = 34, cx = 40, cy = 40; const p = (a) => [cx + R * Math.cos(a), cy - R * Math.sin(a)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1), [xe, ye] = p(0);
  return `<svg class="gauge" viewBox="0 0 80 46" aria-hidden="true"><path d="M${x0} ${y0} A${R} ${R} 0 0 1 ${xe} ${ye}" class="gt"/><path d="M${x0} ${y0} A${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}" class="gf"/><circle cx="${x1.toFixed(2)}" cy="${y1.toFixed(2)}" r="3" class="gd"/></svg>`;
}
function loanQuote(o, amt) { const ratio = Math.max(0, Math.min(1, amt / Math.max(1, o.lim))); const r = o.r * (.85 + .35 * ratio); const pay = amt * r / (1 - Math.pow(1 + r, -o.n_)); return { r, pay }; }
function lockedLoan(o) {
  const months = st.reports.length, br = K.counts(st).all;
  let prog = null, label = '';
  if (o.id === 'kobi') { prog = Math.min(1, months / 3); label = months + '/3 ay ciro geçmişi'; }
  else if (o.id === 'yatirim') { prog = Math.min(1, (Math.min(br, 2) / 2 + Math.min(months, 3) / 3) / 2); label = br + '/2 şube · ' + months + '/3 ay'; }
  return `<div class="llock"><span class="lki"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span><div><b>Henüz açılmadı</b><small>${esc(o.why)}</small></div>${prog != null ? `<div class="lprog"><div class="bar"><i style="width:${prog * 100}%"></i></div><span class="num">${label}</span></div>` : ''}</div>`;
}
function vBank() {
  const sc = st.bank.score, offers = K.loanOffers(st), pr = K.promoOffer(st), c = K.counts(st);
  const grade = sc >= 1500 ? 'Çok iyi' : sc >= 1200 ? 'İyi' : sc >= 900 ? 'Orta' : 'Riskli';
  const pay = st.bank.loans.reduce((a, l) => a + l.pay, 0);
  const lname = { ihtiyac: 'İhtiyaç', kobi: 'KOBİ', yatirim: 'Yatırım', yapilandirma: 'Yapılandırma' };
  return `<div class="bk">
    <div class="bkhero">
      <div class="score">${gauge(sc)}<div><span class="lbl">Kredi notu</span><b class="num">${Math.round(sc)}</b><span class="pill ${sc >= 1200 ? 'ok' : sc >= 900 ? 'warn' : 'bad'}">${grade}</span></div></div>
      <div class="mstat"><span class="lbl">Maaş bankası</span><b class="ag">${st.bank.payroll ? BANKS[st.bank.payroll].n : 'Henüz yok'}</b></div>
      <div class="mstat"><span class="lbl">Aylık taksit</span><b class="num">${fmtK(pay)}</b></div>
      <div class="mstat"><span class="lbl">KMH limiti</span><b class="num">${fmtK(K.kmhLimit(st))}</b></div>
    </div>
    <section class="mksec"><header><h3>Kredi teklifleri</h3><span class="muted" style="font-size:10.5px">Faiz, kredi notuna ve maaş bankana göre değişir</span></header>
      <div class="loans">${offers.map(o => { const ok = o.ok && o.lim > 0; return `<div class="loan ${ok ? '' : 'off'}">${(() => { const amt0 = Math.round(o.lim * .5 / 1000) * 1000; const q = loanQuote(o, amt0 || o.lim); return `<div class="lh"><b>${o.n}</b><span class="lrate"><span class="num" id="lr-${o.id}">%${((ok ? q.r : o.r) * 100).toFixed(2)}</span><small>aylık · ${o.n_} ay</small></span></div>${ok ? `<small class="muted">${esc(o.why)}</small>` : ''}
        ${ok ? `<div class="lamt"><select id="la-${o.id}" data-a="lamt" data-v="${o.id}" aria-label="Tutar">${[.25, .5, .75, 1].map(f => { const v = Math.round(o.lim * f / 1000) * 1000; return `<option value="${v}" ${f === .5 ? 'selected' : ''}>${fmt(v)}</option>`; }).join('')}</select><button class="btn sm pri" data-a="loan" data-v="${o.id}">Kullan</button></div><div class="llim"><span id="lp-${o.id}">Taksit ${fmtK(q.pay)}/ay</span><span>Limit ${fmtK(o.lim)}</span></div>` : lockedLoan(o)}`; })()}</div>`; }).join('')}</div></section>
    <div class="grid g2">
      <section class="mksec"><header><h3>Maaş promosyonu</h3><span class="muted" style="font-size:10.5px">3 yıllık sözleşme</span></header>
        ${st.bank.promo ? `<div class="promo-on"><b>${BANKS[st.bank.promo.bank].n}</b><span>Kişi başı ${fmt(st.bank.promo.per)} · ${st.bank.promo.distribute ? 'personele dağıtıldı' : 'kasada tutuldu'}</span><small>${K.dateLabel(st.bank.promo.until)} tarihine kadar</small></div>`
        : pr ? `<div class="promos">${pr.offers.map(o => `<div class="prow"><span>${BANKS[o.bank].n}</span><b class="num">${fmt(o.per)}<small>/kişi</small></b><span class="row"><button class="btn sm pri" data-a="promo" data-v="${o.bank}" data-p="${o.per}" data-d="1">Dağıt</button><button class="btn sm" data-a="promo" data-v="${o.bank}" data-p="${o.per}" data-d="0">Kasada tut</button></span></div>`).join('')}</div><small class="muted">Dağıtırsan moral 6 ay yüksek kalır, kasada tutarsan personel küser.</small>`
        : `<div class="progress"><div class="row between"><span>Teklif için personel</span><b class="num">${c.staff}/10</b></div><div class="bar"><i style="width:${Math.min(100, c.staff * 10)}%"></i></div><small class="muted">Bankalar 10 personelin altındaki işletmelere promosyon teklif etmiyor. Personel sayısı arttıkça kişi başı tutar da yükselir.</small></div>`}</section>
      <section class="mksec"><header><h3>Aktif krediler</h3><span class="muted" style="font-size:10.5px">${st.bank.loans.length} kredi</span></header>
        ${st.bank.loans.length ? st.bank.loans.map(l => `<div class="aloan"><div class="row between"><b>${lname[l.type] || l.type}</b><span class="num">${fmtK(l.pay)}/ay</span></div><div class="bar"><i style="width:${(1 - l.left / l.n) * 100}%"></i></div><div class="row between muted" style="font-size:10px"><span>Kalan anapara ${fmtK(l.bal)}</span><span>${l.left} ay kaldı</span></div></div>`).join('')
        : '<div class="lockrow"><span class="pic">' + IC.bank + '</span><span>Aktif kredin yok. Nakit eksiye düşerse kredili mevduat devreye girer ve günlük faiz işler.</span></div>'}</section>
    </div></div>`;
}

/* ---------- pazarlama ---------- */
function vMarketing() {
  const k = st.mkt, aw = K.awareness(st), open = st.branches, A = AGENCIES[k.agency];
  const handle = '@' + st.name.toLocaleLowerCase('tr-TR').replace(/[^a-z0-9çğıöşü]+/g, '');
  const posted = k.lastPost === st.day;
  const posts = [['urun', 'Yeni ürün', 'Menüden bir ürünü öne çıkar', I('<path d="M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 11h2a2.5 2.5 0 0 1 0 5h-2"/>')], ['kampanya', 'Kampanya', 'İndirim ve fırsat duyurusu', I('<path d="M20 12 12 20l-8-8V4h8z"/><circle cx="8" cy="8" r="1.4"/>')], ['mekan', 'Mekan', 'Şık dekor daha çok etkiler', I('<rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/>')], ['ekip', 'Ekip videosu', 'Baristalarla samimi içerik', I('<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>')]];
  const agDesc = { none: 'Masraf yok, büyüme yavaş', freelancer: 'Düzenli içerik, yavaş büyüme', performans: 'Reklam verimini artırır', kreatif: 'Kalıcı marka bilinirliği' };
  const inits = n => n.replace('@', '').slice(0, 2).toLocaleUpperCase('tr-TR');
  return `<div class="mk">
    <div class="mkhero">
      <div class="prof"><span class="avatar"><span>${esc(st.name.slice(0, 1).toLocaleUpperCase('tr-TR'))}</span></span><div><b>${esc(handle)}</b><small>${esc(st.name)} · resmi hesap</small></div></div>
      <div class="mstat"><span class="lbl">Takipçi</span><b class="num">${k.followers.toLocaleString('tr-TR')}</b></div>
      <div class="mstat"><span class="lbl">Bilinirlik</span><b class="num">${Math.round(aw)}<small>/100</small></b><div class="bar"><i style="width:${aw}%"></i></div></div>
      <div class="mstat"><span class="lbl">Ajans</span><b class="ag">${A.n}</b></div>
    </div>
    <div class="mkgrid">
      <section class="mksec"><header><h3>Bugünün paylaşımı</h3><span class="pill ${posted ? '' : 'acc'}">${posted ? 'Bugün paylaşıldı' : 'Günde 1 paylaşım'}</span></header>
        <div class="posts">${posts.map(([v, n, d, ic]) => `<button class="post" data-a="post" data-v="${v}" ${posted ? 'disabled' : ''}><span class="pic">${ic}</span><b>${n}</b><small>${d}</small></button>`).join('')}</div></section>
      <section class="mksec"><header><h3>Ajans</h3><span class="muted" style="font-size:10.5px">Aylık ücret ay sonunda ödenir</span></header>
        <div class="agencies">${Object.entries(AGENCIES).map(([id, a]) => `<button class="agc ${k.agency === id ? 'on' : ''}" data-a="agency" data-v="${id}" aria-pressed="${k.agency === id}"><span class="agt"><b>${{ none: 'Ajans yok', freelancer: 'Freelancer', performans: 'Performans', kreatif: 'Kreatif' }[id]}</b><span class="fee num">${a.fee ? fmtK(a.fee) + '/ay' : 'Ücretsiz'}</span></span><small>${agDesc[id]}</small></button>`).join('')}</div></section>
      <section class="mksec wide"><header><h3>Reklam kampanyası</h3><span class="muted" style="font-size:10.5px">Arka arkaya kampanya verimi düşürür</span></header>
        ${open.length ? `<div class="camp"><label><span class="lbl">Hedef</span><select id="ctarget"><option value="all">Tüm şubeler</option>${open.map(b => `<option value="${b.id}">${esc(b.name)}</option>`).join('')}</select></label>
          <label><span class="lbl">Bütçe</span><select id="cbudget">${[25000, 75000, 200000, 500000].map(v => `<option value="${v}">${fmtK(v)}</option>`).join('')}</select></label>
          <label><span class="lbl">Süre</span><select id="cdays"><option value="7">7 gün</option><option value="14">14 gün</option><option value="30">30 gün</option></select></label>
          <button class="gold" data-a="campaign">Yayına al ${IC.next}</button></div>
          ${k.campaigns.map(c => `<div class="live"><span class="dot"></span>Yayında · ${fmtK(c.budget)} · erişim ${c.reach.toLocaleString('tr-TR')} · trafik +%${Math.round((c.mult - 1) * 100)} · ${K.dateLabel(c.until).replace(/ \d{4}$/, '')}'e kadar</div>`).join('')}` : '<p class="muted" style="margin:0">Kampanya için önce bir şube aç.</p>'}</section>
      <section class="mksec infl"><header><div><h3>Influencer davet et</h3><small class="hsub">Kitlesi şubenin müşterisine uyan içerik üreticisi daha çok etki eder.</small></div><div class="hnotes"><span class="hn"><i>↻</i>Her ay yeni isimler</span><span class="hn warn"><i>!</i>Bazılarının takipçisi sahte olabilir</span></div></header>
        <div class="infls">${k.inflPool.map((I2, ix) => { const pal = INFL_PAL[(I2.name.length + ix) % INFL_PAL.length]; const tc = TIER_C[I2.tier] || TIER_C.Nano;
          return `<div class="ifc ${I2.used ? 'used' : ''}" style="--c1:${pal[0]};--c2:${pal[1]};--c3:${pal[2]}">
            <span class="iring"><span class="iav">${esc(inits(I2.name))}</span></span>
            <div class="ifb"><b>${esc(I2.name)}</b><span class="tags"><span class="tg" style="background:${tc[1]};color:${tc[0]}">${I2.tier}</span><span class="tg aud">${AUD_IC[I2.aud] || ''}${K.AUD_LABEL[I2.aud]}</span></span></div>
            <div class="ifn"><span class="num">${fmtK(I2.followers).replace(' ₺', '')}</span><small>takipçi</small></div>
            <div class="iff">${I2.used ? '<span class="done">✓ Bu ay iş birliği yapıldı</span>' : open.length ? `<select id="ib-${I2.id}" aria-label="Şube">${open.map(b2 => `<option value="${b2.id}">${esc(b2.name)}</option>`).join('')}</select><button class="ibtn2" data-a="infl" data-v="${I2.id}">Davet et · ${fmtK(I2.fee)}</button>` : `<span class="fee2">${fmtK(I2.fee)}</span><span class="muted" style="font-size:10px">Davet için önce şube aç</span>`}</div>
          </div>`; }).join('')}</div></section>
    </div></div>`;
}

const INFL_PAL = [['#ff7eb3','#ff758c','#ffb199'],['#7f7fd5','#86a8e7','#91eae4'],['#f9a825','#ff7043','#ffd54f'],['#43cea2','#185a9d','#7ee8c6'],['#c471ed','#f64f59','#f7b2d9'],['#4facfe','#00f2fe','#a1c4fd'],['#f093fb','#f5576c','#ffd3e0'],['#30cfd0','#330867','#a8edea']];
const TIER_C = { Nano: ['#7ee8c6', 'rgb(126 232 198 / .14)'], Mikro: ['#86a8e7', 'rgb(134 168 231 / .16)'], Makro: ['#f7b267', 'rgb(247 178 103 / .16)'], 'Ünlü': ['#ff8fb1', 'rgb(255 143 177 / .16)'] };
const AUD_IC = { ogrenci: '🎓 ', elit: '💎 ', aile: '👨‍👩‍👧 ', genel: '☕ ', gece: '🌙 ' };
/* ---------- tedarik ---------- */
function vSupply() {
  const c = K.counts(st);
  const icons = { kahve: [I('<path d="M5 7h14l-2 13H7z"/><path d="M8 7l1-3h6l1 3"/>'), I('<path d="M3 17h13V7H3zM16 10h4l1 3v4h-5"/><circle cx="7" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>'), I('<path d="M4 20V10l5 3V10l5 3V10l6 3v7z"/>'), I('<path d="M3 20V9l6-4 6 4v11"/><path d="M15 20v-7h6v7M3 20h18M7 13h4M7 16h4"/>')], tatli: [I('<path d="M4 20h16M6 20V11h12v9M9 11V7h6v4"/>'), I('<path d="M3 17h13V7H3zM16 10h4l1 3v4h-5"/><circle cx="7" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>'), I('<path d="M5 12h14v8H5zM8 12V8a4 4 0 0 1 8 0v4"/>'), I('<path d="M3 20V9l6-4 6 4v11"/><path d="M15 20v-7h6v7M3 20h18"/>')] };
  const track = (key, title, sub) => {
    const cur = st.supply[key];
    return `<section class="track"><header><div><span class="lbl">${sub}</span><h3>${title}</h3></div><div class="tnow"><span class="lbl">Birim maliyet</span><b class="num">%${Math.round(SUPPLY[key][cur].mult * 100)}</b></div></header>
      <div class="tprog">${[0, 1, 2, 3].map(i => `<i class="${i <= cur ? 'f' : ''}"></i>`).join('')}</div>
      <div class="steps">${SUPPLY[key].map((s2, i) => { const on = cur === i, can = c.open >= s2.req, done = i < cur;
        return `<div class="snode ${on ? 'on' : ''} ${done ? 'done' : ''} ${!can && !on ? 'locked' : ''}">
          <div class="shd"><span class="sic">${icons[key][i]}</span><span class="sno num">0${i + 1}</span></div>
          <b>${s2.n}</b><small>${s2.note}</small>
          <div class="sbar"><span class="lbl">Maliyet</span><div class="bar"><i style="width:${s2.mult * 100}%"></i></div><span class="num">%${Math.round(s2.mult * 100)}</span></div>
          <div class="sq"><span class="lbl">Kalite</span><span class="dots">${[0, 1, 2, 3].map(d => `<i class="${s2.q >= d * 4 && (d > 0 || s2.q > 0) ? 'f' : ''}"></i>`).join('')}</span></div>
          <div class="scost"><span>Kurulum <b class="num">${s2.setup ? fmtK(s2.setup) : '—'}</b></span><span>Aylık <b class="num">${s2.monthly ? fmtK(s2.monthly) : '—'}</b></span></div>
          ${on ? '<span class="sstate">Kullanımda</span>' : can ? `<button class="btn sm ${i > cur ? 'pri' : ''}" data-a="supply" data-k="${key}" data-v="${i}">${i > cur ? 'Geçiş yap' : 'Bu kademeye dön'}</button>` : `<span class="sstate lock">${s2.req} açık şube gerekir</span>`}
        </div>`; }).join('')}</div></section>`;
  };
  return `<div class="vhead"><div><h1>Tedarik</h1><p>Önce dışarıdan alırsın. Şube sayın arttıkça büyük tedarikçiye, fasona ve kendi tesisine geçersin.</p></div><span class="pill acc">${c.open} açık şube</span></div>
    <div class="stack">${track('kahve', 'Kahve çekirdeği', 'Türk kahvesi · filtre · espresso bazlı')}${track('tatli', 'Tatlı ve yiyecek', 'Cheesecake · brownie · tost · kahvaltı')}</div>`;
}

/* ---------- şirket ---------- */
function goalsCard() {
  const G = K.GOALS, done = st.goals || {}; const nd = G.filter(g => done[g.id]).length;
  const next = G.filter(g => !done[g.id]).slice(0, 5); const recent = G.filter(g => done[g.id]).sort((a, b) => done[b.id] - done[a.id]).slice(0, 3);
  const rw = g => [g.r.cash ? fmtK(g.r.cash * st.world.refIdx) : '', g.r.rep ? '+' + g.r.rep + ' itibar' : '', g.r.followers ? '+' + g.r.followers.toLocaleString('tr-TR') + ' takipçi' : ''].filter(Boolean).join(' · ');
  return `<section class="card goals"><div class="row between"><h3>Hedefler</h3><span class="muted" style="font-size:10.5px">${nd}/${G.length} tamamlandı</span></div><div class="gbar"><i style="width:${nd / G.length * 100}%"></i></div>
    <div class="gl">${next.map(g => `<div class="goal"><span class="gk"></span><div><b>${esc(g.n)}</b><small>${esc(g.d)}</small></div><span class="gr">${rw(g)}</span></div>`).join('')}${recent.map(g => `<div class="goal done"><span class="gk">✓</span><div><b>${esc(g.n)}</b><small>${esc(g.d)}</small></div><span class="gr">${rw(g)}</span></div>`).join('')}</div></section>`;
}
function ramChip(b) {
  const R = K.ramadanInfo(st.day); let t = '';
  const eff = b ? Math.round(K.consOf(DISTRICTS[b.d]) * 40 * (1 - Math.min(.6, DISTRICTS[b.d].tour || 0))) : 0;
  if (R.phase === 'once' && R.left <= 21) t = `Ramazan ${R.left} gün sonra${b ? ' · bu semtte ciro ~%' + eff + ' düşer, akşamlar canlanır' : ''}`;
  else if (R.phase === 'ramazan') t = `Ramazan · ${30 - R.d} gün kaldı${b ? ' · ciro ~%' + eff + ' düşük, iftar sonrası yoğun' : ''}`;
  else if (R.phase === 'bayram') t = 'Ramazan Bayramı · sokaklar kalabalık';
  if (!t) { const KB = K.kurbanInfo(st.day); const kp = b ? (K.KURBAN_P[DISTRICTS[b.d].p] != null ? K.KURBAN_P[DISTRICTS[b.d].p] : K.PROV[DISTRICTS[b.d].p].tier === 'k' ? .14 : .06) : 0; const kt = b ? (kp < 0 ? 'ciro ~%' + Math.round(-kp * 100) + ' düşer, şehir memlekete gider' : 'ciro ~%' + Math.round(kp * 100) + ' artar, memlekete dönenler gelir') : '';
    if (KB.phase === 'once' && KB.left <= 14) t = `Kurban Bayramı ${KB.left} gün sonra${kt ? ' · ' + kt : ''}`; else if (KB.phase === 'kurban') t = `Kurban Bayramı${KB.d < 0 ? ' yolu' : ''}${kt ? ' · ' + kt : ''}`; }
  return t ? `<span class="ramchip"><svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>${t}</span>` : '';
}
function vCompany() {
  const c = K.counts(st), rep2 = K.reputation(st);
  const value = st.branches.reduce((a, b) => a + K.salePrice(st, b), 0) + Math.max(0, st.cash) + st.invest.stakes.reduce((a, s2) => a + s2.val * s2.pct, 0);
  const steps = [['Kafe', 'Başlangıç', true, TIC.kafe], ['Metro kiosk', '2 kafe', !!st.unlocked.metro, TIC.metro], ['AVM', '3 kafe · itibar 30', !!st.unlocked.avm, TIC.avm], ['Pub', '5 kafe', !!st.unlocked.pub, TIC.pub], ['Rooftop', 'Pub · itibar 65', !!st.unlocked.rooftop, TIC.rooftop], ['Ortaklık', '5 şube', c.all >= 5, IC.co]];
  const doneN = steps.filter(x => x[2]).length;
  return `<div class="co">
    <div class="cohero"><span class="mono big">${esc(st.name.slice(0, 1).toLocaleUpperCase('tr-TR'))}</span><div class="coname"><span class="lbl">Şirket</span><h1>${esc(st.name)}</h1><small>${K.dateLabel(0)} tarihinde kuruldu</small></div>
      <div class="costats"><div><span class="lbl">Şube</span><b class="num">${c.all}</b></div><div><span class="lbl">Personel</span><b class="num">${c.staff}</b></div><div><span class="lbl">İtibar</span><b class="num">${Math.round(rep2)}</b><div class="bar"><i style="width:${rep2}%"></i></div></div><div><span class="lbl">Şirket değeri</span><b class="num">${fmtK(value)}</b></div></div></div>
    <section class="path"><header><h3>Büyüme yolu</h3><span class="muted" style="font-size:10.5px">${doneN}/${steps.length} seviye açık</span></header>
      <div class="pathline"><div class="pfill" style="width:${(doneN - 1) / (steps.length - 1) * 100}%"></div>${steps.map(x => `<div class="pnode ${x[2] ? 'done' : ''}"><span class="pic">${x[3]}</span><b>${x[0]}</b><small>${x[1]}</small></div>`).join('')}</div></section>
    ${goalsCard()}
    <div class="grid g2">
      <section class="mksec"><header><h3>Ortaklık fırsatları</h3></header>${c.all >= 5 ? (st.invest.offers.map(o => `<div class="offer"><div><b>${esc(o.name)}</b><small>%${Math.round(o.pct * 100)} hisse · değer ${fmtK(o.val)} · aylık kâr ~${fmtK(o.base)}</small></div><button class="btn sm pri" data-a="stake" data-v="${o.id}">${fmtK(o.price)}</button></div>`).join('') || '<p class="muted" style="margin:0">Bu ay yeni teklif yok.</p>') + st.invest.stakes.map((s2, i) => `<div class="offer"><div><b>${esc(s2.name)}</b><small>%${Math.round(s2.pct * 100)} · son temettü ${fmtK(s2.last)}</small></div><button class="btn sm" data-a="sellstake" data-v="${i}">Sat</button></div>`).join('') : `<div class="lockrow"><span class="pic">${IC.co}</span><span>5 şubeye ulaşınca başka kafelerin hisse teklifleri burada görünür. Şu an ${c.all} şuben var.</span></div>`}</section>
      <section class="mksec"><header><h3>Gelişmeler</h3></header><ol class="timeline">${st.log.slice(0, 10).map(l => `<li class="${l.k}"><time>${K.dateLabel(l.d).replace(/ \d{4}$/, '')}</time><span>${esc(l.m)}</span></li>`).join('')}</ol></section>
    </div></div>`;
}

/* ---------- puan isteme ----------
   Google/Apple'ın kendi değerlendirme penceresi. Güzel bir anda sorulur (kârlı ay, 3. şube),
   oyunda en az 2 ay geçmiş olmalı, iki istek arasında 30 gerçek gün, toplamda en fazla 3 kez. */
function askReview(why) {
  if (!st || !window.KZReview) return; const R = st.review = st.review || { n: 0, at: 0 };
  if (R.n >= 3 || st.day < 60 || Date.now() - R.at < 30 * 864e5) return;
  R.n++; R.at = Date.now(); save();
  setTimeout(() => { try { window.KZReview(why); } catch (e) {} }, 1200);
}
function migrate(st) {
  const map = { ank: '06', izm: '35', ant: '07', brs: '16', mug: '48' };
  for (const b of st.branches) { if (DISTRICTS[b.d]) continue; let code = /^[pd]\d\d/.test(b.d) ? b.d.slice(1, 3) : map[b.d.slice(0, 3)]; const ds = code ? K.provDistricts(code) : []; const c = ds.find(id => DISTRICTS[id].central) || ds[0]; b.d = c || 'kartal'; K.computeOffer(st, b); }
  for (const k in st.listings) if (!DISTRICTS[k.split(':')[0]]) delete st.listings[k];
  // AVM adları değişti: eski kayıtlardaki şube ve ilan adlarını güncel adla yenile
  for (const b of st.branches) { if (!b.mall || !b.archN) continue; const m = K.mallById(st, b.mall); const i = b.archN.indexOf(' · '); if (m && i > 0) b.archN = b.archN.slice(0, i) + ' · ' + m.n; }
  for (const k in st.listings) if (k.startsWith('M:')) delete st.listings[k];
}
/* ---------- ayarlar ---------- */
function prefs() { st.prefs = st.prefs || { report: true, coins: true, cashFull: false }; return st.prefs; }
function sw(k, on, label) { return `<button class="switch ${on ? 'on' : ''}" role="switch" aria-checked="${on}" aria-label="${label}" data-a="pref" data-v="${k}"><i></i></button>`; }
function backupTxt() {
  const p = window.KZ_PLATFORM;
  if (p === 'ios') return 'Kayıt ve Altın iCloud hesabına otomatik yedeklenir; uygulamayı silip yeniden yüklesen de aynı Apple Kimliği ile geri gelir.';
  if (p === 'android') return 'Kayıt ve Altın Google hesabına otomatik yedeklenir (Android yedekleme açıksa, günde bir kez); yeniden yüklemede geri gelir.';
  return 'Tarayıcı sürümünde kayıt yalnızca bu cihazda tutulur.';
}
const restoreRow = () => `<div class="shrest"><span>Daha önce satın aldıysan</span><button class="btn sm ghost" data-a="restore">Satın alımları geri yükle</button></div>`;
// mağazadan gelen ürün listesine göre kalıcı ürünleri geri verir (tüketilen Altın/nakit paketleri geri gelmez)
const RESTORABLE = { patron: { perm: 'patron' }, hizli: { perm: 'fast' }, akademi: { perm: 'akademi' }, noads: { noads: true } };
function applyRestore(list, silent) {
  if (!st) { ui.pendRestore = list; return; }
  const S = K.iapState(st), got = [];
  for (const id of list || []) { const g = RESTORABLE[id]; if (!g) continue; const key = g.perm || 'noads'; if (S[key]) continue; S[key] = true; S.owned[id] = Math.max(1, S.owned[id] || 0); got.push((K.IAP.find(x => x.id === id) || {}).n || id); }
  if (got.length) { toast('Geri yüklendi: ' + got.join(', ')); sfx('coin'); save(); render(); }
  else if (!silent) toast('Geri yüklenecek kalıcı ürün bulunamadı.');
}
window.addEventListener('kzrestore', e => applyRestore(e.detail.list, e.detail.silent));
function settingsSheet() {
  const P = prefs(); const sp = st.speed;
  const sv = ui.lastSave || (st && st.savedAt); const saved = sv ? (new Date(sv).toDateString() === new Date().toDateString() ? 'bugün ' : new Date(sv).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' ') + new Date(sv).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) + ' · oyun günü ' + (st.day + 1) : 'henüz yok';
  return `<div class="sheet settings" role="dialog" aria-modal="true" aria-label="Ayarlar">
    <header class="sth"><span class="sti">${IC.gear}</span><div><h2>Ayarlar</h2><small>${esc(st.name)} · Gün ${st.day + 1}</small></div><button class="ibtn" data-a="closesettings" aria-label="Kapat"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></header>
    <div class="sbody">
      <section class="sgroup"><h4>Oyun</h4>
        <div class="srow"><div><b>Ses efektleri</b><small>Kasa ve kapı zili, az ve sade</small></div>${sw('sfx', P.sfx !== false, 'Ses efektleri')}</div>
        <div class="srow"><div><b>Kafe ambiyansı</b><small>Ana ekranda hafif uğultu</small></div>${sw('amb', !!P.amb, 'Kafe ambiyansı')}</div>
        <div class="srow"><div><b>Bildirimler</b><small>Günlük ödül ve şubelerin seni beklediğinde haber ver</small></div>${sw('notif', P.notif !== false, 'Bildirimler')}</div>
        <div class="srow"><div><b>Ay sonu raporu</b><small>Her ay kapanışında Z raporunu göster</small></div>${sw('report', P.report, 'Ay sonu raporu')}</div>
        <div class="srow"><div><b>Kasa baloncukları</b><small>Ana ekranda kazanılan tutarları göster</small></div>${sw('coins', P.coins, 'Kasa baloncukları')}</div>
      </section>
      <section class="sgroup"><h4>Görünüm</h4>
        <div class="srow col"><div><b>Dükkan cephesi</b><small>Tüm şubelerin rengi ve tabelası. Özel cepheler mağazada.</small></div><div class="swatches">${Object.entries(BRAND_COLORS).map(([k, c]) => brandAllowed(k) ? `<button class="swt ${curBrand().color === k ? 'on' : ''}" data-a="setbrand" data-v="${k}" aria-label="${c.n}" title="${c.n}" style="--sw:${c.sw};--sg:${c.sign[1]}"><i></i></button>` : `<button class="swt lock" data-a="shoptab" data-v="Görünüm" aria-label="${c.n} · mağazada" title="${c.n} · mağazada" style="--sw:${c.sw};--sg:${c.sign[1]}"><i></i></button>`).join('')}</div></div>
        <div class="srow col"><div><b>Tema</b><small>Oyunun renkleri. Seçim bu cihazda saklanır.</small></div>${themePicker()}</div>
        <div class="srow"><div><b>Para gösterimi</b><small>Üst çubuktaki kasa tutarı</small></div><div class="seg"><button class="${P.cashFull ? '' : 'on'}" data-a="cashfmt" data-v="0">Kısa · 2 Mn ₺</button><button class="${P.cashFull ? 'on' : ''}" data-a="cashfmt" data-v="1">Tam</button></div></div>
        <div class="srow"><div><b>Kafe adı</b><small>Tabelada ve hesaplarda görünür</small></div><div class="row"><input type="text" id="rename" maxlength="24" value="${esc(st.name)}" aria-label="Kafe adı"><button class="btn sm" data-a="rename">Kaydet</button></div></div>
      </section>
      <section class="sgroup"><h4>Hesap ve yedek</h4>
        <div class="srow"><div><b>Satın alımları geri yükle</b><small>Patron Kartı, Hızlı mod, Akademi ve Reklamsız ${window.KZ_PLATFORM === 'ios' ? 'Apple' : 'Google'} hesabından geri gelir</small></div><button class="btn sm" data-a="restore">Geri yükle</button></div>
        <div class="srow"><div><b>Bulut yedeği</b><small>${backupTxt()}</small></div></div>
      </section>
      ${window.KZLog ? `<section class="sgroup"><h4>Geliştirici</h4>
        <div class="srow"><div><b>Sürüm</b><small>${esc(window.KZ_VERSION || 'tarayıcı')}${window.KZUpdate ? ' · yeni sürüm var: ' + esc(window.KZUpdate.version) : ''}</small></div><button class="btn sm" data-a="adtest">Reklamı dene</button></div>
        <div class="srow col"><div><b>Günlük</b><small>Hata ve reklam adımları. Kopyalayıp Claude'a yapıştırabilirsin.</small></div><pre class="klog">${esc(window.KZLog.lines.slice(-8).join('\n'))}</pre><div class="row"><button class="btn sm" data-a="copylog">Günlüğü kopyala</button></div></div>
      </section>` : ''}
      <section class="sgroup"><h4>Kayıt</h4>
        <div class="srow"><div><b>Otomatik kayıt</b><small>Her gün sonunda bu cihaza kaydedilir · son kayıt ${saved}</small></div><button class="btn sm" data-a="savenow">Şimdi kaydet</button></div>
        <div class="srow"><div><b>Yeni oyun</b><small>Mevcut ilerleme silinir</small></div>${ui.confirm && ui.confirm.k === 'reset' ? '<div class="row"><button class="btn sm" data-a="cancelconfirm">Vazgeç</button><button class="btn sm danger" data-a="doreset">Evet, sil</button></div>' : '<button class="btn sm danger" data-a="reset">Yeni oyuna başla</button>'}</div>
      </section>
      <p class="ver">Cafe Simulator</p>
    </div></div>`;
}

/* ---------- katmanlar ---------- */
function renderLayer() {
  const layer = $('#layer'); if (!layer) return;
  const _sl = layer.querySelector('#suleft'), _sh = layer.querySelector('.sheet'), _keep = [_sl ? _sl.scrollTop : 0, _sh ? _sh.scrollTop : 0], _det = layer.querySelector('.sudet');
  const _open = _det && _det.open;
  setTimeout(() => { const a = layer.querySelector('#suleft'), b = layer.querySelector('.sheet'), d = layer.querySelector('.sudet'); if (a) a.scrollTop = _keep[0]; if (b) b.scrollTop = _keep[1]; if (d && _open) d.open = true; }, 0);
  const wrap = h => `<div class="layer">${h}</div>`;
  if (st.crisis && st.crisis.bankrupt) { const best = st.reports.reduce((m, r) => Math.max(m, r.profit), 0); layer.innerHTML = wrap(`<div class="sheet sm ev crisis"><div class="kick neg">İflas</div><h2>${esc(st.name)} kapandı</h2><p>Bütün şubeler devredildi ama borç kapanmadı. Şirket ${st.day + 1}. günde iflas etti.</p><ul class="cstats"><li><span>Oynanan süre</span><b>${Math.floor((st.day + 1) / 30)} ay</b></li><li><span>En iyi ay</span><b>${fmt(best)}</b></li><li><span>Kalan borç</span><b class="neg">${fmt(Math.max(0, -st.cash))}</b></li></ul><div class="opts"><button class="opt" data-a="doreset"><b>Yeni şirket kur</b><small>Baştan başla, 2 Mn ₺ sermaye.</small></button></div></div>`); return; }
  if (st.crisis && st.crisis.forced) { const C = st.crisis; layer.innerHTML = wrap(`<div class="sheet sm ev crisis"><div class="kick neg">Zorunlu devir</div><h2>Banka şube devri istiyor</h2><p>Kasa ${fmt(st.cash)}${C.loans ? ', kredi borcu ' + fmt(C.loans) : ''}. İhtar süresi doldu. Bir şubeyi yatırımcıya devretmen gerekiyor; ödenen bedel önce eksi bakiyeyi, sonra kredileri kapatır, kalan kasana geçer.</p><div class="opts">${C.offers.map(o => { const b = st.branches.find(x => x.id === o.b); if (!b) return ''; const net = o.price - Math.max(0, -st.cash); return `<button class="opt" data-a="forcedsell" data-v="${o.b}"><b>${esc(b.name)} → ${esc(o.inv)}</b><small>Teklif ${fmt(o.price)} · ${net >= 0 ? 'borç kapanır, ' + fmt(net) + ' artar' : 'borcun ' + fmt(-net) + ' kısmı kalır'}${b.lastMonth ? ' · geçen ay ' + fmtK(b.lastMonth.profit) : ''}</small></button>`; }).join('')}</div><small class="muted" style="font-size:10px">Kredi notun 120 puan düşer. Devralan yatırımcı şubeyi kendi markasıyla işletir.</small></div>`); return; }
  if (ui.setup) { layer.innerHTML = wrap(setupSheet()); return; }
  if (ui.cmp) { const h = compareSheet(); if (ui.cmp) { layer.innerHTML = wrap(h); return; } }
  if (ui.shop) { layer.innerHTML = wrap(shopSheet()); return; }
  if (ui.settings) { layer.innerHTML = wrap(settingsSheet()); return; }
  if (window.KZUpdate && ui.upd !== 'done' && !ui.setup) { const u = window.KZUpdate;
    layer.innerHTML = wrap(`<div class="sheet sm offl"><div class="offic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 19h14"/></svg></div><span class="lbl">Güncelleme</span><h2>Yeni sürüm var · ${esc(u.version)}</h2>${u.notes ? `<p class="muted" style="white-space:pre-line;text-align:left;max-width:360px">${esc(u.notes)}</p>` : '<p class="muted">Yeni özellikler ve düzeltmeler için güncelle.</p>'}<div class="row" style="justify-content:center;gap:8px"><button class="gold" data-a="updnow">Güncelle ${IC.next}</button>${u.force ? '' : '<button class="btn" data-a="updlater">Sonra</button>'}</div></div>`); return; }
  if (ui.offline) { const o = ui.offline, pos = o.gain >= 0;
    layer.innerHTML = wrap(`<div class="sheet sm offl"><div class="offic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg></div><span class="lbl">Sen yokken</span><h2>${o.days} gün geçti</h2><div class="offamt num ${pos ? '' : 'neg'}">${pos ? '+' : '−'}${fmt(Math.abs(o.gain))}</div><p class="muted">Kasa değişimi · ${fmtK(o.rev)} ciro · ${Math.round(o.cust).toLocaleString('tr-TR')} müşteri${o.capped ? '<br>Oyun kapalıyken en fazla 1 ay ilerler.' : ''}</p><div class="row" style="justify-content:center;flex-wrap:wrap;gap:8px"><button class="gold" data-a="offok">Devam ${IC.next}</button>${o.bonus ? adBtn('offline', 'Reklam izle · +' + fmtK(o.bonus) + ' yatırımcı primi', '') : ''}</div></div>`); return; }
  drainQuiet(); const ev = K.nextEvent(st);
  if (ev) {
    if (ev.k === 'rapor' && !prefs().report) { st.queue.shift(); return renderLayer(); }
    if (ev.k === 'rapor') { const r = st.reports[ev.r] || st.reports[st.reports.length - 1]; layer.innerHTML = wrap(`<div class="sheet sm"><div class="shh"><div><span class="lbl">Ay kapandı</span><h2>${r.label}</h2></div></div>${zReport(r)}${r.branches.some(x => x.why && x.why.pct) ? `<div class="whym"><span class="lbl">Ciro neden değişti</span>${r.branches.filter(x => x.why && x.why.pct).map(x => `<div class="wym"><b>${esc(x.name)}</b><span class="num ${x.why.chg < 0 ? 'neg' : 'pos'}">${x.why.chg < 0 ? '▼' : '▲'} %${Math.round(Math.abs(x.why.chg) * 100)}</span><span class="wys">${whyBlock(x.why, true)}</span></div>`).join('')}</div>` : ''}<div class="row sact" style="margin-top:8px;flex-wrap:wrap"><button class="gold" data-a="evok" data-v="0">Devam ${IC.next}</button><button class="btn" data-a="evfin">Finansa git</button>${!r.adBonus ? adBtn('aybonus', 'Reklam izle · +' + fmtK(K.monthBonus(st, r)) + ' sponsor primi', st.reports.indexOf(r)) : ''}</div></div>`); return; }
    const c = K.eventCard(st, ev); if (!c) { st.queue.shift(); return renderLayer(); }
    layer.innerHTML = wrap(`<div class="sheet sm ev" role="dialog" aria-modal="true"><div class="kick">${esc(c.s)}</div><h2>${esc(c.t)}</h2><p>${esc(c.body)}</p><div class="opts">${c.opts.map((o, i) => o.ad ? `<button class="opt adopt" data-a="evad" data-v="${i}" data-k="${o.ad}"><b>${ADI}${esc(o.n)}</b><small>${esc(o.d)}</small></button>` : `<button class="opt" data-a="evok" data-v="${i}"><b>${esc(o.n)}</b><small>${esc(o.d)}</small></button>`).join('')}</div></div>`);
    return;
  }
  layer.innerHTML = '';
}
function checkOffline() {
  if (!st || ui.offline) return;
  syncTime().then(ok => {
    if (!st || ui.offline) return;
    if (!ok) { if (st.savedAt && !ui.noNetTold) { ui.noNetTold = true; toast('İnternet yok: oyun kapalıyken geçen süre bağlanınca hesaplanır'); } return; }
    ui.noNetTold = false;
    const o = K.simulateAway(st, nowT());
    if (o) ui.offline = o;
    st.savedAt = nowT(); save(); if (o) render();
  });
}
function drainQuiet() {
  for (let i = 0; i < 6 && st && !st.crisis; i++) {
    const ev = K.nextEvent(st); if (!ev || ev.k === 'rapor') return;
    const c = K.eventCard(st, ev); if (!c) { st.queue.shift(); continue; }
    const quiet = ev.k === 'hedef' || ev.k === 'asgari' || (c.opts.length === 1 && !c.opts[0].ad);
    if (!quiet) return;
    K.resolveEvent(st, ev, 0); toast(c.t + (c.opts[0] && c.opts[0].d ? ' · ' + c.opts[0].d : ''));
  }
}
function blocking() { if (st) drainQuiet(); return !!(st && ((window.KZUpdate && ui.upd !== 'done') || ui.offline || st.crisis || ui.setup || ui.cmp || ui.shop || ui.settings || K.nextEvent(st))); }

/* ---------- etkileşim ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const a = el.dataset.a, v = el.dataset.v;
  if (el.tagName === 'INPUT' || el.tagName === 'SELECT') return;
  if (a === 'rotateok') { ui.rotateOk = true; fit(); return; }
  if (a === 'brand') { ui.brand = brandOf(ui.brand); ui.brand[el.dataset.k] = v; const nm = $('#nm'); if (nm) ui.startName = nm.value; const sv = $('#nm') && $('#nm').selectionStart; render(); const n2 = $('#nm'); return; }
  if (a === 'newgame') { const nm = $('#nm'); st = K.newGame({ name: (nm && nm.value) || 'Demli Kafe' }); st.brand = brandOf(ui.brand); carryWallet(st); if (ui.pendRestore) { const l = ui.pendRestore; ui.pendRestore = null; applyRestore(l, true); } ui.view = 'home'; ui.sel = null; ui.prov = null; ui.mapLevel = 'tr'; render(); save(); return; }
  if (a === 'continue') { st = loadSave(); if (!st) return; migrate(st); st.paused = true; checkOffline(); if (ui.pendRestore) { const l = ui.pendRestore; ui.pendRestore = null; applyRestore(l, true); } if (ui.mapLevel === 'ist') ui.mapLevel = 'tr'; ui.view = 'home'; render(); return; }
  if (!st) return;
  const b = st.branches.find(x => x.id === ui.branch);
  switch (a) {
    case 'nav': ui.view = v; ui.confirm = null; break;
    case 'gomap': ui.view = 'map'; ui.type = 'kafe'; if (v) { ui.sel = v; ui.prov = DISTRICTS[v].p; ui.mapLevel = 'prov'; const pv = provView(ui.prov); setMV({ x: pv[0] - pv[2] / 2, y: pv[1] - pv[2] * dims().h / dims().w / 2, w: pv[2] }); } else { ui.sel = null; ui.prov = null; ui.mapLevel = 'tr'; setMV(Object.assign({}, MVDEF.tr)); } break;
    case 'prov': { if (ui._dragged) { ui._dragged = false; return; } ui.sel = null; ui.mall = null; ui.mallGroup = null; if (!v) { ui.prov = null; flyTo('tr', TRV[0] + TRV[2] / 2, TRV[1] + TRV[3] / 2, TRV[2]); return; } ui.prov = v; const pv = provView(v); flyTo('prov', pv[0], pv[1], pv[2]); return; }
    case 'level': ui.sel = null; ui.prov = null; ui.mall = null; ui.mallGroup = null; flyTo('tr', TRV[0] + TRV[2] / 2, TRV[1] + TRV[3] / 2, TRV[2]); return;
    case 'speed': if (+v === 0) st.paused = true; else { st.paused = false; st.speed = +v === 2 && st.iap && st.iap.fast ? 2 : 1; } break;
    case 'settings': ui.settings = true; break;
    case 'closesettings': ui.settings = false; ui.confirm = null; break;
    case 'pref': { const P = prefs(); if (v === 'notif') { P.notif = P.notif === false; if (P.notif) askNotifPerm(); } else P[v] = !P[v]; save(); renderLayer(); return; }
    case 'cashfmt': prefs().cashFull = v === '1'; save(); break;
    case 'setspeed': st.speed = +v; st.paused = false; break;
    case 'rename': { const nm = $('#rename'); const val = nm && nm.value.trim(); if (val) { st.name = val.slice(0, 24); save(); toast('Kafe adı güncellendi.'); } break; }
    case 'savenow': save(); toast('Oyun kaydedildi.'); renderLayer(); return;
    case 'endday': ui.ffwd = true; st.paused = false; break;
    case 'hprev': ui.homeIdx = (ui.homeIdx - 1 + st.branches.length) % st.branches.length; break;
    case 'hnext': ui.homeIdx = (ui.homeIdx + 1) % st.branches.length; break;
    case 'qbranch': { const hb = st.branches[ui.homeIdx]; if (hb) { ui.branch = hb.id; ui.view = 'branch'; ui.btab = v; } break; }
    case 'sel': { if (ui._dragged) { ui._dragged = false; return; } ui.sel = v || null; ui.mall = null; ui.mallGroup = null; if (v) { ui.prov = DISTRICTS[v].p; if (ui.view === 'map') { if (ui.mapLevel !== 'prov') { const pv = provView(ui.prov); flyTo('prov', pv[0], pv[1], pv[2]); return; } const d = DISTRICTS[v], g = d.g != null ? TRD.ds[d.p][d.g] : null, mv = mapView(); const span = g ? Math.max(g[6], g[7] * dims().w / dims().h) : 300; if (span < mv.w * .22) { const w = Math.max(600, Math.min(mv.w, span * 4.2)); flyTo('prov', d.mx, d.my, w); return; } } } break; }
    case 'mz': { const mv = mapView(), D = dims(); if (v === 'reset') { if (ui.mapLevel === 'prov' && ui.prov) { const pv = provView(ui.prov); setMV({ x: pv[0] - pv[2] / 2, y: pv[1] - pv[2] * D.h / D.w / 2, w: pv[2] }); } else setMV(Object.assign({}, MVDEF.tr)); } else { const cx = mv.x + mv.w / 2, cy = mv.y + mv.w * D.h / D.w / 2; const nw = Math.max(320, Math.min(D.w, mv.w * (v === 'in' ? .66 : 1.5))); setMV({ x: cx - nw / 2, y: cy - nw * D.h / D.w / 2, w: nw }); } break; }
    case 'type': ui.type = v; ui.mall = null; break;
    case 'mall': { const m = K.mallById(st, v); if (!m) break; ui.mall = v; ui.mallGroup = null; ui.type = 'avm'; ui.sel = K.mallDid(st, m); ui.prov = m.p; if (ui.view === 'map' && ui.mapLevel !== 'prov') { const pv = provView(m.p); flyTo('prov', pv[0], pv[1], pv[2]); return; } break; }
    case 'mallback': ui.mall = null; break;
    case 'mgback': ui.mallGroup = null; break;
    case 'mclus': { if (ui._dragged) { ui._dragged = false; return; } const [x, y] = v.split(',').map(Number); ui.mallGroup = el.dataset.k.split('|'); ui.mall = null; ui.sel = null; flyTo('prov', x, y, Math.max(320, mapView().w * .38)); return; }
    case 'refreshL': if (st.cash < 5000) { toast('Nakit yetersiz.'); return; } K.refreshListings(st, ui.sel, ui.type, 5000); toast('Yeni ilanlar listelendi.'); break;
    case 'inspect': { const L = curListings().find(x => x.id === v); if (L) { K.inspectListing(st, L); toast('Dükkan incelendi.'); } ui._keepScroll = true; break; }
    case 'rent': { const L = curListings().find(x => x.id === v); if (L) { ui.setup = { L, ch: K.defaultChoice(st, L) }; ui.setup.ch.name = L.mall ? K.mallById(st, L.mall).n.replace(/ AVM$/, '') : (DISTRICTS[L.did].n + (L.type === 'kafe' ? '' : ' ' + TYPES[L.type].n)).trim(); } ui._keepScroll = true; break; }
    case 'closesetup': ui.setup = null; ui._keepScroll = true; break;
    case 'ch': { const nm = $('#bname'); if (nm) ui.setup.ch.name = nm.value; ui.setup.ch[el.dataset.k] = v; if (el.dataset.k === 'concept') ui.setup.ch.staff = Math.max(ui.setup.ch.staff, K.minStaff(v, ui.setup.L.tables)); renderLayer(); return; }
    case 'staff': { const nm = $('#bname'); if (nm) ui.setup.ch.name = nm.value; ui.setup.ch.staff = Math.max(1, Math.min(40, ui.setup.ch.staff + +v)); renderLayer(); return; }
    case 'loanopen': { const nm = $('#bname'); if (nm) ui.setup.ch.name = nm.value || ui.setup.ch.name; const cost = K.setupCost(st, ui.setup.L, ui.setup.ch).total; const lo = bestLoan(cost - st.cash); if (!lo.o) { toast(lo.why); break; } const lr = K.takeLoan(st, lo.o.id, lo.amt, lo.q.r); if (!lr.ok) { toast(lr.msg); break; } const r = K.openBranch(st, ui.setup.L, ui.setup.ch); if (r.ok) { if (st.branches.length === 1) setTimeout(askNotifPerm, 2500); if (st.branches.length >= 3) askReview('3-sube'); ui.setup = null; ui.view = 'home'; ui.homeIdx = st.branches.length - 1; toast(fmt(lo.amt) + ' kredi çekildi. ' + r.b.name + (r.b.status === 'acik' ? ' açıldı.' : ' kiralandı.')); sfx('bell'); save(); } else toast(r.msg); break; }
    case 'compare': ui.cmp = true; renderLayer(); return;
    case 'shop': ui.shop = true; ui.shopPrev = null; renderLayer(); return;
    case 'setbrand': { if (brandAllowed(v)) { st.brand = Object.assign({}, st.brand || {}, { color: v }); save(); } renderLayer(); return; }
    case 'shoptab': { ui.settings = false; ui.shop = true; ui.shopTab = v; ui.shopPrev = null; renderLayer(); return; }
    case 'settheme': { try { localStorage.setItem(THEME_KEY, v); } catch (e) {} applyTheme(v); renderLayer(); return; }
    case 'closeshop': ui.shop = false; render(); return;
    case 'buy': { const it = K.IAP.find(x => x.id === v); if (!it || ui._buying) return; if (!K.iapAvail(st, it)) { toast('Bu paket şu an alınamıyor.'); return; } ui._buying = true; buyMock(it).then(ok => { ui._buying = false; if (!ok) return; const r = K.iapGive(st, v, true); toast(r.msg); sfx('coin'); save(); render(); }); return; }
    case 'gbuy': { const r = K.goldBuy(st, v); if (!r.ok) { toast(r.msg); if (r.need) { ui.shopTab = 'Kasa'; ui.shopPrev = null; } render(); return; } toast(r.msg); sfx('coin'); ui.shopPrev = null; const it = K.GSHOP.find(x => x.id === v); if (it && it.give.theme) { try { localStorage.setItem(THEME_KEY, it.give.theme); } catch (e) {} applyTheme(it.give.theme); } save(); render(); return; }
    case 'sprev': ui.shopPrev = v; renderLayer(); return;
    case 'sprevx': ui.shopPrev = null; renderLayer(); return;
    case 'noop': return;
    case 'ticket': { const r = K.useTicket(st, +v); toast(r.msg); save(); break; }
    case 'closecmp': ui.cmp = false; render(); return;
    case 'rentcmp': { ui.cmp = false; const L = curListings().find(x => x.id === v); if (L) { ui.setup = { L, ch: K.defaultChoice(st, L) }; ui.setup.ch.name = DISTRICTS[L.did].n; } render(); return; }
    case 'confirmopen': { const nm = $('#bname'); if (nm) ui.setup.ch.name = nm.value || ui.setup.ch.name; const r = K.openBranch(st, ui.setup.L, ui.setup.ch); if (r.ok) { if (st.branches.length === 1) setTimeout(askNotifPerm, 2500); if (st.branches.length >= 3) askReview('3-sube'); ui.setup = null; ui.view = 'home'; ui.homeIdx = st.branches.length - 1; toast(r.b.status === 'acik' ? r.b.name + ' açıldı. Hayırlı olsun!' : r.b.name + ' kiralandı, ruhsatlar bekleniyor.'); save(); } else toast(r.msg); break; }
    case 'branch': ui.branch = +v; ui.view = 'branch'; ui.btab = 'ozet'; ui.confirm = null; break;
    case 'btab': ui.btab = v; ui.confirm = null; break;
    case 'pedit': { ui.pedit = ui.pedit === v ? null : v; ui.pval = null; ui._keepScroll = true; break; }
    case 'pstep': { if (!ui.pedit) return; const rg = $('#ps-' + ui.pedit); const cur = ui.pval != null ? ui.pval : b.menu[ui.pedit].price; const nv = Math.max(5, cur + (+v)); psLive(b, ui.pedit, nv); return; }
    case 'papply': { const p = ui.pval; if (p > 0 && p !== b.menu[v].price) { K.setPrice(st, b, v, p); toast(K.PRODUCTS[v].n + ' fiyatı ' + fmt(p) + ' oldu.'); save(); } ui.pedit = null; ui.pval = null; ui._keepScroll = true; break; }
    case 'sugp': { const p = +el.dataset.p; if (p > 0) { K.setPrice(st, b, v, p); toast(K.PRODUCTS[v].n + ' fiyatı ' + fmt(p) + ' oldu.'); save(); } ui._keepScroll = true; break; }
    case 'sugall': { let n = 0; for (const id of K.TYPES[b.type].menu) { const r = K.suggestPrice(st, b, id); if (r) { K.setPrice(st, b, id, r.price); n++; } } toast(n + ' ürünün fiyatı önerilene çekildi.'); save(); ui._keepScroll = true; break; }
    case 'raise': K.raiseAll(st, b, +v); toast('Fiyatlar %' + Math.round(+v * 100) + ' artırıldı.'); ui._keepScroll = true; break;
    case 'bstaff': { const r = K.changeStaff(st, b, +v); if (!r.ok) toast(r.msg); break; }
    case 'bwage': b.wage = v; break;
    case 'hiremgr': return res(K.hireManager(st, b, v));
    case 'firemgr': ui.confirm = { k: 'firemgr' }; break;
    case 'firemgr2': ui.confirm = null; K.fireManager(st, b); toast('Müdür görevden alındı.'); break;
    case 'autoprice': K.toggleAutoPrice(st, b); ui._keepScroll = true; break;
    case 'bconcept': if (v !== b.concept) ui.confirm = { k: 'concept', v }; break;
    case 'doconcept': { const cv = ui.confirm && ui.confirm.v; ui.confirm = null; return res(K.changeConcept(st, b, cv)); }
    case 'cancelconfirm': ui.confirm = null; break;
    case 'bdecor': return res(K.upgradeDecor(st, b, v));
    case 'bequip': return res(K.upgradeEquip(st, b, v));
    case 'bkitchen': return res(K.addKitchen(st, b));
    case 'bfront': K.toggleFront(st, b); break;
    case 'postalk': return res(K.posTalk(st, b));
    case 'bvalor': b.valor = b.valor === '30' ? '0' : '30'; toast(b.valor === '30' ? 'Kartlı satışlar 30 gün valörlü.' : 'Blokesiz POS\'a geçildi.'); break;
    case 'sell': ui.confirm = { k: 'sell', v: b.id }; break;
    case 'dosell': { const p = K.sellBranch(st, b); ui.confirm = null; ui.view = 'branches'; toast('Şube ' + fmt(p) + ' karşılığında devredildi.'); save(); break; }
    case 'loan': { const o = K.loanOffers(st).find(x => x.id === v); const amt = +($('#la-' + v) || {}).value; if (o && amt > 0) { const q = loanQuote(o, amt); const lr = K.takeLoan(st, v, amt, q.r); if (!lr.ok) { toast(lr.msg); break; } toast(fmt(amt) + ' hesabına geçti. Aylık %' + (q.r * 100).toFixed(2) + ' faiz.'); save(); } break; }
    case 'promo': K.takePromo(st, v, +el.dataset.p, el.dataset.d === '1'); toast(el.dataset.d === '1' ? 'Promosyon personele dağıtıldı.' : 'Promosyon kasaya alındı.'); break;
    case 'post': ui._keepScroll = true; return res(K.postContent(st, v));
    case 'agency': K.setAgency(st, v); ui._keepScroll = true; break;
    case 'campaign': ui._keepScroll = true; return res(K.startCampaign(st, $('#ctarget').value, +$('#cbudget').value, +$('#cdays').value));
    case 'infl': ui._keepScroll = true; return res(K.inviteInfluencer(st, v, +$('#ib-' + v).value));
    case 'supply': return res(K.upgradeSupply(st, el.dataset.k, +v));
    case 'stake': return res(K.buyStake(st, v));
    case 'sellstake': K.sellStake(st, +v); break;
    case 'reset': ui.confirm = { k: 'reset' }; renderLayer(); return;
    case 'doreset': clearSave(); st = null; ui.confirm = null; ui.setup = null; ui.settings = false; render(); return;
    case 'evad': { const ev = K.nextEvent(st); const k = el.dataset.k; if (ev) runAd(k, null, () => K.resolveEvent(st, ev, +v)); return; }
    case 'restore': { if (!window.KZIAP || !window.KZIAP.restore) { toast(window.KZ_NATIVE ? 'Mağaza bağlantısı henüz hazır değil, biraz sonra dene.' : 'Tarayıcı sürümünde satın alım yok.'); return; } toast('Mağaza kontrol ediliyor…'); window.KZIAP.restore(false).then(l => applyRestore(l, false), err => toast('Geri yükleme yapılamadı: ' + ((err && err.message) || 'bağlantı hatası'))); return; }
    case 'copylog': { const t = window.KZLog ? window.KZLog.text() : ''; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Günlük kopyalandı (' + window.KZLog.lines.length + ' satır).'), () => { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('Günlük kopyalandı.'); } catch (e) { toast('Kopyalanamadı.'); } ta.remove(); }); return; }
    case 'adtest': { if (!window.KZAds) { toast('Reklam yalnızca uygulamada çalışır.'); return; } toast('Reklam yükleniyor…'); window.KZAds.showRewarded('test').then(ok => { toast(ok ? 'Reklam çalıştı.' : 'Reklam açılamadı: ' + (window.KZAds.lastError || 'bilinmeyen')); render(); }); return; }
    case 'updnow': { const u = window.KZUpdate; ui.upd = 'done'; if (u && u.open) u.open(); render(); return; }
    case 'updlater': { ui.upd = 'done'; render(); return; }
    case 'offok': { ui.offline = null; render(); return; }
    case 'ad': { const k = el.dataset.k; let arg = v; if (k === 'ruhsat' || k === 'moral') arg = +v; if (k === 'aybonus') arg = +v; if (k === 'offline') { runAd(k, null, () => { ui.offline = null; }); return; } if (k === 'ilan') arg = { did: ui.sel, type: ui.type }; if (k === 'incele') arg = { did: ui.sel, type: ui.type, id: v, mall: ui.mall }; runAd(k, arg, k === 'aybonus' ? () => { const ev = K.nextEvent(st); if (ev && ev.k === 'rapor') K.resolveEvent(st, ev, 0); } : null); return; }
    case 'evok': { const ev = K.nextEvent(st); if (ev && ev.k === 'rapor') { const r = st.reports[ev.r] || st.reports[st.reports.length - 1]; if (r && r.profit > 0) askReview('karli-ay'); } if (ev) K.resolveEvent(st, ev, +v); if (st.flags.gotoMall) { const m = K.mallById(st, st.flags.gotoMall); st.flags.gotoMall = null; if (m) { ui.view = 'map'; ui.mall = m.id; ui.type = 'avm'; ui.sel = K.mallDid(st, m); ui.prov = m.p; ui.mapLevel = 'prov'; const pv = provView(m.p); setMV({ x: m.x - pv[2] * .3, y: m.y - pv[2] * .3 * dims().h / dims().w, w: pv[2] * .6 }); } } save(); break; }
    case 'evfin': { const ev = K.nextEvent(st); if (ev) K.resolveEvent(st, ev, 0); ui.view = 'finance'; ui.rep = null; break; }
    case 'forcedsell': K.forcedTransfer(st, +v); save(); break;
    case 'crisissell': { const bb = st.branches.find(x => x.id === +v); if (bb) K.sellBranch(st, bb); if (st.cash >= -K.kmhLimit(st)) st.crisis = false; break; }
    case 'restructure': if (K.restructure(st)) toast('Borç yapılandırıldı.'); break;
    default: return;
  }
  render();
});
document.addEventListener('input', e => {
  if (e.target && e.target.dataset && e.target.dataset.a === 'pslide' && st) { const b = st.branches.find(x => x.id === ui.branch); if (b) psLive(b, e.target.dataset.v, +e.target.value); return; }
  if (e.target && e.target.id === 'nm') { ui.startName = e.target.value; const art = document.getElementById('startArt'); if (art) art.innerHTML = startArt(); }
});
document.addEventListener('change', e => {
  const el = e.target; const a = el.dataset && el.dataset.a; if (!a || !st) return;
  const b = st.branches.find(x => x.id === ui.branch);
  if (a === 'price' && b) { const v = +el.value; if (v > 0) { K.setPrice(st, b, el.dataset.v, v); save(); } el.blur(); ui._keepScroll = true; render(); }
  if (a === 'toggle' && b) { K.toggleItem(st, b, el.dataset.v); ui._keepScroll = true; render(); }
  if (a === 'chk' && ui.setup) { const nm = $('#bname'); if (nm) ui.setup.ch.name = nm.value; ui.setup.ch[el.dataset.k] = el.checked; renderLayer(); }
  if (a === 'repsel') { ui.rep = +el.value; render(); }
  if (a === 'price') { const b2 = st.branches.find(x => x.id === ui.branch); const cell = $('#imp-' + el.dataset.v); const v = +el.value; if (b2 && cell && v > 0 && v !== b2.menu[el.dataset.v].price) cell.innerHTML = impTxt(K.priceImpact(st, b2, { [el.dataset.v]: v })); else if (cell && b2 && v === b2.menu[el.dataset.v].price) cell.innerHTML = ''; }
  if (a === 'lamt') { const o = K.loanOffers(st).find(x => x.id === el.dataset.v); if (o) { const q = loanQuote(o, +el.value); const r = $('#lr-' + o.id), pp = $('#lp-' + o.id); if (r) r.textContent = '%' + (q.r * 100).toFixed(2); if (pp) pp.textContent = 'Taksit ' + fmtK(q.pay) + '/ay'; } }
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('g.pin')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  if (e.key === 'Escape' && (ui.setup || ui.settings || ui.cmp || ui.shop)) { ui.setup = null; ui.settings = false; ui.cmp = false; ui.shop = false; render(); }
});

/* ---------- haritada yumuşak geçiş ---------- */
function flyTo(level, cx, cy, w) {
  const from = Object.assign({}, mapView());
  ui.mapLevel = level; const D = dims(); w = Math.min(D.w, w); const h = w * D.h / D.w;
  const to = { x: Math.max(D.x0 - D.w * .1, Math.min(D.x0 + D.w - w * .9, cx - w / 2)), y: Math.max(D.y0 - D.h * .1, Math.min(D.y0 + D.h - h * .9, cy - h / 2)), w };
  setMV(to); ui._keepScroll = false; render();
  const svg = $('#mapsvg'); if (!svg || !from || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const t0 = performance.now(), dur = 420, ease = t => 1 - Math.pow(1 - t, 3);
  const step = now => { const k = ease(Math.min(1, (now - t0) / dur)); const x = from.x + (to.x - from.x) * k, y = from.y + (to.y - from.y) * k, ww = from.w + (to.w - from.w) * k; const s2 = $('#mapsvg'); if (!s2) return; s2.setAttribute('viewBox', x + ' ' + y + ' ' + ww + ' ' + (ww * D.h / D.w)); if (k < 1) requestAnimationFrame(step); };
  svg.setAttribute('viewBox', from.x + ' ' + from.y + ' ' + from.w + ' ' + (from.w * D.h / D.w)); requestAnimationFrame(step);
}

/* ---------- harita üzeri etiket ---------- */
document.addEventListener('pointermove', e => { const card = $('#mapcard'); if (!card) return; let tip = $('#maptip'); const t = e.target.closest && e.target.closest('#mapsvg [data-a=prov], #mapsvg [data-a=sel]');
  if (!t || drag && drag.moved || e.pointerType === 'touch') { if (tip) tip.style.opacity = 0; return; }
  if (!tip) { tip = document.createElement('div'); tip.id = 'maptip'; card.appendChild(tip); }
  const id = t.dataset.v, a = t.dataset.a; let html;
  if (a === 'prov') { const P = K.PROV[id]; html = `<b>${esc(P.n)}</b>`; }
  else { const d = DISTRICTS[id]; const lk = K.districtLock(st, id).length > 0; html = `<b>${esc(d.n)}</b><span><i style="background:${PROFF[d.prof]}"></i>${K.PROFILE[d.prof].n}${lk ? ' · kilitli' : ''}</span>`; }
  if (tip.innerHTML !== html) tip.innerHTML = html; const r = card.getBoundingClientRect(), sc = r.width / card.offsetWidth;
  tip.style.left = ((e.clientX - r.left) / sc + 12) + 'px'; tip.style.top = ((e.clientY - r.top) / sc - 34) + 'px'; tip.style.opacity = 1; });
/* ---------- harita sürükle / iki parmakla yakınlaştır / tekerlek ----------
   Hareket sırasında SVG yeniden çizilmez: CSS transform (GPU) ile kaydırılır ve ölçeklenir,
   parmak kalkınca yeni görünüm viewBox'a yazılır ve etiketler bir kez yeniden çizilir. */
let drag = null; const ptrs = new Map(); let gst = null, graf = 0;
const MV_MIN = 320;
function gStart(svg) {
  const r = svg.getBoundingClientRect(); const mv = Object.assign({}, mapView()); const D = dims(); const mh = mv.w * D.h / D.w;
  const sc = Math.min(r.width / mv.w, r.height / mh); const ox = (r.width - mv.w * sc) / 2, oy = (r.height - mh * sc) / 2;
  const pts = [...ptrs.values()];
  const c = pts.length > 1 ? { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2, d: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1 } : { x: pts[0].x, y: pts[0].y, d: 1 };
  gst = { svg, r, mv, mh, sc, ox, oy, c0: c, n: pts.length, tx: 0, ty: 0, s: 1, sMin: mv.w / D.w, sMax: mv.w / MV_MIN };
  svg.style.transformOrigin = '0 0'; svg.style.willChange = 'transform';
}
function gMove() {
  if (!gst) return; const pts = [...ptrs.values()]; const g = gst;
  if (pts.length > 1 && g.n > 1) { const m = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }; const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    g.s = Math.max(g.sMin, Math.min(g.sMax, d / g.c0.d)); g.tx = m.x - g.r.left - g.s * (g.c0.x - g.r.left); g.ty = m.y - g.r.top - g.s * (g.c0.y - g.r.top); }
  else { g.s = 1; g.tx = pts[0].x - g.c0.x; g.ty = pts[0].y - g.c0.y; }
  if (!graf) graf = requestAnimationFrame(() => { graf = 0; if (gst) gst.svg.style.transform = `translate(${gst.tx}px,${gst.ty}px) scale(${gst.s})`; });
}
// hareketi viewBox'a işler; full: etiket boyutları için ekranı bir kez yeniden çiz
function gCommit(full) {
  const g = gst; if (!g) return; gst = null; if (graf) { cancelAnimationFrame(graf); graf = 0; }
  const D = dims(); const ss = g.sc * g.s;
  const nv = { x: g.mv.x - g.tx / ss - g.ox / g.sc + g.ox / ss, y: g.mv.y - g.ty / ss - g.oy / g.sc + g.oy / ss, w: g.mv.w / g.s };
  setMV(nv); g.svg.style.transform = ''; g.svg.style.willChange = '';
  g.svg.setAttribute('viewBox', nv.x + ' ' + nv.y + ' ' + nv.w + ' ' + (nv.w * D.h / D.w));
  if (full && Math.abs(g.s - 1) > .01) render();
}
document.addEventListener('pointerdown', e => { const svg = e.target.closest && e.target.closest('#mapsvg'); if (!svg) return;
  if (gst) gCommit(false); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptrs.size > 2) return;
  if (!drag) drag = { x: e.clientX, y: e.clientY, moved: false }; else drag.moved = true; gStart(svg); });
document.addEventListener('pointermove', e => { if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (drag && !drag.moved && Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 4) drag.moved = true;
  if (drag && drag.moved) gMove(); });
function gEnd(e) { if (!ptrs.has(e.pointerId)) return; ptrs.delete(e.pointerId);
  if (ptrs.size) { gCommit(false); const svg = $('#mapsvg'); if (svg) gStart(svg); return; }
  const moved = drag && drag.moved; gCommit(true); if (moved) { ui._dragged = true; setTimeout(() => { ui._dragged = false; }, 50); } drag = null; }
document.addEventListener('pointerup', gEnd); document.addEventListener('pointercancel', gEnd);
document.addEventListener('wheel', e => { const svg = e.target.closest && e.target.closest('#mapsvg'); if (!svg) return; e.preventDefault(); const mv = mapView(), D = dims(); const r = svg.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height; const h = mv.w * D.h / D.w; const nw = Math.max(320, Math.min(D.w, mv.w * (e.deltaY < 0 ? .85 : 1.18))); const nh = nw * D.h / D.w; setMV({ x: mv.x + (mv.w - nw) * px, y: mv.y + (h - nh) * py, w: nw }); render(); }, { passive: false });

/* ---------- para baloncukları ---------- */
let lastRev = 0;
function coinPop() {
  if (ui.view !== 'home' || !st || !prefs().coins) return;
  const b = st.branches[ui.homeIdx]; const box = $('#coins'); if (!b || !box) return;
  const r = b.today.rev; const d = r - (b._lastPop || 0); b._lastPop = r;
  if (d > 20 && Math.random() < .5) sfx('coin');
  if (d > 20) { const c = document.createElement('span'); c.className = 'coin'; c.textContent = '+' + Math.round(d).toLocaleString('tr-TR') + ' ₺'; c.style.left = (150 + Math.random() * 180) + 'px'; c.style.top = (70 + Math.random() * 40) + 'px'; box.appendChild(c); setTimeout(() => c.remove(), 2500); }
}

/* ---------- ana ekranda mülkler arası kaydırma ---------- */
let swp = null;
document.addEventListener('pointerdown', e => { const sc = e.target.closest && e.target.closest('#hscene'); if (sc && !e.target.closest('button')) swp = { x: e.clientX, y: e.clientY, t: Date.now() }; });
document.addEventListener('pointerup', e => { if (!swp) return; const dx = e.clientX - swp.x, dy = e.clientY - swp.y; const ok = Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4 && Date.now() - swp.t < 800; swp = null;
  if (!ok || !st || st.branches.length < 2) return; ui.homeIdx = (ui.homeIdx + (dx < 0 ? 1 : -1) + st.branches.length) % st.branches.length; ui._swipe = dx < 0 ? 'l' : 'r'; render(); });

/* ---------- temalar ---------- */
const THEMES = {
  t08: { n: 'Antrasit & Limon', k: 'Koyu', c: ["#111214", "#1a1c1f", "#222428", "#30333a", "#f2f2ee", "#a3a59e", "#e6d45a", "#33301a", "#141206", "#0c0d0e", "#24272b", "#0a0b0c"], light: 0 },
  t06: { n: 'Petrol & Mercan', k: 'Koyu', c: ["#0a1719", "#10232a", "#163038", "#20414a", "#e6f2f3", "#8fadb2", "#f08a6c", "#3a2219", "#1f0c06", "#071113", "#14303a", "#050c0e"], light: 0 },
  t03: { n: 'Grafit & Bakır', k: 'Koyu', c: ["#121314", "#1b1d1f", "#232528", "#30333a", "#eeeeee", "#a0a4ab", "#d08a5a", "#33241a", "#1a0f08", "#0d0e0f", "#25282c", "#0b0c0d"], light: 0 },
  t01: { n: 'Espresso & Krem', k: 'Koyu', c: ["#17110d", "#211913", "#2a2019", "#3a2d23", "#f3e9dd", "#b7a594", "#d9a066", "#3a2a1c", "#1a1008", "#120d0a", "#2c221a", "#0f0b08"], light: 0 },
  t02: { n: 'Zümrüt Gece', k: 'Koyu', premium: true, c: ['#0b1714','#11211c','#172b25','#21392f','#e8f2ee','#93ada3','#c9a86a','#2b2a1c','#14110a','#08120f','#173028','#071010'], light: 0 },
  t05: { n: 'Mürdüm & Gül', k: 'Koyu', premium: true, c: ['#140f1c','#1d1628','#251c33','#352a48','#f1ebf7','#a79bb8','#e79ab8','#3a2230','#1e0d16','#0e0a14','#261d36','#0a0710'], light: 0 },
  t07: { n: 'Gece Neon', k: 'Koyu', premium: true, c: ['#0b0b14','#14142a','#1b1b38','#2a2a50','#eef0ff','#9a9cc4','#7cf0d0','#163a35','#04140f','#07070f','#1b1b3a','#05050c'], light: 0 },
  t15: { n: 'Mermer & Altın', k: 'Açık', premium: true, c: ['#f2f1ee','#ffffff','#f6f5f2','#e1ded7','#1c1c1e','#77746c','#b08a3e','#f1e7d1','#ffffff','#dedcd6','#f0efea','#c7c3b8'], light: 1 },
  t13: { n: 'Nordik Buz', k: 'Açık', c: ["#edf2f6", "#ffffff", "#f3f7fa", "#d8e2ea", "#18222e", "#66768a", "#2f7fb5", "#dbeaf5", "#ffffff", "#d3e1ec", "#eef3f7", "#b3c5d4"], light: 1 }
};
const THEME_KEY = 'kafe-zinciri-tema';
function themeOwned(id) { const t = THEMES[id]; return !!t && (!t.premium || !!(st && st.iap && st.iap.themes && st.iap.themes[id])); }
function themeId() { try { const v = localStorage.getItem(THEME_KEY); if (v && THEMES[v] && (!THEMES[v].premium || !st || themeOwned(v))) return v; } catch (e) {} return 't08'; }
function themeCSS(id, start) {
  let [bg, p, p2, ln, ink, mu, ac, acs, on, sea, prv, pst] = THEMES[id].c, light = THEMES[id].light;
  if (start && light) { const D = THEMES.t08.c; [bg, p, p2, ln, ink, mu] = D; acs = '#1f2b38'; light = 0; } // açılış ekranı her zaman koyu
  let s = `:root:root,html:root .screen{--bg:${bg}!important;--panel:${p}!important;--panel2:${p2}!important;--line:${ln}!important;--ink:${ink}!important;--muted:${mu}!important;--accent:${ac}!important;--accent-soft:${acs}!important;--on-accent:${on}!important;color-scheme:${light ? 'light' : 'dark'}}
.screen{background:${bg}!important}
.mapsvg .sea,.trmap2 .sea{fill:${sea}!important} .trmap2 .prv{fill:${prv}!important;stroke:${pst}!important} .provmap .prv.dim{fill:${prv}!important;opacity:.6}
.screen .sucta2,.screen .gold{background:linear-gradient(135deg,color-mix(in srgb,${ac} 70%,#fff),${ac})!important;color:${on}!important}
.screen .cta{background:linear-gradient(120deg,color-mix(in srgb,${ac} 75%,#fff),${ac})!important;color:${on}!important}
.coin2{background:radial-gradient(circle at 35% 30%,color-mix(in srgb,${ac} 40%,#fff),${ac} 60%,color-mix(in srgb,${ac} 70%,#000))!important;color:${on}!important}
.mpin rect,.mclus .cb{stroke:${ac}!important} .mpin path,.mclus path{stroke:${ac}!important} .mclus text{fill:${ac}!important}`;
  if (light) s += `
.trmap2 .plbl text,.dlbl text,.dpin text{fill:${ink}!important;stroke:${bg}!important} .wxchip,.scene .chip,.ramchip,.adbtn.onscene{background:${p}e6!important;color:${ink}!important;border-color:${ln}!important}
.mpin rect,.mclus .cb{fill:${p}!important} .water{fill:${mu}!important}
.adbtn{background:${p}!important;color:${ink}!important;border-color:${ln}!important} .adi{stroke:${ac}!important} .adi path{fill:${ac}!important}
.dreg{stroke:${bg}!important} .dreg.luks{fill:color-mix(in srgb,#8a6fc0 45%,${p})!important} .dreg.premium{fill:color-mix(in srgb,#c9a254 50%,${p})!important} .dreg.normal{fill:color-mix(in srgb,#4a8fbd 45%,${p})!important} .dreg.dusuk{fill:color-mix(in srgb,#7c8696 35%,${p})!important}
.maplegend{background:${p}e6!important} .mapzoom button{background:${p}!important;color:${ink}!important;border-color:${ln}!important} .maplabel .btn{background:${p}!important;color:${ink}!important}
.floor2 .fl0{fill:${p2}!important} .floor2 .tt{fill:${ln}!important;stroke:color-mix(in srgb,${ln} 70%,#000)!important} .floor2 .ch{fill:${ln}!important} .floor2 .bar2{fill:color-mix(in srgb,${ac} 25%,${p})!important} .floor2 .tt.b,.floor2 .tb2.busy .tt{fill:color-mix(in srgb,${ac} 40%,${p})!important}
.provmap .pfocus{stroke:${ac}!important} .dlbl text{fill:${ink}!important;stroke:${p}!important} .adov{background:#0b111ccc}`;
  return s;
}
function applyTheme(id) { let e = document.getElementById('kz-theme'); if (!e) { e = document.createElement('style'); e.id = 'kz-theme'; document.body.appendChild(e); } const k = id + (st ? '' : ':s'); if (e.dataset.k === k) return; e.dataset.k = k; e.textContent = themeCSS(id, !st); }
function themePicker() {
  const cur = themeId();
  return `<div class="thgrid">${Object.entries(THEMES).map(([id, t]) => { const c = t.c; return `<button class="thc ${cur === id ? 'on' : ''}" data-a="${themeOwned(id) ? 'settheme' : 'shoptab'}" data-v="${themeOwned(id) ? id : 'Görünüm'}" aria-pressed="${cur === id}" style="--tb:${c[0]};--tp:${c[1]};--tl:${c[3]};--ti:${c[4]};--ta:${c[6]}">${themeOwned(id) ? '' : '<span class="thlock">80 Altın</span>'}<span class="thprev"><i class="tbar"></i><i class="tcard"></i><i class="tcard2"></i><i class="tbtn"></i></span><b>${t.n}</b><small>${t.k}${id === 't08' ? ' · varsayılan' : ''}</small></button>`; }).join('')}</div>`;
}

/* ---------- mağaza (oyun içi satın alma) ---------- */
// Mobil sürümde window.KZIAP.purchase(sku) App Store / Google Play ödemesini yapıp Promise<boolean> döndürür.
const SHOP_TABS = ['Öne çıkan', 'Teklifler', 'Kalıcı', 'Lokasyonlar', 'Görünüm', 'Hız', 'Kasa'];
const SHOP_IC = {
  'Öne çıkan': '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  Teklifler: '<path d="M20 12v8H4v-8M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z"/>',
  'Kalıcı': '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>',
  Lokasyonlar: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  'Görünüm': '<path d="M3 10l1.5-5h15L21 10"/><path d="M4 10v10h16V10"/><path d="M3 10h18"/><path d="M10 20v-5h4v5"/>',
  'Hız': '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  Kasa: '<circle cx="12" cy="12" r="8"/><path d="M9.5 9h4a2 2 0 0 1 0 4h-3a2 2 0 0 0 0 4h4M12 7v2M12 17v1"/>'
};
const GOLD_I = '<svg class="gi" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="12" rx="7" ry="9.5" transform="rotate(-25 12 12)" fill="currentColor"/><path d="M9 4.5c3 4.5-1.5 9 3 15" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.6" stroke-linecap="round" transform="rotate(-25 12 12)"/></svg>';
const tl = v => v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
const priceOf = it => (window.KZIAP && KZIAP.prices && KZIAP.prices[it.id]) || tl(it.price);
function offerEnd(it) {
  if (it.week != null) return { at: K.weekEnds() };
  if (it.until) return { txt: Math.max(0, it.until - st.day) + ' oyun günü kaldı' };
  if (it.id === 'bayram') return { txt: 'Bayram boyunca' };
  if (it.id === 'melek') return { txt: 'Durum düzelince kalkar' };
  if (it.id === 'zincir') return { txt: '5. şubene özel' };
  return null;
}
function cdTxt(ms) { ms = Math.max(0, ms); const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4), s2 = Math.floor(ms % 6e4 / 1000); return (d ? d + 'g ' : '') + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s2).padStart(2, '0'); }
function endChip(it) { const e = offerEnd(it); if (!e) return ''; return e.at ? `<span class="shend" data-cd="${e.at}">${I('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>')}<b>${cdTxt(e.at - nowT())}</b></span>` : `<span class="shend">${I('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>')}<b>${e.txt}</b></span>`; }
function tlCard(it, big) {
  const worth = it.worth ? `<s>${tl(it.worth)}</s>` : '';
  const pct = it.worth ? Math.round((1 - it.price / it.worth) * 100) : 0;
  return `<button class="sx ${big ? 'sxhero' : ''}" data-a="buy" data-v="${it.id}">${it.tag ? `<span class="sxtag ${/En iyi|Sadece|Haftalık|Bayram/.test(it.tag) ? 'hot' : ''}">${esc(it.tag)}</span>` : ''}
    <span class="sxic">${I(SHOP_IC[it.cat] || SHOP_IC.Kasa)}</span><b>${esc(it.n)}</b><small>${esc(it.d)}</small>
    ${pct ? `<span class="sxv">%${pct} avantaj · ${tl(it.worth)} değerinde</span>` : ''}${big ? endChip(it) : ''}
    <span class="sxp">${worth}<em>${priceOf(it)}</em></span></button>`;
}
function skinPrev(k, w) { return `<span class="shprev" style="width:${w || 100}%">${facade({ name: st.name, brand: Object.assign({}, curBrand(), { color: k }), night: false, open: true, occ: .4, id: 'pv' + k, par: 'xMidYMid slice' })}</span>`; }
function themePrev(id) { const c = THEMES[id].c; return `<span class="shtheme" style="--tb:${c[0]};--tp:${c[1]};--tl:${c[3]};--ti:${c[4]};--ta:${c[6]}"><i class="tbar"></i><i class="tcard"></i><i class="tcard2"></i><i class="tbtn"></i></span>`; }
function gCard(it) {
  const S = K.iapState(st), own = it.once && S.owned[it.id], can = S.gold >= it.gold;
  const g = it.give; let prev = '';
  if (g.skin) prev = skinPrev(g.skin); else if (g.theme) prev = themePrev(g.theme);
  else if (g.loc) { const L = K.SLOCS[g.loc], d = DISTRICTS[L.did]; prev = `<span class="shloc">${I(SHOP_IC.Lokasyonlar)}<b>${esc(d.n)}</b><small>${esc(K.PROV[d.p].n)} · ${L.type === 'rooftop' ? 'Çatı terası' : 'Bahçeli kafe'}</small></span>`; }
  return `<button class="sx g ${prev ? 'pv' : ''} ${own ? 'own' : ''}" data-a="${own ? 'noop' : (prev ? 'sprev' : 'gbuy')}" data-v="${it.id}">${prev}${prev ? '' : `<span class="sxic">${I(SHOP_IC[it.cat])}</span>`}<b>${esc(it.n)}</b><small>${esc(it.d)}</small>
    <span class="sxp gp ${can || own ? '' : 'no'}">${own ? '<em>Sende var</em>' : `<em>${GOLD_I}${it.gold}</em>`}</span></button>`;
}
function shopPreview(id) {
  const it = K.GSHOP.find(x => x.id === id); if (!it) return '';
  const S = K.iapState(st), g = it.give, can = S.gold >= it.gold;
  let big = '';
  if (g.skin) big = `<div class="spbig">${facade({ name: st.name, brand: Object.assign({}, curBrand(), { color: g.skin }), night: false, open: true, occ: .6, id: 'pvb', par: 'xMidYMid slice' })}</div>`;
  else if (g.theme) big = `<div class="spbig th">${themePrev(g.theme)}</div>`;
  else if (g.loc) { const L = K.SLOCS[g.loc], d = DISTRICTS[L.did]; big = `<div class="spbig loc"><div>${I(SHOP_IC.Lokasyonlar)}<b>${esc(L.n)}</b><small>${esc(d.n)} · ${esc(K.PROV[d.p].n)}</small><p>${esc(L.d)}</p><ul><li>Bu dükkan sadece senin haritanda çıkar</li><li>Semt kilidi ve şube şartı aranmaz</li><li>Kira ve kurulum ayrıca ödenir; iyi yönetilmezse zarar edebilir</li></ul></div></div>`; }
  return `<div class="sprev">${big}<div class="spinfo"><span class="lbl">${esc(it.cat)}</span><h3>${esc(it.n)}</h3><p class="muted">${esc(it.d)}</p>
    <div class="row" style="gap:8px;margin-top:auto"><button class="btn" data-a="sprevx">Geri</button><button class="gold" data-a="gbuy" data-v="${it.id}">${GOLD_I}${it.gold} Altın ile al</button></div>${can ? '' : `<small class="muted">${it.gold - S.gold} Altın eksik · <button class="lnk" data-a="shoptab" data-v="Kasa">Altın al</button></small>`}</div></div>`;
}
function shopSheet() {
  const S = K.iapState(st); const tab = SHOP_TABS.includes(ui.shopTab) ? ui.shopTab : 'Öne çıkan';
  const tlAv = cat => K.IAP.filter(x => x.cat === cat && K.iapAvail(st, x));
  const gAv = cat => K.GSHOP.filter(x => x.cat === cat && (K.iapAvail(st, x) || (x.once && S.owned[x.id])));
  const offers = tlAv('Teklifler');
  let body = '';
  if (ui.shopPrev) body = shopPreview(ui.shopPrev);
  else if (tab === 'Öne çıkan') {
    const hero = offers[0] || K.IAP.find(x => x.id === 'gold_m');
    const picks = [K.IAP.find(x => x.id === 'patron'), K.IAP.find(x => x.id === 'gold_m')].filter(x => x && K.iapAvail(st, x) && x !== hero);
    const gp = [K.GSHOP.find(x => x.id === 'loc_galata'), K.GSHOP.find(x => x.id === 'skin_neon')].filter(x => x && K.iapAvail(st, x));
    body = `<div class="sxg2 feat">${tlCard(hero, true)}<div class="sxg">${picks.map(x => tlCard(x)).join('')}${gp.map(gCard).join('')}</div></div>`;
  } else if (tab === 'Teklifler') body = offers.length ? `<div class="sxg">${offers.map(x => tlCard(x, true)).join('')}</div>` : `<p class="muted shempty">Şu an aktif teklif yok. Haftalık fırsat her pazartesi yenilenir.</p>`;
  else if (tab === 'Kalıcı') body = `<div class="sxg">${K.IAP.filter(x => x.cat === 'Kalıcı').map(x => S.owned[x.id] ? `<div class="sx own"><span class="sxic">${I(SHOP_IC['Kalıcı'])}</span><b>${esc(x.n)}</b><small>${esc(x.d)}</small><span class="sxp"><em>Sende var</em></span></div>` : tlCard(x)).join('')}</div>${restoreRow()}`;
  else if (tab === 'Kasa') body = `<h5 class="shh5">Altın Çekirdek</h5><div class="sxg">${tlAv('Kasa').filter(x => x.give.gold).map(x => tlCard(x)).join('')}</div><h5 class="shh5">Nakit</h5><div class="sxg">${tlAv('Kasa').filter(x => x.give.cash).map(x => tlCard(x)).join('')}</div>`;
  else body = `<div class="sxg ${tab === 'Görünüm' || tab === 'Lokasyonlar' ? 'wide' : ''}">${gAv(tab).map(gCard).join('')}</div>`;
  const first = !S.firstDone ? `<div class="shfirst">${I(SHOP_IC.Teklifler)}<span><b>İlk alımına 2 kat!</b> İlk paketinde nakit ve Altın iki katı gelir.</span></div>` : '';
  return `<div class="sheet shop2" role="dialog" aria-modal="true" aria-label="Mağaza">
    <header class="sth"><span class="sti">${I('<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>')}</span><div><h2>Mağaza</h2><small>${S.tickets ? S.tickets + ' ruhsat bileti · ' : ''}${S.noads ? 'Reklamsız · ' : ''}${window.KZIAP ? '' : window.KZ_NATIVE ? 'Mağaza bağlantısı bekleniyor' : 'Deneme: ücret alınmaz'}</small></div>
      <button class="goldchip" data-a="shoptab" data-v="Kasa">${GOLD_I}<b class="num">${S.gold.toLocaleString('tr-TR')}</b><span>+</span></button>
      <button class="ibtn" data-a="closeshop" aria-label="Kapat"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></header>
    <nav class="shtabs" role="tablist">${SHOP_TABS.map(t => `<button role="tab" aria-selected="${t === tab}" class="${t === tab ? 'on' : ''}" data-a="shoptab" data-v="${t}">${I(SHOP_IC[t])}${t}${t === 'Teklifler' && offers.length ? `<i class="dot">${offers.length}</i>` : ''}</button>`).join('')}</nav>
    <div class="shbody">${ui.shopPrev ? '' : first}${body}<small class="muted shfoot">Altın Çekirdek görevlerden ve günlük ödüllerden de kazanılır. Para ödülleri enflasyonla birlikte büyür.</small></div></div>`;
}
function buyMock(it) {
  if (window.KZIAP && window.KZIAP.purchase) return window.KZIAP.purchase(it.id).catch(() => false);
  if (window.KZ_NATIVE) { toast('Mağaza şu an kullanılamıyor. İnternet bağlantını kontrol edip tekrar dene.'); return Promise.resolve(false); }
  return new Promise(res => { const box = document.createElement('div'); box.className = 'adov'; box.innerHTML = `<div class="adcard buyc"><div class="adtop"><span>Satın alma</span></div><div class="buyb"><b>${esc(it.n)}</b><span>${esc(it.d)}</span><em>${tl(it.price)}</em><small>Deneme sürümü: gerçek ödeme alınmaz. Mobil sürümde App Store / Google Play ödeme ekranı açılır.</small></div><div class="row" style="gap:8px"><button class="btn" id="byno" style="flex:1;justify-content:center">Vazgeç</button><button class="gold" id="byok" style="flex:1;justify-content:center">Onayla</button></div></div>`;
    document.getElementById('screen').appendChild(box); box.querySelector('#byno').onclick = () => { box.remove(); res(false); }; box.querySelector('#byok').onclick = () => { box.remove(); res(true); }; });
}

/* ---------- ödüllü reklam ---------- */
// Mobil sürümde window.KZAds.showRewarded(yer) AdMob/AppLovin ödüllü videosunu açıp Promise<boolean> döndürür.
const ADI = '<svg class="adi" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/></svg>';
function monetOn() { return !!(st && (st.branches.some(b => b.status === 'acik') || st.reports.length)); }
function adBtn(kind, label, v, extra) { if (!monetOn()) return ''; const left = K.adLeft(st, kind); if (!left) return ''; return `<button class="adbtn ${extra || ''}" data-a="ad" data-k="${kind}" data-v="${v == null ? '' : v}">${ADI}<span>${label}</span></button>`; }
function showAd(kind) {
  if (K.iapState(st).noads) return Promise.resolve(true);
  if (window.KZAds && window.KZAds.showRewarded) return window.KZAds.showRewarded(kind);
  return new Promise(res => {
    const wasPaused = st.paused; st.paused = true; const box = document.createElement('div'); box.className = 'adov'; let t = 5;
    box.innerHTML = `<div class="adcard"><div class="adtop"><span>Reklam</span><b id="adt">${t}</b></div><div class="adbody"><span class="adlogo">☕</span><b>Burada ödüllü video reklam oynar</b><small>Mobil sürümde AdMob ya da AppLovin bağlanacak. Bu deneme sürümünde 5 saniye beklemen yeterli.</small></div><div class="adbar"><i id="adb"></i></div><button class="gold" id="adok" disabled>Ödülü al</button></div>`;
    document.getElementById('screen').appendChild(box); const tb = box.querySelector('#adt'), bar = box.querySelector('#adb'), ok = box.querySelector('#adok');
    requestAnimationFrame(() => { bar.style.transition = 'width 5s linear'; bar.style.width = '100%'; });
    const iv = setInterval(() => { t--; tb.textContent = Math.max(0, t); if (t <= 0) { clearInterval(iv); ok.disabled = false; tb.textContent = '✓'; } }, 1000);
    ok.onclick = () => { box.remove(); st.paused = wasPaused; res(true); };
  });
}
async function runAd(kind, arg, after) {
  if (ui._adBusy) return; ui._adBusy = true;
  try { const ok = await showAd(kind); if (!ok) { const why = window.KZAds && window.KZAds.lastError; toast(why ? 'Reklam açılamadı: ' + why : 'Reklam tamamlanmadı.'); return; } if (after) after(); const r = K.adReward(st, kind, arg); if (r.msg) toast(r.msg); sfx('coin'); save(); }
  finally { ui._adBusy = false; render(); }
}

/* ---------- ses ---------- */
const SND = { ctx: null, amb: null };
function actx() { if (!SND.ctx) { try { SND.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (SND.ctx.state === 'suspended') SND.ctx.resume(); return SND.ctx; }
function sfx(kind) {
  if (!st || prefs().sfx === false) return; const c = SND.ctx; if (!c || c.state !== 'running') return; const t = c.currentTime;
  const g = c.createGain(); g.connect(c.destination);
  if (kind === 'coin') { // yumuşak kasa zili: iki kısa sinüs
    [1318, 1760].forEach((f, i) => { const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f; const gg = c.createGain(); gg.gain.setValueAtTime(0, t + i * .06); gg.gain.linearRampToValueAtTime(.05, t + i * .06 + .01); gg.gain.exponentialRampToValueAtTime(.0005, t + i * .06 + .35); o.connect(gg); gg.connect(c.destination); o.start(t + i * .06); o.stop(t + i * .06 + .4); });
  } else if (kind === 'bell') { // kapı zili: aynı tını, tek nota
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = 988; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.06, t + .01); g.gain.exponentialRampToValueAtTime(.0005, t + .6); o.connect(g); o.start(t); o.stop(t + .65);
  }
}
function ambience() {
  const want = !!(st && prefs().amb && ui.view === 'home' && !st.paused && !blocking());
  const c = want ? actx() : SND.ctx; if (!c) return;
  if (want && !SND.amb) { const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0); let l = 0; for (let i = 0; i < len; i++) { l = (l + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.2; }
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600; const g = c.createGain(); g.gain.value = 0; g.gain.linearRampToValueAtTime(.05, c.currentTime + 1.5); src.connect(f); f.connect(g); g.connect(c.destination); src.start(); SND.amb = { src, g }; }
  if (!want && SND.amb) { const a = SND.amb; SND.amb = null; try { a.g.gain.linearRampToValueAtTime(0, SND.ctx.currentTime + .6); a.src.stop(SND.ctx.currentTime + .7); } catch (e) {} }
}
document.addEventListener('pointerdown', () => { if (st && (prefs().sfx !== false || prefs().amb)) actx(); }, { capture: true });

/* ---------- döngü ---------- */
let acc = 0, last = performance.now();
function loop(now) {
  const dt = Math.min(1000, now - last); last = now;
  if (st && !blocking() && !st.over) {
    if (ui.ffwd) {
      const day = st.day; let n = 0;
      while (st.day === day && n++ < 30 && !blocking()) K.tickHour(st);
      if (st.day !== day || blocking()) { ui.ffwd = false; save(); }
      acc = 0; ui._keepScroll = true; liveRender();
    } else if (!st.paused) {
      acc += dt; let ticked = false, guard = 0;
      const MSH = MS_PER_HOUR / (st.speed === 2 && st.iap && st.iap.fast ? 2 : 1); let dch = false; while (acc >= MSH && guard++ < 50) { acc -= MSH; const day = st.day; K.tickHour(st); ticked = true; if (st.day !== day) { save(); dch = true; } if (blocking()) { acc = 0; break; } }
      if (ticked) { liveRender(dch); coinPop(); } else if (ui._pendingLive && performance.now() - (ui._touchAt || 0) > 1500) liveRender(true); ambience();
    }
  }
  requestAnimationFrame(loop);
}

/* ---------- başlat ---------- */
window.addEventListener('kzupdate', () => { if (st) render(); });
setInterval(() => { document.querySelectorAll('[data-cd]').forEach(e => { const b = e.querySelector('b'); if (b) b.textContent = cdTxt(+e.dataset.cd - nowT()); }); }, 1000);
window.addEventListener('online', () => { if (st) checkOffline(); });
/* ---------- telefon bildirimleri (yerel, sunucusuz) ----------
   Oyun arka plana geçince planlanır, açılınca hepsi iptal edilir. Günde en fazla 2, 22:00–09:00 arası gönderilmez. */
function quietShift(t) { const d = new Date(t); const h = d.getHours(); if (h >= 22) { d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); } else if (h < 9) d.setHours(10, 0, 0, 0); return d.getTime(); }
function planNotifs() {
  const N = window.KZNotif; if (!N) return;
  if (!st || st.over || !st.branches.length || prefs().notif === false) { N.clear(); return; }
  const now = Date.now(), list = []; const maxD = K.iapState(st).patron ? 60 : 30;
  const b = st.branches[0]; const semt = DISTRICTS[b.d] ? DISTRICTS[b.d].n : '';
  list.push({ id: 1, at: quietShift(now + maxD * 60000), title: 'Şubelerin ' + maxD + ' gündür sensiz çalışıyor', body: 'Ay sonu raporların ve kasan seni bekliyor. Bundan sonrası birikmiyor, şimdi bir uğra.' });
  const t = new Date(now); t.setDate(t.getDate() + 1); t.setHours(Math.min(21, Math.max(10, t.getHours())), 0, 0, 0);
  list.push({ id: 2, at: t.getTime(), title: 'Günlük ödülün hazır', body: fmt(K.dailyGift(st)) + ' ve 3 Altın Çekirdek hesabına eklenmeyi bekliyor.' });
  list.push({ id: 3, at: quietShift(now + 3 * 864e5), title: (st.name || 'Kafen') + ' seni bekliyor', body: semt + ' şubende müşteriler var, rakiplerin boş durmuyor. Menüne ve fiyatlarına bir göz at.' });
  list.push({ id: 4, at: quietShift(now + 7 * 864e5), title: 'Bir haftadır yoksun', body: 'Yeni semtlerde ve AVM\'lerde boş dükkanlar var. Zincirini büyütmeye devam et.' });
  // aynı güne en fazla 2 bildirim
  const per = {}; N.schedule(list.sort((a, c) => a.at - c.at).filter(x => { const k = new Date(x.at).toDateString(); per[k] = (per[k] || 0) + 1; return per[k] <= 2; }));
}
function askNotifPerm() { if (window.KZNotif && prefs().notif !== false) window.KZNotif.permission(); }
document.addEventListener('visibilitychange', () => { if (!st) return; if (document.hidden) { save(); planNotifs(); } else { planNotifs(); checkOffline(); render(); } });
// Android uygulama arka plana geçerken JS'i hemen dondurabilir; plan oyun açıkken de her dakika tazelenir.
// Tüm zamanlar "şimdiden itibaren" olduğu için oyun açıkken hiçbiri tetiklenmez (her dakika ileri itilir).
setInterval(() => { if (st && !document.hidden) planNotifs(); }, 60000);
window.addEventListener('pagehide', () => { if (st) save(); });
const saved = loadSave();
if (saved && saved.v === 1) ui.startName = saved.name;
applyTheme(themeId());
shell(); render();
requestAnimationFrame(loop);
})();
// Ekran çerçevesi kaydırılmamalı: odaklanan gizli bir giriş tarayıcıya #screen'i kaydırtırsa geri al
(function () { const fix = e => { const t = e.target; if (t && (t.id === 'screen' || t === document.documentElement || t === document || t === document.body) ) { const el = t === document ? document.scrollingElement : t; if (el && (el.scrollTop || el.scrollLeft)) { el.scrollTop = 0; el.scrollLeft = 0; } } }; document.addEventListener('scroll', fix, true); })();
