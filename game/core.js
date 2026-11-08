/* Kafe Zinciri Simülatörü — simülasyon çekirdeği (arayüzden bağımsız) */
(function (root) {
'use strict';

/* ---------- yardımcılar ---------- */
function rnd(st) {
  let t = (st.seed = (st.seed + 0x6D2B79F5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rr = (st, a, b) => a + (b - a) * rnd(st);
const ri = (st, a, b) => Math.floor(rr(st, a, b + 1));
const pick = (st, arr) => arr[Math.floor(rnd(st) * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r500 = v => Math.round(v / 500) * 500;
const r1000 = v => Math.round(v / 1000) * 1000;
function H(spec) { const a = new Array(24).fill(0); for (const [s, e, v] of spec) for (let h = s; h < e; h++) a[h] = Math.max(a[h], v); return a; }

/* ---------- veri ---------- */
const DISTRICTS = {
  esenyurt:   { n: 'Esenyurt',     side: 'Avrupa',  x: 9,  y: 30, elit: 2,  rent: 350,  traffic: 1000, stu: .40, off: .18, tour: 0,   comp: .45, strict: .35, req: {} },
  kartal:     { n: 'Kartal',       side: 'Anadolu', x: 78, y: 63, elit: 4,  rent: 500,  traffic: 900,  stu: .35, off: .28, tour: 0,   comp: .40, strict: .40, req: {} },
  pendik:     { n: 'Pendik',       side: 'Anadolu', x: 90, y: 70, elit: 3,  rent: 450,  traffic: 850,  stu: .35, off: .25, tour: 0,   comp: .35, strict: .35, req: {} },
  maltepe:    { n: 'Maltepe',      side: 'Anadolu', x: 68, y: 56, elit: 5,  rent: 700,  traffic: 950,  stu: .40, off: .32, tour: 0,   comp: .50, strict: .45, req: { rep: 20 } },
  uskudar:    { n: 'Üsküdar',      side: 'Anadolu', x: 55, y: 32, elit: 6,  rent: 1000, traffic: 1100, stu: .30, off: .35, tour: .08, comp: .55, strict: .50, req: { rep: 30, branches: 1 } },
  atasehir:   { n: 'Ataşehir',     side: 'Anadolu', x: 66, y: 40, elit: 6,  rent: 1100, traffic: 1000, stu: .18, off: .60, tour: 0,   comp: .60, strict: .50, req: { rep: 35, branches: 1 } },
  mecidiyekoy:{ n: 'Şişli',        side: 'Avrupa',  x: 38, y: 24, elit: 6,  rent: 1700, traffic: 1300, stu: .22, off: .70, tour: .03, comp: .70, strict: .55, req: { rep: 40, branches: 2 } },
  bakirkoy:   { n: 'Bakırköy',     side: 'Avrupa',  x: 22, y: 52, elit: 7,  rent: 2000, traffic: 1200, stu: .25, off: .42, tour: .05, comp: .65, strict: .55, req: { rep: 45, branches: 2 } },
  kadikoy:    { n: 'Kadıköy',      side: 'Anadolu', x: 54, y: 46, elit: 8,  rent: 2400, traffic: 1250, stu: .35, off: .32, tour: .12, comp: .80, strict: .60, req: { rep: 55, branches: 3 } },
  besiktas:   { n: 'Beşiktaş',     side: 'Avrupa',  x: 46, y: 28, elit: 8,  rent: 2400, traffic: 1400, stu: .42, off: .42, tour: .15, comp: .80, strict: .60, req: { rep: 55, branches: 3 } },
  bagdat:     { n: 'Bağdat Caddesi', side: 'Anadolu', x: 62, y: 52, elit: 9, rent: 4500, traffic: 1250, stu: .12, off: .32, tour: .10, comp: .80, strict: .65, req: { rep: 70, branches: 4, cash: 5000000 } },
  nisantasi:  { n: 'Nişantaşı',    side: 'Avrupa',  x: 41, y: 31, elit: 10, rent: 5500, traffic: 1300, stu: .08, off: .48, tour: .20, comp: .85, strict: .70, req: { rep: 75, branches: 5, cash: 8000000 } },
  adalar:     { n: 'Adalar',       side: 'Anadolu', x: 0, y: 0, elit: 7, rent: 1500, traffic: 780, stu: .05, off: .05, tour: .45, comp: .35, strict: .55, island: true, req: { rep: 30, branches: 1 } },
  bebek:      { n: 'Bebek',        side: 'Avrupa',  x: 45, y: 15, elit: 10, rent: 5000, traffic: 900,  stu: .08, off: .18, tour: .40, comp: .70, strict: .70, req: { rep: 80, branches: 6, cash: 10000000 } }
};


/* ---------- 81 il ---------- */
// [plaka, ad, enlem, boylam, kademe(m=metropol,b=büyük,k=küçük), öğrenci+, turist+]
const PROVINCES = [
 ['01','Adana',37.0,35.32,'b',.05,0],['02','Adıyaman',37.76,38.28,'k',0,0],['03','Afyonkarahisar',38.76,30.54,'k',.05,.03],['04','Ağrı',39.72,43.05,'k',0,0],['05','Amasya',40.65,35.83,'k',0,.05],
 ['06','Ankara',39.93,32.86,'m',.15,0],['07','Antalya',36.9,30.7,'b',0,.3],['08','Artvin',41.18,41.82,'k',0,.05],['09','Aydın',37.85,27.85,'k',0,.12],['10','Balıkesir',39.65,27.88,'b',0,.08],
 ['11','Bilecik',40.14,29.98,'k',.05,0],['12','Bingöl',38.88,40.5,'k',0,0],['13','Bitlis',38.4,42.11,'k',0,0],['14','Bolu',40.73,31.61,'k',.08,.06],['15','Burdur',37.72,30.29,'k',.05,0],
 ['16','Bursa',40.19,29.06,'b',.05,.04],['17','Çanakkale',40.15,26.41,'k',.15,.12],['18','Çankırı',40.6,33.62,'k',0,0],['19','Çorum',40.55,34.95,'k',0,0],['20','Denizli',37.78,29.09,'b',.05,.04],
 ['21','Diyarbakır',37.91,40.24,'b',.05,.03],['22','Edirne',41.68,26.56,'k',.12,.06],['23','Elazığ',38.67,39.22,'k',.05,0],['24','Erzincan',39.75,39.49,'k',0,0],['25','Erzurum',39.9,41.27,'b',.12,.04],
 ['26','Eskişehir',39.78,30.52,'b',.25,.03],['27','Gaziantep',37.07,37.38,'b',.03,.04],['28','Giresun',40.91,38.39,'k',0,.03],['29','Gümüşhane',40.46,39.48,'k',0,0],['30','Hakkari',37.57,43.74,'k',0,0],
 ['31','Hatay',36.2,36.16,'b',0,.05],['32','Isparta',37.76,30.55,'k',.18,0],['33','Mersin',36.8,34.63,'b',.04,.05],['34','İstanbul',41.01,28.98,'m',0,0],['35','İzmir',38.42,27.14,'m',.1,.1],
 ['36','Kars',40.6,43.1,'k',0,.04],['37','Kastamonu',41.38,33.78,'k',0,.02],['38','Kayseri',38.73,35.48,'b',.06,.02],['39','Kırklareli',41.73,27.22,'k',0,0],['40','Kırşehir',39.15,34.17,'k',0,0],
 ['41','Kocaeli',40.77,29.92,'b',.03,0],['42','Konya',37.87,32.48,'b',.1,.02],['43','Kütahya',39.42,29.98,'k',.08,0],['44','Malatya',38.35,38.31,'b',.05,0],['45','Manisa',38.61,27.43,'b',0,0],
 ['46','Kahramanmaraş',37.58,36.94,'k',0,0],['47','Mardin',37.31,40.74,'k',0,.12],['48','Muğla',37.22,28.36,'b',0,.4],['49','Muş',38.75,41.5,'k',0,0],['50','Nevşehir',38.62,34.71,'k',0,.35],
 ['51','Niğde',37.97,34.68,'k',0,0],['52','Ordu',40.98,37.88,'k',0,.03],['53','Rize',41.02,40.52,'k',0,.05],['54','Sakarya',40.78,30.4,'b',.06,0],['55','Samsun',41.29,36.33,'b',.06,.02],
 ['56','Siirt',37.93,41.94,'k',0,0],['57','Sinop',42.03,35.15,'k',0,.08],['58','Sivas',39.75,37.02,'k',.05,0],['59','Tekirdağ',40.98,27.51,'b',0,.03],['60','Tokat',40.31,36.55,'k',0,0],
 ['61','Trabzon',41.0,39.72,'b',.06,.12],['62','Tunceli',39.11,39.55,'k',0,.03],['63','Şanlıurfa',37.16,38.79,'b',0,.08],['64','Uşak',38.68,29.4,'k',0,0],['65','Van',38.49,43.38,'k',.05,.03],
 ['66','Yozgat',39.82,34.81,'k',0,0],['67','Zonguldak',41.45,31.79,'k',0,0],['68','Aksaray',38.37,34.03,'k',0,0],['69','Bayburt',40.26,40.23,'k',0,0],['70','Karaman',37.18,33.22,'k',0,0],
 ['71','Kırıkkale',39.85,33.51,'k',.04,0],['72','Batman',37.88,41.13,'k',0,0],['73','Şırnak',37.52,42.46,'k',0,0],['74','Bartın',41.63,32.34,'k',0,.04],['75','Ardahan',41.11,42.7,'k',0,0],
 ['76','Iğdır',39.92,44.04,'k',0,0],['77','Yalova',40.65,29.27,'k',0,.06],['78','Karabük',41.2,32.62,'k',.1,.04],['79','Kilis',36.72,37.12,'k',0,0],['80','Osmaniye',37.07,36.25,'k',0,0],['81','Düzce',40.84,31.16,'k',.04,0]
].map(a => ({ code: a[0], n: a[1], lat: a[2], lon: a[3], tier: a[4], stu: a[5], tour: a[6] }));
const PROV = {}; PROVINCES.forEach(p => { PROV[p.code] = p; });
// büyükşehir semtleri
function provDistricts(code) { return Object.keys(DISTRICTS).filter(id => DISTRICTS[id].p === code); }

for (const id in DISTRICTS) DISTRICTS[id].p = '34';
const LUX = { '48': { Bodrum: 'luks', Marmaris: 'premium', Fethiye: 'premium', Datça: 'premium', Menteşe: 'normal' }, '35': { Çeşme: 'luks', Urla: 'premium', Konak: 'premium', Karşıyaka: 'premium', Bornova: 'premium', Narlıdere: 'premium', Balçova: 'premium', Bayraklı: 'premium' }, '06': { Çankaya: 'luks', Yenimahalle: 'premium', Gölbaşı: 'premium', Etimesgut: 'premium' }, '07': { Muratpaşa: 'premium', Konyaaltı: 'premium', Kaş: 'premium', Kemer: 'premium', Alanya: 'premium' }, '16': { Nilüfer: 'premium' }, '26': { Tepebaşı: 'premium', Odunpazarı: 'premium' }, '41': { İzmit: 'premium' }, '42': { Selçuklu: 'premium' }, '38': { Talas: 'premium', Melikgazi: 'premium' }, '27': { Şehitkamil: 'premium' }, '01': { Çukurova: 'premium' }, '55': { Atakum: 'premium' }, '61': { Ortahisar: 'premium' }, '33': { Mezitli: 'premium', Yenişehir: 'premium' }, '09': { Kuşadası: 'premium', Didim: 'premium' }, '10': { Ayvalık: 'premium' }, '17': { Bozcaada: 'luks', Gökçeada: 'premium' }, '20': { Pamukkale: 'premium' }, '54': { Serdivan: 'premium' } };
const PROFILE = { luks: { n: 'Lüks', elit: 9, rentM: 2.4, trafM: 1.05, req: { rep: 55, branches: 3 } }, premium: { n: 'Premium', elit: 7, rentM: 1.5, trafM: 1.05, req: {} }, normal: { n: 'Normal', elit: 4, rentM: 1, trafM: 1, req: {} }, dusuk: { n: 'Düşük', elit: 2, rentM: .55, trafM: .6, req: {} } };
function profileOf(d) { return d.prof || (d.elit >= 9 ? 'luks' : d.elit >= 6 ? 'premium' : d.elit >= 3 ? 'normal' : 'dusuk'); }
// şehir ölçeği: İstanbul > Ankara/İzmir > büyükşehir > il
const METRO_P = new Set(['34', '06', '35', '16', '01', '27', '41', '42', '38', '26']);
const COAST_P = new Set(['01', '07', '08', '09', '10', '16', '17', '22', '28', '31', '33', '34', '35', '37', '39', '41', '48', '52', '53', '54', '55', '57', '59', '61', '67', '74', '77', '81']);
function cityScale(code) { if (code === '34') return { price: 1, rent: 1, traf: 1 }; if (code === '06' || code === '35') return { price: .93, rent: .68, traf: .9 }; const P = PROV[code]; if (P && P.tier === 'm') return { price: .9, rent: .55, traf: .82 }; if (P && P.tier === 'b') return { price: .84, rent: .36, traf: .7 }; return { price: .78, rent: .26, traf: .6 }; }
// Ramazan: Diyanet takvimine göre 2027'de 8 Şubat başlar (Bayram 9-11 Mart); hicri yıl ~354,37 gün öne kayar
const RAM0 = Date.UTC(2027, 1, 8), HIJRI = 354.367;
function ramadanInfo(day) {
  const t = START + day * 864e5; const k = Math.floor((t - RAM0) / (HIJRI * 864e5));
  for (const kk of [k, k + 1]) { const s0 = RAM0 + Math.round(kk * HIJRI) * 864e5; const dS = Math.round((s0 - START) / 864e5); if (day >= dS && day < dS + 30) return { phase: 'ramazan', start: dS, d: day - dS }; if (day >= dS + 30 && day < dS + 33) return { phase: 'bayram', start: dS, d: day - dS - 30 }; if (day < dS) return { phase: 'once', start: dS, left: dS - day }; }
  return { phase: 'once', start: day + 365, left: 365 };
}
// muhafazakârlık endeksi (0-1): KONDA 2022'de yetişkinlerin %67'si düzenli oruç tutuyor; Orta/Doğu Anadolu ve İç Anadolu'da daha yüksek, Ege, Trakya ve büyükşehirlerin merkez semtlerinde daha düşük
const CONS_P = { '42': .92, '38': .85, '58': .82, '66': .85, '19': .8, '25': .85, '69': .88, '46': .82, '63': .9, '44': .8, '68': .82, '70': .85, '51': .78, '29': .8, '12': .85, '13': .85, '49': .9, '56': .88, '04': .82, '24': .75, '40': .7, '71': .7, '61': .7, '53': .8, '60': .78, '02': .8, '27': .78, '21': .78, '72': .82, '47': .78, '65': .82, '30': .82, '73': .8, '36': .72, '75': .7, '76': .7, '43': .68, '64': .65, '05': .7, '18': .72, '50': .78, '57': .68, '14': .7, '81': .75, '79': .75, '23': .7, '80': .75, '31': .6, '03': .65, '15': .65, '32': .65, '26': .45, '54': .72, '55': .65, '28': .65, '08': .62, '37': .68, '74': .62, '78': .65, '67': .58, '11': .62, '52': .68, '01': .6, '33': .5, '20': .52, '41': .62, '16': .58, '06': .55, '34': .5, '07': .4, '10': .45, '45': .5, '77': .55, '39': .3, '59': .38, '22': .3, '17': .3, '09': .3, '48': .28, '35': .25, '62': .3 };
const CONS_IST = { 'Fatih': .8, 'Üsküdar': .65, 'Sultanbeyli': .85, 'Bağcılar': .78, 'Esenler': .8, 'Başakşehir': .75, 'Sultangazi': .8, 'Arnavutköy': .75, 'Eyüpsultan': .7, 'Sancaktepe': .72, 'Pendik': .62, 'Ümraniye': .62, 'Kağıthane': .6, 'Gaziosmanpaşa': .68, 'Zeytinburnu': .65, 'Bayrampaşa': .62, 'Güngören': .62, 'Esenyurt': .62, 'Küçükçekmece': .55, 'Beykoz': .55, 'Çekmeköy': .6, 'Kartal': .5, 'Maltepe': .45, 'Tuzla': .52, 'Avcılar': .45, 'Büyükçekmece': .42, 'Beylikdüzü': .4, 'Silivri': .45, 'Çatalca': .5, 'Şile': .45, 'Bahçelievler': .5, 'Ataşehir': .38, 'Beyoğlu': .35, 'Bakırköy': .25, 'Sarıyer': .3, 'Şişli': .3, 'Kadıköy': .18, 'Beşiktaş': .18, 'Adalar': .2 };
function consOf(d) {
  if (d.cons != null) return d.cons;
  let c = d.p === '34' ? (CONS_IST[d.n] != null ? CONS_IST[d.n] : .5) : (CONS_P[d.p] != null ? CONS_P[d.p] : .65);
  if (d.p !== '34') { if (d.prof === 'luks') c -= .25; else if (d.prof === 'premium') c -= .1; if (d.stu > .4) c -= .08; }
  if (d.spot) c = .12; // Bağdat Cad., Nişantaşı, Bebek
  return d.cons = clamp(c, .08, .95);
}
function kurbanInfo(day) {
  const t = START + day * 864e5; const k = Math.floor((t - RAM0) / (HIJRI * 864e5));
  for (const kk of [k - 1, k, k + 1]) { const s0 = Math.round((RAM0 + Math.round(kk * HIJRI) * 864e5 - START) / 864e5) + 97; if (day >= s0 - 2 && day <= s0 + 4) return { phase: 'kurban', start: s0, d: day - s0 }; if (day < s0 - 2) return { phase: 'once', start: s0, left: s0 - day }; }
  return { phase: 'once', start: day + 354, left: 354 };
}
// bayramda büyükşehirden memlekete göç: İstanbul, Ankara, İzmir boşalır; Anadolu'daki memleket illeri ve tatil kıyıları dolar
const KURBAN_P = { '34': -.5, '06': -.45, '35': -.32, '41': -.38, '16': -.3, '26': -.35, '42': -.12, '01': -.15, '27': -.12, '38': -.15, '33': -.1, '55': -.05, '07': .22, '48': .3, '09': .18, '10': .2, '17': .2, '22': .05, '59': .08, '31': -.05, '21': -.05 };
function kurbanMult(st, b, h) {
  const K2 = st._kur; if (st._noRam || !K2 || K2.phase !== 'kurban') return 1;
  const d = DISTRICTS[b.d], P = PROV[d.p];
  let m = KURBAN_P[d.p] != null ? KURBAN_P[d.p] : P.tier === 'k' ? .14 : .06; // memlekete dönenler
  if (m < 0) m -= d.stu * .25 + d.off * .2; // öğrenciler ve ofisler boşalır
  const k = K2.d < 0 ? .5 : K2.d <= 2 ? 1 : .6; // arife ve son günlerde etki daha az
  let f = 1 + m * k;
  if (K2.d === 0 && h < 13) f *= .55; // bayramın ilk sabahı: namaz ve kurban
  if (b.type === 'metro' && m < 0) f *= .85;
  return Math.max(.2, f);
}
function ramadanMult(st, b, h) {
  const R = st._ram; if (st._noRam || !R || (R.phase !== 'ramazan' && R.phase !== 'bayram')) return 1;
  const c = consOf(DISTRICTS[b.d]); const tur = DISTRICTS[b.d].tour || 0;
  if (R.phase === 'bayram') return 1 + c * .12 - (b.type === 'pub' ? .1 : 0);
  if (b.type === 'pub') return 1 - c * .35;
  const fast = c * .9 * (1 - Math.min(.6, tur));
  if (h < 18) return Math.max(.15, 1 - fast * .85);
  if (h < 19) return Math.max(.3, 1 - fast * .6);
  return 1 + fast * .45; // iftar sonrası çay, kahve, tatlı
}
const PJ = (lat, lon) => [Math.round((lon - 25.6) * Math.cos(39 * Math.PI / 180) * 1200), Math.round((42.2 - lat) * 1200)];
// İstanbul: elle ayarlanmış semtler ilçe sınırlarına bağlanır; Bağdat Cad., Nişantaşı, Bebek ilçe içi nokta semtlerdir
const IST_ID = { Esenyurt: 'esenyurt', Kartal: 'kartal', Pendik: 'pendik', Maltepe: 'maltepe', Üsküdar: 'uskudar', Ataşehir: 'atasehir', Şişli: 'mecidiyekoy', Bakırköy: 'bakirkoy', Kadıköy: 'kadikoy', Beşiktaş: 'besiktas', Adalar: 'adalar' };
const SPOTS = { bagdat: ['kadikoy', 40.966, 29.07], nisantasi: ['mecidiyekoy', 41.051, 28.994], bebek: ['besiktas', 41.077, 29.043] };
LUX['34'] = { Sarıyer: 'luks', Beykoz: 'premium', Beyoğlu: 'premium', Fatih: 'premium', Ümraniye: 'normal', Beylikdüzü: 'normal', Başakşehir: 'normal', Kağıthane: 'normal', Eyüpsultan: 'normal', Zeytinburnu: 'normal', Bahçelievler: 'normal', Küçükçekmece: 'normal', Avcılar: 'normal', Büyükçekmece: 'normal', Çekmeköy: 'normal', Tuzla: 'normal', Şile: 'normal', Silivri: 'normal', Bayrampaşa: 'normal' };
if (typeof TRD !== 'undefined') for (const P of PROVINCES) {
  if (!TRD.ds[P.code]) continue; const ist = P.code === '34';
  const CS = cityScale(P.code); const base = ist ? { rent: 600, traffic: 1050, off: .4, comp: .55, strict: .5 } : { rent: Math.round(820 * CS.rent), traffic: Math.round(1150 * CS.traf), off: P.tier === 'k' ? .2 : P.tier === 'b' ? .3 : .4, comp: P.tier === 'k' ? .25 : P.tier === 'b' ? .38 : .5, strict: P.tier === 'k' ? .3 : .42 };
  TRD.ds[P.code].forEach((row, i) => {
    const [n, x, y, central, , slug] = row;
    if (ist && IST_ID[n]) { const d = DISTRICTS[IST_ID[n]]; Object.assign(d, { mx: x, my: y, g: i, central: !!central, prof: profileOf(d) }); return; }
    const lx = (LUX[P.code] || {})[n];
    const prof = lx || (central ? 'normal' : 'dusuk'); const PF = PROFILE[prof];
    DISTRICTS['d' + P.code + '_' + slug] = { n, p: P.code, mx: x, my: y, g: i, central: !!central, prof, elit: PF.elit, rent: Math.round(base.rent * PF.rentM * (1 + P.tour * (prof === 'dusuk' ? .2 : 1))), traffic: Math.round(base.traffic * PF.trafM * (central ? 1 : .8) * (1 + P.tour * .4)), stu: Math.min(.6, (central ? .28 : .16) + P.stu), off: central ? base.off : base.off * .5, tour: P.tour * (prof === 'luks' ? 2 : prof === 'premium' ? 1.3 : .6), comp: base.comp * (central ? 1 : .6), strict: base.strict, req: PF.req };
  });
}
for (const id in SPOTS) { const [par, lat, lon] = SPOTS[id]; const [x, y] = PJ(lat, lon); Object.assign(DISTRICTS[id], { mx: x, my: y, spot: par }); }
for (const id in DISTRICTS) if (DISTRICTS[id].p === '34') DISTRICTS[id].prof = profileOf(DISTRICTS[id]);

const SEGS = {
  ogrenci:   { n: 'Öğrenci',        items: 1.1, sit: 2.6, ta: .2,  tol: .80, party: 1.9, wkd: 1.15, h: H([[8,11,.25],[11,13,.55],[13,20,1],[20,22,.7],[22,24,.3]]), fav: ['cay','filtre','latte','soguklatte','limonata','brownie','tost','mocktail'] },
  ofis:      { n: 'Ofis çalışanı',  items: 1.2, sit: .5,  ta: .65, tol: 1.05, party: 1.4, wkd: .25, h: H([[6,7,.4],[7,8,.7],[8,10,1],[10,12,.35],[12,14,.9],[14,17,.35],[17,19,.6],[19,21,.15]]), fav: ['americano','latte','filtre','tost','cheesecake','soguklatte','turk','cay'] },
  uzaktan:   { n: 'Uzaktan çalışan',items: 1.7, sit: 3.0, ta: .1,  tol: .98, party: 1.1, wkd: .5,  h: H([[9,18,1],[18,20,.4]]), fav: ['latte','americano','filtre','tost','brownie','soguklatte'] },
  grup:      { n: 'Arkadaş grubu',  items: 1.8, sit: 1.7, ta: .05, tol: 1.05, party: 3.0, wkd: 1.6, h: H([[11,15,.3],[15,19,.8],[19,23,1],[23,24,.5]]), fav: ['turk','latte','cheesecake','soguklatte','limonata','brownie','cay','mocktail','bira','kokteyl','atistirmalik'] },
  aile:      { n: 'Aile',           items: 2.4, sit: 1.4, ta: 0,   tol: 1.0,  party: 3.4, wkd: 2.8, h: H([[9,13,1],[13,18,.6],[18,21,.4]]), fav: ['kahvalti','cay','turk','cheesecake','limonata','tost','mocktail'] },
  elit:      { n: 'Elit müşteri',   items: 1.9, sit: 1.2, ta: .3,  tol: 1.5,  party: 2.0, wkd: 1.3, h: H([[9,12,.6],[12,19,1],[19,24,.8]]), fav: ['latte','americano','cheesecake','kahvalti','soguklatte','sarap','kokteyl'] },
  turist:    { n: 'Turist',         items: 1.6, sit: .8,  ta: .35, tol: 1.35, party: 2.2, wkd: 1.2, h: H([[10,20,1],[20,23,.5]]), fav: ['turk','latte','cheesecake','cay','limonata','bira','kokteyl'] },
  beyazyaka: { n: 'İş çıkışı',      items: 2.2, sit: 2.0, ta: 0,   tol: 1.05, party: 2.6, wkd: .9,  h: H([[16,18,.4],[18,23,1],[23,24,.6]]), fav: ['bira','kokteyl','sarap','atistirmalik','burger','mocktail'] },
  macsever:  { n: 'Maç izleyicisi', items: 2.6, sit: 2.4, ta: 0,   tol: .95,  party: 3.5, wkd: 1.8, h: H([[19,24,1]]), fav: ['bira','atistirmalik','burger'] }
};

const PRODUCTS = {
  cay:          { n: 'Çay',                 ref: 35,  cost: 8,   line: 'diger' },
  turk:         { n: 'Türk kahvesi',        ref: 95,  cost: 25,  line: 'kahve' },
  filtre:       { n: 'Filtre kahve',        ref: 115, cost: 30,  line: 'kahve' },
  americano:    { n: 'Americano',           ref: 125, cost: 32,  line: 'kahve' },
  latte:        { n: 'Latte',               ref: 150, cost: 45,  line: 'kahve' },
  soguklatte:   { n: 'Soğuk latte',         ref: 165, cost: 52,  line: 'kahve' },
  limonata:     { n: 'Ev yapımı limonata',  ref: 115, cost: 35,  line: 'diger' },
  cheesecake:   { n: 'Cheesecake',          ref: 195, cost: 85,  line: 'tatli' },
  brownie:      { n: 'Brownie',             ref: 155, cost: 60,  line: 'tatli' },
  tost:         { n: 'Kaşarlı tost',        ref: 185, cost: 72,  line: 'tatli' },
  kahvalti:     { n: 'Kahvaltı tabağı',     ref: 480, cost: 200, line: 'tatli', needs: 'mutfak' },
  bira:         { n: 'Fıçı bira',           ref: 230, cost: 105,  line: 'alkol' },
  kokteyl:      { n: 'Kokteyl',             ref: 430, cost: 145, line: 'alkol' },
  sarap:        { n: 'Kadeh şarap',         ref: 320, cost: 130, line: 'alkol' },
  mocktail:     { n: 'Alkolsüz kokteyl',    ref: 210, cost: 65,  line: 'diger' },
  atistirmalik: { n: 'Atıştırmalık tabağı', ref: 270, cost: 100,  line: 'tatli' },
  burger:       { n: 'Burger',              ref: 430, cost: 190, line: 'tatli', needs: 'mutfak' }
};

const TYPES = {
  kafe:    { n: 'Kafe',        open: 7,  close: 24, menu: ['cay','turk','filtre','americano','latte','soguklatte','limonata','cheesecake','brownie','tost','kahvalti'], segs: ['ogrenci','ofis','uzaktan','grup','aile','elit','turist'], arch: ['A','B','C','D','E','F','G','H','I','J','L'], req: {}, kdv: .10, desc: 'Temel işletme. Her şey burada başlar.' },
  metro:   { n: 'Metro kiosk', open: 6,  close: 23, menu: ['cay','filtre','americano','latte','soguklatte','brownie','tost'], segs: ['ofis','ogrenci','turist'], arch: ['M1','M2','M1'], req: { cafes: 2 }, kdv: .10, desc: 'İstasyon içinde take away. Kira yerine ihale bedeli ve ciro payı.' },
  avm:     { n: 'AVM',         open: 10, close: 22, menu: ['cay','turk','americano','latte','soguklatte','limonata','cheesecake','brownie','tost'], segs: ['ogrenci','aile','grup','elit','turist','ofis'], arch: ['V1','V2','V1'], req: { cafes: 3, rep: 30 }, kdv: .10, desc: 'Garantili trafik, yüksek kira ve ciro kirası. Hava durumundan etkilenmez.' },
  pub:     { n: 'Pub',         open: 16, close: 24, menu: ['bira','kokteyl','sarap','mocktail','atistirmalik','burger'], segs: ['beyazyaka','grup','macsever','elit','turist'], arch: ['P1','P2','P3'], req: { cafes: 5 }, kdv: .18, desc: 'Gece müşterisi ve yüksek sepet. Alkol izni gerekir, okul yakınına açılamaz.' },
  rooftop: { n: 'Rooftop',     open: 10, close: 24, menu: ['turk','americano','latte','soguklatte','limonata','cheesecake','kahvalti','bira','kokteyl','sarap','mocktail','atistirmalik'], segs: ['elit','turist','grup','beyazyaka','aile'], arch: ['R1','R1'], req: { pubs: 1, rep: 65 }, minElit: 8, kdv: .15, desc: 'Manzara primi, en yüksek fiyat toleransı. Mevsime çok bağlı.' }
};

const ARCH = {
  A:  { n: 'Ara sokakta geniş dükkan',     area: 120, tables: 18, tm: .84, vis: .72,  rm: .8,  front: true },
  B:  { n: 'Ana caddede küçük dükkan',     area: 30,  tables: 3,  tm: .8, vis: 1.0, rm: 1.7, front: false },
  C:  { n: 'Lise ve dershane yanı',        area: 65,  tables: 10, tm: .8,  vis: .8,  rm: .7,  stu: .40, school: true, summer: .4 },
  D:  { n: 'Metro çıkışında dükkan',       area: 45,  tables: 4,  tm: 1.08, vis: 1,  rm: 1.45, off: .25, front: false },
  E:  { n: 'Üniversite kampüsü karşısı',   area: 90,  tables: 16, tm: .9,  vis: .85, rm: .9,  stu: .50, school: true, summer: .35 },
  F:  { n: 'Sahil / park kenarı, bahçeli', area: 150, tables: 22, tm: .7,  vis: .9,  rm: 1.0, garden: true, smoke: true, front: true, flic: true, seasonal: true, family: .15 },
  G:  { n: 'Hastane yanı',                 area: 80,  tables: 12, tm: 1.0, vis: .85, rm: .95, wknd: .6 },
  H:  { n: 'Plaza zemin katı',             area: 55,  tables: 6,  tm: 1.0, vis: .8,  rm: 1.25, off: .5, wknd: .35, aidat: 7000, front: false },
  I:  { n: 'Devren kafe',                  area: 70,  tables: 12, tm: .95, vis: .9,  rm: 1.0, devren: true },
  J:  { n: 'Ana caddede bodrum kat',       area: 100, tables: 20, tm: .5,  vis: .35, rm: .55, smoke: false, front: false },
  L:  { n: 'Yeni konut projesinin altı',   area: 110, tables: 16, tm: .38, vis: .8,  rm: .6,  growing: true, discount: 6 },
  M1: { n: 'Metro istasyonu içi kiosk',    area: 12,  tables: 0,  tm: .68, vis: 1.1, rm: 0,   ihale: true, ciro: .12, kiosk: true, off: .4, front: false, smoke: false, noWeather: true },
  M2: { n: 'Marmaray aktarma kiosku',      area: 16,  tables: 0,  tm: .8,  vis: 1.1, rm: 0,   ihale: true, ciro: .14, kiosk: true, off: .45, front: false, smoke: false, noWeather: true },
  V1: { n: 'AVM koridor kiosku',           area: 25,  tables: 6,  tm: 1.2, vis: 1.1, rm: 2.2, ciro: .08, kiosk: true, shared: true, wknd: 1.6, noWeather: true, front: false, smoke: false },
  V2: { n: 'AVM içi kafe',                 area: 90,  tables: 14, tm: .9, vis: 1.0, rm: 1.8, ciro: .06, wknd: 1.6, noWeather: true, front: false, smoke: false },
  P1: { n: 'Ana caddede pub',              area: 110, tables: 16, tm: .45, vis: 1.0, rm: 1.4, front: true },
  P2: { n: 'Ara sokakta bar',              area: 70,  tables: 10, tm: .45, vis: .6,  rm: .9,  front: true },
  P3: { n: 'Okul yakınında dükkan',        area: 90,  tables: 14, tm: .8,  vis: .8,  rm: .7,  school: true },
  R1: { n: 'Çatı katı teras',              area: 200, tables: 26, tm: .6,  vis: .7,  rm: .55, garden: true, smoke: true, seasonal: true, roof: true, front: false }
};

const EQUIP = {
  giris: { n: 'Giriş seviyesi', cost: 220000, speed: .85, q: -5, brk: .010 },
  orta:  { n: 'Orta seviye',    cost: 450000, speed: 1.0, q: 0,  brk: .005 },
  pro:   { n: 'Profesyonel',    cost: 900000, speed: 1.2, q: 6,  brk: .0025 }
};
const DECOR = {
  basit:    { n: 'Basit',    m2: 2500,  dek: -6 },
  standart: { n: 'Standart', m2: 5000,  dek: 0 },
  premium:  { n: 'Premium',  m2: 10000, dek: 8 }
};
const CONCEPTS = {
  takeaway: { n: 'Take away',  basket: .92, sitAdd: -.5, minStaff: 2, waiterPer: 0 },
  self:     { n: 'Self servis', basket: 1,  sitAdd: 0,   minStaff: 3, waiterPer: 0 },
  garson:   { n: 'Garsonlu',   basket: 1.18, sitAdd: .3, minStaff: 3, waiterPer: 6 },
  karma:    { n: 'Karma',      basket: 1.08, sitAdd: .15, minStaff: 3, waiterPer: 10 }
};
const WAGES = {
  asgari: { n: 'Asgari ücret', cost: 42000, moral: -12 },
  piyasa: { n: 'Piyasa',       cost: 50000, moral: 0 },
  ustu:   { n: 'Piyasa üstü',  cost: 60000, moral: 12 }
};
const BANKS = {
  lira:    { n: 'Lira Bankası',    pos0: .0269, pos30: .0139, promo: 1.0,  loan: 0 },
  bogaz:   { n: 'Boğaz Bank',      pos0: .0249, pos30: .0159, promo: 1.1,  loan: .002 },
  anadolu: { n: 'Anadolu Katılım', pos0: .0279, pos30: .0119, promo: .9,   loan: -.002 },
  marmara: { n: 'Marmara Finans',  pos0: .0255, pos30: .0145, promo: 1.05, loan: 0 }
};
const SUPPLY = {
  kahve: [
    { n: 'Toptancıdan paketli çekirdek', mult: 1,   q: 0,  setup: 0,       monthly: 0,      req: 0, note: 'Sermaye gerekmez, en pahalı birim maliyet.' },
    { n: 'Kavurma firmasıyla sözleşme',  mult: .85, q: 4,  setup: 0,       monthly: 15000,  req: 2, note: 'Aylık minimum alım taahhüdü, istikrarlı kalite.' },
    { n: 'Fason kavurma, kendi blend\'in', mult: .74, q: 8, setup: 350000, monthly: 30000,  req: 3, note: 'Markaya özel imza lezzet.' },
    { n: 'Kendi kavurma tesisin',        mult: .55, q: 12, setup: 5500000, monthly: 320000, req: 5, note: 'En düşük maliyet. Az şubeyle zarar ettirir.' }
  ],
  tatli: [
    { n: 'Mahalle pastanesi / toptancı', mult: 1,   q: 0,  setup: 0,       monthly: 0,      req: 0, note: 'Hazır ürün, sıradan kalite.' },
    { n: 'Büyük zincirden toptan alım',  mult: .82, q: 3,  setup: 0,       monthly: 12000,  req: 2, note: 'Büyük kafelerin üretiminden uygun fiyat.' },
    { n: 'Fason üretim, kendi tariflerin', mult: .72, q: 6, setup: 250000, monthly: 25000,  req: 3, note: 'Bir pastane senin tariflerinle üretir.' },
    { n: 'Merkez mutfak ve tatlı atölyesi', mult: .52, q: 10, setup: 4000000, monthly: 260000, req: 5, note: 'Şubelere soğuk zincirle dağıtım.' }
  ]
};
const AGENCIES = {
  none:       { n: 'Ajans yok',              fee: 0,      fol: 0,  buzz: 0 },
  freelancer: { n: 'Freelancer sosyal medya', fee: 18000,  fol: 10, buzz: .02 },
  performans: { n: 'Performans ajansı',      fee: 65000,  fol: 18, buzz: .05, adEff: 1.4 },
  kreatif:    { n: 'Kreatif marka ajansı',   fee: 180000, fol: 35, buzz: .14 }
};
const RIVALS = [
  { n: 'Starbax',       tier: 'premium', w: 1.3 },
  { n: 'Floria Jean\'s', tier: 'premium', w: 1.1 },
  { n: 'Kahve Evreni',  tier: 'zincir',  w: 1.0 },
  { n: 'EspiranzoLab',   tier: 'zincir',  w: 1.0 },
  { n: 'Karibu Kahve',  tier: 'zincir',  w: .9 },
  { n: 'Simit Konağı',  tier: 'ucuz',    w: .8 }
];
const LOCALS = ['Köşe Kahve', 'Lavinya Cafe', 'Demlik', 'Mavi Fincan', 'Kuytu', 'Bahar Pastanesi', 'Sokak Arası', 'Telve', 'Kum Saati', 'Pembe Köşk', 'Fincan', 'Kahve Durağı'];
const INFL_NAMES = ['@kahvesizolmaz', '@moda.gezgini', '@istanbul.lezzet.durak', '@sinavhaftasi', '@cadde.stil', '@ailecek.gezelim', '@burak.yiyor', '@ece.kafede', '@uykusuz.ogrenci', '@sehrin.mekanlari', '@bir.fincan.hikaye', '@kadikoy.notlari', '@lux.istanbul', '@hafta.sonu.planı'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const STARTS = {
  birikim: { n: 'Birikim',      cash: 2000000, desc: '2 milyon ₺ birikim. Borç yok, hata payı az.' },
  kredi:   { n: 'Kredili',      cash: 1000000, loan: 2000000, desc: '1 milyon ₺ birikim + 2 milyon ₺ ihtiyaç kredisi (36 ay).' },
  ortak:   { n: 'Ortaklı',      cash: 3200000, partner: .3, desc: '3,2 milyon ₺. Ortağın her ay kârın %30\'unu alır.' }
};

/* ---------- tarih ---------- */
const START = Date.UTC(2027, 3, 1);
function dateOf(day) { return new Date(START + day * 864e5); }
function dateLabel(day) { const d = dateOf(day); return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }
function monthLabel(day) { const d = dateOf(day); return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }

/* ---------- yeni oyun ---------- */
function newGame(opts) {
  const seed = (opts && opts.seed) || ((Date.now() ^ 0x5bd1e995) | 0);
  const s = STARTS.birikim;
  const st = {
    v: 1, seed, name: (opts.name || 'Demli Kafe').trim().slice(0, 28), start: 'birikim', cashHist: [],
    cash: s.cash, partner: s.partner || 0,
    day: 0, hour: 7, speed: 1, paused: false, over: false,
    branches: [], nextId: 1, listings: {},
    world: { comps: {}, refIdx: 1, costIdx: 1, wageIdx: 1, mods: [] },
    bank: { payroll: null, promo: null, loans: [], score: 1350, negDays: 0, restructured: false, posTalk: -999 },
    mkt: { followers: 150, buzz: 0, agency: 'none', agencyQ: 1, agencySince: 0, campaigns: [], infl: [], inflPool: [], lastPost: -1, lastCampaign: -999 },
    supply: { kahve: 0, tatli: 0 },
    invest: { stakes: [], offers: [] },
    reports: [], month: blankMonth(), pending: [], log: [], queue: [], flags: {}, unlocked: {}
  };
  if (s.loan) addLoan(st, 'ihtiyac', s.loan, .042, 36, true);
  refreshInfluencers(st);
  st.ctx = dayCtx(st);
  for (const id in DISTRICTS) if (!Object.keys(DISTRICTS[id].req).length) st.unlocked['d:' + id] = true;
  log(st, 'Şirket kuruldu: ' + st.name + '. İlk şubeni açmak için haritadan bir il seç.');
  return st;
}
function blankMonth() { return { rev: 0, cogs: 0, cust: 0, lost: 0, pos: 0, extra: 0, mkt: 0, other: 0, cat: {} }; }
// kategori: yatirim (kurulum, tadilat, ekipman) | ceza | servis | ik (işe alım, tazminat) | faiz | olay | ilan
const CAT_N = { yatirim: 'Yatırım (kurulum, tadilat, ekipman)', ceza: 'Cezalar', servis: 'Arıza ve servis', ik: 'İşe alım ve tazminat', faiz: 'KMH faizi', olay: 'Olay giderleri', ilan: 'İlan ve inceleme' };
function spend(st, v, cat) { st.cash -= v; const c = st.month.cat || (st.month.cat = {}); c[cat] = (c[cat] || 0) + v; if (cat !== 'yatirim') st.month.other += v; }
function log(st, msg, kind) { st.log.unshift({ d: st.day, h: st.hour, m: msg, k: kind || '' }); if (st.log.length > 60) st.log.length = 60; }

// rakip gücü: puan ve fiyat seviyesine göre
const PRICE_PI = { Ucuz: .85, Makul: 1, 'Pahalı': 1.25 };
function compStrength(c) { const pi = c.pi || PRICE_PI[c.price] || 1; return c.w * (.55 + .1 * c.rating) * Math.pow(1 / pi, .6) * (c.promo && c.promo.until > 0 ? 1.12 : 1); }
function priceLabel(pi) { return pi < .93 ? 'Ucuz' : pi < 1.15 ? 'Makul' : 'Pahalı'; }
// haftada bir: rakipler kendi hayatını yaşar. %60 olumlu (puan artışı, kampanya), %40 olumsuz (puan düşüşü, zam)
function evolveRivals(st) {
  const mine = new Set(st.branches.map(b => b.d));
  for (const did in st.world.comps) {
    for (const c of st.world.comps[did]) {
      if (c.pi == null) c.pi = PRICE_PI[c.price] || 1;
      if (c.promo && c.promo.until <= st.day) { c.pi = c.promo.prev; c.promo = null; }
      const good = rnd(st) < .6; const r = rnd(st); let note = '';
      if (good) {
        if (r < .65) { const dlt = rr(st, .02, .09); c.rating = +Math.min(4.9, c.rating + dlt).toFixed(2); c.tr = 1; if (dlt > .07) note = 'yükselişte, puanı ' + c.rating.toFixed(1).replace('.', ',') + ' oldu'; }
        else if (!c.promo) { c.promo = { until: st.day + 14, prev: c.pi }; c.pi = +(c.pi * .9).toFixed(3); c.tr = 1; note = 'iki haftalık indirim kampanyası başlattı'; }
      } else {
        if (r < .6) { const dlt = rr(st, .02, .1); c.rating = +Math.max(2.8, c.rating - dlt).toFixed(2); c.tr = -1; if (dlt > .08) note = 'kötü yorumlar aldı, puanı ' + c.rating.toFixed(1).replace('.', ',') + ' oldu'; }
        else if (!c.promo) { c.pi = +(c.pi * rr(st, 1.04, 1.1)).toFixed(3); c.tr = -1; note = 'fiyatlarına zam yaptı'; }
      }
      c.price = priceLabel(c.pi);
      c.hist = (c.hist || [c.rating]).concat([c.rating]).slice(-8);
      if (note && mine.has(did) && rnd(st) < .35) log(st, c.n + ' (' + DISTRICTS[did].n + ') ' + note + '.', good ? 'warn' : 'info');
    }
  }
}
function comps(st, did) { if (!st.world.comps[did]) st.world.comps[did] = genComps(st, did); return st.world.comps[did]; }
function genComps(st, did) {
  const d = DISTRICTS[did]; const P = PROV[d.p]; const n = 2 + Math.round(d.comp * 5); const out = [], used = new Set();
  const bigCity = d.p === '34' || (P && P.tier === 'm');
  const allowed = RIVALS.filter(r => r.tier === 'premium' ? (bigCity ? d.elit >= 3 || d.central : (d.central && d.elit >= 4 && P.tier !== 'k') || d.elit >= 8) : r.tier === 'zincir' ? (bigCity || d.central || d.elit >= 4) : (d.central || d.prof !== 'dusuk'));
  const bigP = allowed.length ? (bigCity ? .35 + d.elit * .04 : d.central ? .3 : .12) : 0;
  for (let i = 0; i < n; i++) {
    const pool = rnd(st) < bigP ? allowed.filter(r => !used.has(r.n)) : [];
    if (pool.length) { const r = pick(st, pool); used.add(r.n); out.push({ n: r.n, tier: r.tier, w: r.w, rating: +(rr(st, 3.7, 4.5)).toFixed(1), price: r.tier === 'premium' ? 'Pahalı' : r.tier === 'ucuz' ? 'Ucuz' : 'Makul' }); }
    else { const lp = LOCALS.filter(x => !used.has(x)); if (!lp.length) break; const nm = pick(st, lp); used.add(nm); out.push({ n: nm, tier: 'mahalle', w: .6, rating: +(rr(st, 3.2, 4.6)).toFixed(1), price: 'Makul' }); }
  }
  return out;
}

/* ---------- kilitler ---------- */
function counts(st) {
  const c = { cafes: 0, pubs: 0, all: 0, open: 0, staff: 0 };
  for (const b of st.branches) { c.all++; if (b.type === 'kafe') c.cafes++; if (b.type === 'pub') c.pubs++; if (b.status === 'acik') c.open++; c.staff += b.staff; }
  return c;
}
function reqMissing(st, req) {
  const c = counts(st), rep = reputation(st), miss = [];
  if (req.branches && c.all < req.branches) miss.push(req.branches + ' şube gerekiyor (şu an ' + c.all + ')');
  if (req.cafes && c.cafes < req.cafes) miss.push(req.cafes + ' kafe gerekiyor (şu an ' + c.cafes + ')');
  if (req.pubs && c.pubs < req.pubs) miss.push('En az ' + req.pubs + ' pub işletmiş olmalısın');
  if (req.rep && rep < req.rep) miss.push('Marka itibarı ' + req.rep + ' gerekiyor (şu an ' + Math.round(rep) + ')');
  if (req.cash && st.cash < req.cash) miss.push('En az ' + fmt(req.cash) + ' nakit gerekiyor');
  return miss;
}
function districtLock(st, did) { return reqMissing(st, DISTRICTS[did].req); }
function typeLock(st, type, did) {
  const T = TYPES[type]; const m = reqMissing(st, T.req);
  if (type === 'metro' && did && (!METRO_P.has(DISTRICTS[did].p) || (DISTRICTS[did].p !== '34' && !DISTRICTS[did].central))) m.push('Bu ilçede metro ya da raylı sistem istasyonu yok');
  if (T.minElit && did && DISTRICTS[did].elit < T.minElit) m.push('Bu semtte rooftop için yeterli talep yok (semt profili ' + T.minElit + '+ gerekir)');
  return m;
}

/* ---------- itibar ---------- */
function awareness(st) { const org = 100 * (1 - Math.exp(-st.mkt.followers / 60000)); return clamp(org * .65 + st.mkt.buzz, 0, 100); }
function reputation(st) {
  const open = st.branches.filter(b => b.status === 'acik');
  let rs = 0, w = 0; for (const b of open) { const k = 1 + (b.rc || 0); rs += b.rating * k; w += k; }
  const ratingPart = w ? (rs / w - 1) / 4 * 100 : 30;
  return clamp(ratingPart * .55 + awareness(st) * .3 + Math.min(100, open.length * 8) * .15 + (st.repBonus || 0), 0, 100);
}

/* ---------- ilanlar ---------- */
function listingKey(did, type) { return did + ':' + type; }
function getListings(st, did, type) {
  const k = listingKey(did, type); const L = st.listings[k];
  if (L && L.until > st.day) return L.items;
  const items = genListings(st, did, type);
  st.listings[k] = { until: st.day + 7, items };
  return items;
}
function refreshListings(st, did, type, cost) {
  if (cost) spend(st, cost, 'ilan');
  delete st.listings[listingKey(did, type)];
  return getListings(st, did, type);
}
function genListings(st, did, type) {
  const d = DISTRICTS[did], T = TYPES[type];
  const P = PROV[d.p], big = d.p === '34' || P.tier === 'm';
  const pool = T.arch.filter(ak => !(ak === 'H' && !(big || (d.central && P.tier === 'b'))) && !(ak === 'E' && !(big || P.stu > .03 || d.central)) && !(ak === 'G' && !d.central && d.prof === 'dusuk') && !(ak === 'M2' && d.p !== '34'));
  if (!pool.length) pool.push(T.arch[0]);
  const n = type === 'kafe' ? Math.min(pool.length, ri(st, 3, 5)) : ri(st, 2, 3);
  const out = [];
  for (let i = 0; i < n; i++) {
    const ak = type === 'kafe' ? pool.splice(Math.floor(rnd(st) * pool.length), 1)[0] : pick(st, pool);
    if (!ak) break;
    const A = ARCH[ak];
    const area = Math.max(8, Math.round(A.area * rr(st, .88, 1.12)));
    const tables = A.tables ? Math.max(2, Math.round(A.tables * area / A.area)) : 0;
    let rent;
    if (A.ihale) rent = r1000(Math.max(75000, d.rent * area * 14 * rr(st, .9, 1.1)));
    else rent = r500(d.rent * area * A.rm * rr(st, .9, 1.12));
    const hasFront = A.front !== undefined ? A.front : rnd(st) < .6;
    const flic = hasFront ? (A.flic !== undefined ? A.flic : rnd(st) < .5) : false;
    const smoke = A.smoke !== undefined ? A.smoke : (hasFront || rnd(st) < .35);
    let pot = rr(st, .74, 1.26); if (A.growing) pot = rr(st, .55, 1.45);
    const notes = []; let hint = '';
    if (rnd(st) < .3) { pot *= .82; hint = pick(st, ['Komşu esnaf: "Burada son 3 yılda 2 kafe kapandı."', 'Sayım: Öğleden sonra trafiği beklenenden zayıf.', 'Tesisatta nem var, kış aylarında sorun çıkarabilir.']); }
    else if (rnd(st) < .25) { pot *= 1.12; hint = pick(st, ['Sayım: Sabah saatlerinde yoğun yaya akışı var.', 'Komşu esnaf: "Yakındaki ofislere yeni şirket taşınıyor."', 'Sokakta kafe eksik, talep yüksek görünüyor.']); }
    else hint = pick(st, ['Sayım: Trafik ilanla uyumlu.', 'Komşu esnaf: "Mahalle sakin ama sadık müşterisi olur."', 'Elektrik ve su tesisatı temiz.']);
    const nearby = comps(st, did).filter(() => rnd(st) < .55);
    let nm = A.n;
    if (ak === 'F' && !COAST_P.has(d.p)) nm = 'Park kenarı, bahçeli dükkan';
    if (ak === 'D' && !METRO_P.has(d.p)) nm = 'Meydan ve durak köşesi';
    if (ak === 'M1' && d.p !== '34') nm = d.p === '06' || d.p === '35' || d.p === '16' ? 'Metro istasyonu içi kiosk' : 'Raylı sistem durağı kiosku';
    const L = {
      id: 'L' + Math.floor(rnd(st) * 1e9).toString(36), did, type, arch: ak, area, tables, nm,
      rent, deposit: rent * 3, hasFront, flic, smoke,
      frontTables: hasFront ? Math.max(2, Math.round(area / 25)) : 0,
      aptFee: hasFront && !flic ? r500(rr(st, 6000, 18000) * (.6 + d.elit * .1)) : 0,
      havaParasi: A.devren ? r1000(rent * rr(st, 6, 10)) : 0,
      ciro: A.ciro || 0, aidat: A.aidat ? r500(A.aidat * (.7 + d.elit * .08)) : 0,
      pot: +pot.toFixed(3), hint, inspected: false,
      nearby, blocked: (type === 'pub' && A.school) ? 'Okul yakını: alkollü içki satış izni alınamaz.' : ''
    };
    if (A.devren && rnd(st) < .4) L.badPast = true;
    out.push(L);
  }
  return out;
}
function inspectListing(st, L) {
  if (L.inspected) return; spend(st, 15000, 'ilan'); L.inspected = true;
}
function listingEstimate(L) { const lo = Math.round((L.pot - .08) * 100), hi = Math.round((L.pot + .08) * 100); return [lo, hi]; }

/* ---------- kurulum ---------- */
function permitsFor(st, L, choice) {
  const d = DISTRICTS[L.did], first = st.branches.length === 0;
  const list = [];
  if (first) list.push({ n: 'Şirket kuruluşu ve vergi levhası', fee: 18000 });
  list.push({ n: 'Yazar kasa / ÖKC kaydı', fee: 8000 });
  list.push({ n: 'İşyeri açma ve çalışma ruhsatı', fee: r500(20000 * (1 + d.strict)) });
  list.push({ n: 'İtfaiye uygunluk raporu', fee: 6000 });
  if (!ARCH[L.arch].ihale) list.push({ n: 'Tabela ruhsatı', fee: 4000 });
  if (L.hasFront && L.flic && choice.useFront) list.push({ n: 'Ön alan işgaliye izni (ruhsata işli)', fee: 8000 });
  list.push({ n: 'Hijyen eğitimi belgesi', fee: 3000 * Math.max(1, choice.staff) });
  list.push({ n: 'SGK işyeri tescili', fee: 0 });
  if (L.type === 'pub' || L.type === 'rooftop') list.push({ n: 'Alkollü içki satış izni', fee: 60000 });
  if (ARCH[L.arch].roof) list.push({ n: 'Çatı kullanım izni ve statik rapor', fee: 45000 });
  if (ARCH[L.arch].ihale || ARCH[L.arch].ciro) list.push({ n: ARCH[L.arch].ihale ? 'İhale teminatı' : 'AVM sözleşme teminatı', fee: L.rent * 2 });
  return list;
}
function waitDays(st, L) {
  if (st.branches.length === 0) return 0;
  let w = 1; const d = DISTRICTS[L.did];
  if (d.strict >= .6) w++; if (L.type === 'pub' || L.type === 'rooftop') w++; if (ARCH[L.arch].roof) w++;
  return Math.min(3, w);
}
function conceptsFor(L) {
  const A = ARCH[L.arch];
  if (A.kiosk) return ['takeaway'];
  if (L.tables <= 4) return ['takeaway', 'self'];
  if (L.type === 'pub') return ['self', 'karma', 'garson'];
  return ['self', 'karma', 'garson', 'takeaway'];
}
function minStaff(concept, tables) {
  const C = CONCEPTS[concept]; let m = C.minStaff; if (C.waiterPer) m += Math.ceil(tables / C.waiterPer) - 1; return Math.max(1, m);
}
function defaultChoice(st, L) {
  const cs = conceptsFor(L); const concept = cs.includes('self') && L.tables > 4 ? 'self' : cs[0];
  const A = ARCH[L.arch];
  return {
    concept, decor: 'standart', equip: A.devren ? 'devren' : 'orta', kitchen: false, staff: Math.max(minStaff(concept, L.tables), Math.round(L.tables / 7) + 2),
    wage: 'piyasa', bank: st.bank.payroll || 'lira', valor: '0', useFront: L.hasFront, name: DISTRICTS[L.did].n + ' ' + (L.type === 'kafe' ? '' : TYPES[L.type].n),
    rush: false
  };
}
function setupCost(st, L, ch) {
  const A = ARCH[L.arch]; const lines = [];
  lines.push({ n: 'Depozito (3 aylık kira)', v: L.deposit });
  const firstRent = A.discount || L.openDisc ? Math.round(L.rent * .5) : L.rent;
  lines.push({ n: A.ihale ? 'İlk ay ihale bedeli' : 'Peşin ilk ay kira', v: firstRent });
  if (L.havaParasi) lines.push({ n: 'Hava parası (devren)', v: L.havaParasi });
  const dec = DECOR[ch.decor];
  lines.push({ n: 'Tadilat ve dekor (' + dec.n + ')', v: Math.round(dec.m2 * L.area * (A.devren ? .4 : 1) * (A.kiosk ? 1.6 : 1)) });
  if (ch.equip !== 'devren') lines.push({ n: 'Ekipman (' + EQUIP[ch.equip].n + ')', v: Math.round(EQUIP[ch.equip].cost * (A.kiosk ? .35 : 1)) });
  if (ch.kitchen) lines.push({ n: 'Mutfak ekipmanı', v: 250000 });
  for (const p of permitsFor(st, L, ch)) if (p.fee) lines.push({ n: p.n, v: p.fee });
  lines.push({ n: 'POS cihazı ve kurulum', v: 2500 });
  if (!A.ihale) lines.push({ n: 'Tabela', v: 25000 });
  lines.push({ n: 'İlk stok', v: L.type === 'pub' ? 90000 : 35000 });
  const total = lines.reduce((a, l) => a + l.v, 0);
  return { lines, total };
}
function forecast(st, L, ch) {
  const c = JSON.parse(JSON.stringify(st));
  c.queue = []; c._noEvents = true; c._fcOthers = st.branches.filter(b => b.status === 'acik').length; c.branches = []; c.listings = {}; c.log = []; c.cash = 1e12; c.over = false;
  const L2 = Object.assign({}, L); if (!L.inspected) { L2.pot = 1; L2.badPast = false; }
  const r = openBranch(c, L2, Object.assign({}, ch)); if (!r.ok) return null; const b = r.b; b.status = 'acik'; b.daysLeft = 0; c.queue = [];
  const acc = { rev: 0, cogs: 0, cust: 0, lost: 0, days: 0 };
  for (let dd = 0; dd < 42; dd++) { for (let h = 0; h < 24; h++) { tickHour(c); c.queue = []; } if (dd >= 12 && b.yesterday) { const y = b.yesterday; acc.rev += y.rev; acc.cogs += y.cogs; acc.cust += y.cust; acc.lost += y.lost; acc.days++; } }
  const k = 30 / Math.max(1, acc.days), rev = acc.rev * k, cogs = acc.cogs * k; const T = TYPES[L.type];
  const wages = ch.staff * WAGES[ch.wage].cost * st.world.wageIdx;
  const util = utilCost(st, b) + (b.useFront && !b.flic ? b.aptFee : 0) + (b.aidat || 0) + (L.type === 'pub' || L.type === 'rooftop' ? (90000 * st.world.wageIdx + 15000) : 0);
  const kdv = Math.max(0, (rev - cogs) * (T.kdv / (1 + T.kdv)));
  const pos = rev * .85 * (ch.valor === '30' ? BANKS[ch.bank].pos30 : BANKS[ch.bank].pos0);
  const pre = rev - cogs - L.rent - rev * (L.ciro || 0) - wages - util - rev * .045 - kdv - pos - 2500 - (c._fcOthers ? 0 : 10000);
  const profit = pre > 0 ? pre * .8 : pre;
  const setup = setupCost(st, L, ch).total;
  return { rev, profit, cust: acc.cust * k / 30, lost: acc.lost * k / 30, setup, payback: profit > 0 ? (setup - L.deposit) / profit : null, sure: !!L.inspected };
}
function openBranch(st, L, ch) {
  const cost = setupCost(st, L, ch).total;
  if (st.cash < cost) return { ok: false, msg: 'Nakit yetersiz. ' + fmt(cost - st.cash) + ' eksik.' };
  if (L.blocked) return { ok: false, msg: L.blocked };
  st.cash -= L.deposit; spend(st, cost - L.deposit, 'yatirim'); // depozito iade edilebilir varlık
  const A = ARCH[L.arch], T = TYPES[L.type];
  const wait = waitDays(st, L);
  const menu = {};
  for (const id of T.menu) menu[id] = { on: !PRODUCTS[id].needs || ch.kitchen, price: Math.round(PRODUCTS[id].ref * priceIdx(L.did) * st.world.refIdx / 5) * 5 };
  const b = {
    id: st.nextId++, name: (ch.name || DISTRICTS[L.did].n).trim().slice(0, 30), d: L.did, type: L.type, arch: L.arch, archN: L.nm || ARCH[L.arch].n,
    area: L.area, tables: L.tables, frontTables: L.frontTables, hasFront: L.hasFront, flic: L.flic, useFront: !!(ch.useFront && L.hasFront),
    aptFee: L.aptFee, smoke: L.smoke || !!(ch.useFront && L.hasFront), rent: L.rent, deposit: L.deposit, ciro: L.ciro, aidat: L.aidat, havaParasi: L.havaParasi,
    pot: L.pot * (L.badPast ? .85 : 1), growth: A.growing ? .55 : 1, discountLeft: L.openDisc || A.discount || 0, mall: L.mall || null,
    concept: ch.concept, decor: ch.decor, equip: ch.equip === 'devren' ? 'orta' : ch.equip, kitchen: !!ch.kitchen,
    staff: ch.staff, wage: ch.wage, moral: 70, bank: ch.bank, valor: ch.valor, menu,
    status: wait ? 'hazirlik' : 'acik', daysLeft: wait, openedDay: st.day + wait, contractStart: st.day,
    rating: L.badPast ? 2.7 : 3.2, rc: 15, occ: [], today: blankDay(), mAcc: blankBM(), hist: [], lossMonths: 0, closedUntil: -1,
    compMod: 1, boosts: [], lastMonth: null, extraRev: 0
  };
  if (!st.bank.payroll) st.bank.payroll = ch.bank;
  st.branches.push(b);
  if (L.mall) { const v = mallVac(st, L.mall); v.n = Math.max(0, v.n - 1); const k = st.listings['M:' + L.mall]; if (k) k.items = k.items.filter(x => x.id !== L.id); } else delete st.listings[listingKey(L.did, L.type)];
  computeOffer(st, b); segWeights(st, b);
  log(st, b.name + (wait ? ' kiralandı. Ruhsatlar ' + wait + ' gün içinde tamamlanacak.' : ' açıldı. Hayırlı olsun.'), 'good');
  checkUnlocks(st);
  return { ok: true, b };
}
function blankDay() { return { rev: 0, cust: 0, lost: 0, satSum: 0, cogs: 0, seatLost: 0, queueLost: 0 }; }
function blankBM() { return { rev: 0, cogs: 0, cust: 0, lost: 0, card: 0, days: 0 }; }
const DRV_N = { takvim: 'Ramazan ve bayramlar', fiyat: 'Fiyatların', rakip: 'Rakipler', sezon: 'Mevsim ve hava', olay: 'Olaylar ve kampanyalar', marka: 'Marka bilinirliği', kalite: 'Puan ve dekor', kapasite: 'Kapasite (kaçan müşteri)', gun: 'Açık gün sayısı' };
function monthDrivers(st, b) {
  const f = b.mAcc.f; if (!f || !f.n) return null;
  const cur = { takvim: (f.takvim || 0) / f.n, fiyat: f.fiyat / f.n, rakip: f.rakip / f.n, sezon: f.sezon / f.n, olay: f.olay / f.n, marka: f.marka / f.n, kalite: f.kalite / f.n, kapasite: f.kapN ? f.kapasite / f.kapN : 0, gun: Math.log(Math.max(1, b.mAcc.days)) };
  const prev = b.drv; b.drv = cur;
  const rev = b.mAcc.rev + (b.extraRev || 0), prevRev = b.lastMonth ? b.lastMonth.rev : 0;
  if (!prev || !prevRev) return { first: true };
  const tot = Math.log(Math.max(1, rev) / Math.max(1, prevRev)); const parts = {}; let expl = 0;
  for (const k in cur) { parts[k] = cur[k] - (prev[k] || 0); expl += parts[k]; }
  parts.diger = tot - expl;
  const pct = {}; for (const k in parts) pct[k] = Math.exp(parts[k]) - 1;
  return { chg: rev / prevRev - 1, pct };
}

/* ---------- ekonomi yardımcıları ---------- */
function supplyMult(st, id) { const l = PRODUCTS[id].line; if (l === 'kahve') return SUPPLY.kahve[st.supply.kahve].mult; if (l === 'tatli') return SUPPLY.tatli[st.supply.tatli].mult; return 1; }
function supplyQ(st, id) { const l = PRODUCTS[id].line; if (l === 'kahve') return SUPPLY.kahve[st.supply.kahve].q; if (l === 'tatli') return SUPPLY.tatli[st.supply.tatli].q; return 2; }
function priceIdx(did) { const d = DISTRICTS[did]; return (.75 + .06 * d.elit) * cityScale(d.p).price; }
function localRef(st, b, id) { return PRODUCTS[id].ref * priceIdx(b.d) * st.world.refIdx; }
function unitCost(st, id) { return PRODUCTS[id].cost * st.world.costIdx * supplyMult(st, id); }
function perception(st, b, id) {
  const r = b.menu[id].price / localRef(st, b, id);
  if (r < .85) return ['Ucuz', 'ok']; if (r < 1.12) return ['Makul', 'ok']; if (r < 1.35) return ['Pahalı', 'warn']; return ['Fahiş', 'bad'];
}
function computeOffer(st, b) {
  const T = TYPES[b.type];
  const items = T.menu.filter(id => b.menu[id] && b.menu[id].on && (!PRODUCTS[id].needs || b.kitchen));
  const res = {};
  for (const s of T.segs) {
    const S = SEGS[s]; const fav = S.fav.filter(x => items.includes(x));
    if (!fav.length) { res[s] = { fit: 0 }; continue; }
    const avail = S.fav.filter(x => T.menu.includes(x)).length;
    const fit = Math.min(1, .35 + .65 * fav.length / Math.max(1, Math.min(4, avail)));
    let pr = 0, ref = 0, cost = 0, q = 0;
    for (const id of fav) { pr += b.menu[id].price; ref += localRef(st, b, id); cost += unitCost(st, id); q += supplyQ(st, id); }
    const k = fav.length; pr /= k; ref /= k; cost /= k; q /= k;
    const x = (pr / ref) / S.tol;
    const prop = x <= 1 ? Math.min(1.3, 1 + (1 - x) * .7) : Math.max(.04, 1 - (x - 1) * 1.5 - (x - 1) * (x - 1) * 3);
    res[s] = { fit, price: pr, ref, cost, x, prop, q: q + EQUIP[b.equip].q + (b.manager ? 2 : 0), fav };
  }
  b._offer = res;
}
function segWeights(st, b) {
  const d = DISTRICTS[b.d], A = ARCH[b.arch], T = TYPES[b.type], ctx = st.ctx || dayCtx(st);
  const base = { ogrenci: d.stu + (A.stu || 0), ofis: d.off + (A.off || 0), uzaktan: .12 + d.off * .25, grup: .28, aile: .12 + (A.family || 0) + (d.elit < 6 ? .06 : 0),
    elit: Math.max(.02, (d.elit - 3) * .06), turist: d.tour + (A.roof ? .15 : 0), beyazyaka: .22 + d.off * .6, macsever: .18 };
  const w = {}; let sum = 0;
  for (const s of T.segs) { let v = base[s]; if (s === 'ogrenci' && ctx.summer && A.summer) v *= A.summer; if (s === 'ogrenci' && ctx.summer && !A.summer) v *= .75; w[s] = v; sum += v; }
  for (const s in w) w[s] /= sum;
  b._w = w;
}
function dayCtx(st) {
  const dt = dateOf(st.day); const m = dt.getUTCMonth(), wd = dt.getUTCDay();
  const summer = m >= 5 && m <= 7, winter = m === 11 || m <= 1;
  const rainP = winter ? .38 : (m >= 2 && m <= 4) || m >= 9 ? .25 : .06;
  const rain = rnd(st) < rainP, hot = summer && rnd(st) < .4;
  return { wd, weekend: wd === 0 || wd === 6, month: m, summer, winter, rain, hot };
}
// il bazlı hava: bölge iklimi + ay. k: gunes | bulut | yagmur | kar | sicak
const CLIM = { dogu: ['25', '36', '75', '04', '65', '13', '49', '12', '24', '62', '69', '30', '58', '76', '73', '56', '72', '21', '47', '44', '23', '02', '63', '27', '46', '80'], ic: ['06', '42', '26', '38', '40', '50', '51', '68', '70', '66', '18', '71', '03', '32', '64', '43', '15', '19', '11', '14'],
  karadeniz: ['61', '53', '08', '28', '52', '55', '57', '37', '74', '67', '81', '60', '05', '29', '78', '79'], akdeniz: ['07', '33', '01', '31'], ege: ['35', '09', '48', '20', '45', '10', '17'] };
const CLIM_OF = {}; for (const r in CLIM) for (const c of CLIM[r]) CLIM_OF[c] = r;
// aylara göre [yağış olasılığı, karın yağıştaki payı, sıcak gün olasılığı, ort. sıcaklık]
const CLIM_T = {
  marmara:   [[.45, .2, 0, 6], [.4, .2, 0, 7], [.35, .05, 0, 9], [.28, 0, 0, 13], [.2, 0, .05, 18], [.12, 0, .25, 23], [.06, 0, .45, 26], [.06, 0, .45, 26], [.12, 0, .2, 22], [.28, 0, 0, 17], [.38, 0, 0, 12], [.45, .1, 0, 8]],
  ege:       [[.4, .03, 0, 9], [.35, .03, 0, 10], [.3, 0, 0, 13], [.22, 0, .05, 17], [.12, 0, .2, 22], [.05, 0, .5, 27], [.02, 0, .7, 30], [.02, 0, .7, 30], [.06, 0, .4, 25], [.2, 0, .05, 20], [.3, 0, 0, 14], [.4, 0, 0, 10]],
  akdeniz:   [[.35, 0, 0, 11], [.3, 0, 0, 12], [.25, 0, 0, 15], [.15, 0, .1, 19], [.08, 0, .35, 23], [.03, 0, .6, 28], [.01, 0, .8, 31], [.01, 0, .8, 31], [.04, 0, .5, 27], [.15, 0, .15, 22], [.25, 0, 0, 16], [.35, 0, 0, 12]],
  karadeniz: [[.5, .3, 0, 7], [.48, .3, 0, 7], [.45, .1, 0, 9], [.4, 0, 0, 12], [.38, 0, 0, 16], [.35, 0, .05, 20], [.3, 0, .1, 23], [.3, 0, .1, 23], [.38, 0, .05, 20], [.48, 0, 0, 16], [.5, 0, 0, 12], [.5, .15, 0, 9]],
  ic:        [[.3, .7, 0, 0], [.28, .6, 0, 2], [.3, .3, 0, 6], [.3, 0, 0, 11], [.28, 0, .05, 16], [.15, 0, .3, 21], [.05, 0, .5, 24], [.04, 0, .5, 24], [.08, 0, .2, 19], [.2, 0, 0, 13], [.25, .2, 0, 6], [.3, .6, 0, 2]],
  dogu:      [[.32, .9, 0, -8], [.32, .9, 0, -6], [.33, .7, 0, -1], [.35, .2, 0, 6], [.33, 0, 0, 11], [.2, 0, .1, 16], [.08, 0, .3, 20], [.06, 0, .3, 20], [.1, 0, .1, 15], [.25, .1, 0, 9], [.3, .5, 0, 2], [.32, .85, 0, -4]] };
function hash01(a, b) { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function wxOf(st, code) {
  const day = st.day, m = dateOf(day).getUTCMonth(); const reg = CLIM_OF[code] || 'marmara'; const [rp, sn, hp, temp] = CLIM_T[reg][m];
  const pc = +code || 34; // bitişik günler benzer olsun: 2 günlük bloklar + günlük sapma
  const r1 = hash01(Math.floor(day / 2), pc * 7 + 1), r2 = hash01(day, pc * 13 + 5), r3 = hash01(day, pc * 3 + 9);
  const wet = r1 * .6 + r2 * .4 < rp; let k = 'gunes';
  if (wet) k = r3 < sn ? 'kar' : 'yagmur'; else if (r2 < hp) k = 'sicak'; else if (r3 < .3 + rp * .6) k = 'bulut';
  return { k, t: Math.round(temp + (r2 - .5) * 8 - (k === 'kar' ? 3 : 0) + (k === 'sicak' ? 4 : 0)) };
}
const WX_N = { gunes: 'Güneşli', bulut: 'Bulutlu', yagmur: 'Yağmurlu', kar: 'Karlı', sicak: 'Çok sıcak' };
function weatherLabel(ctx) { if (ctx.rain) return 'Yağmurlu'; if (ctx.hot) return 'Çok sıcak'; if (ctx.winter) return 'Soğuk'; if (ctx.summer) return 'Güneşli'; return 'Parçalı bulutlu'; }

function branchMult(st, b) {
  let m = 1; for (const x of b.boosts) if (x.until >= st.day) m *= x.mult;
  for (const x of st.world.mods) if (x.until >= st.day && (!x.d || x.d === b.d)) m *= x.mult;
  return m;
}
function utilCost(st, b) { return (b.area * 330 + 14000) * st.world.costIdx; }
function ownerBonus(st) { return st.branches.filter(b => b.status === 'acik').length + (st._fcOthers || 0) <= 1 ? 1 : 0; }
function staffCap(st, b) {
  const C = CONCEPTS[b.concept];
  const waiters = C.waiterPer ? Math.ceil(b.tables / C.waiterPer) * .6 : 0;
  // dükkan 15-17 saat açık: kadro iki vardiyaya bölünür, aynı anda yaklaşık yarısı çalışır
  const interns = b.interns && b.interns.until >= st.day ? b.interns.n * .35 : 0;
  const eff = Math.max(.5, b.staff * .55 + interns + ownerBonus(st) + (b.manager ? .5 : 0) - waiters * .55);
  const moralF = .75 + .35 * (b.moral / 100);
  return eff * 22 * EQUIP[b.equip].speed * moralF;
}
const K_INT = 0.05;

/* ---------- saatlik simülasyon ---------- */
function branchHour(st, b, h) {
  if (b.occ.length) { for (const o of b.occ) o.rem -= 1; b.occ = b.occ.filter(o => o.rem > 0); }
  if (b.status !== 'acik') return;
  const T = TYPES[b.type]; if (h < T.open || h >= T.close) { b.occ = []; return; }
  if (b.closedUntil >= st.day) return;
  const d = DISTRICTS[b.d], A = ARCH[b.arch], C = CONCEPTS[b.concept]; const wx = wxOf(st, d.p); const ctx = Object.assign({}, st.ctx, { rain: wx.k === 'yagmur' || wx.k === 'kar', snow: wx.k === 'kar', hot: wx.k === 'sicak' });
  let traffic = d.traffic * A.tm * b.growth;
  if (ctx.snow && !A.noWeather) traffic *= A.garden ? .45 : .7; else if (ctx.rain && !A.noWeather) traffic *= A.garden ? .6 : .82;
  if (A.seasonal) traffic *= ctx.summer ? 1.35 : ctx.winter ? .6 : 1;
  if (d.island) traffic *= ctx.summer ? 1.6 : ctx.winter ? .45 : 1;
  if (ctx.weekend && A.wknd) traffic *= A.wknd;
  traffic *= branchMult(st, b) * mallMult(st, b);
  const ramF = ramadanMult(st, b, h) * kurbanMult(st, b, h); traffic *= ramF;
  const brand = 1 + awareness(st) / 100 * .7;
  const ratingF = .55 + .15 * b.rating;
  const dek = DECOR[b.decor].dek - Math.max(0, d.elit - 5) * (b.decor === 'basit' ? 2.2 : b.decor === 'standart' ? .8 : 0);
  const compW = comps(st, b.d).reduce((a, c) => a + compStrength(c), 0);
  const compF = clamp(1 - compW * .045, .62, 1) * b.compMod;
  const interest = K_INT * A.vis * brand * ratingF * b.pot * compF * (1 + dek / 60) * (1.15 - d.elit * .04);
  const cap = staffCap(st, b);
  const want = []; let total = 0;
  // ciro sürücüleri (neden analizi)
  const fa = b.mAcc.f || (b.mAcc.f = { n: 0, sezon: 0, olay: 0, marka: 0, kalite: 0, rakip: 0, fiyat: 0, kapasite: 0 });
  { let pw = 0, pv = 0; for (const s of T.segs) { const o = b._offer[s], w = b._w[s]; if (!o || !o.fit || !w) continue; pw += w * o.fit; pv += w * o.fit * o.prop * (o.price / Math.max(1, o.ref)); } const seasonF = traffic / Math.max(1, d.traffic * A.tm * b.growth * branchMult(st, b) * mallMult(st, b) * ramF);
    fa.n++; fa.takvim = (fa.takvim || 0) + Math.log(Math.max(.05, ramF)); fa.sezon += Math.log(Math.max(.05, seasonF)); fa.olay += Math.log(Math.max(.05, branchMult(st, b))); fa.marka += Math.log(brand); fa.kalite += Math.log(Math.max(.05, ratingF * (1 + dek / 60))); fa.rakip += Math.log(Math.max(.05, compF)); fa.fiyat += Math.log(Math.max(.05, pw ? pv / pw : 1)); }
  for (const s of T.segs) {
    const S = SEGS[s], o = b._offer[s], w = b._w[s];
    if (!o || !o.fit || !w) continue;
    let act = S.h[h]; if (ctx.weekend) act *= S.wkd;
    if (!act) continue;
    let n = traffic * w * act * interest * o.fit * o.prop;
    if (ctx.hot && s !== 'aile') n *= 1.06;
    if (A.kiosk || b.concept === 'takeaway' || b.tables === 0) n *= clamp(.35 + S.ta, .35, 1);
    n *= rr(st, .85, 1.15);
    const fl = Math.floor(n); n = fl + (rnd(st) < n - fl ? 1 : 0);
    if (n <= 0) continue;
    want.push({ s, n }); total += n;
  }
  if (!total) return;
  const ratio = total > cap ? cap / total : 1;

  const queueLost = total - Math.min(total, cap);
  let free = b.tables + (b.useFront ? b.frontTables * (ctx.rain || ctx.winter ? .3 : 1) : 0) - b.occ.reduce((a, o) => a + o.t, 0);
  const smokePen = b.smoke ? 0 : -6;
  const waitPen = ratio < 1 ? -(1 - ratio) * 45 : 0;
  let rev = 0, cogs = 0, served = 0, lost = queueLost, seatLost = 0, satSum = 0;
  for (const x of want) {
    const S = SEGS[x.s], o = b._offer[x.s];
    let n = x.n * ratio;
    let ta = A.kiosk ? 1 : b.concept === 'takeaway' ? Math.max(S.ta, .85) : S.ta;
    if (b.tables === 0) ta = 1;
    let seated = n * (1 - ta), takeaway = n - seated;
    if (seated > 0) {
      const parties = seated / S.party;
      const ok = Math.max(0, Math.min(parties, free));
      const over = parties - ok;
      if (ok > 0) { b.occ.push({ t: ok, rem: Math.max(.5, S.sit + C.sitAdd) }); free -= ok; }
      if (over > 0) { const p = over * S.party; takeaway += p * .3; lost += p * .7; seatLost += p * .7; seated = ok * S.party; }
    }
    const got = seated + takeaway;
    const pm = o.prop > 1 ? 1 + (o.prop - 1) * .4 : 1;
    const itS = S.items * C.basket * pm, itT = Math.min(S.items, 1.15) * pm;
    const units = seated * itS + takeaway * itT, mc = b.marginCut && b.marginCut >= st.day ? .9 : 1;
    if (units > 0 && o.fav) { const it = b.mAcc.it || (b.mAcc.it = {}); const per = units / o.fav.length; for (const id of o.fav) { const r = it[id] || (it[id] = [0, 0, 0]); r[0] += per; r[1] += per * b.menu[id].price * mc; r[2] += per * unitCost(st, id) * 1.12; } }
    rev += units * o.price * mc; cogs += (seated * itS + takeaway * itT) * o.cost * 1.12 + takeaway * itT * 6 * st.world.costIdx; served += got;
    const priceSat = o.x > 1 ? -(o.x - 1) * 55 : (1 - o.x) * 10;
    const smk = (x.s === 'ogrenci' || x.s === 'grup' || x.s === 'beyazyaka' || x.s === 'macsever') ? smokePen : 0;
    const sat = 62 + o.q + dek + waitPen + priceSat + smk + (o.fit < .6 ? -6 : 0) + (b.moral - 70) * .15;
    satSum += sat * got;
    const sc = b.today.sc || (b.today.sc = { fiyat: 0, bekleme: 0, kalite: 0, dekor: 0, sigara: 0, ekip: 0, n: 0 }); sc.fiyat += priceSat * got; sc.bekleme += waitPen * got; sc.kalite += (o.q - 8) * got; sc.dekor += dek * got; sc.sigara += smk * got; sc.ekip += (b.moral - 70) * .15 * got; sc.n += got;
  }
  fa.kapN = (fa.kapN || 0) + total; fa.kapasite += total * Math.log(Math.max(.05, served / total));
  const t = b.today; t.rev += rev; t.cogs += cogs; t.cust += served; t.lost += lost; t.satSum += satSum; t.seatLost += seatLost; t.queueLost += queueLost;
}

/* ---------- AVM'ler ---------- */
const MALL_SIZE = { 1: { n: 'Küçük', f: .8, rent: .85 }, 2: { n: 'Orta', f: 1, rent: 1 }, 3: { n: 'Büyük', f: 1.35, rent: 1.3 } };
function allMalls(st) { return (typeof MALLS !== 'undefined' ? MALLS : []).concat(st.newMalls || []); }
function mallById(st, id) { return allMalls(st).find(m => m.id === id); }
function mallDid(st, m) { if (m.did) return m.did; const ids = provDistricts(m.p); const hit = ids.find(id => !DISTRICTS[id].spot && DISTRICTS[id].n === m.dn); return m.did = hit || ids.find(id => DISTRICTS[id].central) || ids[0]; }
function mallsIn(st, did) { const d = DISTRICTS[did]; if (!d || d.spot) return []; return allMalls(st).filter(m => m.p === d.p && mallDid(st, m) === did); }
function mallVac(st, id) {
  st.mallVac = st.mallVac || {}; let v = st.mallVac[id]; const m = mallById(st, id);
  if (!v || v.until <= st.day) { const r = rnd(st); v = st.mallVac[id] = { until: st.day + ri(st, 15, 40), n: m && m.isNew && st.day - m.openDay < 45 ? ri(st, 3, 5) : r < .35 ? 0 : r < .75 ? 1 : r < .93 ? 2 : 3 }; delete st.listings['M:' + id]; }
  return v;
}
function mallListings(st, id) {
  const m = mallById(st, id); if (!m) return []; const v = mallVac(st, id); const k = 'M:' + id;
  if (st.listings[k] && st.listings[k].until > st.day) return st.listings[k].items.slice(0, v.n);
  const did = mallDid(st, m); const items = [];
  const newOpen = m.isNew && st.day - m.openDay < 60;
  for (let i = 0; i < v.n; i++) { const ak = i % 3 === 1 ? 'V2' : 'V1'; const L = genListings(st, did, 'avm').find(x => x.arch === ak) || genListings(st, did, 'avm')[0]; if (!L) continue;
    L.mall = id; L.nm = (ak === 'V2' ? 'İçeride kafe alanı' : 'Koridor kiosku') + ' · ' + m.n; L.rent = r500(L.rent * MALL_SIZE[m.s].rent); L.deposit = L.rent * 3;
    if (newOpen) { L.openDisc = 6; L.notes = (L.notes || []).concat(['Açılışa özel: ilk 6 ay kira %50 indirimli']); }
    items.push(L); }
  st.listings[k] = { until: v.until, items }; return items;
}
function mallMult(st, b) { if (!b.mall) return 1; const m = mallById(st, b.mall); if (!m) return 1; return MALL_SIZE[m.s].f * (m.isNew && st.day - m.openDay < 75 ? 1.25 : 1); }
const NEW_MALL = ['Vadi', 'Nova', 'Atlas', 'Park', 'Life', 'Meydan', 'Panorama', 'Kule', 'Bahçe', 'Galeri', 'Liman', 'Yıldız'];
function maybeNewMall(st) {
  if (st._noEvents || rnd(st) > 1 / 140) return;
  if ((st.newMalls || []).filter(m => st.day - m.openDay < 120).length) return;
  const code = pick(st, ['34', '34', '34', '06', '35']); const ids = provDistricts(code).filter(id => !DISTRICTS[id].spot && DISTRICTS[id].prof !== 'dusuk' && DISTRICTS[id].g != null);
  if (!ids.length) return; const did = pick(st, ids), d = DISTRICTS[did];
  const n = d.n + ' ' + pick(st, NEW_MALL) + ' AVM'; const id = 'n' + st.day + Math.floor(rnd(st) * 1000);
  const m = { id, n, p: code, dn: d.n, did, x: Math.round(d.mx + rr(st, -60, 60)), y: Math.round(d.my + rr(st, -40, 40)), s: rnd(st) < .5 ? 3 : 2, isNew: true, openDay: st.day + 7 };
  (st.newMalls = st.newMalls || []).push(m); st.mallVac = st.mallVac || {}; st.mallVac[id] = { until: st.day + 50, n: ri(st, 3, 5) }; delete st.listings['M:' + id];
  log(st, PROV[code].n + ' ' + d.n + '\'de ' + n + ' açılıyor. Açılışa özel indirimli dükkanlar var.', 'good');
  st.queue.push({ k: 'avmacilis', mall: id });
}

/* ---------- oyun içi satın alma ---------- */
// fiyatlar mağaza fiyat kademelerine göre (₺). Mobil sürümde window.KZIAP.purchase(sku) gerçek ödemeyi yapar.
const IAP = [
  { id: 'starter', cat: 'Teklif', n: 'Başlangıç paketi', d: '1,5 Mn ₺ + 5 itibar + 3 anında ruhsat bileti', price: 79.99, once: true, until: 30, tag: 'Tek seferlik · %60 avantaj', give: { cash: 1500000, rep: 5, tickets: 3 } },
  { id: 'cash_s', cat: 'Kasa', n: 'Kasa takviyesi', d: '500 B ₺ nakit', price: 29.99, give: { cash: 500000 } },
  { id: 'cash_m', cat: 'Kasa', n: 'Yatırımcı desteği', d: '2,5 Mn ₺ nakit', price: 99.99, tag: 'En çok tercih edilen', give: { cash: 2500000 } },
  { id: 'cash_l', cat: 'Kasa', n: 'Holding sermayesi', d: '10 Mn ₺ nakit', price: 299.99, tag: '%25 daha fazla', give: { cash: 10000000 } },
  { id: 'rep_s', cat: 'İtibar', n: 'Basın bülteni', d: '+5 marka itibarı', price: 49.99, give: { rep: 5 } },
  { id: 'rep_l', cat: 'İtibar', n: 'Ulusal kampanya', d: '+12 marka itibarı ve 20.000 takipçi', price: 129.99, give: { rep: 12, followers: 20000 } },
  { id: 'fol', cat: 'İtibar', n: 'Sosyal medya paketi', d: '+25.000 takipçi', price: 39.99, give: { followers: 25000 } },
  { id: 'tickets', cat: 'Hız', n: 'Anında ruhsat biletleri', d: '5 bilet: ruhsat beklemeden şubeyi hemen açar', price: 59.99, give: { tickets: 5 } },
  { id: 'moral', cat: 'Hız', n: 'Ekip kutlaması', d: 'Tüm şubelerde moral +25', price: 24.99, give: { moralAll: 25 } },
  { id: 'score', cat: 'Hız', n: 'Kredi notu danışmanlığı', d: 'Banka notu +300', price: 69.99, give: { score: 300 } },
  { id: 'noads', cat: 'Premium', n: 'Reklamsız', d: 'Reklam ödülleri video izlemeden anında gelir', price: 149.99, once: true, give: { noads: true } }
];
function iapState(st) { return st.iap = st.iap || { owned: {}, tickets: 0, spent: 0 }; }
function iapAvail(st, it) { const S = iapState(st); if (it.once && S.owned[it.id]) return false; if (it.until && st.day > it.until) return false; return true; }
function iapGive(st, id) {
  const it = IAP.find(x => x.id === id); if (!it || !iapAvail(st, it)) return { ok: false, msg: 'Bu paket şu an alınamıyor.' };
  const S = iapState(st), g = it.give, out = [];
  if (g.cash) { const v = Math.round(g.cash * st.world.refIdx / 1000) * 1000; st.cash += v; out.push(fmt(v)); }
  if (g.rep) { st.repBonus = (st.repBonus || 0) + g.rep; out.push('+' + g.rep + ' itibar'); }
  if (g.followers) { st.mkt.followers += g.followers; out.push('+' + g.followers.toLocaleString('tr-TR') + ' takipçi'); }
  if (g.tickets) { S.tickets += g.tickets; out.push(g.tickets + ' ruhsat bileti'); }
  if (g.moralAll) { for (const b of st.branches) b.moral = Math.min(100, b.moral + g.moralAll); out.push('moral +' + g.moralAll); }
  if (g.score) { st.bank.score = Math.min(1900, st.bank.score + g.score); out.push('kredi notu +' + g.score); }
  if (g.noads) { S.noads = true; out.push('reklamsız'); }
  S.owned[id] = (S.owned[id] || 0) + 1; S.spent += it.price;
  log(st, 'Mağaza: ' + it.n + ' · ' + out.join(', ') + '.', 'good'); return { ok: true, msg: it.n + ': ' + out.join(', ') };
}
function useTicket(st, bid) { const S = iapState(st), b = st.branches.find(x => x.id === bid); if (!b || b.status !== 'hazirlik' || S.tickets <= 0) return { ok: false, msg: 'Bilet yok.' }; S.tickets--; b.daysLeft = 0; b.status = 'acik'; b.openedDay = st.day; log(st, b.name + ' ruhsat bileti ile hemen açıldı.', 'good'); return { ok: true, msg: b.name + ' açıldı!' }; }

/* ---------- ödüllü reklamlar ---------- */
// sınırlar gerçek güne göre (mağaza oyunlarındaki gibi); ödüller küçük tutuldu
const AD_CAP = { offline: 4, ruhsat: 4, ilan: 3, incele: 3, ariza: 2, aybonus: 3, ihtar: 1, gunluk: 1, moral: 2 };
const AD_TOTAL = 15;
function adDay() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function adState(st) { const k = adDay(); if (!st.ads || st.ads.day !== k) st.ads = { day: k, n: {}, tot: 0 }; return st.ads; }
function adLeft(st, kind) { const a = adState(st); return Math.max(0, Math.min((AD_CAP[kind] || 1) - (a.n[kind] || 0), AD_TOTAL - a.tot)); }
function adMark(st, kind) { const a = adState(st); a.n[kind] = (a.n[kind] || 0) + 1; a.tot++; }
function monthBonus(st, r) { const cap = Math.round(150000 * st.world.refIdx / 1000) * 1000; return r && r.profit > 0 ? Math.min(cap, Math.max(40000, Math.round(r.profit * .2 / 1000) * 1000)) : Math.round(40000 * st.world.refIdx / 1000) * 1000; }
function dailyGift(st) { return Math.round(40000 * st.world.refIdx / 1000) * 1000; }
function adReward(st, kind, arg) {
  if (!adLeft(st, kind)) return { ok: false, msg: 'Bugünlük bu ödülün hakkı doldu.' };
  let msg = '';
  if (kind === 'ruhsat') { const b = st.branches.find(x => x.id === arg); if (!b || b.status !== 'hazirlik') return { ok: false }; b.daysLeft -= 3; if (b.daysLeft <= 0) { b.daysLeft = 0; b.status = 'acik'; b.openedDay = st.day; log(st, b.name + ' ruhsatlarını aldı ve açıldı.', 'good'); msg = b.name + ' açıldı!'; } else msg = 'Ruhsat 3 gün kısaldı: ' + b.daysLeft + ' gün kaldı.'; }
  else if (kind === 'ilan') { refreshListings(st, arg.did, arg.type, 0); msg = 'Yeni ilanlar ücretsiz listelendi.'; }
  else if (kind === 'incele') { const L = (arg.mall ? mallListings(st, arg.mall) : getListings(st, arg.did, arg.type)).find(x => x.id === arg.id); if (!L || L.inspected) return { ok: false }; L.inspected = true; msg = 'Dükkan ücretsiz incelendi.'; }
  else if (kind === 'aybonus') { const r = st.reports[arg]; if (!r || r.adBonus) return { ok: false }; const v = monthBonus(st, r); r.adBonus = v; st.cash += v; st.month.extra += v; msg = fmt(v) + ' sponsor primi kasaya geçti.'; }
  else if (kind === 'ihtar') { if (!st.bank.warn || st.bank.warn.ad) return { ok: false }; st.bank.warn.until += 5; st.bank.warn.ad = true; msg = 'Banka 5 gün ek süre verdi.'; }
  else if (kind === 'offline') { const o = st.offlineLast; if (!o || o.doubled) return { ok: false }; o.doubled = true; st.cash += o.amt; st.month.extra += o.amt; msg = 'Kazancın ikiye katlandı: +' + fmt(o.amt) + '.'; }
  else if (kind === 'gunluk') { const v = dailyGift(st); st.cash += v; st.month.extra += v; msg = 'Günlük ödül: ' + fmt(v) + '.'; }
  else if (kind === 'moral') { const b = st.branches.find(x => x.id === arg); if (!b) return { ok: false }; b.moral = Math.min(100, b.moral + 12); msg = 'Ekibe ikram: moral +12.'; }
  else if (kind === 'ariza') { msg = 'Servis ücretsiz geldi.'; }
  adMark(st, kind); return { ok: true, msg };
}

/* ---------- hedefler ---------- */
// ödüller orta düzeyde: hissedilir ama oyunu bozmaz
const GOALS = [
  { id: 'ilk', n: 'İlk dükkan', d: 'İlk şubeni aç', r: { cash: 60000 }, f: st => st.branches.length >= 1 },
  { id: 'karli', n: 'İlk kârlı ay', d: 'Bir ayı işletme kârıyla kapat', r: { cash: 75000 }, f: st => st.reports.some(r => r.profit > 0) },
  { id: 'menu', n: 'Menüyü ayarla', d: 'Bir ürünün fiyatını değiştir', r: { rep: 3 }, f: st => !!st.flags.priceSet },
  { id: 'iki', n: 'İkinci şube', d: '2 şubeye ulaş', r: { cash: 105000 }, f: st => st.branches.length >= 2 },
  { id: 'mudur', n: 'Emanet ellerde', d: 'Bir şubeye müdür ata', r: { rep: 5 }, f: st => st.branches.some(b => b.manager) },
  { id: 'yildiz', n: 'Yıldızlı şube', d: 'Bir şubenin puanı 4,6 olsun', r: { followers: 4500 }, f: st => st.branches.some(b => b.rating >= 4.6 && b.rc > 120) },
  { id: 'takipci', n: 'Sosyal medya', d: '10.000 takipçiye ulaş', r: { cash: 90000 }, f: st => st.mkt.followers >= 10000 },
  { id: 'uc_il', n: 'Yola çık', d: '3 farklı ilde şube', r: { cash: 150000 }, f: st => new Set(st.branches.map(b => DISTRICTS[b.d].p)).size >= 3 },
  { id: 'metro', n: 'Raylı sistem', d: 'Bir metro kiosku aç', r: { rep: 5 }, f: st => st.branches.some(b => b.type === 'metro') },
  { id: 'bes', n: 'Zincir oldu', d: '5 şubeye ulaş', r: { cash: 225000 }, f: st => st.branches.length >= 5 },
  { id: 'milyon', n: 'Aylık 1 milyon', d: 'Bir ayı 1 Mn ₺ işletme kârıyla kapat', r: { cash: 180000 }, f: st => st.reports.some(r => r.profit >= 1e6) },
  { id: 'nisantasi', n: 'Nişantaşı', d: 'Nişantaşı\'nda şube aç', r: { followers: 12000 }, f: st => st.branches.some(b => b.d === 'nisantasi') },
  { id: 'bagdat', n: 'Bağdat Caddesi', d: 'Bağdat Caddesi\'nde şube aç', r: { followers: 12000 }, f: st => st.branches.some(b => b.d === 'bagdat') },
  { id: 'pub', n: 'Gece hayatı', d: 'Bir pub aç', r: { rep: 5 }, f: st => st.branches.some(b => b.type === 'pub') },
  { id: 'ramazan', n: 'Ramazan\'ı atlat', d: 'Ramazan ayını kârla kapat', r: { cash: 90000 }, f: st => !!st.flags.ramProfit },
  { id: 'borcsuz', n: 'Borçsuz', d: 'Kredi kullanıp tamamen kapat', r: { rep: 5 }, f: st => !!st.flags.loanUsed && !st.bank.loans.length },
  { id: 'on', n: 'On şube', d: '10 şubeye ulaş', r: { cash: 360000 }, f: st => st.branches.length >= 10 },
  { id: 'bes_mn', n: 'Aylık 5 milyon', d: 'Bir ayı 5 Mn ₺ işletme kârıyla kapat', r: { cash: 450000 }, f: st => st.reports.some(r => r.profit >= 5e6) },
  { id: 'tesis', n: 'Kendi kavurmanı yap', d: 'Kendi kahve tesisini kur', r: { rep: 7 }, f: st => st.supply.kahve === 2 }
];
function goalReward(st, g) { const r = g.r, o = []; if (r.cash) { const v = Math.round(r.cash * st.world.refIdx / 1000) * 1000; st.cash += v; st.month.extra += v; o.push(fmt(v)); } if (r.rep) { st.repBonus = (st.repBonus || 0) + r.rep; o.push('+' + r.rep + ' itibar'); } if (r.followers) { st.mkt.followers += r.followers; o.push('+' + r.followers.toLocaleString('tr-TR') + ' takipçi'); } return o.join(', '); }
function checkGoals(st) {
  st.goals = st.goals || {};
  for (const g of GOALS) { if (st.goals[g.id]) continue; let ok = false; try { ok = g.f(st); } catch (e) {} if (ok) { const rw = goalReward(st, g); st.goals[g.id] = st.day; log(st, 'Hedef tamamlandı: ' + g.n + ' · ödül ' + rw + '.', 'good'); st.queue.push({ k: 'hedef', g: g.id, rw }); } }
}

/* ---------- müşteri yorumları ---------- */
const REV_TXT = {
  fiyat: { neg: ['Fiyatlar semtin çok üstünde, bir latte için bu kadar vermem.', 'Lezzet fena değil ama bu fiyata bir daha gelmem.', 'Hesap gelince şaşırdık, pahalı.', 'Çay fiyatı abartı, mahallede yarı fiyatına var.', 'Porsiyonlar küçük, fiyatlar büyük.'], pos: ['Fiyatlar gayet makul, öğrenci dostu.', 'Bu kaliteye bu fiyat, mahallenin en iyisi.', 'Cebi yakmayan güzel bir yer.', 'Hesap geldiğinde şaşırdık, beklediğimizden uygundu.'] },
  bekleme: { neg: ['Sipariş için 15 dakika kuyrukta bekledim.', 'Çalışan sayısı yetersiz, kasa hep kalabalık.', 'Oturacak yer bulamadık, çıkıp gittik.', 'Kahvem gelene kadar toplantım bitti.', 'Öğle arası gelmeyin, sıra bitmiyor.'], pos: ['Siparişim çok hızlı geldi.', 'Kalabalık olmasına rağmen hızlılar.', 'Sabah yoğunluğunda bile 2 dakikada kahvem elimdeydi.'] },
  kalite: { neg: ['Kahve yanık tadındaydı.', 'Tatlılar bayattı, kahve de sıradan.', 'Süt fazla ısıtılmış, latte acı çıktı.', 'Tost soğuk geldi.'], pos: ['Kahveleri gerçekten çok iyi, çekirdeği belli.', 'Cheesecake efsane, kahve de çok taze.', 'Filtre kahvesi şehrin en iyilerinden.', 'Latte art bile yapıyorlar, tadı da çok dengeli.', 'Brownie sıcak servis edildi, harikaydı.'] },
  dekor: { neg: ['Mekan biraz bakımsız, sandalyeler rahatsız.', 'Dekor semtin seviyesinin altında kalmış.', 'Işıklar çok sert, uzun oturulmuyor.', 'Tuvalet temiz değildi.'], pos: ['Mekan çok şık, fotoğraf için harika.', 'Ferah ve sıcak bir ortam, çalışmak için ideal.', 'Müzik seçimi ve ışıklar çok iyi.', 'Prizler her masada var, laptopla rahat çalıştım.'] },
  sigara: { neg: ['Sigara içilebilecek bir alan yok, arkadaşlarla oturamadık.', 'Dışarıda oturacak yer olsa daha çok gelirdik.'], pos: ['Dış alanı çok keyifli.', 'Ön taraftaki masalar akşamları çok güzel.'] },
  ekip: { neg: ['Çalışanlar mutsuz ve ilgisiz görünüyor.', 'Personel çok soğuk davrandı.', 'Siparişimi iki kez yanlış getirdiler.'], pos: ['Ekip çok güler yüzlü, ismimizi bile hatırlıyorlar.', 'Barista çok ilgiliydi, öneriler verdi.', 'Çalışanlar çok nazik, kendimizi evde hissettik.'] }
};
const REV_NAMES = ['Elif K.', 'Burak T.', 'Selin A.', 'Mert Y.', 'Zehra D.', 'Can Ö.', 'İrem S.', 'Kaan B.', 'Defne G.', 'Oğuz E.', 'Nazlı Ç.', 'Arda P.', 'Ece M.', 'Tolga U.', 'Pınar H.', 'Yusuf A.'];
function genReviews(st, b, t) {
  if (!t.cust || !t.sc || !t.sc.n) return;
  const n = t.cust * .012; let k = Math.floor(n) + (rnd(st) < n % 1 ? 1 : 0); k = Math.min(k, 2); if (!k) return;
  const sc = t.sc, avg = t.satSum / t.cust; const comp = {}; for (const x in REV_TXT) comp[x] = sc[x] / sc.n;
  b.reviews = b.reviews || [];
  for (let i = 0; i < k; i++) {
    const stars = clamp(Math.round(1 + (avg - 25) / 12.5 + rr(st, -1.1, 1.1)), 1, 5);
    const keys = Object.keys(comp); let key, pol;
    pol = stars <= 3 ? 'neg' : 'pos';
    // bileşenin gücüne göre ağırlıklı seçim; nötr bileşenler de az olasılıkla konu olur
    const ws = keys.map(x => { const v = pol === 'neg' ? -comp[x] : comp[x]; return Math.max(.4, v) + (x === 'kalite' ? 1.2 : x === 'ekip' ? .6 : 0); });
    let r0 = rnd(st) * ws.reduce((a2, c2) => a2 + c2, 0); key = keys[0]; for (let j = 0; j < keys.length; j++) { r0 -= ws[j]; if (r0 <= 0) { key = keys[j]; break; } }
    const pool = (REV_TXT[key][pol] || REV_TXT.kalite[pol]).filter(x => !b.reviews.slice(0, 6).some(r => r.t === x));
    const txt = pool.length ? pick(st, pool) : pick(st, REV_TXT.kalite[pol]);
    b.reviews.unshift({ day: st.day, s: stars, n: pick(st, REV_NAMES), t: txt, k: key, p: pol });
  }
  b.reviews = b.reviews.slice(0, 40);
}
function reviewSummary(b) {
  const rs = (b.reviews || []).slice(0, 30); const c = {};
  for (const r of rs) { c[r.k] = c[r.k] || { pos: 0, neg: 0 }; c[r.k][r.p]++; }
  return { n: rs.length, avg: rs.length ? rs.reduce((a, r) => a + r.s, 0) / rs.length : 0, c };
}

/* ---------- zaman ---------- */
// ilk haftalardaki küçük başarı anları (oyunu durdurmaz, köşede kutlama notu olarak çıkar)
const START_REC = [
  { d: 'd34_beyoglu', why: 'Turist ve yaya trafiği yüksek' },
  { d: 'd35_bornova', why: 'Öğrenci şehri, kira makul' },
  { d: 'd06_yenimahalle', why: 'Kalabalık ve rekabet düşük' }
].filter(r => DISTRICTS[r.d]);
function note(st, t, s, big) { (st.notes || (st.notes = [])).push({ t, s, big: !!big }); }
function msHour(st) {
  const M = st.ms || (st.ms = {});
  if (!M.c1) { const b = st.branches.find(x => x.status === 'acik' && x.today && x.today.cust >= 1); if (b) { M.c1 = 1; note(st, 'İlk müşterin geldi', b.name + ' kapısından ilk müşteri içeri girdi.', true); } }
  let ct = M.ct || 0, rt = M.rt || 0; for (const b of st.branches) if (b.status === 'acik' && b.today) { ct += b.today.cust || 0; rt += b.today.rev || 0; }
  const steps = [['c100', ct >= 100, 'İlk 100 müşteri', 'Dükkanına toplam 100 kişi uğradı.'], ['c1k', ct >= 1000, '1.000 müşteri', 'Mahallede adın duyulmaya başladı.'],
    ['r10k', rt >= 10000, 'İlk 10.000 ₺ ciro', 'Toplam satışların 10 bini geçti.'], ['r100k', rt >= 100000, '100.000 ₺ ciro', 'Toplam satışların 100 bini geçti.'], ['r1m', rt >= 1e6, '1 milyon ₺ ciro', 'Toplam satışların 1 milyonu geçti.']];
  for (const [k, ok, t, sub] of steps) if (ok && !M[k]) { M[k] = 1; note(st, t, sub, k === 'r1m' || k === 'c1k'); return; }
}
function msDay(st) {
  const M = st.ms || (st.ms = {}); const op = st.branches.filter(b => b.status === 'acik' && b.yesterday);
  for (const b of op) { M.ct = (M.ct || 0) + (b.yesterday.cust || 0); M.rt = (M.rt || 0) + (b.yesterday.rev || 0); }
  if (!M.s5) { for (const b of op) { const r = (b.reviews || []).find(x => x.s >= 5 && x.day >= st.day - 1); if (r) { M.s5 = 1; note(st, 'İlk 5 yıldızlı yorum', r.n + ': “' + r.t + '”', true); break; } } }
  if (!M.best && op.length) { const b = op[0]; if (b.hist.length >= 4) { const last = b.hist[b.hist.length - 1].rev, prev = Math.max(...b.hist.slice(0, -1).map(h => h.rev)); if (last > prev * 1.05 && st.day < 120) { M.best = st.day; note(st, 'Rekor gün', b.name + ' bugün ' + fmt(last) + ' ile en iyi gününü yaptı.'); } } }
  for (const b of op) { b.ms = b.ms || {};
    if (!b.ms.w1 && st.day - b.openedDay >= 6 && b.hist.length >= 7) { b.ms.w1 = 1; const h = b.hist.slice(-7); const rv = h.reduce((a, x) => a + x.rev, 0), cu = h.reduce((a, x) => a + x.cust, 0), ls = h.reduce((a, x) => a + x.lost, 0);
      note(st, 'İlk hafta · ' + b.name, '7 günde ' + fmt(rv) + ' ciro, ' + cu.toLocaleString('tr-TR') + ' müşteri, puan ★ ' + b.rating.toFixed(1) + (ls > cu * .1 ? '. ' + ls + ' kişi bekleyemeden gitti, personel ya da masa ekleyebilirsin.' : '.'), true); }
  }
}
// uygulama kapalıyken kazanç: her saat yokluk ≈ 0,8 günlük net kâr, en fazla 12 saat
function offlineEarn(st, now) {
  if (!st || !st.savedAt || st.over) return null;
  const mins = (now - st.savedAt) / 60000; if (mins < 10) return null;
  const open = st.branches.filter(b => b.status === 'acik'); if (!open.length) return null;
  let daily = 0; const R = st.reports.slice(-2);
  if (R.length) daily = R.reduce((a, r) => a + r.profit, 0) / R.length / 30;
  else open.forEach(b => { const h = (b.hist || []).slice(-7); if (h.length) daily += h.reduce((a, x) => a + x.rev, 0) / h.length * .12; });
  if (!(daily > 0)) return null;
  const hrs = Math.min(12, mins / 60), amt = Math.round(daily * hrs * .8 / 500) * 500;
  if (amt < 1000) return null;
  return { hrs, amt, capped: mins / 60 > 12 };
}
function claimOffline(st, o) { st.cash += o.amt; st.month.extra += o.amt; st.offlineLast = { amt: o.amt, doubled: false }; log(st, 'Sen yokken şubeler ' + fmt(o.amt) + ' kazandı.', 'good'); }
function tickHour(st) {
  if (st.over) return;
  for (const b of st.branches) branchHour(st, b, st.hour);
  msHour(st);
  st.hour++;
  if (st.hour >= 24) { st.hour = 0; endDay(st); msDay(st); }
}

function endDay(st) {
  const prevMonth = dateOf(st.day).getUTCMonth();
  for (const b of st.branches) {
    if (b.status === 'hazirlik') {
      b.daysLeft--; if (b.daysLeft <= 0) { b.status = 'acik'; b.openedDay = st.day + 1; log(st, b.name + ' ruhsatlarını aldı ve açıldı.', 'good'); }
      continue;
    }
    const t = b.today;
    if (t.cust > 0) {
      const avg = t.satSum / t.cust; b.lastSat = avg;
      const stars = clamp(1 + (avg - 25) / 12.5, 1, 5);
      const nr = Math.max(1, t.cust * .03);
      b.rating = (b.rating * b.rc + stars * nr) / (b.rc + nr); b.rc = Math.min(300, b.rc + nr);
    }
    if (b.delivery && t.rev > 0) { const dv = t.rev * .1; t.rev += dv; t.cogs += dv * .36 + dv * .28; t.cust += dv / 180; }
    const card = t.rev * .85, cash = t.rev - card;
    const rate = Math.max(.008, (b.valor === '30' ? BANKS[b.bank].pos30 : BANKS[b.bank].pos0) - (b.posDisc || 0));
    const com = card * rate;
    st.cash += cash - t.cogs;
    if (b.valor === '30') st.pending.push({ day: st.day + 30, amt: card - com }); else st.cash += card - com;
    const m = st.month; m.rev += t.rev; m.cogs += t.cogs; m.cust += t.cust; m.lost += t.lost; m.pos += com;
    const bm = b.mAcc; bm.rev += t.rev; bm.cogs += t.cogs; bm.cust += t.cust; bm.lost += t.lost; bm.pos = (bm.pos || 0) + com; if (t.cust > 0) bm.days = (bm.days || 0) + 1;
    b.hist.push({ rev: Math.round(t.rev), cust: Math.round(t.cust), lost: Math.round(t.lost) }); if (b.hist.length > 30) b.hist.shift();
    genReviews(st, b, t);
    b.yesterday = t; b.today = blankDay(); b.occ = [];
    // moral
    const need = minStaff(b.concept, b.tables);
    let target = 70 + WAGES[b.wage].moral + (b.manager ? MGR_LVL[b.manager.lvl].moral : 0) + (b.staff < need ? -22 : 0) + (b.promoBoost && b.promoBoost >= st.day ? 12 : 0) + (b.promoCut && b.promoCut >= st.day ? -10 : 0);
    b.moral += (target - b.moral) * .08;
    if (ARCH[b.arch].growing && b.growth < 1) b.growth = Math.min(1, b.growth + .006);
  }
  if (st.world.costDelay && st.world.costDelay.at <= st.day) { st.world.costIdx *= st.world.costDelay.m; st.world.costDelay = null; }
  // valör
  if (st.pending.length) { const due = st.pending.filter(p => p.day <= st.day + 1); for (const p of due) st.cash += p.amt; st.pending = st.pending.filter(p => p.day > st.day + 1); }
  // kmh
  if (st.cash < 0) { spend(st, -st.cash * .0017, 'faiz'); st.bank.negDays++; st.bank.negStreak = (st.bank.negStreak || 0) + 1; } else { st.bank.negStreak = 0; if (st.bank.warn) { st.bank.warn = null; log(st, 'Kasa artıya geçti, banka ihtarı kalktı.', 'good'); } }
  if (st._ram && st._ram.phase === 'ramazan') st.month.ramD = (st.month.ramD || 0) + 1;
  // pazarlama günlük
  dailyMarketing(st);
  (st.cashHist = st.cashHist || []).push(Math.round(st.cash)); if (st.cashHist.length > 60) st.cashHist.shift();
  st.day++;
  st.ctx = dayCtx(st); st._ram = ramadanInfo(st.day); st._kur = kurbanInfo(st.day);
  if (st._kur.phase === 'once' && st._kur.left === 10) log(st, 'Kurban Bayramı 10 gün sonra. Büyükşehirler boşalır, memleket illeri ve tatil yerleri dolar.', 'info');
  if (st._kur.phase === 'kurban' && st._kur.d === -2) log(st, 'Bayram yolculuğu başladı: büyükşehirlerde sokaklar sakinleşiyor.', 'info');
  if (st._ram.phase === 'once' && st._ram.left === 10) log(st, 'Ramazan 10 gün sonra başlıyor. Muhafazakâr semtlerde gündüz cirosu düşer, iftar sonrası canlanır.', 'info');
  if (st._ram.phase === 'ramazan' && st._ram.d === 0) log(st, 'Ramazan başladı. Gündüz satışları semtine göre azalacak; akşamları iftar sonrası yoğunluk olur.', 'info');
  if (st._ram.phase === 'bayram' && st._ram.d === 0) log(st, 'Ramazan Bayramı: 3 gün aileler ve misafirler sokakta.', 'good');
  checkGoals(st);
  if (st.day % 7 === 0) evolveRivals(st);
  maybeNewMall(st);
  for (const b of st.branches) { segWeights(st, b); computeOffer(st, b); }
  st.world.mods = st.world.mods.filter(x => x.until >= st.day);
  for (const b of st.branches) b.boosts = b.boosts.filter(x => x.until >= st.day);
  const newMonth = dateOf(st.day).getUTCMonth() !== prevMonth;
  if (newMonth) endMonth(st);
  rollEvent(st);
  checkCrisis(st);
}

function dailyMarketing(st) {
  const k = st.mkt; const A = AGENCIES[k.agency];
  const open = st.branches.filter(b => b.status === 'acik').length;
  const org = open * (2 + Math.random() * 3) + k.followers * .0006;
  k.followers += Math.round(org + (A.fol || 0) * k.agencyQ * (1 + open * .15));
  k.buzz = Math.max(0, k.buzz * .97 + (A.buzz || 0) * k.agencyQ);
  k.campaigns = k.campaigns.filter(c => c.until >= st.day);
}

function endMonth(st) {
  const label = monthLabel(st.day - 1);
  const cat = Object.assign({}, st.month.cat || {}); const invest = cat.yatirim || 0; delete cat.yatirim;
  const rep = { label, day: st.day, rev: 0, cogs: 0, rent: 0, wages: 0, util: 0, opex: 0, pos: 0, kdv: 0, other: st.month.other, cat, invest, mkt: st.month.mkt, supply: 0, loans: 0, tax: 0, partner: 0, extra: 0, dividends: 0, branches: [] };
  const wageIdx = st.world.wageIdx, costIdx = st.world.costIdx;
  for (const b of st.branches) {
    const bm = b.mAcc; const T = TYPES[b.type];
    let rent = b.rent; if (b.discountLeft > 0) { rent = Math.round(rent * .5); b.discountLeft--; }
    const ciro = bm.rev * (b.ciro || 0);
    const wages = b.staff * WAGES[b.wage].cost * wageIdx;
    const util = utilCost(st, b) + (b.useFront && !b.flic ? b.aptFee : 0) + (b.aidat || 0) + (b.type === 'pub' || b.type === 'rooftop' ? (90000 * wageIdx + 15000) : 0);
    const opex = bm.rev * .045; // sarf, temizlik, bakım, fire
    const mgr = (b.manager ? b.manager.wage * wageIdx : 0) + (b.interns && b.interns.until >= st.day - 30 ? b.interns.n * 21000 * wageIdx : 0);
    const extra = b.extraRev || 0;
    const kdv = Math.max(0, (bm.rev + extra - bm.cogs) * (T.kdv / (1 + T.kdv)));
    const pos = bm.pos || 0;
    const profit = bm.rev + extra - bm.cogs - rent - ciro - wages - mgr - util - opex - kdv - pos;
    rep.rev += bm.rev + extra; rep.cogs += bm.cogs; rep.rent += rent + ciro; rep.wages += wages + mgr; rep.util += util; rep.opex += opex; rep.kdv += kdv; rep.pos += pos; rep.extra += extra;
    rep.branches.push({ id: b.id, name: b.name, rev: bm.rev + extra, profit, cust: Math.round(bm.cust), lost: Math.round(bm.lost), status: b.status, why: b.status === 'acik' ? monthDrivers(st, b) : null });
    if (b.status === 'acik' && b.openedDay < st.day - 20) { if (profit < 0) b.lossMonths++; else b.lossMonths = 0; }
    b.lastMonth = { rev: bm.rev + extra, profit, cust: Math.round(bm.cust), lost: Math.round(bm.lost), why: rep.branches[rep.branches.length - 1].why };
    b.mHist = (b.mHist || []).concat([{ l: label, rev: Math.round(bm.rev + extra), profit: Math.round(profit) }]).slice(-12);
    // kira artışı yıldönümü
    if (st.day - b.contractStart >= 360 && ((st.day - b.contractStart) % 365) < 31 && !b.raisedYear && !(b.rentLock > st.day)) { b.raisedYear = true; st.queue.push({ k: 'kira', b: b.id }); }
    if (((st.day - b.contractStart) % 365) > 40) b.raisedYear = false;
    if (b.manager && b.manager.autoPrice && b.lastRef) { const k = st.world.refIdx * 1.021 / b.lastRef; if (k > 1.005) { for (const id in b.menu) b.menu[id].price = Math.round(b.menu[id].price * k / 5) * 5; log(st, b.manager.n + ' (' + b.name + ') fiyatları enflasyona göre %' + Math.round((k - 1) * 100) + ' güncelledi.', 'info'); } }
    b.lastRef = st.world.refIdx * 1.021;
    b.lastItems = b.mAcc.it || null;
    b.mAcc = blankBM(); b.extraRev = 0;
  }
  // tedarik sabit giderleri
  rep.supply = SUPPLY.kahve[st.supply.kahve].monthly + SUPPLY.tatli[st.supply.tatli].monthly;
  // ajans
  rep.mkt += AGENCIES[st.mkt.agency].fee;
  // muhasebe
  rep.other += 10000 + 2500 * st.branches.length; rep.cat.muhasebe = 10000 + 2500 * st.branches.length;
  // krediler
  for (const l of st.bank.loans) { if (l.left > 0) { rep.loans += l.pay; l.left--; l.paidInt = (l.paidInt || 0) + l.bal * l.r; l.bal = Math.max(0, l.bal * (1 + l.r) - l.pay); } }
  st.bank.loans = st.bank.loans.filter(l => l.left > 0);
  // ortaklık temettü
  for (const s of st.invest.stakes) { const p = s.base * rr(st, .4, 1.5) * st.world.refIdx; s.last = Math.round(p * s.pct); rep.dividends += s.last; s.val = Math.round(s.val * rr(st, .97, 1.05)); }
  const pre = rep.rev - rep.cogs - rep.rent - rep.wages - rep.util - rep.opex - rep.kdv - rep.pos - rep.supply - rep.mkt - rep.other + rep.dividends;
  rep.tax = pre > 0 ? pre * .2 : 0;
  rep.partner = st.partner && pre > 0 ? (pre - rep.tax) * st.partner : 0;
  // nakit: ciro, cogs, pos, other, mkt zaten günlük/anlık düşüldü. Burada aylık sabitler ödenir.
  const payNow = rep.rent + rep.wages + rep.util + rep.opex + rep.kdv + rep.supply + AGENCIES[st.mkt.agency].fee + 10000 + 2500 * st.branches.length + rep.loans + rep.tax + rep.partner - rep.dividends;
  st.cash -= payNow;
  rep.profit = pre - rep.tax - rep.partner; if ((st.month.ramD || 0) >= 15 && rep.profit > 0) st.flags.ramProfit = true; rep.cashFlow = rep.profit - rep.invest - rep.loans;
  rep.cashEnd = st.cash;
  rep.cust = Math.round(st.month.cust); rep.lost = Math.round(st.month.lost);
  st.reports.push(rep); if (st.reports.length > 24) st.reports.shift();
  st.flags = st.flags || {};
  if (!st.flags.kosgeb && rep.profit < 0 && st.day < 150 && st.branches.length <= 2) {
    const g = Math.min(150000, Math.round(-rep.profit * .6 / 1000) * 1000);
    if (g >= 5000) { st.flags.kosgeb = true; st.cash += g; rep.kosgeb = g; log(st, 'KOSGEB girişimci desteği: ' + fmt(g) + ' hibe kasaya geçti.', 'good');
      (st.notes || (st.notes = [])).push({ t: 'Girişimci desteği', s: 'İlk ayın zorlu geçti. KOSGEB ' + fmt(g) + ' hibe verdi; fiyatları ve personeli gözden geçir.', big: true }); }
  }
  st.month = blankMonth();
  // kredi notu
  st.bank.score = clamp(st.bank.score + (st.bank.negDays === 0 ? 10 : -st.bank.negDays * 3), 300, 1900);
  st.bank.negDays = 0;
  // enflasyon
  st.world.refIdx *= 1.021; st.world.costIdx *= 1.022;
  const m = dateOf(st.day).getUTCMonth();
  if (m === 0 || m === 6) { st.world.wageIdx *= 1.14; st.queue.push({ k: 'asgari' }); }
  // promosyon süresi
  if (st.bank.promo && st.bank.promo.until <= st.day) st.bank.promo = null;
  refreshInfluencers(st);
  if (counts(st).all >= 5) refreshOffers(st);
  for (const b of st.branches) if (b.lossMonths === 3) st.queue.push({ k: 'zarar', b: b.id });
  st.queue.unshift({ k: 'rapor', r: st.reports.length - 1 });
  checkUnlocks(st);
}

/* ---------- krediler ---------- */
function addLoan(st, type, amt, r, n, silent) {
  const pay = amt * r / (1 - Math.pow(1 + r, -n));
  st.bank.loans.push({ type, amt, bal: amt, r, n, left: n, pay: Math.round(pay) });
  st.flags.loanUsed = true; st.cash += amt; if (!silent) log(st, fmt(amt) + ' kredi kullanıldı. Aylık taksit ' + fmt(pay) + '.', 'info');
}
function avgRev(st, n) { const r = st.reports.slice(-n); if (!r.length) return 0; return r.reduce((a, x) => a + x.rev, 0) / r.length; }
function loanOffers(st) {
  const sc = st.bank.score, bank = BANKS[st.bank.payroll || 'lira'];
  const adj = (1350 - sc) / 100 * .002 + bank.loan;
  const c = counts(st); const months = st.reports.length;
  const o = [];
  o.push({ id: 'ihtiyac', n: 'Bireysel ihtiyaç kredisi', r: .042 + adj, n_: 24, lim: Math.round(750000 * clamp(sc / 1350, .4, 1.4) / 1000) * 1000, ok: true, why: 'Kurucunun kişisel sorumluluğunda.' });
  const ar = avgRev(st, 3);
  o.push({ id: 'kobi', n: 'KOBİ işletme kredisi', r: .034 + adj, n_: 36, lim: Math.round(ar * 3 * clamp(sc / 1350, .4, 1.4) / 1000) * 1000, ok: months >= 3 && ar > 0, why: months >= 3 ? 'Ciro geçmişine göre limit.' : '3 aylık ciro geçmişi gerekir.' });
  o.push({ id: 'yatirim', n: 'Yatırım kredisi', r: .029 + adj, n_: 48, lim: Math.round(ar * 6 * clamp(sc / 1350, .4, 1.4) / 1000) * 1000, ok: c.all >= 2 && months >= 3, why: c.all >= 2 ? 'Yeni şube veya tesis için, uzun vade.' : 'En az 2 şube gerekir.' });
  const totalPay = st.bank.loans.reduce((a, l) => a + l.pay, 0);
  for (const x of o) { if (sc < 700) { x.ok = false; x.why = 'Kredi notun çok düşük.'; } if (ar && totalPay > ar * .35 && x.id !== 'ihtiyac') { x.ok = false; x.why = 'Mevcut borç servisin cironun %35\'ini aşıyor.'; } }
  return o;
}
function kmhLimit(st) { return Math.round((300000 + avgRev(st, 3) * .4) / 1000) * 1000; }

/* ---------- POS ve promosyon ---------- */
function posTalk(st, b) {
  if (st.day - (b.posTalk || -999) < 60) return { ok: false, msg: 'Banka bu şube için 60 gün içinde tekrar görüşmez.' };
  b.posTalk = st.day;
  const vol = (b.lastMonth ? b.lastMonth.rev : 0) * .85; const total = avgRev(st, 1) * .85;
  const chance = clamp(.15 + vol / 3e6 + total / 1.5e7, .1, .85);
  if (rnd(st) < chance) { b.posDisc = (b.posDisc || 0) + .002; return { ok: true, msg: 'Banka komisyonu 0,20 puan indirdi.' }; }
  return { ok: false, msg: 'Banka teklifi kabul etmedi. Ciron büyüyünce tekrar dene.' };
}
function promoOffer(st) {
  const n = counts(st).staff; if (n < 10) return null;
  const per = n < 25 ? 4500 : n < 50 ? 7500 : n < 100 ? 10000 : 13000;
  const offers = Object.keys(BANKS).map(id => ({ bank: id, per: Math.round(per * BANKS[id].promo / 100) * 100 }));
  return { staff: n, offers };
}
function takePromo(st, bank, per, distribute) {
  const n = counts(st).staff; const total = per * n;
  st.bank.payroll = bank; st.bank.promo = { bank, per, until: st.day + 365 * 3, distribute };
  if (distribute) { for (const b of st.branches) b.promoBoost = st.day + 180; log(st, 'Maaş promosyonu (' + fmt(total) + ') personele dağıtıldı. Moral yükseldi.', 'good'); }
  else { st.cash += total; for (const b of st.branches) b.promoCut = st.day + 120; log(st, 'Maaş promosyonu (' + fmt(total) + ') şirkette tutuldu. Personel memnun değil.', 'warn'); }
}

/* ---------- pazarlama ---------- */
function postContent(st, kind) {
  if (st.mkt.lastPost === st.day) return { ok: false, msg: 'Bugün zaten paylaşım yaptın.' };
  st.mkt.lastPost = st.day;
  const decorBest = st.branches.reduce((a, b) => Math.max(a, DECOR[b.decor].dek), -6);
  const kf = { urun: 1, kampanya: 1.2, mekan: 1 + (decorBest + 6) / 14, ekip: .9 }[kind] || 1;
  const gain = Math.round((40 + st.mkt.followers * .006) * kf * rr(st, .4, 1.9) * (st.mkt.agency !== 'none' ? 1.3 * st.mkt.agencyQ : 1));
  st.mkt.followers += gain; st.mkt.buzz += .3 * kf;
  return { ok: true, msg: 'Paylaşım ' + gain.toLocaleString('tr-TR') + ' yeni takipçi getirdi.' };
}
function setAgency(st, id) {
  if (st.mkt.agency === id) return;
  st.mkt.agency = id; st.mkt.agencySince = st.day; st.mkt.agencyQ = id === 'none' ? 1 : +rr(st, .6, 1.3).toFixed(2);
  log(st, id === 'none' ? 'Ajans sözleşmesi sonlandırıldı.' : AGENCIES[id].n + ' ile çalışmaya başlandı.', 'info');
}
function startCampaign(st, target, budget, days) {
  if (st.cash < budget) return { ok: false, msg: 'Nakit yetersiz.' };
  st.cash -= budget; st.month.mkt += budget;
  const fatigue = st.day - st.mkt.lastCampaign < 30 ? .8 : 1; st.mkt.lastCampaign = st.day;
  const eff = (AGENCIES[st.mkt.agency].adEff || 1) * (st.mkt.agency === 'performans' ? st.mkt.agencyQ : 1) * fatigue;
  const targets = target === 'all' ? st.branches.filter(b => b.status !== 'kapali') : st.branches.filter(b => b.id === +target);
  const per = budget / Math.max(1, targets.length) / days;
  const mult = 1 + clamp(per / 4000 * .09 * eff, .02, .6);
  for (const b of targets) b.boosts.push({ k: 'reklam', mult, until: st.day + days });
  const reach = Math.round(budget / 45 * 1000);
  st.mkt.followers += Math.round(reach * .002);
  st.mkt.buzz += budget / 40000;
  st.mkt.campaigns.push({ target, budget, days, until: st.day + days, reach, clicks: Math.round(reach * .012 * eff), mult });
  return { ok: true, msg: 'Kampanya başladı. Tahmini erişim ' + reach.toLocaleString('tr-TR') + ' kişi.' };
}
function refreshInfluencers(st) {
  const tiers = [['Nano', 5e3, 15e3, 4e3, 9e3, .1], ['Mikro', 3e4, 12e4, 2e4, 6e4, .22], ['Makro', 3e5, 9e5, 15e4, 4e5, .12], ['Ünlü', 2e6, 5e6, 9e5, 2e6, .05]];
  const aud = ['ogrenci', 'elit', 'aile', 'genel', 'gece'];
  const pool = []; const names = INFL_NAMES.slice();
  for (let i = 0; i < 6; i++) {
    const t = tiers[i < 2 ? 0 : i < 4 ? 1 : i < 5 ? 2 : 3];
    const name = names.splice(Math.floor(rnd(st) * names.length), 1)[0];
    pool.push({ id: 'I' + i + st.day, name, tier: t[0], followers: Math.round(rr(st, t[1], t[2]) / 100) * 100, fee: r1000(rr(st, t[3], t[4])), aud: pick(st, aud), fake: rnd(st) < t[5], used: false });
  }
  st.mkt.inflPool = pool;
}
const AUD_LABEL = { ogrenci: 'Öğrenci', elit: 'Elit', aile: 'Aile', genel: 'Genel', gece: 'Gece hayatı' };
function inviteInfluencer(st, inflId, branchId) {
  const I = st.mkt.inflPool.find(x => x.id === inflId), b = st.branches.find(x => x.id === branchId);
  if (!I || !b || I.used) return { ok: false, msg: 'Davet gönderilemedi.' };
  if (st.cash < I.fee) return { ok: false, msg: 'Nakit yetersiz.' };
  st.cash -= I.fee; st.month.mkt += I.fee; I.used = true;
  if (I.fake) { log(st, I.name + ' paylaşımı neredeyse hiç etkileşim almadı. Takipçileri sahte çıktı.', 'bad'); return { ok: true, msg: 'Paylaşım yapıldı ama etkisi çok zayıf kaldı. Takipçileri sahte çıktı.' }; }
  const top = Object.entries(b._w || {}).sort((a, c) => c[1] - a[1])[0];
  const segMap = { ogrenci: 'ogrenci', elit: 'elit', aile: 'aile', beyazyaka: 'gece', macsever: 'gece', grup: 'genel' };
  const match = I.aud === 'genel' ? .8 : (top && segMap[top[0]] === I.aud) ? 1.2 : (b._w && (I.aud === 'gece' ? (b._w.beyazyaka || 0) : (b._w[I.aud] || 0)) > .15 ? .9 : .45);
  let mult = 1 + clamp(Math.sqrt(I.followers) / 1500 * match, .03, .6);
  let msg = I.name + ' ' + b.name + ' şubesini paylaştı.';
  if (b.rating < 3.6) { mult = 1 + (mult - 1) * .5; b.rating = Math.max(1, b.rating - .15); msg += ' Deneyimden memnun kalmadı, puanın düştü.'; }
  b.boosts.push({ k: 'influencer', mult, until: st.day + 10 });
  st.mkt.followers += Math.round(I.followers * .004 * match); st.mkt.buzz += Math.sqrt(I.followers) / 300;
  log(st, msg, 'good');
  return { ok: true, msg };
}

/* ---------- tedarik ---------- */
function upgradeSupply(st, line, tier) {
  const S = SUPPLY[line][tier]; const c = counts(st);
  if (c.open < S.req) return { ok: false, msg: S.req + ' açık şube gerekiyor.' };
  if (st.cash < S.setup) return { ok: false, msg: 'Nakit yetersiz.' };
  st.cash -= S.setup; st.month.other += S.setup; st.supply[line] = tier;
  for (const b of st.branches) computeOffer(st, b);
  log(st, 'Tedarik değişti: ' + S.n + '.', 'info');
  return { ok: true, msg: S.n + ' devreye alındı.' };
}

/* ---------- şube işlemleri ---------- */
function demandIdx(st, b) { let d = 0, r = 0, g = 0; for (const s of TYPES[b.type].segs) { const o = b._offer[s], w = (b._w || {})[s] || 0; if (!o || !o.fit) continue; const pm = o.prop > 1 ? 1 + (o.prop - 1) * .4 : 1; d += w * o.fit * o.prop; r += w * o.fit * o.prop * o.price * pm; g += w * o.fit * o.prop * pm * (o.price / (1 + TYPES[b.type].kdv) - o.cost * 1.12); } return { d, r, g }; }
function priceImpact(st, b, changes) {
  // changes: { id: yeniFiyat } ya da { id: false } (menüden çıkar); { _all: oran }
  const save = b._offer, menu = b.menu; const m2 = {};
  for (const id in menu) m2[id] = Object.assign({}, menu[id]);
  if (changes._all) for (const id in m2) m2[id].price = Math.round(m2[id].price * (1 + changes._all) / 5) * 5;
  for (const id in changes) if (id !== '_all') { if (changes[id] === false) m2[id].on = false; else m2[id].price = changes[id]; }
  const base = demandIdx(st, b); b.menu = m2; computeOffer(st, b); const nw = demandIdx(st, b); b.menu = menu; b._offer = save;
  return { cust: base.d ? nw.d / base.d - 1 : 0, rev: base.r ? nw.r / base.r - 1 : 0, gp: base.g ? nw.g / base.g - 1 : 0 };
}
function setPrice(st, b, id, price) { st.flags.priceSet = true; b.menu[id].price = Math.max(5, Math.round(price)); computeOffer(st, b); }
function toggleItem(st, b, id) { if (PRODUCTS[id].needs && !b.kitchen) return; b.menu[id].on = !b.menu[id].on; computeOffer(st, b); }
function raiseAll(st, b, pct) { for (const id in b.menu) b.menu[id].price = Math.round(b.menu[id].price * (1 + pct) / 5) * 5; computeOffer(st, b); b.boosts.push({ k: 'zam', mult: pct > .08 ? .93 : .97, until: st.day + 10 }); }
function changeStaff(st, b, delta) {
  const n = b.staff + delta; if (n < 1) return { ok: false, msg: 'En az 1 personel gerekir.' };
  if (delta > 0) spend(st, 5000, 'ik');
  else { const sev = Math.round(WAGES[b.wage].cost * st.world.wageIdx * .6); spend(st, sev, 'ik'); b.moral -= 6; }
  b.staff = n; return { ok: true };
}
function changeConcept(st, b, c) { const cost = 60000; if (st.cash < cost) return { ok: false, msg: 'Nakit yetersiz.' }; spend(st, cost, 'yatirim'); b.concept = c; b.closedUntil = st.day; return { ok: true, msg: 'Konsept değişti. Şube bugün kapalı.' }; }
function upgradeDecor(st, b, dec) { const cost = Math.round(DECOR[dec].m2 * b.area * .8); if (st.cash < cost) return { ok: false, msg: 'Nakit yetersiz.' }; spend(st, cost, 'yatirim'); b.decor = dec; b.closedUntil = st.day + 2; return { ok: true, msg: 'Tadilat başladı. Şube 3 gün kapalı.' }; }
function upgradeEquip(st, b, eq) { const cost = Math.round(EQUIP[eq].cost * .85); if (st.cash < cost) return { ok: false, msg: 'Nakit yetersiz.' }; spend(st, cost, 'yatirim'); b.equip = eq; computeOffer(st, b); return { ok: true, msg: 'Yeni ekipman kuruldu.' }; }
function addKitchen(st, b) { if (b.kitchen) return; const c = 250000; if (st.cash < c) return { ok: false, msg: 'Nakit yetersiz.' }; spend(st, c, 'yatirim'); b.kitchen = true; for (const id in b.menu) if (PRODUCTS[id].needs) b.menu[id].on = true; computeOffer(st, b); return { ok: true, msg: 'Mutfak kuruldu.' }; }
function toggleFront(st, b) { if (!b.hasFront) return; b.useFront = !b.useFront; b.smoke = b.useFront || ARCH[b.arch].smoke === true; }
function salePrice(st, b) {
  const lm = b.lastMonth ? b.lastMonth.profit : 0;
  const good = Math.max(0, lm) * 5;
  return r1000(b.area * DECOR[b.decor].m2 * .25 + EQUIP[b.equip].cost * .45 + good + (b.havaParasi || 0) * .6);
}
function sellBranch(st, b) {
  const p = salePrice(st, b); const early = st.day - b.contractStart < 365;
  st.cash += p + (b.type ? (early ? 0 : b.deposit) : 0);
  st.branches = st.branches.filter(x => x !== b);
  log(st, b.name + ' devredildi: ' + fmt(p) + (early ? ' (sözleşme erken bittiği için depozito yandı)' : ' + depozito iadesi') + '.', 'warn');
  return p;
}

/* ---------- şube müdürü ---------- */
const MGR_LVL = { yeni: { n: 'Yeni müdür', wage: 62000, moral: 3, desc: 'Küçük olayları çözer, kapasite +, denetimlerde daha güvenli.' }, deneyimli: { n: 'Deneyimli müdür', wage: 88000, moral: 7, desc: 'Ekibi toparlar: moral ve kalite artar, fiyatları enflasyona göre güncelleyebilir.' } };
const MGR_NAMES = ['Ayşe Kaya', 'Mert Demir', 'Elif Şahin', 'Can Yıldız', 'Zeynep Arslan', 'Burak Çelik', 'Selin Aydın', 'Emre Koç', 'Deniz Öztürk', 'Gizem Kurt', 'Onur Polat', 'Ece Doğan'];
function managerCandidates(st, b) {
  const used = new Set(st.branches.filter(x => x.manager).map(x => x.manager.n)); const names = MGR_NAMES.filter(n => !used.has(n));
  const off = (b.id * 7 + Math.floor(st.day / 30)) % Math.max(1, names.length);
  return ['yeni', 'deneyimli'].map((lvl, i) => ({ n: names[(off + i * 3) % names.length] || 'Müdür', lvl, wage: MGR_LVL[lvl].wage }));
}
function hireManager(st, b, lvl) {
  const c = managerCandidates(st, b).find(x => x.lvl === lvl); if (!c) return { ok: false, msg: 'Aday yok.' };
  if (b.manager) return { ok: false, msg: 'Bu şubenin zaten müdürü var.' };
  spend(st, 15000, 'ik'); b.manager = { n: c.n, lvl, wage: c.wage, autoPrice: lvl === 'deneyimli', since: st.day }; b.moral += 4; computeOffer(st, b);
  log(st, c.n + ', ' + b.name + ' şubesine müdür olarak atandı.', 'good'); return { ok: true, msg: c.n + ' şube müdürü oldu.' };
}
function fireManager(st, b) { if (!b.manager) return; const sev = Math.round(b.manager.wage * st.world.wageIdx); spend(st, sev, 'ik'); log(st, b.manager.n + ' görevden ayrıldı (' + b.name + ').', 'warn'); b.manager = null; b.moral -= 6; computeOffer(st, b); }
function toggleAutoPrice(st, b) { if (b.manager) b.manager.autoPrice = !b.manager.autoPrice; }

/* ---------- yatırım ---------- */
function refreshOffers(st) {
  const opts = [];
  for (let i = 0; i < 3; i++) {
    const did = pick(st, Object.keys(DISTRICTS)); const base = r1000(rr(st, 80000, 450000) * (.6 + DISTRICTS[did].elit * .08));
    const pct = pick(st, [.1, .2, .25, .3, .4]); const val = r1000(base * rr(st, 14, 26));
    opts.push({ id: 'O' + st.day + i, name: pick(st, LOCALS) + ' (' + DISTRICTS[did].n + ')', base, pct, val, price: r1000(val * pct), risk: base < 150000 ? 'Yüksek' : 'Orta' });
  }
  st.invest.offers = opts;
}
function buyStake(st, id) {
  const o = st.invest.offers.find(x => x.id === id); if (!o) return { ok: false, msg: 'Teklif bulunamadı.' };
  if (st.cash < o.price) return { ok: false, msg: 'Nakit yetersiz.' };
  st.cash -= o.price; st.invest.stakes.push({ name: o.name, pct: o.pct, base: o.base, val: o.val, cost: o.price, last: 0 });
  st.invest.offers = st.invest.offers.filter(x => x !== o); log(st, o.name + ' ortaklığına %' + Math.round(o.pct * 100) + ' hisseyle girildi.', 'good');
  return { ok: true, msg: 'Hisse alındı.' };
}
function sellStake(st, i) { const s = st.invest.stakes[i]; if (!s) return; const p = Math.round(s.val * s.pct * rr(st, .85, 1.05)); st.cash += p; st.invest.stakes.splice(i, 1); log(st, s.name + ' hisseleri ' + fmt(p) + ' karşılığında satıldı.', 'info'); }

/* ---------- olaylar ---------- */
function openBranches(st) { return st.branches.filter(b => b.status === 'acik'); }
// olay havuzu: [anahtar, ağırlık, şube başına bekleme günü]
const EV_CD = { turist: 90, kart: 120, yerel: 100, ses: 150, fotograf: 120, nisan: 120, patlak: 90, kasa: 150, sozlesme: 200, vitrin: 120, cekirdek: 150, kosu: 200, kitap: 120, veteriner: 150, kazan: 120, fiyatsikayet: 90, yangin: 200, ogrencikart: 150, mudurteklif: 150, menukart: 150, buzdolabi: 120, internet: 90, dogumgunu: 90, dizi2: 200, ariza: 50, istifa: 45, yorum: 30, hijyen: 75, su: 60, zabita: 40, apartman: 120, rakip: 90, unlu: 120, dm: 25, kurumsal: 100, insaat: 120,
  elektrik: 60, rakipkampanya: 60, stajyer: 120, tedarikci: 120, kur: 150, festival: 120, derbi: 45, firtina: 120, bocek: 90, muzisyen: 60, donem: 150, blogger: 70,
  vergi: 180, kurye: 200, dizi: 150, kulup: 60, komsu: 60, trend: 90, kutlama: 90, sigorta: 150, catlak: 120, kayip: 90, okul: 200, bagis: 120 };
const MGR_AUTO = { patlak: 0, buzdolabi: 0, internet: 0, kasa: 0, fiyatsikayet: 0, ariza: 0, istifa: 0, yorum: 0, su: 1, dm: 0, elektrik: 1, bocek: 0, muzisyen: 1, kutlama: 0, kayip: 0, komsu: 0, kulup: 0 };
function rollEvent(st) {
  if (st._noEvents) return;
  const open = openBranches(st); if (!open.length) return;
  if (st.day - (st.lastEv || -99) < 14) return;
  if (rnd(st) > .045) return;
  const b = pick(st, open); const d = DISTRICTS[b.d], A = ARCH[b.arch], T = TYPES[b.type], P = PROV[d.p];
  const cd = st.evCd || (st.evCd = {});
  const ok = k => (cd[k + ':' + b.id] || -999) + (EV_CD[k] || 30) <= st.day && (cd[k] || -999) + 30 <= st.day;
  const pool = [];
  const add = (k, w) => { if (ok(k)) pool.push([k, w]); };
  add('ariza', 2.2 * EQUIP[b.equip].brk / .005); add('istifa', 1.2 * (b.moral < 60 ? 2 : b.wage === 'ustu' ? .4 : 1)); add('yorum', b.rating < 3.6 ? 2 : .9); add('hijyen', 1.2); add('su', .8); add('elektrik', .8);
  if (b.useFront && !b.flic) { add('zabita', 2); add('apartman', 1); }
  add('rakip', 1); add('rakipkampanya', 1.2); add('unlu', d.p === '34' || P.tier === 'm' ? .5 : .25); add('dm', 1.2);
  if (b.arch === 'H' || d.off > .4) add('kurumsal', 1);
  if (!st.world.mods.some(m => m.d === b.d)) add('insaat', .6);
  if (d.stu > .3 || A.school) { add('stajyer', .8); add('kulup', 1); add('okul', .7); }
  add('tedarikci', .7); add('kur', .4); add('festival', .8); if (b.type !== 'metro') add('derbi', .9); add('firtina', A.garden || b.useFront ? 1 : .3);
  add('bocek', .6); if (b.useFront || A.garden) add('muzisyen', .8); add('blogger', 1); add('vergi', .4); if (b.type === 'kafe' && b.tables) add('kurye', .7);
  if (d.p === '34' || P.tier === 'm') add('dizi', .4); if (b.type === 'pub' || T.close >= 24) add('komsu', .7); add('trend', .8); add('kutlama', .6);
  if (A.garden || A.seasonal) add('sigorta', .4); add('catlak', .4); add('kayip', .5); add('bagis', .5);
  if (d.tour > .05 || d.p === '34') add('turist', .7); add('kart', .6); add('yerel', .6); add('ses', .4); add('fotograf', .5); add('nisan', .5);
  add('patlak', .5); add('kasa', .4); add('sozlesme', .4); add('vitrin', .5); add('cekirdek', .5); add('kosu', d.p === '34' || P.tier === 'm' ? .5 : .2);
  add('kitap', .5); add('veteriner', .4); add('kazan', .5); add('fiyatsikayet', b.rating < 3.8 ? .7 : .3); add('yangin', .3); add('ogrencikart', d.stu > .3 ? .7 : .2);
  if (b.manager) add('mudurteklif', .4); add('menukart', .4); add('buzdolabi', .5); add('internet', .5); if (b.type !== 'metro') add('dogumgunu', .5); add('dizi2', .3);
  if (!pool.length) return;
  let sum = pool.reduce((a, p) => a + p[1], 0), x = rnd(st) * sum, k = pool[0][0];
  for (const p of pool) { x -= p[1]; if (x <= 0) { k = p[0]; break; } }
  cd[k + ':' + b.id] = st.day; cd[k] = st.day; st.lastEv = st.day;
  const ev = { k, b: b.id, seed: Math.floor(rnd(st) * 1e6) };
  if (b.manager && MGR_AUTO[k] != null) { const card = eventCard(st, ev); if (card) { const i = Math.min(card.opts.length - 1, MGR_AUTO[k]); card.opts[i].f(); log(st, b.manager.n + ' (' + b.name + '): ' + card.t + ' → ' + card.opts[i].n.toLowerCase() + '.', 'info'); return; } }
  st.queue.push(ev);
}
function eventCard(st, ev) {
  const b = st.branches.find(x => x.id === ev.b); const bn = b ? b.name : '';
  const d = b ? DISTRICTS[b.d] : null;
  switch (ev.k) {
    case 'ariza': { const fast = Math.round((EQUIP[b.equip].cost * .06) / 1000) * 1000; return { t: 'Espresso makinesi arızalandı', s: bn, body: 'Sabah açılışta makine basınç vermedi. Kahve satışı durdu.', opts: [
      ...(adLeft(st, 'ariza') ? [{ n: 'Reklam izle, servis bizden', d: 'Kısa bir reklam, acil servis ücretsiz gelir', ad: 'ariza', f: () => {} }] : []),
      { n: 'Acil servis çağır', d: fmt(fast) + ', bugün çözülür', f: () => { pay(st, fast, 'servis'); } },
      { n: 'Normal servisi bekle', d: fmt(Math.round(fast * .35)) + ', 2 gün kahve satışı yarıya iner', f: () => { pay(st, Math.round(fast * .35), 'servis'); b.boosts.push({ k: 'ariza', mult: .55, until: st.day + 2 }); } } ] }; }
    case 'istifa': return { t: 'Barista istifa etti', s: bn, body: 'Ekibin en deneyimli baristası başka bir zincirden teklif aldı ve ayrılıyor.', opts: [
      { n: 'Hemen yenisini al', d: '8.000 ₺ ilan ve işe alım', f: () => { pay(st, 8000, 'ik'); b.moral -= 4; } },
      { n: 'Kadroyu bir kişi azalt', d: 'Maaştan tasarruf, servis yavaşlar', f: () => { b.staff = Math.max(1, b.staff - 1); b.moral -= 8; } },
      { n: 'Karşı teklif ver', d: '%20 zam, moral artar', f: () => { b.moral += 6; pay(st, 8000 * 3, 'ik'); } } ] };
    case 'yorum': return { t: 'Kötü bir yorum yayılıyor', s: bn, body: 'Bir müşteri soğuk kahve ve ilgisiz servis şikayetiyle sert bir yorum yazdı. Paylaşım hızla yayılıyor.', opts: [
      { n: 'Özür dile, ikram teklif et', d: '15.000 ₺, puan az etkilenir', f: () => { pay(st, 15000); b.rating = Math.max(1, b.rating - .08); } },
      { n: 'Cevap verme', d: 'Puan düşer', f: () => { b.rating = Math.max(1, b.rating - .25); } },
      { n: 'Sert cevap ver', d: 'Puan çok düşer ama konuşulursun', f: () => { b.rating = Math.max(1, b.rating - .4); st.mkt.buzz += 4; st.mkt.followers += 800; } } ] };
    case 'hijyen': { const score = DECOR[b.decor].dek + EQUIP[b.equip].q + (b.moral - 60) * .3 + rr(st, -10, 10) + (b.manager ? 5 : 0) - (b.hygieneRisk && b.hygieneRisk >= st.day ? 9 : 0); const pass = score > -4; return { t: 'Gıda ve hijyen denetimi', s: bn, body: pass ? 'İl tarım müdürlüğü ekibi denetim yaptı. Mutfak ve depo temiz bulundu.' : 'Denetimde soğuk zincir kayıtlarında ve depo düzeninde eksikler bulundu.', opts: pass ? [{ n: 'Tamam', d: 'Denetimden geçti', f: () => { b.rating = Math.min(5, b.rating + .03); } }] : [
      { n: 'Cezayı öde', d: '42.000 ₺', f: () => pay(st, 42000, 'ceza') },
      { n: 'İtiraz et', d: '%50 iptal şansı, kaybedersen 60.000 ₺', f: () => { if (rnd(st) > .5) pay(st, 60000, 'ceza'); } } ] }; }
    case 'su': return { t: 'Mahallede su kesintisi', s: bn, body: 'İSKİ arıza nedeniyle bölgede suyu kesti. Kesinti akşama kadar sürecek.', opts: [
      { n: 'Şubeyi bugün kapat', d: 'Bir günlük ciro kaybı', f: () => { b.closedUntil = st.day; } },
      { n: 'Damacana ile idare et', d: '6.000 ₺, kısıtlı menü', f: () => { pay(st, 6000); b.boosts.push({ k: 'su', mult: .6, until: st.day }); } } ] };
    case 'zabita': return { t: 'Zabıta denetimi', s: bn, body: 'Dükkan önündeki masalar ruhsata işli değil. Zabıta tutanak tutmak üzere.', opts: [
      { n: 'Cezayı öde, masalar kalsın', d: '25.000 ₺, tekrar gelebilirler', f: () => pay(st, 25000, 'ceza') },
      { n: 'Masaları içeri al', d: 'Dış oturma alanı kapanır', f: () => { pay(st, 25000, 'ceza'); b.useFront = false; b.smoke = ARCH[b.arch].smoke === true; } } ] };
    case 'apartman': { const nf = r500(b.aptFee * 1.5); return { t: 'Apartman yönetimi ön alanı istiyor', s: bn, body: 'Yeni yönetici, ön alanın ortak alan olduğunu hatırlatıp aylık bedeli ' + fmt(b.aptFee) + ' yerine ' + fmt(nf) + ' istiyor.', opts: [
      { n: 'Yeni bedeli kabul et', d: fmt(nf) + ' / ay', f: () => { b.aptFee = nf; } },
      { n: 'Masaları kaldır', d: 'Dış oturma ve sigara alanı kapanır', f: () => { b.useFront = false; b.smoke = ARCH[b.arch].smoke === true; } } ] }; }
    case 'rakip': { const r = pick(st, RIVALS.filter(x => !comps(st, b.d).some(c => c.n === x.n)).concat([RIVALS[2]])); const addC = () => comps(st, b.d).push({ n: r.n, tier: r.tier, w: r.w, rating: 4.2, price: r.tier === 'premium' ? 'Pahalı' : 'Makul' }); return { t: r.n + ' yanına şube açıyor', s: bn, body: r.n + ', ' + bn + ' şubene 150 metre mesafede yeni bir şube açıyor. Açılış haftası çok kalabalık olacak.', opts: [
      { n: 'Açılış haftası kampanyası yap', d: '45.000 ₺, kayıp çok azalır', f: () => { pay(st, 45000); addC(); b.compMod *= .97; b.boosts.push({ k: 'rk', mult: 1.1, until: st.day + 7 }); } },
      { n: 'Kaliteye yatır, farkını göster', d: '25.000 ₺ eğitim, puan ve moral artar', f: () => { pay(st, 25000); addC(); b.compMod *= .95; b.rating = Math.min(5, b.rating + .15); b.moral += 5; } },
      { n: 'Fiyatları koru, bekle', d: 'Müşteri payın kalıcı olarak düşer', f: () => { addC(); b.compMod *= .9; } } ] }; }
    case 'unlu': return { t: 'Ünlü biri şubende görüldü', s: bn, body: 'Tanınmış bir oyuncu ' + bn + ' şubesinde kahve içerken fotoğraflandı. Paylaşım viral oldu.', opts: [
      { n: 'Harika', d: 'Bir hafta yoğunluk ve takipçi artışı', f: () => { b.boosts.push({ k: 'unlu', mult: 1.35, until: st.day + 7 }); st.mkt.followers += 4000; st.mkt.buzz += 6; } } ] };
    case 'dm': { const nm = pick(st, INFL_NAMES); return { t: nm + ' mesaj attı', s: bn, body: 'Yerel bir içerik üreticisi ikram karşılığında ' + bn + ' şubesini paylaşmak istiyor.', opts: [
      { n: 'Davet et', d: '2.000 ₺ ikram', f: () => { pay(st, 2000); if (rnd(st) < .7) { b.boosts.push({ k: 'dm', mult: 1.08, until: st.day + 6 }); st.mkt.followers += 300; } } },
      { n: 'Teşekkür et, geç', d: 'Bir şey olmaz', f: () => {} } ] }; }
    case 'kurumsal': { const amt = r1000(rr(st, 30000, 70000)); return { t: 'Kurumsal sipariş teklifi', s: bn, body: 'Yakındaki bir şirket ofisine her ay toplu kahve ve tatlı siparişi vermek istiyor. Aylık ciro yaklaşık ' + fmt(amt) + '.', opts: [
      { n: 'Kabul et', d: 'Ek ciro, ekibe ek yük', f: () => { b.corp = { amt, until: st.day + 180 }; b.moral -= 3; } },
      { n: 'Reddet', d: 'Ekip yorulmasın', f: () => {} } ] }; }
    case 'insaat': return { t: d.n + ' bölgesinde yol çalışması', s: bn, body: 'Belediye, ' + d.n + ' ana caddesinde altyapı çalışması başlattı. Yaya trafiği 2 ay boyunca düşecek.', opts: [
      { n: 'Anladım', d: 'Bölgedeki şubelerde trafik %25 düşer', f: () => { st.world.mods.push({ d: b.d, mult: .75, until: st.day + 60 }); } } ] };
    case 'ihtar': { const lim = kmhLimit(st); return { t: 'Bankadan ihtarname', s: 'Lira Bankası · kredi birimi', body: 'Kasa ' + fmt(st.cash) + ' ve ' + (st.bank.negStreak || 0) + ' gündür ekside. 10 gün içinde artıya geçmezsen banka, alacağını tahsil etmek için şubelerinden birini bir yatırımcıya devretmeni şart koşacak.', opts: [
      ...(adLeft(st, 'ihtar') && st.bank.warn && !st.bank.warn.ad ? [{ n: 'Reklam izle, 5 gün ek süre al', d: 'Banka ihtar süresini uzatır', ad: 'ihtar', f: () => {} }] : []),
      { n: 'Anladım, toparlayacağım', d: 'Maliyetleri kıs, kredi ya da devir düşün', f: () => {} },
      ...(!st.bank.restructured && st.bank.score >= 800 && st.cash < 0 ? [{ n: 'Borcu yapılandır', d: '36 ay vade, kredi notu 200 puan düşer', f: () => { restructure(st); } }] : []) ] }; }
    case 'hedef': { const g = GOALS.find(x => x.id === ev.g); return { t: g ? g.n : 'Hedef', s: 'Hedef tamamlandı', body: (g ? g.d + '. ' : '') + 'Ödülün: ' + (ev.rw || '') + '.', opts: [{ n: 'Harika', d: 'Sıradaki hedefe bak', f: () => {} }] }; }
    case 'avmacilis': { const m = mallById(st, ev.mall); if (!m) return null; return { t: m.n + ' açılıyor', s: PROV[m.p].n + ' · ' + m.dn, body: MALL_SIZE[m.s].n + ' ölçekli yeni bir alışveriş merkezi 1 hafta sonra kapılarını açıyor. Açılışa özel ilk 6 ay kira %50 indirimli kiosk ve kafe alanları var; ilk aylarda ziyaretçi de fazla olur. Yerler çabuk dolar.', opts: [
      { n: 'Fırsatları keşfet', d: 'Haritada AVM\'yi aç', f: () => { st.flags.gotoMall = m.id; } },
      { n: 'Sonra bakarım', d: 'Boş yerler bir süre açık kalır', f: () => {} } ] }; }
    case 'elektrik': return { t: 'Elektrik kesintisi', s: bn, body: 'Dağıtım şirketi ' + d.n + ' bölgesinde 6 saatlik planlı kesinti duyurdu. Espresso makinesi ve buzdolapları duracak.', opts: [
      { n: 'Jeneratör kirala', d: '9.000 ₺, satış sürer', f: () => pay(st, 9000) },
      { n: 'Öğleden sonra kapat', d: 'Yarım günlük ciro kaybı', f: () => { b.boosts.push({ k: 'elektrik', mult: .5, until: st.day }); } } ] };
    case 'rakipkampanya': { const r = pick(st, RIVALS); return { t: r.n + ' kampanya başlattı', s: bn, body: r.n + ' yakındaki şubesinde iki hafta boyunca "ikinci kahve bizden" kampanyası yapıyor. Müşterilerin bir kısmı oraya kayabilir.', opts: [
      { n: 'Aynı kampanyayı yap', d: '2 hafta marj düşer, müşteri kaybı olmaz', f: () => { b.boosts.push({ k: 'rk', mult: 1.04, until: st.day + 14 }); b.marginCut = st.day + 14; } },
      { n: 'Sadakat kartını öne çıkar', d: '12.000 ₺, kayıp yarıya iner', f: () => { pay(st, 12000); b.boosts.push({ k: 'rk', mult: .93, until: st.day + 14 }); } },
      { n: 'Bekle', d: '2 hafta müşteri %15 azalır', f: () => { b.boosts.push({ k: 'rk', mult: .85, until: st.day + 14 }); } } ] }; }
    case 'stajyer': return { t: 'Üniversiteden staj başvurusu', s: bn, body: 'Turizm ve gastronomi bölümünden iki öğrenci 3 aylık staj için başvurdu. Asgari ücretin yarısıyla çalışırlar.', opts: [
      { n: 'Kabul et', d: '+2 kişi, 3 ay, ayda 42.000 ₺', f: () => { b.interns = { n: 2, until: st.day + 90 }; b.moral += 3; } },
      { n: 'Şimdilik gerek yok', d: 'Bir şey olmaz', f: () => {} } ] };
    case 'tedarikci': return { t: 'Tedarikçi fiyat artışı', s: bn, body: 'Süt ve kahve tedarikçin, yükselen maliyetler yüzünden fiyatlarını %8 artırdığını bildirdi.', opts: [
      { n: 'Kabul et', d: 'Hammadde maliyeti %8 artar', f: () => { st.world.costIdx *= 1.08; } },
      { n: '3 aylık toplu alım yap', d: '120.000 ₺ peşin, artış 3 ay ertelenir', f: () => { pay(st, 120000, 'olay'); st.world.costDelay = { m: 1.08, at: st.day + 90 }; } },
      { n: 'Daha ucuz tedarikçiye geç', d: 'Artış yok ama kalite düşer', f: () => { st.flags.cheapSupply = (st.flags.cheapSupply || 0) + 1; for (const x of st.branches) x.rating = Math.max(1, x.rating - .12); } } ] };
    case 'kur': return { t: 'Kur dalgalanması', s: 'Türkiye geneli', body: 'Döviz kurundaki ani yükseliş ithal çekirdek fiyatlarına yansıdı. Kahve maliyetleri yükseliyor.', opts: [
      { n: 'Anladım', d: 'Hammadde maliyeti %6 artar', f: () => { st.world.costIdx *= 1.06; } },
      { n: 'Hemen stok yap', d: '90.000 ₺, artış 2 ay gecikir', f: () => { pay(st, 90000, 'olay'); st.world.costDelay = { m: 1.06, at: st.day + 60 }; } } ] };
    case 'festival': return { t: d.n + ' sokak festivali', s: bn, body: 'Belediye hafta sonu ' + d.n + ' meydanında yemek ve müzik festivali düzenliyor. Stant açabilirsin.', opts: [
      { n: 'Stant aç', d: '20.000 ₺, 3 gün ek ciro ve takipçi', f: () => { pay(st, 20000); b.boosts.push({ k: 'fest', mult: 1.35, until: st.day + 3 }); st.mkt.followers += 600; } },
      { n: 'Katılma', d: 'Bölgede 3 gün hafif yoğunluk', f: () => { b.boosts.push({ k: 'fest', mult: 1.06, until: st.day + 3 }); } } ] };
    case 'derbi': return { t: 'Derbi akşamı', s: bn, body: 'Bu akşam büyük derbi var. Müşteriler maçı izleyebilecekleri bir yer arıyor.', opts: [
      { n: 'Projeksiyon kur', d: '8.000 ₺, akşam yoğunluğu', f: () => { pay(st, 8000); b.boosts.push({ k: 'derbi', mult: 1.25, until: st.day }); } },
      { n: 'Normal akşam', d: 'Akşam sakin geçer', f: () => { b.boosts.push({ k: 'derbi', mult: .9, until: st.day }); } } ] };
    case 'firtina': return { t: 'Fırtına tenteye zarar verdi', s: bn, body: 'Gece çıkan fırtına dış alandaki tenteyi ve iki şemsiyeyi kullanılmaz hale getirdi.', opts: [
      { n: 'Hemen yenile', d: '22.000 ₺', f: () => pay(st, 22000, 'servis') },
      { n: 'Bir hafta bekle', d: 'Dış alan bir hafta kapalı', f: () => { b.boosts.push({ k: 'firtina', mult: .9, until: st.day + 7 }); } } ] };
    case 'bocek': return { t: 'Depoda haşere görüldü', s: bn, body: 'Bir personel depoda haşere gördüğünü söyledi. Denetimde bulunursa ceza ağır olur.', opts: [
      { n: 'İlaçlama firması çağır', d: '12.000 ₺, şube yarım gün kapalı', f: () => { pay(st, 12000, 'servis'); b.boosts.push({ k: 'bocek', mult: .6, until: st.day }); } },
      { n: 'Ekip temizlesin', d: 'Masrafsız ama sonraki denetim riskli', f: () => { b.hygieneRisk = st.day + 60; } } ] };
    case 'muzisyen': return { t: 'Sokak müzisyeni', s: bn, body: 'Bir gitarist akşamları dükkanın önünde çalmak istiyor; karşılığında sadece çay istiyor.', opts: [
      { n: 'Hoş geldin', d: 'Bir hafta akşamları daha canlı, komşular şikâyet edebilir', f: () => { b.boosts.push({ k: 'muz', mult: 1.08, until: st.day + 7 }); if (rnd(st) < .3) b.moral -= 2; } },
      { n: 'Kibarca reddet', d: 'Bir şey olmaz', f: () => {} } ] };
    case 'okul': return { t: 'Yeni dönem başladı', s: bn, body: 'Yakındaki okulda yeni dönem başladı; öğrenciler mekan arıyor. İlk haftalar müdavim kazanmak için en iyi zaman.', opts: [
      { n: 'Öğrenci indirimi yap', d: '2 hafta %10 indirim, kalıcı küçük artış', f: () => { b.boosts.push({ k: 'okul', mult: 1.18, until: st.day + 14 }); b.marginCut = st.day + 14; b.pot = Math.min(1.5, b.pot * 1.03); } },
      { n: 'Normal devam et', d: 'Kısa bir yoğunluk', f: () => { b.boosts.push({ k: 'okul', mult: 1.06, until: st.day + 7 }); } } ] };
    case 'blogger': { const good = b.rating >= 3.9; return { t: 'Yemek yazarı habersiz geldi', s: bn, body: good ? 'Tanınan bir yemek yazarı şubeni beğendi ve yazısında övdü.' : 'Tanınan bir yemek yazarı şubeye geldi; kahveyi ortalama, servisi yavaş buldu ve bunu yazdı.', opts: [
      { n: good ? 'Paylaş, teşekkür et' : 'Eleştiriyi kabul et', d: good ? '10 gün yoğunluk, takipçi' : 'Puan biraz düşer', f: () => { if (good) { b.boosts.push({ k: 'blog', mult: 1.18, until: st.day + 10 }); st.mkt.followers += 1500; } else b.rating = Math.max(1, b.rating - .1); } } ] }; }
    case 'vergi': { const fine = rnd(st) < .4; return { t: 'Vergi denetimi', s: bn, body: fine ? 'Vergi müfettişi yazar kasa fişlerinde eksik buldu.' : 'Vergi müfettişi kayıtları inceledi; her şey düzgün.', opts: fine ? [
      { n: 'Cezayı öde', d: '35.000 ₺', f: () => pay(st, 35000, 'ceza') },
      { n: 'Mali müşavirle itiraz et', d: '8.000 ₺ müşavir, %60 iptal şansı', f: () => { pay(st, 8000, 'ceza'); if (rnd(st) > .6) pay(st, 35000, 'ceza'); } } ] : [{ n: 'Tamam', d: 'Denetimden geçti', f: () => {} }] }; }
    case 'kurye': return { t: 'Paket servis uygulaması teklifi', s: bn, body: 'Bir yemek sipariş uygulaması ' + bn + ' şubesini listelemek istiyor. Siparişlerden %28 komisyon alıyorlar.', opts: [
      { n: 'Anlaş', d: 'Ek ciro, düşük marj, ekibe ek yük', f: () => { b.delivery = true; b.moral -= 3; } },
      { n: 'Reddet', d: 'Bir şey olmaz', f: () => {} } ] };
    case 'dizi': return { t: 'Dizi çekimi teklifi', s: bn, body: 'Bir yapım şirketi bir sahneyi şubende çekmek istiyor. Şube bir gün kapalı kalır.', opts: [
      { n: 'Kabul et', d: '+45.000 ₺ kira, sonra 2 hafta ilgi', f: () => { st.cash += 45000; st.month.extra += 45000; b.closedUntil = st.day; b.boosts.push({ k: 'dizi', mult: 1.12, until: st.day + 14 }); st.mkt.followers += 2500; } },
      { n: 'Reddet', d: 'Müşterilerini rahatsız etme', f: () => {} } ] };
    case 'kulup': return { t: 'Öğrenci kulübü etkinliği', s: bn, body: 'Bir üniversite kulübü haftalık toplantısını şubende yapmak istiyor. 25 kişi, uzun oturuyorlar.', opts: [
      { n: 'Kabul et', d: '4 hafta salı akşamları dolu, sepet düşük', f: () => { b.boosts.push({ k: 'kulup', mult: 1.05, until: st.day + 28 }); } },
      { n: 'Reddet', d: 'Masalar başka müşterilere kalsın', f: () => {} } ] };
    case 'komsu': return { t: 'Komşulardan gürültü şikâyeti', s: bn, body: 'Üst kattaki komşular gece saatlerindeki gürültüden belediyeye şikâyette bulundu.', opts: [
      { n: 'Ses yalıtımı yaptır', d: '30.000 ₺, sorun biter', f: () => pay(st, 30000, 'servis') },
      { n: 'Müziği kıs, erken kapat', d: '2 hafta akşam cirosu düşer', f: () => { b.boosts.push({ k: 'komsu', mult: .92, until: st.day + 14 }); } } ] };
    case 'trend': { const tr = pick(st, ['San Sebastian cheesecake', 'soğuk demleme', 'fıstıklı latte', 'matcha']); return { t: tr + ' akımı', s: bn, body: 'Sosyal medyada ' + tr + ' akımı başladı. Herkes bunu deneyebileceği bir yer arıyor.', opts: [
      { n: 'Menüye özel ekle', d: '15.000 ₺ deneme, 3 hafta ilgi', f: () => { pay(st, 15000); b.boosts.push({ k: 'trend', mult: 1.12, until: st.day + 21 }); st.mkt.followers += 700; } },
      { n: 'Akım geçer', d: 'Bir şey olmaz', f: () => {} } ] }; }
    case 'kutlama': return { t: 'Ekipte doğum günü', s: bn, body: 'Ekibin en sevilen üyesinin doğum günü. Küçük bir kutlama ekibe iyi gelir.', opts: [
      { n: 'Pasta ve küçük hediye', d: '3.000 ₺, moral +8', f: () => { pay(st, 3000); b.moral += 8; } },
      { n: 'Tebrik et', d: 'Moral +2', f: () => { b.moral += 2; } } ] };
    case 'sigorta': return { t: 'Yağmur suyu bodrumu bastı', s: bn, body: 'Şiddetli yağmurda depoyu su bastı; bir miktar stok ve bir buzdolabı zarar gördü.', opts: [
      { n: 'Sigortadan karşıla', d: '10.000 ₺ muafiyet', f: () => pay(st, 10000, 'servis') },
      { n: 'Kendin karşıla, hızlı aç', d: '35.000 ₺, bugün açık', f: () => pay(st, 35000, 'servis') } ] };
    case 'catlak': return { t: 'Vitrin camı çatladı', s: bn, body: 'Gece bir araç park ederken vitrin camına çarptı. Sürücü ortada yok.', opts: [
      { n: 'Hemen değiştir', d: '18.000 ₺', f: () => pay(st, 18000, 'servis') },
      { n: 'Bantla, sonra bakarız', d: 'Görüntü kötü, 2 hafta puan etkilenir', f: () => { b.boosts.push({ k: 'cam', mult: .95, until: st.day + 14 }); b.rating = Math.max(1, b.rating - .05); } } ] };
    case 'kayip': return { t: 'Unutulan cüzdan', s: bn, body: 'Bir müşteri içinde yüklü para olan cüzdanını masada unuttu. Personel kasaya teslim etti.', opts: [
      { n: 'Sahibini bul, iade et', d: 'Müşteri teşekkür paylaşımı yapar', f: () => { b.rating = Math.min(5, b.rating + .05); st.mkt.followers += 300; } } ] };
    case 'bagis': return { t: 'Mahalle okulundan sponsorluk isteği', s: bn, body: 'Mahalledeki ilkokul, kermes için ikram sponsoru arıyor.', opts: [
      { n: 'Sponsor ol', d: '10.000 ₺, mahallede itibar', f: () => { pay(st, 10000); b.pot = Math.min(1.5, b.pot * 1.02); b.rating = Math.min(5, b.rating + .04); } },
      { n: 'Bu sefer olmaz', d: 'Bir şey olmaz', f: () => {} } ] };
    case 'turist': return { t: 'Turist kafilesi', s: bn, body: 'Bir tur rehberi, 30 kişilik grubunu yarın öğleden sonra ' + bn + ' şubesine getirmek istiyor. Rehber komisyon olarak cironun %10\'unu istiyor.', opts: [
      { n: 'Kabul et', d: 'Bir gün ciro artar, rehbere pay', f: () => { b.boosts.push({ k: 'tur', mult: 1.3, until: st.day + 1 }); b.marginCut = Math.max(b.marginCut || 0, st.day + 1); } },
      { n: 'Reddet', d: 'Müdavimlerin rahat etsin', f: () => {} } ] };
    case 'kart': return { t: 'Banka kampanya teklifi', s: bn, body: 'Bir banka, kart sahiplerine ' + bn + '\'de %15 indirim kampanyası yapmak istiyor. İndirimin yarısını banka karşılıyor.', opts: [
      { n: 'Katıl', d: '3 hafta müşteri artar, marj biraz düşer', f: () => { b.boosts.push({ k: 'kart', mult: 1.12, until: st.day + 21 }); b.marginCut = Math.max(b.marginCut || 0, st.day + 21); } },
      { n: 'Katılma', d: 'Bir şey olmaz', f: () => {} } ] };
    case 'yerel': return { t: 'Mahalle gazetesi röportaj istiyor', s: bn, body: 'Yerel bir gazete, mahallenin yeni mekanları dosyası için seninle görüşmek istiyor.', opts: [
      { n: 'Röportaj ver', d: 'Bilinirlik artar', f: () => { st.mkt.followers += 900; b.boosts.push({ k: 'yerel', mult: 1.06, until: st.day + 10 }); } },
      { n: 'Vakit yok', d: 'Bir şey olmaz', f: () => {} } ] };
    case 'ses': return { t: 'Ses sistemi bozuldu', s: bn, body: 'Hoparlörlerden biri cızırdamaya başladı, müzik rahatsız edici geliyor.', opts: [
      { n: 'Yenisini al', d: '14.000 ₺', f: () => pay(st, 14000, 'servis') },
      { n: 'Müziği kapat', d: 'Bir hafta ortam biraz sönük', f: () => { b.boosts.push({ k: 'ses', mult: .96, until: st.day + 7 }); } } ] };
    case 'fotograf': return { t: 'Fotoğraf çekimi isteği', s: bn, body: 'Bir moda markası katalog çekimini sabah açılıştan önce ' + bn + '\'de yapmak istiyor.', opts: [
      { n: 'Kabul et', d: '+20.000 ₺, marka paylaşımı', f: () => { st.cash += 20000; st.month.extra += 20000; st.mkt.followers += 600; } },
      { n: 'Reddet', d: 'Bir şey olmaz', f: () => {} } ] };
    case 'nisan': return { t: 'Söz ve nişan organizasyonu', s: bn, body: 'Bir aile, küçük bir nişan kutlamasını akşam ' + bn + '\'de yapmak istiyor. Şube o akşam kapalı olur.', opts: [
      { n: 'Kabul et', d: '+35.000 ₺, akşam başka müşteri yok', f: () => { st.cash += 35000; st.month.extra += 35000; b.boosts.push({ k: 'nisan', mult: .7, until: st.day }); b.rating = Math.min(5, b.rating + .03); } },
      { n: 'Reddet', d: 'Bir şey olmaz', f: () => {} } ] };
    case 'patlak': return { t: 'Su borusu patladı', s: bn, body: 'Bar arkasındaki su borusu patladı, zemin su altında.', opts: [
      { n: 'Acil tesisatçı', d: '16.000 ₺, bugün çözülür', f: () => pay(st, 16000, 'servis') },
      { n: 'Yarın baktır', d: '6.000 ₺, bugün kapalı', f: () => { pay(st, 6000, 'servis'); b.closedUntil = st.day; } } ] };
    case 'kasa': return { t: 'Kasada açık çıktı', s: bn, body: 'Gün sonu sayımında kasada 4.500 ₺ eksik çıktı. Kimin hatası olduğu belli değil.', opts: [
      { n: 'Kamera kur', d: '12.000 ₺, bir daha olmaz', f: () => { pay(st, 16500, 'olay'); } },
      { n: 'Ekiple konuş', d: '4.500 ₺ zarar, moral biraz düşer', f: () => { pay(st, 4500, 'olay'); b.moral -= 3; } } ] };
    case 'sozlesme': return { t: 'Ev sahibi uzun sözleşme öneriyor', s: bn, body: 'Ev sahibi, kirayı 2 yıl sabitlemeyi teklif ediyor; karşılığında 2 aylık kirayı peşin istiyor.', opts: [
      { n: 'Kabul et', d: fmt(b.rent * 2) + ' peşin, sonraki kira artışı yok', f: () => { pay(st, b.rent * 2, 'yatirim'); b.rentLock = st.day + 730; } },
      { n: 'Reddet', d: 'Yıllık artış normal işler', f: () => {} } ] };
    case 'vitrin': return { t: 'Vitrin yarışması', s: bn, body: 'Belediye bayram öncesi en güzel vitrin yarışması düzenliyor.', opts: [
      { n: 'Katıl', d: '10.000 ₺ süsleme, %40 kazanma şansı', f: () => { pay(st, 10000); if (rnd(st) < .4) { st.cash += 30000; st.month.extra += 30000; st.mkt.followers += 1200; log(st, b.name + ' vitrin yarışmasını kazandı.', 'good'); } } },
      { n: 'Katılma', d: 'Bir şey olmaz', f: () => {} } ] };
    case 'cekirdek': return { t: 'Nadir çekirdek fırsatı', s: bn, body: 'Bir kavurmacı, sınırlı sayıda Etiyopya çekirdeği teklif ediyor. Bir ay boyunca "günün kahvesi" olabilir.', opts: [
      { n: 'Al', d: '25.000 ₺, bir ay kalite ve puan artar', f: () => { pay(st, 25000); b.boosts.push({ k: 'cek', mult: 1.06, until: st.day + 30 }); b.rating = Math.min(5, b.rating + .08); } },
      { n: 'Gerek yok', d: 'Bir şey olmaz', f: () => {} } ] };
    case 'kosu': return { t: 'Maraton güzergahı', s: bn, body: 'Pazar günkü şehir maratonu ' + bn + '\'nin önünden geçecek. Yol kapalı ama seyirci çok olacak.', opts: [
      { n: 'Su ve kahve standı aç', d: '8.000 ₺, pazar yoğun geçer', f: () => { pay(st, 8000); b.boosts.push({ k: 'kosu', mult: 1.25, until: st.day + 2 }); } },
      { n: 'Normal devam et', d: 'Yol kapalı, pazar sakin', f: () => { b.boosts.push({ k: 'kosu', mult: .85, until: st.day + 2 }); } } ] };
    case 'kitap': return { t: 'Kitap kulübü', s: bn, body: 'Bir okuma grubu ayda iki kez ' + bn + '\'de buluşmak istiyor. Sessiz bir köşe ve indirim istiyorlar.', opts: [
      { n: 'Hoş geldiniz', d: 'Sadık müşteri, küçük kalıcı artış', f: () => { b.pot = Math.min(1.5, b.pot * 1.02); } },
      { n: 'Uygun değil', d: 'Bir şey olmaz', f: () => {} } ] };
    case 'veteriner': return { t: 'Sokak kedisi kapıda', s: bn, body: 'Bir sokak kedisi birkaç gündür dükkanın önünde. Müşteriler çok seviyor ama biraz zayıf görünüyor.', opts: [
      { n: 'Veterinere götür, mama kabı koy', d: '3.000 ₺, mahallede sevilirsin', f: () => { pay(st, 3000); b.rating = Math.min(5, b.rating + .05); st.mkt.followers += 400; } },
      { n: 'Belediyeye haber ver', d: 'Bir şey olmaz', f: () => {} } ] };
    case 'kazan': return { t: 'Kombi arızası', s: bn, body: 'Isıtma çalışmıyor, içerisi soğuk. Müşteriler montlarıyla oturuyor.', opts: [
      { n: 'Hemen tamir', d: '11.000 ₺', f: () => pay(st, 11000, 'servis') },
      { n: 'Isıtıcı getir', d: '3.000 ₺, bir hafta memnuniyet düşer', f: () => { pay(st, 3000, 'servis'); b.boosts.push({ k: 'kazan', mult: .9, until: st.day + 7 }); } } ] };
    case 'fiyatsikayet': return { t: 'Fiyat şikayeti viral oldu', s: bn, body: 'Bir müşteri fişinin fotoğrafını "bu fiyat normal mi?" diye paylaştı, yorumlar kızışıyor.', opts: [
      { n: 'Bir hafta %10 indirim', d: 'Tepki yatışır, marj düşer', f: () => { b.marginCut = Math.max(b.marginCut || 0, st.day + 7); } },
      { n: 'Kaliteyi anlatan paylaşım yap', d: '5.000 ₺, %50 işe yarar', f: () => { pay(st, 5000); if (rnd(st) < .5) b.rating = Math.max(1, b.rating - .1); } } ] };
    case 'yangin': return { t: 'Yangın tüpü denetimi', s: bn, body: 'İtfaiye denetiminde yangın tüplerinin dolum süresinin geçtiği görüldü.', opts: [
      { n: 'Hemen yenile', d: '7.000 ₺', f: () => pay(st, 7000, 'ceza') },
      { n: 'Cezayı öde, sonra yenile', d: '18.000 ₺', f: () => pay(st, 18000, 'ceza') } ] };
    case 'ogrencikart': return { t: 'Üniversite öğrenci kartı anlaşması', s: bn, body: 'Öğrenci konseyi, kart sahiplerine %10 indirim karşılığında ' + bn + '\'yi tanıtmayı teklif ediyor.', opts: [
      { n: 'Anlaş', d: '2 ay öğrenci artar, marj biraz düşer', f: () => { b.boosts.push({ k: 'okart', mult: 1.12, until: st.day + 60 }); b.marginCut = Math.max(b.marginCut || 0, st.day + 30); } },
      { n: 'Anlaşma', d: 'Bir şey olmaz', f: () => {} } ] };
    case 'mudurteklif': return { t: 'Müdürüne teklif geldi', s: bn, body: (b.manager ? b.manager.n : 'Müdürün') + ', rakip bir zincirden daha yüksek maaşlı teklif aldı.', opts: [
      { n: '%15 zam yap', d: 'Müdür kalır', f: () => { if (b.manager) b.manager.wage = Math.round(b.manager.wage * 1.15); } },
      { n: 'Gitmesine izin ver', d: 'Şube müdürsüz kalır', f: () => { if (b.manager) log(st, b.manager.n + ' ayrıldı (' + b.name + ').', 'warn'); b.manager = null; b.moral -= 5; } } ] };
    case 'menukart': return { t: 'Menü tasarımı eskidi', s: bn, body: 'Menü kartları yıprandı, fiyat etiketleri üst üste yapıştırılmış görünüyor.', opts: [
      { n: 'Yeni menü bastır', d: '6.000 ₺, puan biraz artar', f: () => { pay(st, 6000); b.rating = Math.min(5, b.rating + .04); } },
      { n: 'Sonra', d: 'Bir şey olmaz', f: () => {} } ] };
    case 'buzdolabi': return { t: 'Tatlı dolabı soğutmuyor', s: bn, body: 'Vitrin dolabı gece arıza vermiş, içerideki tatlıların bir kısmı bozuldu.', opts: [
      { n: 'Tamir ettir, stoğu yenile', d: '13.000 ₺', f: () => pay(st, 13000, 'servis') },
      { n: 'Tatlı satışını 3 gün durdur', d: '4.000 ₺ tamir, ciro düşer', f: () => { pay(st, 4000, 'servis'); b.boosts.push({ k: 'buz', mult: .85, until: st.day + 3 }); } } ] };
    case 'internet': return { t: 'İnternet kesildi', s: bn, body: 'Altyapı arızası yüzünden internet ve kartlı ödeme çalışmıyor. Sadece nakit alabiliyorsun.', opts: [
      { n: 'Mobil hat ile POS bağla', d: '2.500 ₺, satış sürer', f: () => pay(st, 2500, 'servis') },
      { n: 'Sadece nakit', d: 'Bugün ciro yarıya iner', f: () => { b.boosts.push({ k: 'net', mult: .55, until: st.day }); } } ] };
    case 'dogumgunu': return { t: 'Doğum günü partisi rezervasyonu', s: bn, body: '15 kişilik bir grup cumartesi doğum günü kutlamak istiyor, pasta ve masa süslemesi istiyorlar.', opts: [
      { n: 'Kabul et', d: '+12.000 ₺ ek ciro', f: () => { st.cash += 12000; st.month.extra += 12000; } },
      { n: 'Yerimiz yok', d: 'Bir şey olmaz', f: () => {} } ] };
    case 'dizi2': return { t: 'Dizi oyuncusu müdavim oldu', s: bn, body: 'Sevilen bir dizinin oyuncusu sabahları ' + bn + '\'ye gelmeye başladı ve hikayesinde paylaştı.', opts: [
      { n: 'Ona özel bir fincan hazırla', d: 'İki hafta yoğunluk, takipçi', f: () => { b.boosts.push({ k: 'dizi2', mult: 1.15, until: st.day + 14 }); st.mkt.followers += 3000; } } ] };
    case 'kira': { return { t: 'Kira artışı zamanı', s: bn, body: 'Sözleşme yıl dönümü geldi. Ev sahibi kiranın ' + fmt(b.rent) + ' yerine ' + fmt(r500(b.rent * 1.35)) + ' olmasını istiyor.', opts: [
      { n: 'Kabul et', d: '%35 artış', f: () => { b.rent = r500(b.rent * 1.35); } },
      { n: 'Pazarlık et', d: '%50 şansla %25, olmazsa %45', f: () => { b.rent = r500(b.rent * (rnd(st) < .5 ? 1.25 : 1.45)); } } ] }; }
    case 'asgari': return { t: 'Asgari ücret güncellendi', s: 'Türkiye geneli', body: 'Yeni dönem asgari ücreti açıklandı. Personel maliyetlerin yaklaşık %14 artıyor. Fiyatlarını gözden geçirmeyi unutma.', opts: [{ n: 'Tamam', d: 'Maaş giderleri arttı', f: () => {} }] };
    case 'zarar': return { t: b.name + ' üç aydır zararda', s: bn, body: 'Bu şube üst üste üç ay zarar etti. Konumu, fiyatları veya konsepti yeniden düşünmen gerekebilir.', opts: [
      { n: 'Devam et', d: 'Kurtarmaya çalış', f: () => {} },
      { n: 'Devren sat', d: 'Yaklaşık ' + fmt(salePrice(st, b)), f: () => { sellBranch(st, b); } } ] };
    default: return null;
  }
}
function pay(st, v, cat) { spend(st, v, cat || 'olay'); }
function nextEvent(st) { while (st.queue.length) { const ev = st.queue[0]; if (ev.k === 'rapor') return ev; if (ev.k === 'asgari' || ev.k === 'ihtar' || ev.k === 'hedef' || ev.k === 'avmacilis' || ev.k === 'iap' || st.branches.find(x => x.id === ev.b)) return ev; st.queue.shift(); } return null; }
function resolveEvent(st, ev, i) {
  st.queue.shift(); if (ev.k === 'rapor') return;
  const card = eventCard(st, ev); if (card && card.opts[i]) card.opts[i].f();
}

/* ---------- kriz ---------- */
const INVESTORS = ['Kuzey Gıda Yatırım', 'Anadolu Kahve Holding', 'Marmara Girişim Ortaklığı', 'Ege Restoran Grubu', 'Boğaziçi Franchise A.Ş.', 'Toros Yatırım'];
function checkCrisis(st) {
  if (st._noEvents || st.over) return;
  const lim = kmhLimit(st);
  if (st.cash >= 0) return;
  if (!st.bank.warn && (st.bank.negStreak >= 14 || st.cash < -lim)) { st.bank.warn = { day: st.day, until: st.day + 10 }; st.queue.push({ k: 'ihtar' }); log(st, 'Banka ihtarı: 10 gün içinde kasa artıya geçmezse şube zorunlu devredilecek.', 'bad'); return; }
  if (st.bank.warn && (st.day >= st.bank.warn.until || st.cash < -lim * 1.6)) startForced(st);
}
function startForced(st) {
  if (st.crisis) return;
  if (!st.branches.length) { st.over = true; st.crisis = { bankrupt: true }; log(st, 'Şirket iflas etti.', 'bad'); return; }
  const offers = st.branches.map((b, i) => ({ b: b.id, inv: INVESTORS[(b.id + st.day + i) % INVESTORS.length], price: r1000(salePrice(st, b) * rr(st, .6, .82)) }));
  st.crisis = { forced: true, offers, debt: Math.round(-st.cash), loans: Math.round(st.bank.loans.reduce((a, l) => a + l.bal, 0)) };
}
function forcedTransfer(st, bid) {
  if (!st.crisis || !st.crisis.offers) return;
  const o = st.crisis.offers.find(x => x.b === bid), b = st.branches.find(x => x.id === bid); if (!o || !b) return;
  let left = o.price; const paidCash = Math.min(left, Math.max(0, -st.cash)); st.cash += paidCash; left -= paidCash;
  let paidLoans = 0; for (const l of st.bank.loans) { const p = Math.min(left, l.bal); l.bal -= p; left -= p; paidLoans += p; if (l.bal <= 1) l.left = 0; }
  st.bank.loans = st.bank.loans.filter(l => l.left > 0 && l.bal > 1); for (const l of st.bank.loans) l.pay = Math.round(l.bal * l.r / (1 - Math.pow(1 + l.r, -l.left)));
  st.cash += left; st.branches = st.branches.filter(x => x !== b);
  st.bank.score = Math.max(300, st.bank.score - 120);
  log(st, b.name + ' zorunlu olarak ' + o.inv + '\'a devredildi. ' + fmt(o.price) + ' ödendi: ' + fmt(paidCash) + ' eksi bakiye, ' + fmt(paidLoans) + ' kredi borcu kapandı.', 'bad');
  st.crisis = null;
  if (st.cash < 0) { if (!st.branches.length) { st.over = true; st.crisis = { bankrupt: true }; } else startForced(st); }
  else { st.bank.warn = null; st.bank.negStreak = 0; }
}
function restructure(st) {
  if (st.bank.restructured || st.bank.score < 800) return false;
  const need = -st.cash + 300000; addLoan(st, 'yapilandirma', need, .05, 36); st.bank.restructured = true; st.bank.score -= 200; st.crisis = null; st.bank.warn = null; st.bank.negStreak = 0; return true;
}

/* ---------- kilit takibi ---------- */
function checkUnlocks(st) {
  for (const t in TYPES) { if (t === 'kafe') continue; if (!st.unlocked[t] && typeLock(st, t).length === 0) { st.unlocked[t] = true; log(st, TYPES[t].n + ' açma seviyesine ulaştın.', 'good'); } }
  const fresh = [];
  for (const id in DISTRICTS) { if (!st.unlocked['d:' + id] && districtLock(st, id).length === 0) { st.unlocked['d:' + id] = true; if (Object.keys(DISTRICTS[id].req).length && st.day + st.branches.length > 0) fresh.push(id); } }
  if (fresh.length) { const lux = fresh.filter(id => DISTRICTS[id].prof === 'luks'), rest = fresh.filter(id => DISTRICTS[id].prof !== 'luks');
    const nm = id => DISTRICTS[id].n + (DISTRICTS[id].p === '34' ? '' : ' (' + PROV[DISTRICTS[id].p].n + ')');
    if (rest.length) log(st, 'Yeni semtler açıldı: ' + rest.slice(0, 4).map(nm).join(', ') + (rest.length > 4 ? ' ve ' + (rest.length - 4) + ' semt daha' : '') + '.', 'good');
    if (lux.length) log(st, lux.length + ' lüks ilçenin kilidi açıldı: ' + lux.slice(0, 3).map(nm).join(', ') + (lux.length > 3 ? ' ve diğerleri' : '') + '.', 'good'); }
}
function corporateDaily(st) { for (const b of st.branches) if (b.corp && b.corp.until >= st.day && b.status === 'acik') { const v = b.corp.amt / 30; b.extraRev = (b.extraRev || 0) + v; st.cash += v * .6; st.month.extra += v; } }

/* ---------- biçim ---------- */
function fmt(v) { const n = Math.round(v); return n.toLocaleString('tr-TR') + ' ₺'; }
function fmtK(v) { const a = Math.abs(v), s = v < 0 ? '−' : ''; if (a >= 1e6) return s + (a / 1e6).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' Mn ₺'; if (a >= 1e4) return s + Math.round(a / 1000).toLocaleString('tr-TR') + ' B ₺'; return s + Math.round(a).toLocaleString('tr-TR') + ' ₺'; }

const _endDay = endDay;
function endDayWrap(st) { corporateDaily(st); _endDay(st); }

root.KZ = { START_REC, offlineEarn, claimOffline, 
  DISTRICTS, PROVINCES, PROV, PROFILE, profileOf, provDistricts, comps, SEGS, PRODUCTS, TYPES, ARCH, EQUIP, DECOR, CONCEPTS, WAGES, BANKS, SUPPLY, AGENCIES, RIVALS, STARTS, MONTHS, DAYS, AUD_LABEL,
  newGame, tickHour: function (st) { if (st.over) return; for (const b of st.branches) branchHour(st, b, st.hour); msHour(st); st.hour++; if (st.hour >= 24) { st.hour = 0; endDayWrap(st); msDay(st); } },
  dateOf, dateLabel, monthLabel, weatherLabel, wxOf, WX_N, getListings, refreshListings, inspectListing, listingEstimate, permitsFor, waitDays, conceptsFor, minStaff, defaultChoice, setupCost, openBranch,
  districtLock, typeLock, reqMissing, counts, reputation, awareness, perception, localRef, unitCost, computeOffer, staffCap,
  setPrice, toggleItem, raiseAll, changeStaff, changeConcept, upgradeDecor, upgradeEquip, addKitchen, toggleFront, salePrice, sellBranch,
  loanOffers, addLoan, kmhLimit, posTalk, promoOffer, takePromo, postContent, setAgency, startCampaign, inviteInfluencer, upgradeSupply,
  IAP, iapState, iapAvail, iapGive, useTicket, MALL_SIZE, allMalls, mallById, mallsIn, mallVac, mallListings, mallDid, adLeft, adReward, monthBonus, dailyGift, compStrength, GOALS, kurbanInfo, KURBAN_P, ramadanInfo, consOf, forecast, priceImpact, reviewSummary, forcedTransfer, startForced, MGR_LVL, managerCandidates, hireManager, fireManager, toggleAutoPrice, DRV_N, CAT_N, cityScale, utilCost,
  buyStake, sellStake, refreshOffers, nextEvent, eventCard, resolveEvent, restructure, checkUnlocks, fmt, fmtK, clamp, avgRev
};
})(typeof window !== 'undefined' ? window : globalThis);
