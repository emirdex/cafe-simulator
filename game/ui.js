(function () {
'use strict';
const K = window.KZ;
const { DISTRICTS, TYPES, ARCH, PRODUCTS, SEGS, EQUIP, DECOR, CONCEPTS, WAGES, BANKS, SUPPLY, AGENCIES, STARTS } = K;
const fmt = K.fmt, fmtK = K.fmtK;
const SAVE = 'kafe-zinciri-v1';
const MS_PER_HOUR = 7500; // 1 oyun günü = 3 gerçek dakika (1x)

let st = null;
const ui = { view: 'map', sel: null, type: 'kafe', setup: null, branch: null, btab: 'ozet', rep: null, confirm: null, startOpt: 'birikim', startName: 'Demli Kafe', rotateOk: false, ftab: null };
const $ = s => document.querySelector(s);
const ROOT = () => document.getElementById('root');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- kayıt ---------- */
function save() { try { const o = Object.assign({}, st); localStorage.setItem(SAVE, JSON.stringify(o)); } catch (e) {} }
function loadSave() { try { const s = localStorage.getItem(SAVE); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function clearSave() { try { localStorage.removeItem(SAVE); } catch (e) {} }

/* ---------- ikonlar ---------- */
const IC = {
  map: '<svg viewBox="0 0 24 24"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>',
  shop: '<svg viewBox="0 0 24 24"><path d="M4 9h16l-1-4H5L4 9z"/><path d="M5 9v10h14V9"/><path d="M10 19v-5h4v5"/></svg>',
  fin: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  bank: '<svg viewBox="0 0 24 24"><path d="M3 9 12 4l9 5"/><path d="M5 10v7M9 10v7M15 10v7M19 10v7M3 20h18"/></svg>',
  mkt: '<svg viewBox="0 0 24 24"><path d="M4 10v4l11 5V5L4 10z"/><path d="M15 9a3 3 0 0 1 0 6"/><path d="M7 14l1 5h3"/></svg>',
  sup: '<svg viewBox="0 0 24 24"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>',
  co: '<svg viewBox="0 0 24 24"><path d="M4 20V8l5-3v15M9 20V3l7 4v13M16 20v-9l4 2v7M2 20h20"/></svg>',
  phone: '<svg viewBox="0 0 64 64"><rect x="20" y="8" width="24" height="44" rx="4"/><path d="M14 40c-4 6-2 12 6 14M50 24c4-6 2-12-6-14"/></svg>'
};

/* ---------- yardımcı görseller ---------- */
function stars(r) { const f = Math.round(r * 2) / 2; let s = ''; for (let i = 1; i <= 5; i++) s += i <= f ? '★' : (i - .5 === f ? '⯪' : '☆'); return '<span class="stars" title="' + r.toFixed(2) + '">' + s + '</span> <span class="num muted">' + r.toFixed(1) + '</span>'; }
function spark(vals) {
  if (!vals.length) return '<svg class="spark" viewBox="0 0 100 40"></svg>';
  const max = Math.max(1, ...vals), n = vals.length;
  const pts = vals.map((v, i) => [n === 1 ? 50 : i / (n - 1) * 100, 37 - v / max * 33]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return '<svg class="spark" viewBox="0 0 100 40" preserveAspectRatio="none"><path class="a" d="' + d + ' L100 40 L0 40 Z"/><path class="l" d="' + d + '" vector-effect="non-scaling-stroke"/></svg>';
}
function meter(label, v, max, txt) { const p = Math.max(0, Math.min(100, v / max * 100)); return '<div class="meter"><span>' + label + '</span><div class="bar"><i style="width:' + p + '%"></i></div><span class="num">' + (txt != null ? txt : Math.round(v)) + '</span></div>'; }
function toast(m) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; $('#toasts').appendChild(t); setTimeout(() => t.remove(), 3800); }
function res(r) { if (r && r.msg) toast(r.msg); render(); save(); }
function typeName(t) { return TYPES[t].n; }
function statusPill(b) { if (b.status === 'hazirlik') return '<span class="pill warn">Ruhsat: ' + b.daysLeft + ' gün</span>'; if (b.closedUntil >= st.day) return '<span class="pill warn">Bugün kapalı</span>'; if (b.lossMonths >= 2) return '<span class="pill bad">' + b.lossMonths + ' aydır zararda</span>'; return '<span class="pill ok">Açık</span>'; }

/* ---------- başlangıç ---------- */
function renderStart() {
  const saved = loadSave();
  ROOT().innerHTML = `
  <div class="start"><div class="startbox">
    <div>
      <div class="lbl">İstanbul prototipi</div>
      <h1>Kartal'da bir dükkanla başla, <em>zincirini</em> kur.</h1>
      <p class="lead">İlk şubeni bütçene uygun bir semtte aç, fiyatlarını kendin belirle, ruhsatı, kirayı, personeli ve bankayı yönet. Doğru kararlar zincire, yanlış konum zarara götürür.</p>
      <p class="lead" style="font-size:13px">Bir oyun günü 3 dakika sürer. Sol menüden şubelerine, finansa, bankaya, pazarlamaya ve tedarike geçebilirsin.</p>
    </div>
    <div class="card stack">
      <label class="stack" style="gap:4px"><span class="lbl">Kafe markanın adı</span><input type="text" id="nm" maxlength="28" value="${esc(ui.startName)}"></label>
      <div class="lbl" style="margin-top:4px">Başlangıç sermayesi</div>
      <div class="opts3">${Object.entries(STARTS).map(([k, s]) => `<button class="optc ${ui.startOpt === k ? 'on' : ''}" data-a="startopt" data-k="${k}"><b>${s.n}</b><span class="num">${fmtK(s.cash + (s.loan || 0))}</span><small>${s.desc}</small></button>`).join('')}</div>
      <div class="row" style="margin-top:6px"><button class="btn pri" data-a="newgame">Oyunu başlat</button>${saved ? `<button class="btn" data-a="continue">Kayıtlı oyuna devam et</button>` : ''}</div>
      ${saved ? `<div class="muted" style="font-size:12px">Kayıt: ${esc(saved.name)} · ${K.dateLabel(saved.day)} · ${saved.branches.length} şube</div>` : ''}
    </div>
  </div></div>
  <div class="toasts" id="toasts"></div>`;
  const nm = $('#nm'); if (nm) nm.addEventListener('input', e => ui.startName = e.target.value);
}

/* ---------- iskelet ---------- */
function shell() {
  ROOT().innerHTML = `
  <div class="app">
    <header class="top" id="top"></header>
    <nav class="rail" id="rail"></nav>
    <main class="main" id="main"></main>
  </div>
  <div id="layer"></div>
  <div class="toasts" id="toasts"></div>
  <div class="rotate ${ui.rotateOk ? '' : 'show'}" id="rotate"><div>${IC.phone}<h2>Telefonu yan çevir</h2><p class="muted">Oyun yatay ekranda oynanmak üzere tasarlandı.</p><button class="btn" data-a="rotateok">Dikey devam et</button></div></div>`;
}
function renderTop() {
  const ctx = st.ctx; const rep = K.reputation(st);
  const dt = K.dateOf(st.day);
  const sp = st.paused ? 0 : st.speed;
  $('#top').innerHTML = `
    <div class="brand"><b>${esc(st.name)}</b><span>${K.counts(st).all} şube</span></div>
    <div class="clock"><span class="lbl">${K.DAYS[dt.getUTCDay()]} · ${K.weatherLabel(ctx)}</span><span class="num">${K.dateLabel(st.day)} · ${String(st.hour).padStart(2, '0')}:00</span></div>
    <div class="spacer"></div>
    <div class="stat ${st.cash < 0 ? 'neg' : ''}"><span class="lbl">Nakit</span><span class="num">${fmt(st.cash)}</span></div>
    <div class="stat"><span class="lbl">Marka itibarı</span><span class="num">${Math.round(rep)}/100</span></div>
    <div class="speed" role="group" aria-label="Oyun hızı">
      <button class="${sp === 0 ? 'on' : ''}" data-a="speed" data-v="0" aria-label="Duraklat">❚❚</button>
      <button class="${sp === 1 ? 'on' : ''}" data-a="speed" data-v="1">1x</button>
      <button class="${sp === 3 ? 'on' : ''}" data-a="speed" data-v="3">3x</button>
      <button class="${sp === 10 ? 'on' : ''}" data-a="speed" data-v="10">10x</button>
    </div>`;
}
function renderRail() {
  const items = [['map', 'Harita', IC.map], ['branches', 'Şubeler', IC.shop], ['finance', 'Finans', IC.fin], ['bank', 'Banka', IC.bank], ['marketing', 'Pazarlama', IC.mkt], ['supply', 'Tedarik', IC.sup], ['company', 'Şirket', IC.co]];
  const v = ui.view === 'branch' ? 'branches' : ui.view;
  $('#rail').innerHTML = items.map(([k, n, ic]) => `<button class="${v === k ? 'on' : ''}" data-a="nav" data-v="${k}"><span class="dot">${ic}${k === 'branches' && st.branches.length ? `<span class="badge">${st.branches.length}</span>` : ''}</span>${n}</button>`).join('');
}
function render() {
  if (!st) return;
  renderTop(); renderRail();
  const m = $('#main');
  const scroll = m.scrollTop;
  const V = { map: vMap, branches: vBranches, branch: vBranch, finance: vFinance, bank: vBank, marketing: vMarketing, supply: vSupply, company: vCompany }[ui.view] || vMap;
  m.innerHTML = V();
  m.scrollTop = scroll;
  const side = $('#side'); if (side && ui._sideScroll) side.scrollTop = ui._sideScroll;
  renderLayer();
}
function liveRender() {
  if (!st) return;
  renderTop();
  if (blocking()) renderLayer();
  const ae = document.activeElement;
  if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'SELECT') && $('#main').contains(ae)) return;
  if (ui.setup || ui.confirm) return;
  const side = $('#side'); if (side) ui._sideScroll = side.scrollTop;
  render();
}

/* ---------- harita ---------- */
function mapSVG() {
  const pins = Object.entries(DISTRICTS).map(([id, d]) => {
    const locked = K.districtLock(st, id).length > 0;
    const own = st.branches.filter(b => b.d === id).length;
    const sel = ui.sel === id;
    const left = d.x > 88 || (d.side === 'Avrupa' && d.x > 40); const anchor = left ? 'end' : 'start', tx = left ? d.x - 2.4 : d.x + 2.4;
    return `<g class="pin ${locked ? 'locked' : ''} ${sel ? 'sel' : ''}" data-a="sel" data-v="${id}" tabindex="0" role="button" aria-label="${esc(d.n)}">
      ${sel ? `<circle class="halo" cx="${d.x}" cy="${d.y}" r="4"/>` : ''}
      <circle class="c" cx="${d.x}" cy="${d.y}" r="1.25"/>
      ${own ? `<circle class="ring" cx="${d.x}" cy="${d.y}" r="2.3"/><circle class="own" cx="${d.x + 1.9}" cy="${d.y - 1.9}" r="1.3"/><text class="owntx" x="${d.x + 1.9}" y="${d.y - 1.25}" text-anchor="middle">${own}</text>` : ''}
      <text x="${tx}" y="${d.y + .9}" text-anchor="${anchor}">${esc(d.n)}</text>
      <circle cx="${d.x}" cy="${d.y}" r="4" fill="transparent"/>
    </g>`;
  }).join('');
  return `<svg class="mapsvg" viewBox="0 0 100 80" role="img" aria-label="İstanbul semt haritası">
    <rect class="sea" x="0" y="0" width="100" height="80"/>
    <path class="land" d="M0 0 H50 C49 8 47.5 16 49.5 24 C51 32 47 40 44 46 C38 52 30 56 20 58 C12 60 6 59 0 58 Z"/>
    <path class="land" d="M53.5 0 H100 V76 C93 76 86 72 78 69 C70 66 63 61 59.5 55 C56.5 50 57 44 54 38 C51.5 32 53.5 22 52.5 14 C52.2 8 53 4 53.5 0 Z"/>
    <text class="lbl2" x="4" y="7">AVRUPA YAKASI</text>
    <text class="lbl2" x="96" y="7" text-anchor="end">ANADOLU YAKASI</text>
    <text class="lbl2" x="30" y="72">MARMARA DENİZİ</text>
    <text class="lbl2" x="51.6" y="9" transform="rotate(-86 51.6 9)" text-anchor="middle">BOĞAZ</text>
    ${pins}
  </svg>`;
}
function vMap() {
  return `<div class="mapwrap">
    <div class="card mapcard">
      <div class="mh"><h2>İstanbul</h2><span class="muted" style="font-size:12px">Diğer 80 il bu prototipte henüz kapalı</span></div>
      ${mapSVG()}
      <div class="legend"><span><i></i>Açık semt</span><span><i class="l"></i>Kilitli semt</span><span><i class="o"></i>Şuben var</span></div>
    </div>
    <div class="side" id="side" style="overflow:auto;max-height:calc(100vh - 110px)">${ui.sel ? districtPanel(ui.sel) : mapIntro()}</div>
  </div>`;
}
function mapIntro() {
  const first = st.branches.length === 0;
  return `<div class="card mentor"><div class="av">S</div><div><b>Selim Usta</b><p>${first
    ? 'Otuz yıldır kafe işletiyorum, sana bir tavsiye: ilk dükkanı kirası düşük bir semtte aç. Kartal, Pendik ya da Esenyurt iyi başlangıçtır. Nişantaşı ve Bağdat Caddesi\'ni zincirin büyüyünce düşünürsün.'
    : 'Yeni şube için önce semtin müşteri yapısına bak. Öğrenci çok olan yerde masa çabuk dolar ama kasa az döner. Ofis bölgesinde sabah take away iyi kazandırır.'}</p></div></div>
  <div class="card"><h2>Semtler</h2>
    <table class="t"><thead><tr><th>Semt</th><th>Elitizm</th><th class="r">Kira m²</th><th></th></tr></thead><tbody>
    ${Object.entries(DISTRICTS).map(([id, d]) => { const lk = K.districtLock(st, id); return `<tr data-a="sel" data-v="${id}" style="cursor:pointer"><td>${esc(d.n)}</td><td>${d.elit}/10</td><td class="r num">${fmt(d.rent * st.world.refIdx)}</td><td class="r">${lk.length ? '<span class="pill">Kilitli</span>' : '<span class="pill ok">Açık</span>'}</td></tr>`; }).join('')}
    </tbody></table></div>`;
}
function districtPanel(id) {
  const d = DISTRICTS[id], lock = K.districtLock(st, id);
  const comps = st.world.comps[id];
  let h = `<div class="card">
    <div class="row between"><div><span class="lbl">${d.side} yakası</span><h2 style="margin:0">${esc(d.n)}</h2></div><button class="btn sm ghost" data-a="sel" data-v="">Kapat</button></div>
    <div class="stack" style="gap:6px;margin-top:10px">
      ${meter('Elitizm', d.elit, 10, d.elit + '/10')}
      ${meter('Kira seviyesi', d.rent, 5500, '')}
      ${meter('Yaya trafiği', d.traffic, 1400, '')}
      ${meter('Öğrenci', d.stu, .5, Math.round(d.stu * 100) + '%')}
      ${meter('Ofis çalışanı', d.off, .7, Math.round(d.off * 100) + '%')}
      ${meter('Rekabet', d.comp, 1, '')}
      ${meter('Belediye katılığı', d.strict, 1, '')}
    </div>
    <div class="rivals" style="margin-top:10px"><span class="lbl">Semtteki kafeler</span><div class="chips" style="margin-top:4px">${comps.map(c => `<span class="pill ${c.tier === 'premium' ? 'acc' : ''}">${esc(c.n)} · ${c.rating}</span>`).join('')}</div></div>
  </div>`;
  if (lock.length) return h + `<div class="lockbox"><b>Bu semt henüz kilitli</b><ul>${lock.map(x => '<li>' + esc(x) + '</li>').join('')}</ul><p style="margin:8px 0 0;font-size:12.5px">Kira ve müşteri beklentisi yüksek semtler, sermayen ve marka itibarın büyüdükçe açılır.</p></div>`;
  h += `<div class="seg">${Object.keys(TYPES).map(t => { const lk = K.typeLock(st, t, id); return `<button class="${ui.type === t ? 'on' : ''}" data-a="type" data-v="${t}" ${lk.length ? 'title="' + esc(lk.join(' · ')) + '"' : ''}>${TYPES[t].n}${lk.length ? ' · kilitli' : ''}</button>`; }).join('')}</div>`;
  const tl = K.typeLock(st, ui.type, id);
  if (tl.length) return h + `<div class="lockbox"><b>${TYPES[ui.type].n} açmak için</b><ul>${tl.map(x => '<li>' + esc(x) + '</li>').join('')}</ul><p style="margin:8px 0 0;font-size:12.5px">${TYPES[ui.type].desc}</p></div>`;
  const ls = K.getListings(st, id, ui.type);
  h += `<div class="row between"><span class="muted" style="font-size:12.5px">${ls.length} ilan · ${TYPES[ui.type].desc}</span><button class="btn sm" data-a="refreshL">Yeni ilanlara bak (5.000 ₺)</button></div>`;
  h += ls.map(L => listingCard(L)).join('');
  return h;
}
function listingCard(L) {
  const A = ARCH[L.arch], d = DISTRICTS[L.did];
  const chips = [];
  if (A.kiosk) chips.push('<span class="pill">Sadece take away</span>');
  if (L.hasFront) chips.push(L.flic ? '<span class="pill ok">Ön alan ruhsata işli</span>' : `<span class="pill warn">Ön alan ruhsatta yok · apartmana ${fmt(L.aptFee)}/ay</span>`);
  else if (!A.kiosk) chips.push('<span class="pill">Ön alan yok</span>');
  chips.push(L.smoke ? '<span class="pill ok">Sigara alanı var</span>' : '<span class="pill bad">Sigara alanı yok</span>');
  if (A.devren) chips.push(`<span class="pill acc">Devren · ekipman ve ruhsat hazır</span>`);
  if (L.ciro) chips.push(`<span class="pill">Ciro payı %${Math.round(L.ciro * 100)}</span>`);
  if (L.aidat) chips.push(`<span class="pill">Aidat ${fmt(L.aidat)}</span>`);
  if (A.school) chips.push('<span class="pill">Okul yakını</span>');
  if (A.growing) chips.push('<span class="pill warn">Site henüz dolmadı · ilk 6 ay kira %50</span>');
  if (A.seasonal) chips.push('<span class="pill">Mevsimsel</span>');
  if (A.wknd && A.wknd < 1) chips.push('<span class="pill">Hafta sonu sakin</span>');
  const est = K.listingEstimate(L);
  return `<div class="listing ${L.blocked ? 'blocked' : ''}">
    <div class="hd"><h3>${esc(A.n)}</h3><span class="num" style="font-size:15px">${fmt(L.rent)}<span class="muted" style="font-size:11px"> /ay</span></span></div>
    <div class="facts">
      <div><small>Alan</small><b>${L.area} m²</b></div>
      <div><small>${A.shared ? 'Ortak alan' : 'Masa'}</small><b>${L.tables || '—'}${L.hasFront ? ' + ' + L.frontTables : ''}</b></div>
      <div><small>Depozito</small><b>${fmtK(L.deposit)}</b></div>
      <div><small>Trafik</small><b>${A.tm >= 1.3 ? 'Çok yüksek' : A.tm >= .95 ? 'Yüksek' : A.tm >= .7 ? 'Orta' : 'Düşük'}</b></div>
    </div>
    <div class="chips">${chips.join('')}</div>
    ${L.nearby.length ? `<div class="rivals">500 m içinde: ${L.nearby.map(c => esc(c.n)).join(', ')}</div>` : '<div class="rivals">500 m içinde rakip kafe yok.</div>'}
    ${L.havaParasi ? `<div class="rivals">Hava parası: <span class="num">${fmt(L.havaParasi)}</span></div>` : ''}
    ${L.inspected ? `<div class="hint"><b>İnceleme:</b> ${esc(L.hint)}<br><span class="muted">Tahmini potansiyel: %${est[0]}–%${est[1]}${L.badPast ? ' · Eski işletmenin yorumları kötü.' : ''}</span></div>` : ''}
    ${L.blocked ? `<div class="hint" style="color:var(--bad)">${esc(L.blocked)}</div>` : ''}
    <div class="row">
      ${L.inspected ? '' : `<button class="btn sm" data-a="inspect" data-v="${L.id}" ${L.blocked ? 'disabled' : ''}>İncelet · 15.000 ₺</button>`}
      <button class="btn sm pri" data-a="rent" data-v="${L.id}" ${L.blocked ? 'disabled' : ''}>Kirala ve kur</button>
    </div>
  </div>`;
}

/* ---------- kurulum ---------- */
function setupSheet() {
  const { L, ch } = ui.setup; const A = ARCH[L.arch];
  const cost = K.setupCost(st, L, ch); const wait = K.waitDays(st, L);
  const cs = K.conceptsFor(L); const minS = K.minStaff(ch.concept, L.tables);
  const permits = K.permitsFor(st, L, ch);
  const after = st.cash - cost.total;
  const wageM = ch.staff * WAGES[ch.wage].cost * st.world.wageIdx;
  return `<div class="sheet" role="dialog" aria-modal="true">
    <div class="shh"><div><span class="lbl">${esc(DISTRICTS[L.did].n)} · ${typeName(L.type)}</span><h2>${esc(A.n)}, ${L.area} m²</h2></div><button class="btn ghost" data-a="closesetup">Vazgeç</button></div>
    <div class="setup">
      <div>
        <div class="field"><div class="fh"><b>Şube adı</b></div><input type="text" id="bname" maxlength="30" value="${esc(ch.name)}"></div>
        <div class="field"><div class="fh"><b>Servis konsepti</b><span class="muted" style="font-size:12px">${L.tables <= 4 ? 'Masa az olduğu için oturmalı konsept sınırlı.' : ''}</span></div>
          <div class="seg">${Object.keys(CONCEPTS).map(c => `<button class="${ch.concept === c ? 'on' : ''}" data-a="ch" data-k="concept" data-v="${c}" ${cs.includes(c) ? '' : 'disabled'}>${CONCEPTS[c].n}</button>`).join('')}</div>
          <span class="muted" style="font-size:12px">${{ takeaway: 'Hızlı devir, düşük sepet. Oturmak isteyen müşterinin bir kısmı gelmez.', self: 'Dengeli personel ve sepet.', garson: 'Sepet %18 büyür, müşteri daha uzun oturur, garson gerekir.', karma: 'Sepet %8 büyür, az sayıda garson yeterli.' }[ch.concept]}</span></div>
        <div class="field"><div class="fh"><b>Tadilat ve dekor</b><span class="muted" style="font-size:12px">Elitizmi yüksek semtte basit dekor müşteri kaçırır.</span></div>
          <div class="seg">${Object.keys(DECOR).map(k => `<button class="${ch.decor === k ? 'on' : ''}" data-a="ch" data-k="decor" data-v="${k}">${DECOR[k].n} · ${fmtK(DECOR[k].m2 * L.area * (A.devren ? .4 : 1))}</button>`).join('')}</div></div>
        <div class="field"><div class="fh"><b>Ekipman</b><span class="muted" style="font-size:12px">Hız, kahve kalitesi ve arıza sıklığını belirler.</span></div>
          <div class="seg">${A.devren ? `<button class="${ch.equip === 'devren' ? 'on' : ''}" data-a="ch" data-k="equip" data-v="devren">Devren gelen · 0 ₺</button>` : ''}${Object.keys(EQUIP).map(k => `<button class="${ch.equip === k ? 'on' : ''}" data-a="ch" data-k="equip" data-v="${k}">${EQUIP[k].n} · ${fmtK(EQUIP[k].cost)}</button>`).join('')}</div>
          ${L.type !== 'metro' && !A.kiosk ? `<label class="row" style="font-size:13px"><input type="checkbox" data-a="chk" data-k="kitchen" ${ch.kitchen ? 'checked' : ''}> Mutfak ekle (250.000 ₺) · kahvaltı ve burger için gerekir</label>` : ''}</div>
        ${L.hasFront ? `<div class="field"><div class="fh"><b>Ön alan</b>${L.flic ? '<span class="pill ok">Ruhsata işli</span>' : '<span class="pill warn">Ruhsata işli değil</span>'}</div>
          <label class="row" style="font-size:13px"><input type="checkbox" data-a="chk" data-k="useFront" ${ch.useFront ? 'checked' : ''}> ${L.frontTables} dış masa kullan (sigara içilebilir alan olur)</label>
          <span class="muted" style="font-size:12px">${L.flic ? 'Belediyeye işgaliye ödenir, yasal olarak kullanılır.' : 'Apartman yönetimine her ay ' + fmt(L.aptFee) + ' ödenir. Anlaşma bozulabilir, zabıta ceza kesebilir.'}</span></div>` : ''}
        <div class="field"><div class="fh"><b>Personel</b><span class="muted" style="font-size:12px">Bu konsept için en az ${minS} kişi önerilir${st.branches.length === 0 ? '. İlk şubede sen de kasadasın.' : '.'}</span></div>
          <div class="row"><div class="stepper"><button data-a="staff" data-v="-1" aria-label="Azalt">−</button><span>${ch.staff}</span><button data-a="staff" data-v="1" aria-label="Artır">+</button></div>
          <div class="seg">${Object.keys(WAGES).map(k => `<button class="${ch.wage === k ? 'on' : ''}" data-a="ch" data-k="wage" data-v="${k}">${WAGES[k].n}</button>`).join('')}</div></div>
          <span class="muted" style="font-size:12px">Aylık maaş + SGK: <span class="num">${fmt(wageM)}</span></span></div>
        <div class="field"><div class="fh"><b>POS anlaşması</b><span class="muted" style="font-size:12px">Kartlı ödemelerin %85'i bu POS'tan geçer.</span></div>
          <div class="seg">${Object.keys(BANKS).map(k => `<button class="${ch.bank === k ? 'on' : ''}" data-a="ch" data-k="bank" data-v="${k}">${BANKS[k].n}</button>`).join('')}</div>
          <div class="seg"><button class="${ch.valor === '0' ? 'on' : ''}" data-a="ch" data-k="valor" data-v="0">Blokesiz · %${(BANKS[ch.bank].pos0 * 100).toFixed(2)}</button><button class="${ch.valor === '30' ? 'on' : ''}" data-a="ch" data-k="valor" data-v="30">30 gün valör · %${(BANKS[ch.bank].pos30 * 100).toFixed(2)}</button></div>
          <span class="muted" style="font-size:12px">${ch.valor === '30' ? 'Komisyon düşük ama kartlı satışların parası 30 gün sonra hesaba geçer.' : 'Para ertesi gün hesabında, komisyon daha yüksek.'}</span></div>
      </div>
      <div class="stack">
        <div class="receipt">
          <div class="rh"><b>Açılış maliyeti</b><span class="sub">${esc(K.dateLabel(st.day))}</span></div>
          ${cost.lines.map(l => `<div class="ln"><span>${esc(l.n)}</span><span>${fmt(l.v)}</span></div>`).join('')}
          <div class="ln tot"><span>Toplam</span><span>${fmt(cost.total)}</span></div>
          <div class="ln sub"><span>Kasada kalan</span><span class="${after < 0 ? 'neg' : ''}">${fmt(after)}</span></div>
          <div class="ln sub"><span>Aylık kira</span><span>${fmt(L.rent)}</span></div>
        </div>
        <div class="card"><h3 style="margin-bottom:6px">Ruhsat ve izinler</h3>
          <div style="font-size:12.5px" class="stack">${permits.map(p => `<div class="row between"><span>${esc(p.n)}</span><span class="num muted">${p.fee ? fmt(p.fee) : 'Ücretsiz'}</span></div>`).join('')}</div>
          <p style="margin:8px 0 0;font-size:12.5px">${wait === 0 ? '<b>İlk şube:</b> tüm süreçler anında tamamlanır.' : `<b>${wait} oyun günü</b> bekleme (yaklaşık ${wait * 3} dakika). Bu sürede diğer şubeler çalışır.`}</p></div>
        <button class="btn pri" data-a="confirmopen" ${after < 0 ? 'disabled' : ''}>${after < 0 ? 'Nakit yetersiz' : wait ? 'Kirala, ruhsatları başlat' : 'Kirala ve aç'}</button>
        ${after < 0 ? '<span class="muted" style="font-size:12px">Banka ekranından kredi kullanabilir veya daha ucuz seçenekleri deneyebilirsin.</span>' : ''}
      </div>
    </div>
  </div>`;
}

/* ---------- şubeler ---------- */
function vBranches() {
  if (!st.branches.length) return `<div class="pagehead"><div><h1>Şubeler</h1><p>Henüz şuben yok. Haritadan bir semt seçip ilk dükkanını kirala.</p></div><button class="btn pri" data-a="nav" data-v="map">Haritaya git</button></div>`;
  return `<div class="pagehead"><div><h1>Şubeler</h1><p>Bir şubeye dokunarak menüsünü, personelini ve dükkan ayarlarını yönet.</p></div></div>
  <div class="grid g3">${st.branches.map(b => {
    const y = b.yesterday; const lm = b.lastMonth;
    return `<button class="card bcard" data-a="branch" data-v="${b.id}">
      <div class="row between" style="width:100%"><div><span class="lbl">${typeName(b.type)} · ${esc(DISTRICTS[b.d].n)}</span><h3>${esc(b.name)}</h3></div>${statusPill(b)}</div>
      <div>${stars(b.rating)}</div>
      ${spark(b.hist.map(h => h.rev))}
      <div class="kv" style="width:100%"><dt>Dün müşteri</dt><dd>${y ? Math.round(y.cust) : '—'}</dd><dt>Dün ciro</dt><dd>${y ? fmt(y.rev) : '—'}</dd><dt>Geçen ay kâr</dt><dd class="${lm ? (lm.profit < 0 ? 'neg' : 'pos') : ''}">${lm ? fmtK(lm.profit) : '—'}</dd></div>
    </button>`;
  }).join('')}</div>`;
}
function vBranch() {
  const b = st.branches.find(x => x.id === ui.branch); if (!b) { ui.view = 'branches'; return vBranches(); }
  const tabs = [['ozet', 'Özet'], ['menu', 'Menü ve fiyat'], ['personel', 'Personel'], ['dukkan', 'Dükkan ve sözleşme']];
  const body = { ozet: bOzet, menu: bMenu, personel: bPersonel, dukkan: bDukkan }[ui.btab](b);
  return `<div class="pagehead"><div><button class="btn sm ghost" data-a="nav" data-v="branches">← Şubeler</button><h1 style="margin-top:6px">${esc(b.name)}</h1><p>${typeName(b.type)} · ${esc(DISTRICTS[b.d].n)} · ${esc(ARCH[b.arch].n)} · ${b.area} m²</p></div><div class="row">${statusPill(b)}${stars(b.rating)}</div></div>
  <div class="tabs">${tabs.map(([k, n]) => `<button class="${ui.btab === k ? 'on' : ''}" data-a="btab" data-v="${k}">${n}</button>`).join('')}</div>${body}`;
}
function bOzet(b) {
  if (b.status === 'hazirlik') return `<div class="card"><h2>Ruhsat süreci devam ediyor</h2><p>İşyeri açma ruhsatı ve izinler ${b.daysLeft} gün içinde tamamlanacak. Bu sürede menüyü ve personeli ayarlayabilirsin.</p></div>`;
  const t = b.today, y = b.yesterday;
  const occT = b.occ.reduce((a, o) => a + o.t, 0);
  const totalT = b.tables + (b.useFront ? b.frontTables : 0);
  const cells = [];
  for (let i = 0; i < b.tables; i++) { const f = Math.min(1, Math.max(0, occT - i)); cells.push(`<div class="tb ${f >= .99 ? 'full' : f > 0 ? 'half' : ''}"></div>`); }
  for (let i = 0; i < (b.useFront ? b.frontTables : 0); i++) { const f = Math.min(1, Math.max(0, occT - b.tables - i)); cells.push(`<div class="tb out ${f >= .99 ? 'full' : f > 0 ? 'half' : ''}"></div>`); }
  const T = TYPES[b.type]; const open = st.hour >= T.open && st.hour < T.close && b.closedUntil < st.day;
  const cap = Math.round(K.staffCap(st, b));
  const sat = t.cust ? t.satSum / t.cust : (b.lastSat || 0);
  const w = b._w || {}; const segs = Object.entries(w).sort((a, c) => c[1] - a[1]);
  const lm = b.lastMonth;
  return `<div class="grid g4" style="margin-bottom:12px">
    <div class="tile"><div class="lbl">Bugün ciro</div><div class="v">${fmt(t.rev)}</div><div class="s">Dün ${y ? fmtK(y.rev) : '—'}</div></div>
    <div class="tile"><div class="lbl">Bugün müşteri</div><div class="v">${Math.round(t.cust)}</div><div class="s">Kaçan ${Math.round(t.lost)} · dün ${y ? Math.round(y.cust) : '—'}</div></div>
    <div class="tile"><div class="lbl">Memnuniyet</div><div class="v">${sat ? Math.round(sat) : '—'}<span class="muted" style="font-size:12px">/100</span></div><div class="s">${b.smoke ? 'Sigara alanı var' : 'Sigara alanı yok'}</div></div>
    <div class="tile"><div class="lbl">Bu ay ciro</div><div class="v">${fmtK(b.mAcc.rev + t.rev)}</div><div class="s">Geçen ay kâr ${lm ? fmtK(lm.profit) : '—'}</div></div>
  </div>
  <div class="grid g2">
    <div class="floor"><div class="row between"><b>Salon</b><span class="muted" style="font-size:12px">${open ? 'Açık' : 'Kapalı'} · ${T.open}:00–${T.close === 24 ? '24' : T.close}:00 · ${Math.round(occT)}/${totalT} masa dolu</span></div>
      ${totalT ? `<div class="tables">${cells.join('')}</div>` : '<div class="muted" style="font-size:12.5px">Masa yok, sadece take away.</div>'}
      <div class="row between" style="font-size:12px"><span class="muted">Servis kapasitesi: saatte ${cap} müşteri</span><span class="muted">${t.queueLost > 0 ? 'Bugün sırada bekleyip giden: ' + Math.round(t.queueLost) : ''}</span></div>
      ${b.useFront ? '<span class="muted" style="font-size:12px">Kesik çizgili masalar dış alan. Yağmurda ve kışta az kullanılır.</span>' : ''}
    </div>
    <div class="card"><h3 style="margin-bottom:8px">Kim geliyor?</h3><div class="stack" style="gap:6px">${segs.map(([s, v]) => meter(SEGS[s].n, v, segs[0][1], Math.round(v * 100) + '%')).join('')}</div>
      <p class="muted" style="font-size:12px;margin:8px 0 0">Öğrenci tek içecekle saatlerce oturur, masa devri düşer. Ofis çalışanı hızlı alıp çıkar.</p></div>
    <div class="card"><h3>Son 30 gün ciro</h3>${spark(b.hist.map(h => h.rev))}<div class="row between muted" style="font-size:12px"><span>Ort. günlük ${b.hist.length ? fmtK(b.hist.reduce((a, h) => a + h.rev, 0) / b.hist.length) : '—'}</span><span>Ort. müşteri ${b.hist.length ? Math.round(b.hist.reduce((a, h) => a + h.cust, 0) / b.hist.length) : '—'}</span></div></div>
    <div class="card"><h3 style="margin-bottom:6px">Geçen ay</h3>${lm ? `<dl class="kv"><dt>Ciro</dt><dd>${fmt(lm.rev)}</dd><dt>Müşteri</dt><dd>${lm.cust.toLocaleString('tr-TR')}</dd><dt>Kaçan müşteri</dt><dd>${Math.round(lm.lost).toLocaleString('tr-TR')}</dd><dt>Net kâr</dt><dd class="${lm.profit < 0 ? 'neg' : 'pos'}">${fmt(lm.profit)}</dd></dl>` : '<p class="muted">İlk ay kapanışından sonra burada görünür.</p>'}</div>
  </div>`;
}
function bMenu(b) {
  const T = TYPES[b.type];
  return `<div class="card"><div class="row between" style="margin-bottom:8px"><div><h2 style="margin:0">Menü ve fiyatlar</h2><span class="muted" style="font-size:12.5px">Fiyat algısı semtin elitizmine göre hesaplanır. Enflasyon her ay maliyetleri artırır.</span></div>
    <div class="row"><button class="btn sm" data-a="raise" data-v=".05">Tüm fiyatlara %5 zam</button><button class="btn sm" data-a="raise" data-v=".1">%10 zam</button></div></div>
  <div class="tw"><table class="t"><thead><tr><th>Ürün</th><th>Menüde</th><th class="r">Maliyet</th><th class="r">Semt ort.</th><th class="r">Fiyatın</th><th class="r">Marj</th><th>Algı</th></tr></thead><tbody>
  ${T.menu.map(id => { const P = PRODUCTS[id], m = b.menu[id]; const c = K.unitCost(st, id); const ref = K.localRef(st, b, id); const pc = K.perception(st, b, id); const mg = (m.price / (1 + TYPES[b.type].kdv) - c) / (m.price / (1 + TYPES[b.type].kdv)); const locked = P.needs && !b.kitchen;
    return `<tr><td>${esc(P.n)}${locked ? ' <span class="pill">Mutfak gerekir</span>' : ''}</td><td><input type="checkbox" data-a="toggle" data-v="${id}" ${m.on && !locked ? 'checked' : ''} ${locked ? 'disabled' : ''} aria-label="${esc(P.n)} menüde"></td><td class="r num">${fmt(c)}</td><td class="r num muted">${fmt(ref)}</td><td class="r"><input class="price" type="number" min="5" step="5" id="pr-${b.id}-${id}" data-a="price" data-v="${id}" value="${m.price}"></td><td class="r num ${mg < .35 ? 'neg' : ''}">%${Math.round(mg * 100)}</td><td><span class="pill ${pc[1]}">${pc[0]}</span></td></tr>`; }).join('')}
  </tbody></table></div><p class="muted" style="font-size:12px;margin:8px 0 0">Marj, KDV düşüldükten sonraki brüt kârdır. Toplu zam kısa süre müşteri tepkisi yaratır.</p></div>`;
}
function bPersonel(b) {
  const minS = K.minStaff(b.concept, b.tables); const cs = K.conceptsFor({ arch: b.arch, tables: b.tables, type: b.type });
  const wageM = b.staff * WAGES[b.wage].cost * st.world.wageIdx;
  return `<div class="grid g2"><div class="card stack"><h2>Kadro</h2>
    <div class="row between"><span>Personel sayısı</span><div class="stepper"><button data-a="bstaff" data-v="-1" aria-label="Azalt">−</button><span>${b.staff}</span><button data-a="bstaff" data-v="1" aria-label="Artır">+</button></div></div>
    <span class="muted" style="font-size:12px">İşe alım 5.000 ₺. Çıkarmada yaklaşık ${fmt(WAGES[b.wage].cost * st.world.wageIdx * .6)} tazminat ve moral kaybı. Önerilen en az ${minS}.</span>
    <div><span class="lbl">Maaş seviyesi</span><div class="seg" style="margin-top:4px">${Object.keys(WAGES).map(k => `<button class="${b.wage === k ? 'on' : ''}" data-a="bwage" data-v="${k}">${WAGES[k].n}</button>`).join('')}</div></div>
    <dl class="kv"><dt>Aylık maaş + SGK</dt><dd>${fmt(wageM)}</dd><dt>Saatlik servis kapasitesi</dt><dd>${Math.round(K.staffCap(st, b))} müşteri</dd><dt>Bugün sırada bekleyip giden</dt><dd>${Math.round(b.today.queueLost)}</dd></dl>
    ${meter('Moral', b.moral, 100)}
    ${b.promoBoost >= st.day ? '<span class="pill ok">Promosyon dağıtıldı, moral yüksek</span>' : ''}${b.promoCut >= st.day ? '<span class="pill bad">Promosyon verilmedi, personel küs</span>' : ''}
  </div>
  <div class="card stack"><h2>Servis konsepti</h2><p class="muted" style="margin:0;font-size:12.5px">Değiştirmek 60.000 ₺ tutar ve şube bir gün kapanır.</p>
    <div class="seg">${Object.keys(CONCEPTS).map(c => `<button class="${b.concept === c ? 'on' : ''}" data-a="bconcept" data-v="${c}" ${cs.includes(c) ? '' : 'disabled'}>${CONCEPTS[c].n}</button>`).join('')}</div>
    ${ui.confirm && ui.confirm.k === 'concept' ? `<div class="hint">Konsept ${CONCEPTS[ui.confirm.v].n} olarak değişsin mi? <div class="row" style="margin-top:6px"><button class="btn sm pri" data-a="doconcept">Evet, değiştir</button><button class="btn sm" data-a="cancelconfirm">Vazgeç</button></div></div>` : ''}
  </div></div>`;
}
function bDukkan(b) {
  const bank = BANKS[b.bank]; const rate = (b.valor === '30' ? bank.pos30 : bank.pos0) - (b.posDisc || 0);
  const sp = K.salePrice(st, b); const early = st.day - b.contractStart < 365;
  return `<div class="grid g2">
  <div class="card stack"><h2>Dükkan</h2>
    <div><span class="lbl">Dekor</span><div class="seg" style="margin-top:4px">${Object.keys(DECOR).map(k => `<button class="${b.decor === k ? 'on' : ''}" data-a="bdecor" data-v="${k}" ${b.decor === k ? 'disabled' : ''}>${DECOR[k].n}${b.decor === k ? '' : ' · ' + fmtK(DECOR[k].m2 * b.area * .8)}</button>`).join('')}</div><span class="muted" style="font-size:12px">Tadilat sırasında şube 3 gün kapalı kalır.</span></div>
    <div><span class="lbl">Ekipman</span><div class="seg" style="margin-top:4px">${Object.keys(EQUIP).map(k => `<button class="${b.equip === k ? 'on' : ''}" data-a="bequip" data-v="${k}" ${b.equip === k ? 'disabled' : ''}>${EQUIP[k].n}${b.equip === k ? '' : ' · ' + fmtK(EQUIP[k].cost * .85)}</button>`).join('')}</div></div>
    ${ARCH[b.arch].kiosk ? '' : `<div class="row between"><span>Mutfak</span>${b.kitchen ? '<span class="pill ok">Var</span>' : '<button class="btn sm" data-a="bkitchen">Mutfak kur · 250.000 ₺</button>'}</div>`}
    ${b.hasFront ? `<div class="row between"><span>Ön alan (${b.frontTables} masa) ${b.flic ? '<span class="pill ok">Ruhsata işli</span>' : '<span class="pill warn">Ruhsatta yok · ' + fmt(b.aptFee) + '/ay</span>'}</span><button class="btn sm" data-a="bfront">${b.useFront ? 'Masaları içeri al' : 'Dış masaları kullan'}</button></div>` : ''}
    <dl class="kv"><dt>Sigara içilebilir alan</dt><dd>${b.smoke ? 'Var' : 'Yok'}</dd><dt>Aylık kira</dt><dd>${fmt(b.rent)}</dd>${b.ciro ? `<dt>Ciro payı</dt><dd>%${Math.round(b.ciro * 100)}</dd>` : ''}${b.aidat ? `<dt>Aidat</dt><dd>${fmt(b.aidat)}</dd>` : ''}<dt>Depozito</dt><dd>${fmt(b.deposit)}</dd><dt>Sözleşme başlangıcı</dt><dd>${K.dateLabel(b.contractStart)}</dd></dl>
  </div>
  <div class="card stack"><h2>POS</h2>
    <dl class="kv"><dt>Banka</dt><dd>${bank.n}</dd><dt>Valör</dt><dd>${b.valor === '30' ? '30 gün' : 'Blokesiz'}</dd><dt>Komisyon</dt><dd>%${(Math.max(.008, rate) * 100).toFixed(2)}</dd></dl>
    <div class="row"><button class="btn sm" data-a="postalk">Komisyon pazarlığı yap</button><button class="btn sm" data-a="bvalor">${b.valor === '30' ? 'Blokesize geç' : '30 gün valöre geç'}</button></div>
    <h2 style="margin-top:8px">Devren sat</h2>
    <p class="muted" style="margin:0;font-size:12.5px">Tahmini devir bedeli <span class="num">${fmt(sp)}</span>. ${early ? 'Sözleşmenin ilk yılında çıktığın için depozito iade edilmez.' : 'Depozito iade edilir.'}</p>
    ${ui.confirm && ui.confirm.k === 'sell' && ui.confirm.v === b.id ? `<div class="hint">${esc(b.name)} devredilsin mi? Bu işlem geri alınamaz.<div class="row" style="margin-top:6px"><button class="btn sm danger" data-a="dosell">Evet, devret</button><button class="btn sm" data-a="cancelconfirm">Vazgeç</button></div></div>` : `<div><button class="btn sm danger" data-a="sell">Şubeyi devret</button></div>`}
  </div></div>`;
}

/* ---------- finans ---------- */
function vFinance() {
  const reps = st.reports; const last = reps[reps.length - 1];
  const pend = st.pending.reduce((a, p) => a + p.amt, 0);
  const sel = ui.rep != null && reps[ui.rep] ? reps[ui.rep] : last;
  return `<div class="pagehead"><div><h1>Finans</h1><p>Ciro günlük kasaya girer. Kira, maaş, SGK, KDV ve vergi her ay sonunda ödenir.</p></div></div>
  <div class="grid g4" style="margin-bottom:12px">
    <div class="tile"><div class="lbl">Nakit</div><div class="v ${st.cash < 0 ? 'neg' : ''}">${fmt(st.cash)}</div><div class="s">Kredili mevduat limiti ${fmtK(K.kmhLimit(st))}</div></div>
    <div class="tile"><div class="lbl">Bekleyen valör</div><div class="v">${fmt(pend)}</div><div class="s">POS'ta bloke kartlı satışlar</div></div>
    <div class="tile"><div class="lbl">Bu ay ciro</div><div class="v">${fmtK(st.month.rev)}</div><div class="s">${st.month.cust.toLocaleString('tr-TR')} müşteri</div></div>
    <div class="tile"><div class="lbl">Geçen ay net</div><div class="v ${last ? (last.profit < 0 ? 'neg' : 'pos') : ''}">${last ? fmtK(last.profit) : '—'}</div><div class="s">${last ? last.label : 'İlk ay devam ediyor'}</div></div>
  </div>
  ${reps.length ? `<div class="grid g2"><div class="card"><h2>Aylık ciro ve net kâr</h2>${finChart(reps)}</div>
    <div class="card"><div class="row between" style="margin-bottom:8px"><h2 style="margin:0">Z raporu</h2><select id="repsel" data-a="repsel" aria-label="Ay seç">${reps.map((r, i) => `<option value="${i}" ${r === sel ? 'selected' : ''}>${r.label}</option>`).join('')}</select></div>${zReport(sel)}</div></div>
    <div class="card" style="margin-top:12px"><h2>Şube bazında ${sel.label}</h2><div class="tw"><table class="t"><thead><tr><th>Şube</th><th class="r">Ciro</th><th class="r">Müşteri</th><th class="r">Kaçan</th><th class="r">Net katkı</th></tr></thead><tbody>${sel.branches.map(x => `<tr><td>${esc(x.name)}</td><td class="r num">${fmt(x.rev)}</td><td class="r num">${Math.round(x.cust).toLocaleString('tr-TR')}</td><td class="r num">${Math.round(x.lost).toLocaleString('tr-TR')}</td><td class="r num ${x.profit < 0 ? 'neg' : 'pos'}">${fmt(x.profit)}</td></tr>`).join('')}</tbody></table></div><p class="muted" style="font-size:12px;margin:8px 0 0">Net katkı şirket giderleri (muhasebe, ajans, tedarik sözleşmeleri, kredi, vergi) dağıtılmadan önceki şube sonucudur.</p></div>`
  : '<div class="card"><p>İlk ay kapanışından sonra aylık raporların burada görünür.</p></div>'}`;
}
function finChart(reps) {
  const rs = reps.slice(-12); const W = 520, H = 200, pl = 48, pb = 22, pt = 10;
  const maxR = Math.max(1, ...rs.map(r => r.rev)); const minP = Math.min(0, ...rs.map(r => r.profit)); const top = Math.max(maxR, 1);
  const scale = v => pt + (H - pb - pt) * (1 - (v - minP) / (top - minP));
  const bw = (W - pl - 8) / rs.length;
  const z = scale(0);
  const ticks = [minP, 0, top / 2, top].filter((v, i, a) => a.indexOf(v) === i);
  return `<div class="tw"><svg class="chart" viewBox="0 0 ${W} ${H}" style="width:100%;min-width:360px">
    ${ticks.map(v => `<line class="grid" x1="${pl}" x2="${W - 4}" y1="${scale(v)}" y2="${scale(v)}"/><text x="${pl - 6}" y="${scale(v) + 3}" text-anchor="end">${fmtK(v).replace(' ₺', '')}</text>`).join('')}
    ${rs.map((r, i) => { const x = pl + i * bw + bw * .12; const w = bw * .76; const ry = scale(r.rev); const py = r.profit >= 0 ? scale(r.profit) : z; const ph = Math.abs(scale(r.profit) - z);
      return `<rect class="rv" x="${x}" y="${ry}" width="${w}" height="${z - ry}" rx="2"><title>${r.label}: ciro ${fmt(r.rev)}</title></rect><rect class="${r.profit >= 0 ? 'pp' : 'pn'}" x="${x + w * .25}" y="${py}" width="${w * .5}" height="${Math.max(1, ph)}" rx="1.5"><title>${r.label}: net ${fmt(r.profit)}</title></rect><text x="${x + w / 2}" y="${H - 6}" text-anchor="middle">${r.label.slice(0, 3)}</text>`; }).join('')}
  </svg></div><div class="row muted" style="font-size:12px;gap:14px"><span><span style="display:inline-block;width:10px;height:10px;background:var(--panel2);border:1px solid var(--line)"></span> Ciro</span><span><span style="display:inline-block;width:10px;height:10px;background:var(--good)"></span> Net kâr</span><span><span style="display:inline-block;width:10px;height:10px;background:var(--bad)"></span> Zarar</span></div>`;
}
function zReport(r) {
  const L = (n, v, neg) => `<div class="ln"><span>${n}</span><span>${neg && v ? '−' : ''}${fmt(v)}</span></div>`;
  return `<div class="receipt"><div class="rh"><b>${esc(st.name)}</b><span class="sub">Z RAPORU · ${r.label}</span></div>
    ${L('Ciro (KDV dahil)', r.rev)}${r.dividends ? L('Ortaklık temettüsü', r.dividends) : ''}
    ${L('Hammadde ve ambalaj', r.cogs, 1)}${L('Kira ve ciro payı', r.rent, 1)}${L('Maaş ve SGK', r.wages, 1)}${L('Fatura, aidat, ön alan', r.util, 1)}
    ${L('POS komisyonu', r.pos, 1)}${L('KDV', r.kdv, 1)}${r.supply ? L('Tedarik sözleşmeleri', r.supply, 1) : ''}${L('Pazarlama', r.mkt, 1)}${L('Diğer (yatırım, kurulum, muhasebe)', r.other, 1)}
    ${L('Gelir vergisi', r.tax, 1)}${r.partner ? L('Ortağın payı', r.partner, 1) : ''}
    <div class="ln tot"><span>Net</span><span class="${r.profit < 0 ? 'neg' : 'pos'}">${fmt(r.profit)}</span></div>
    ${r.loans ? `<div class="ln sub"><span>Kredi taksitleri (ödendi)</span><span>${fmt(r.loans)}</span></div>` : ''}
    <div class="ln sub"><span>Ay sonu nakit</span><span>${fmt(r.cashEnd)}</span></div>
    <div class="ln sub"><span>Müşteri / kaçan</span><span>${Math.round(r.cust).toLocaleString('tr-TR')} / ${Math.round(r.lost).toLocaleString('tr-TR')}</span></div></div>`;
}

/* ---------- banka ---------- */
function vBank() {
  const sc = st.bank.score; const offers = K.loanOffers(st); const pr = K.promoOffer(st);
  return `<div class="pagehead"><div><h1>Banka</h1><p>POS anlaşmaların, maaş promosyonu ve kredilerin. Düzenli ödeme kredi notunu yükseltir, eksi bakiye düşürür.</p></div></div>
  <div class="grid g3" style="margin-bottom:12px">
    <div class="tile"><div class="lbl">Kredi notu</div><div class="v">${Math.round(sc)}</div><div class="bar" style="margin-top:6px"><i style="width:${(sc - 300) / 16}%"></i></div><div class="s">${sc >= 1500 ? 'Çok iyi' : sc >= 1200 ? 'İyi' : sc >= 900 ? 'Orta' : 'Riskli'}</div></div>
    <div class="tile"><div class="lbl">Maaş bankası</div><div class="v" style="font-size:16px;font-family:var(--f-display)">${st.bank.payroll ? BANKS[st.bank.payroll].n : '—'}</div><div class="s">Kredi faizini etkiler</div></div>
    <div class="tile"><div class="lbl">Toplam aylık taksit</div><div class="v">${fmt(st.bank.loans.reduce((a, l) => a + l.pay, 0))}</div><div class="s">${st.bank.loans.length} aktif kredi</div></div>
  </div>
  <div class="grid g2">
    <div class="card"><h2>Kredi teklifleri</h2><div class="stack">${offers.map(o => `<div class="tier"><div class="row between"><b>${o.n}</b><span class="num">Aylık %${(o.r * 100).toFixed(2)} · ${o.n_} ay</span></div><span class="muted" style="font-size:12.5px">${esc(o.why)}</span>
      ${o.ok && o.lim > 0 ? `<div class="row"><select id="la-${o.id}" aria-label="Tutar">${[.25, .5, .75, 1].map(f => { const v = Math.round(o.lim * f / 1000) * 1000; return `<option value="${v}">${fmt(v)}</option>`; }).join('')}</select><button class="btn sm pri" data-a="loan" data-v="${o.id}">Krediyi kullan</button></div>` : `<span class="pill">Şu an kullanılamaz</span>`}</div>`).join('')}</div></div>
    <div class="stack">
      <div class="card"><h2>Maaş promosyonu</h2>${st.bank.promo ? `<p>${BANKS[st.bank.promo.bank].n} ile promosyon anlaşman ${K.dateLabel(st.bank.promo.until)} tarihine kadar sürüyor. Kişi başı ${fmt(st.bank.promo.per)}, ${st.bank.promo.distribute ? 'personele dağıtıldı' : 'şirkette tutuldu'}.</p>` : pr ? `<p class="muted" style="margin:0 0 8px;font-size:12.5px">${pr.staff} personelin için bankalar 3 yıllık maaş promosyonu teklif ediyor.</p>
        <table class="t"><thead><tr><th>Banka</th><th class="r">Kişi başı</th><th class="r">Toplam</th><th></th></tr></thead><tbody>${pr.offers.map(o => `<tr><td>${BANKS[o.bank].n}</td><td class="r num">${fmt(o.per)}</td><td class="r num">${fmtK(o.per * pr.staff)}</td><td class="r"><button class="btn sm" data-a="promo" data-v="${o.bank}" data-p="${o.per}" data-d="1">Personele dağıt</button> <button class="btn sm ghost" data-a="promo" data-v="${o.bank}" data-p="${o.per}" data-d="0">Şirkette tut</button></td></tr>`).join('')}</tbody></table>
        <p class="muted" style="font-size:12px;margin:8px 0 0">Dağıtırsan moral 6 ay yüksek kalır. Şirkette tutarsan nakit gelir ama personel küser.</p>` : `<p class="muted">Bankalar 10 personelin altındaki işletmelere promosyon teklif etmiyor. Şu an ${K.counts(st).staff} personelin var.</p>`}</div>
      <div class="card"><h2>Aktif krediler</h2>${st.bank.loans.length ? `<div class="tw"><table class="t"><thead><tr><th>Kredi</th><th class="r">Kalan anapara</th><th class="r">Taksit</th><th class="r">Kalan ay</th></tr></thead><tbody>${st.bank.loans.map(l => `<tr><td>${{ ihtiyac: 'İhtiyaç', kobi: 'KOBİ', yatirim: 'Yatırım', yapilandirma: 'Yapılandırma' }[l.type] || l.type}</td><td class="r num">${fmt(l.bal)}</td><td class="r num">${fmt(l.pay)}</td><td class="r num">${l.left}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Aktif kredin yok.</p>'}
        <p class="muted" style="font-size:12px;margin:8px 0 0">Nakit eksiye düşerse kredili mevduat (${fmtK(K.kmhLimit(st))} limit) devreye girer, günlük faiz işler ve kredi notun düşer.</p></div>
    </div>
  </div>`;
}

/* ---------- pazarlama ---------- */
function vMarketing() {
  const k = st.mkt; const aw = K.awareness(st);
  const open = st.branches.filter(b => b.status !== 'kapali');
  return `<div class="pagehead"><div><h1>Pazarlama</h1><p>Sosyal medya hesabın, ajansın, reklam kampanyaların ve influencer davetlerin. Bilinirlik tüm şubelerin trafiğini artırır.</p></div></div>
  <div class="grid g3" style="margin-bottom:12px">
    <div class="tile"><div class="lbl">Instagram takipçi</div><div class="v">${k.followers.toLocaleString('tr-TR')}</div><div class="s">@${esc(st.name.toLowerCase().replace(/[^a-z0-9çğıöşü]+/g, ''))}</div></div>
    <div class="tile"><div class="lbl">Marka bilinirliği</div><div class="v">${Math.round(aw)}/100</div><div class="bar" style="margin-top:6px"><i style="width:${aw}%"></i></div></div>
    <div class="tile"><div class="lbl">Ajans</div><div class="v" style="font-size:16px;font-family:var(--f-display)">${AGENCIES[k.agency].n}</div><div class="s">${k.agency !== 'none' ? 'Aylık ' + fmt(AGENCIES[k.agency].fee) + (st.day - k.agencySince > 30 ? ' · performans ' + (k.agencyQ >= 1.1 ? 'iyi' : k.agencyQ >= .85 ? 'orta' : 'zayıf') : ' · performans ilk aydan sonra belli olur') : 'İçerikleri kendin üretiyorsun'}</div></div>
  </div>
  <div class="grid g2">
    <div class="stack">
      <div class="card"><h2>Paylaşım yap</h2><p class="muted" style="margin:0 0 8px;font-size:12.5px">Günde bir paylaşım. Premium dekor mekan fotoğraflarını güçlendirir.</p>
        <div class="row">${[['urun', 'Yeni ürün'], ['kampanya', 'Kampanya'], ['mekan', 'Mekan fotoğrafı'], ['ekip', 'Ekip videosu']].map(([v, n]) => `<button class="btn sm" data-a="post" data-v="${v}" ${k.lastPost === st.day ? 'disabled' : ''}>${n}</button>`).join('')}</div></div>
      <div class="card"><h2>Ajans</h2><div class="stack">${Object.entries(AGENCIES).map(([id, a]) => `<div class="row between"><div><b style="font-weight:500">${a.n}</b><div class="muted" style="font-size:12px">${{ none: 'Masraf yok, büyüme yavaş.', freelancer: 'Düzenli içerik, yavaş takipçi artışı.', performans: 'Ücretli reklamların verimini artırır.', kreatif: 'Kalıcı marka bilinirliği, pahalı.' }[id]}</div></div><button class="btn sm ${k.agency === id ? 'pri' : ''}" data-a="agency" data-v="${id}" ${k.agency === id ? 'disabled' : ''}>${k.agency === id ? 'Aktif' : (a.fee ? fmtK(a.fee) + '/ay' : 'Seç')}</button></div>`).join('')}</div></div>
      <div class="card"><h2>Reklam kampanyası</h2>${open.length ? `<div class="stack">
        <label class="row between"><span>Hedef</span><select id="ctarget"><option value="all">Tüm şubeler</option>${open.map(b => `<option value="${b.id}">${esc(b.name)}</option>`).join('')}</select></label>
        <label class="row between"><span>Bütçe</span><select id="cbudget">${[25000, 75000, 200000, 500000].map(v => `<option value="${v}">${fmt(v)}</option>`).join('')}</select></label>
        <label class="row between"><span>Süre</span><select id="cdays"><option value="7">7 gün</option><option value="14">14 gün</option><option value="30">30 gün</option></select></label>
        <button class="btn pri" data-a="campaign">Kampanyayı başlat</button>
        <span class="muted" style="font-size:12px">Konum hedefli reklam. Arka arkaya kampanyalar reklam yorgunluğu yaratır ve verim düşer.</span></div>` : '<p class="muted">Kampanya için önce bir şube açmalısın.</p>'}
        ${k.campaigns.length ? `<div class="stack" style="margin-top:10px">${k.campaigns.map(c => `<div class="hint">${fmt(c.budget)} · ${K.dateLabel(c.until)} tarihine kadar · erişim ${c.reach.toLocaleString('tr-TR')} · tıklama ${c.clicks.toLocaleString('tr-TR')} · trafik +%${Math.round((c.mult - 1) * 100)}</div>`).join('')}</div>` : ''}</div>
    </div>
    <div class="card"><h2>Influencer davet et</h2><p class="muted" style="margin:0 0 8px;font-size:12.5px">Havuz her ay yenilenir. Kitlesi şubenin müşterisiyle uyuşursa etki büyür. Bazılarının takipçileri sahte olabilir.</p>
      <div class="stack">${k.inflPool.map(I => `<div class="tier"><div class="row between"><b>${esc(I.name)}</b><span class="pill">${I.tier}</span></div>
        <div class="row" style="font-size:12.5px;gap:14px"><span class="num">${I.followers.toLocaleString('tr-TR')} takipçi</span><span>Kitle: ${K.AUD_LABEL[I.aud]}</span><span class="num">${fmt(I.fee)}</span></div>
        ${I.used ? '<span class="pill">Bu ay iş birliği yapıldı</span>' : open.length ? `<div class="row"><select id="ib-${I.id}" aria-label="Şube">${open.map(b => `<option value="${b.id}">${esc(b.name)}</option>`).join('')}</select><button class="btn sm pri" data-a="infl" data-v="${I.id}">Davet et</button></div>` : '<span class="muted" style="font-size:12px">Önce şube aç.</span>'}</div>`).join('')}</div></div>
  </div>`;
}

/* ---------- tedarik ---------- */
function vSupply() {
  const c = K.counts(st);
  const line = (key, title, sub) => `<div class="card"><h2>${title}</h2><p class="muted" style="margin:0 0 10px;font-size:12.5px">${sub}</p><div class="grid g2">${SUPPLY[key].map((s, i) => {
    const cur = st.supply[key] === i; const can = c.open >= s.req; const past = st.supply[key] > i;
    return `<div class="tier ${cur ? 'cur' : ''}"><div class="row between"><b>${s.n}</b>${cur ? '<span class="pill acc">Kullanımda</span>' : ''}</div>
      <span class="muted" style="font-size:12.5px">${s.note}</span>
      <dl class="kv"><dt>Birim maliyet</dt><dd>%${Math.round(s.mult * 100)}</dd><dt>Kalite etkisi</dt><dd>+${s.q}</dd><dt>Kurulum</dt><dd>${s.setup ? fmtK(s.setup) : '—'}</dd><dt>Aylık sabit</dt><dd>${s.monthly ? fmtK(s.monthly) : '—'}</dd></dl>
      ${cur ? '' : `<button class="btn sm ${can ? 'pri' : ''}" data-a="supply" data-k="${key}" data-v="${i}" ${can ? '' : 'disabled'}>${!can ? s.req + ' açık şube gerekir' : past ? 'Bu kademeye dön' : 'Geçiş yap'}</button>`}</div>`; }).join('')}</div></div>`;
  return `<div class="pagehead"><div><h1>Tedarik</h1><p>Başta her şeyi dışarıdan alırsın. Şube sayın arttıkça büyük tedarikçilere, fason üretime ve sonunda kendi tesislerine geçebilirsin.</p></div></div>
  <div class="stack">${line('kahve', 'Kahve çekirdeği', 'Türk kahvesi, filtre, americano ve latte grubunun maliyetini ve kalitesini belirler.')}${line('tatli', 'Tatlı ve yiyecek', 'Cheesecake, brownie, tost, kahvaltı ve atıştırmalıkların kaynağı.')}</div>`;
}

/* ---------- şirket ---------- */
function vCompany() {
  const c = K.counts(st), rep = K.reputation(st);
  const steps = [
    ['Kafe', 'Oyun başı', true],
    ['Metro kiosk', '2 kafe', !!st.unlocked.metro],
    ['AVM kiosk ve AVM içi kafe', '3 kafe, itibar 30', !!st.unlocked.avm],
    ['Pub', '5 kafe. Okul yakınına açılamaz, alkol izni gerekir', !!st.unlocked.pub],
    ['Rooftop', 'En az bir pub, itibar 65, elitizmi 8+ semt', !!st.unlocked.rooftop],
    ['Başka kafelere ortaklık', '5 şube', c.all >= 5],
    ['Franchise', 'Sonraki sürümde', false],
    ['Halka arz', 'Sonraki sürümde', false]
  ];
  return `<div class="pagehead"><div><h1>${esc(st.name)}</h1><p>${c.all} şube · ${c.staff} personel · marka itibarı ${Math.round(rep)}/100 · ${K.STARTS[st.start].n} başlangıç</p></div></div>
  <div class="grid g2">
    <div class="card"><h2>Büyüme seviyeleri</h2><div class="ladder">${steps.map((s, i) => `<div class="step ${s[2] ? 'done' : ''}"><span class="ix">${i + 1}</span><div><b style="font-weight:500">${s[0]}</b><small>${s[1]}</small></div>${s[2] ? '<span class="pill ok">Açık</span>' : '<span class="pill">Kilitli</span>'}</div>`).join('')}</div></div>
    <div class="stack">
      <div class="card"><h2>Ortaklık fırsatları</h2>${c.all >= 5 ? (st.invest.offers.length ? st.invest.offers.map(o => `<div class="tier" style="margin-bottom:8px"><div class="row between"><b>${esc(o.name)}</b><span class="pill ${o.risk === 'Yüksek' ? 'warn' : ''}">Risk ${o.risk}</span></div><dl class="kv"><dt>Şirket değeri</dt><dd>${fmtK(o.val)}</dd><dt>Satılan hisse</dt><dd>%${Math.round(o.pct * 100)}</dd><dt>Ortalama aylık kâr</dt><dd>${fmtK(o.base)}</dd><dt>Fiyat</dt><dd>${fmt(o.price)}</dd></dl><button class="btn sm pri" data-a="stake" data-v="${o.id}">Hisse al</button></div>`).join('') : '<p class="muted">Bu ay yeni teklif yok.</p>') : '<p class="muted">5 şubeye ulaşınca başka kafelerin hisse satış teklifleri burada görünür.</p>'}
        ${st.invest.stakes.length ? `<h3 style="margin:10px 0 6px">Portföy</h3><table class="t"><tbody>${st.invest.stakes.map((s, i) => `<tr><td>${esc(s.name)} · %${Math.round(s.pct * 100)}</td><td class="r num">Son temettü ${fmtK(s.last)}</td><td class="r"><button class="btn sm" data-a="sellstake" data-v="${i}">Sat</button></td></tr>`).join('')}</tbody></table>` : ''}</div>
      <div class="card"><h2>Gelişmeler</h2><div class="feed">${st.log.slice(0, 14).map(l => `<div><time>${K.dateLabel(l.d).replace(/ \d{4}$/, '')} ${String(l.h).padStart(2, '0')}:00</time><span class="${l.k}">${esc(l.m)}</span></div>`).join('')}</div></div>
      <div class="card"><h2>Oyun</h2><p class="muted" style="margin:0 0 8px;font-size:12.5px">Oyun her gün sonunda bu cihaza kaydedilir.</p>
        ${ui.confirm && ui.confirm.k === 'reset' ? `<div class="hint">Mevcut oyun silinsin mi?<div class="row" style="margin-top:6px"><button class="btn sm danger" data-a="doreset">Evet, yeni oyun</button><button class="btn sm" data-a="cancelconfirm">Vazgeç</button></div></div>` : '<button class="btn sm danger" data-a="reset">Yeni oyuna başla</button>'}</div>
    </div>
  </div>`;
}

/* ---------- katmanlar: kurulum, olay, rapor, kriz ---------- */
function renderLayer() {
  const layer = $('#layer'); if (!layer) return;
  if (st.crisis) { layer.innerHTML = `<div class="overlay"><div class="sheet sm ev"><div class="kick">Nakit krizi</div><h2>Kredili mevduat limitin aşıldı</h2><p>Nakit ${fmt(st.cash)}. Banka ödemeleri durdurdu. Devam etmek için bir şube devretmen veya borcunu yapılandırman gerekiyor.</p>
    <div class="opts">${st.branches.map(b => `<button class="opt" data-a="crisissell" data-v="${b.id}"><b>${esc(b.name)} devret</b><small>Yaklaşık ${fmt(K.salePrice(st, b))}</small></button>`).join('')}
    ${!st.bank.restructured && st.bank.score >= 800 ? `<button class="opt" data-a="restructure"><b>Borcu yapılandır</b><small>36 ay vadeli yapılandırma kredisi, kredi notu 200 puan düşer. Bir kez kullanılabilir.</small></button>` : ''}
    <button class="opt" data-a="doreset"><b>İflas et, yeniden başla</b><small>Oyun sıfırlanır.</small></button></div></div></div>`; return; }
  if (ui.setup) { layer.innerHTML = `<div class="overlay">${setupSheet()}</div>`; return; }
  const ev = K.nextEvent(st);
  if (ev) {
    if (ev.k === 'rapor') { const r = st.reports[ev.r] || st.reports[st.reports.length - 1]; layer.innerHTML = `<div class="overlay"><div class="sheet sm"><div class="shh"><div><span class="lbl">Ay kapandı</span><h2>${r.label}</h2></div></div>${zReport(r)}<div class="row" style="margin-top:12px"><button class="btn pri" data-a="evok" data-v="0">Devam</button><button class="btn" data-a="evfin">Finansa git</button></div></div></div>`; return; }
    const c = K.eventCard(st, ev); if (!c) { st.queue.shift(); return renderLayer(); }
    layer.innerHTML = `<div class="overlay"><div class="sheet sm ev" role="dialog" aria-modal="true"><div class="kick">${esc(c.s)}</div><h2>${esc(c.t)}</h2><p>${esc(c.body)}</p><div class="opts">${c.opts.map((o, i) => `<button class="opt" data-a="evok" data-v="${i}"><b>${esc(o.n)}</b><small>${esc(o.d)}</small></button>`).join('')}</div></div></div>`;
    return;
  }
  layer.innerHTML = '';
}
function blocking() { return !!(st && (st.crisis || ui.setup || K.nextEvent(st))); }

/* ---------- etkileşim ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const a = el.dataset.a, v = el.dataset.v;
  if (el.tagName === 'INPUT' || el.tagName === 'SELECT') { if (a === 'toggle' || a === 'chk') return; return; }
  switch (a) {
    case 'startopt': ui.startOpt = el.dataset.k; renderStart(); return;
    case 'newgame': st = K.newGame({ name: ui.startName || 'Demli Kafe', start: ui.startOpt }); ui.view = 'map'; ui.sel = 'kartal'; shell(); render(); save(); return;
    case 'continue': st = loadSave(); if (!st) return; st.ctx = st.ctx || {}; ui.view = 'map'; shell(); render(); return;
    case 'rotateok': ui.rotateOk = true; $('#rotate').classList.remove('show'); return;
  }
  if (!st) return;
  const b = st.branches.find(x => x.id === ui.branch);
  switch (a) {
    case 'nav': ui.view = v; ui.confirm = null; if (v !== 'map') ui._sideScroll = 0; break;
    case 'speed': if (+v === 0) st.paused = true; else { st.paused = false; st.speed = +v; } renderTop(); return;
    case 'sel': ui.sel = v || null; ui._sideScroll = 0; break;
    case 'type': ui.type = v; break;
    case 'refreshL': if (st.cash < 5000) return toast('Nakit yetersiz.'); K.refreshListings(st, ui.sel, ui.type, 5000); toast('Yeni ilanlar listelendi.'); break;
    case 'inspect': { const L = K.getListings(st, ui.sel, ui.type).find(x => x.id === v); if (L) { K.inspectListing(st, L); toast('Dükkan incelendi.'); } break; }
    case 'rent': { const L = K.getListings(st, ui.sel, ui.type).find(x => x.id === v); if (L) { ui.setup = { L, ch: K.defaultChoice(st, L) }; ui.setup.ch.name = (DISTRICTS[L.did].n + (L.type === 'kafe' ? '' : ' ' + TYPES[L.type].n)).trim(); } break; }
    case 'closesetup': ui.setup = null; break;
    case 'ch': { const ch = ui.setup.ch; ch[el.dataset.k] = v; if (el.dataset.k === 'concept') ch.staff = Math.max(ch.staff, K.minStaff(v, ui.setup.L.tables)); break; }
    case 'staff': ui.setup.ch.staff = Math.max(1, Math.min(40, ui.setup.ch.staff + +v)); break;
    case 'confirmopen': { const nm = $('#bname'); if (nm) ui.setup.ch.name = nm.value || ui.setup.ch.name; const r = K.openBranch(st, ui.setup.L, ui.setup.ch); if (r.ok) { ui.setup = null; ui.branch = r.b.id; ui.view = 'branch'; ui.btab = 'ozet'; toast(r.b.status === 'acik' ? r.b.name + ' açıldı.' : r.b.name + ' kiralandı, ruhsatlar bekleniyor.'); save(); } else toast(r.msg); break; }
    case 'branch': ui.branch = +v; ui.view = 'branch'; ui.btab = 'ozet'; ui.confirm = null; break;
    case 'btab': ui.btab = v; ui.confirm = null; break;
    case 'raise': K.raiseAll(st, b, +v); toast('Fiyatlar %' + Math.round(+v * 100) + ' artırıldı.'); break;
    case 'bstaff': { const r = K.changeStaff(st, b, +v); if (!r.ok) toast(r.msg); break; }
    case 'bwage': b.wage = v; break;
    case 'bconcept': if (v !== b.concept) ui.confirm = { k: 'concept', v }; break;
    case 'doconcept': { const cv = ui.confirm && ui.confirm.v; ui.confirm = null; return res(K.changeConcept(st, b, cv)); }
    case 'cancelconfirm': ui.confirm = null; break;
    case 'bdecor': return res(K.upgradeDecor(st, b, v));
    case 'bequip': return res(K.upgradeEquip(st, b, v));
    case 'bkitchen': return res(K.addKitchen(st, b));
    case 'bfront': K.toggleFront(st, b); break;
    case 'postalk': return res(K.posTalk(st, b));
    case 'bvalor': b.valor = b.valor === '30' ? '0' : '30'; toast(b.valor === '30' ? 'Kartlı satışlar artık 30 gün valörlü.' : 'Blokesiz POS\'a geçildi.'); break;
    case 'sell': ui.confirm = { k: 'sell', v: b.id }; break;
    case 'dosell': { const p = K.sellBranch(st, b); ui.confirm = null; ui.view = 'branches'; toast('Şube ' + fmt(p) + ' karşılığında devredildi.'); save(); break; }
    case 'loan': { const o = K.loanOffers(st).find(x => x.id === v); const amt = +($('#la-' + v) || {}).value; if (o && amt > 0) { K.addLoan(st, v, amt, o.r, o.n_); toast(fmt(amt) + ' hesabına geçti.'); save(); } break; }
    case 'promo': K.takePromo(st, v, +el.dataset.p, el.dataset.d === '1'); toast(el.dataset.d === '1' ? 'Promosyon personele dağıtıldı.' : 'Promosyon şirket kasasına alındı.'); break;
    case 'post': return res(K.postContent(st, v));
    case 'agency': K.setAgency(st, v); toast(v === 'none' ? 'Ajansla çalışma bitti.' : AGENCIES[v].n + ' ile anlaşıldı.'); break;
    case 'campaign': return res(K.startCampaign(st, $('#ctarget').value, +$('#cbudget').value, +$('#cdays').value));
    case 'infl': return res(K.inviteInfluencer(st, v, +$('#ib-' + v).value));
    case 'supply': return res(K.upgradeSupply(st, el.dataset.k, +v));
    case 'stake': return res(K.buyStake(st, v));
    case 'sellstake': K.sellStake(st, +v); break;
    case 'reset': ui.confirm = { k: 'reset' }; break;
    case 'doreset': clearSave(); st = null; ui.confirm = null; ui.setup = null; renderStart(); return;
    case 'evok': { const ev = K.nextEvent(st); if (ev) K.resolveEvent(st, ev, +v); save(); break; }
    case 'evfin': { const ev = K.nextEvent(st); if (ev) K.resolveEvent(st, ev, 0); ui.view = 'finance'; ui.rep = null; break; }
    case 'crisissell': { const bb = st.branches.find(x => x.id === +v); if (bb) K.sellBranch(st, bb); if (st.cash >= -K.kmhLimit(st)) st.crisis = false; break; }
    case 'restructure': if (K.restructure(st)) toast('Borç yapılandırıldı.'); break;
    default: return;
  }
  render();
});
document.addEventListener('change', e => {
  const el = e.target; const a = el.dataset && el.dataset.a; if (!a || !st) return;
  const b = st.branches.find(x => x.id === ui.branch);
  if (a === 'price' && b) { const v = +el.value; if (v > 0) { K.setPrice(st, b, el.dataset.v, v); save(); } el.blur(); render(); }
  if (a === 'toggle' && b) { K.toggleItem(st, b, el.dataset.v); render(); }
  if (a === 'chk' && ui.setup) { ui.setup.ch[el.dataset.k] = el.checked; render(); }
  if (a === 'repsel') { ui.rep = +el.value; render(); }
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('g.pin')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  if (e.key === 'Escape' && ui.setup) { ui.setup = null; render(); }
});

/* ---------- döngü ---------- */
let acc = 0, last = performance.now();
function loop(now) {
  const dt = Math.min(1000, now - last); last = now;
  if (st && !st.paused && !blocking() && !st.over) {
    acc += dt * st.speed;
    let ticked = false, guard = 0;
    while (acc >= MS_PER_HOUR && guard++ < 50) {
      acc -= MS_PER_HOUR; const day = st.day;
      K.tickHour(st); ticked = true;
      if (st.day !== day) save();
      if (blocking()) { acc = 0; break; }
    }
    if (ticked) liveRender();
  }
  requestAnimationFrame(loop);
}

/* ---------- başlat ---------- */
const saved = loadSave();
if (saved && saved.v === 1) { ui.startName = saved.name; }
renderStart();
requestAnimationFrame(loop);
})();
