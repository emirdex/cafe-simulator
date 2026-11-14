/* Kafe Zinciri · uygulama köprüsü (iOS / Android)
   Oyun kodu tarayıcıda da aynen çalışır; bu dosya yalnızca uygulamada devreye girer. */
(function () {
  var C = window.Capacitor, P = (C && C.Plugins) || {};
  var NATIVE = !!(C && C.isNativePlatform && C.isNativePlatform());
  var PLATFORM = NATIVE ? C.getPlatform() : 'web';
  var CFG = window.KZ_CONFIG || {};

  /* 0) Günlük: hatalar ve reklam adımları; Ayarlar › Geliştirici'den kopyalanır */
  var LOG = window.KZLog = { lines: [], add: function (lvl, msg) {
    var d = new Date(), t = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2);
    var line = t + ' ' + lvl + ' ' + String(msg).slice(0, 400); LOG.lines.push(line); if (LOG.lines.length > 300) LOG.lines.shift();
    try { if (!LOG._t) LOG._t = setTimeout(function () { LOG._t = null; try { localStorage.setItem('kz-log', LOG.lines.join('\n')); } catch (e) {} }, 500); } catch (e) {}
  }, text: function () { return LOG.lines.join('\n'); } };
  try { var old = localStorage.getItem('kz-log'); if (old) LOG.lines = old.split('\n').slice(-150).concat(['---- önceki oturum sonu ----']); } catch (e) {}
  function fmtErr(e) { if (!e) return 'bilinmeyen'; if (typeof e === 'string') return e; return (e.code != null ? '[' + e.code + '] ' : '') + (e.message || e.errorMessage || JSON.stringify(e)); }
  ['log', 'warn', 'error'].forEach(function (k) { var o = console[k]; console[k] = function () { try { LOG.add(k.toUpperCase(), [].map.call(arguments, function (a) { return typeof a === 'object' ? (a && a.message ? a.message : JSON.stringify(a)) : a; }).join(' ')); } catch (e) {} return o.apply(console, arguments); }; });
  window.addEventListener('error', function (e) { LOG.add('HATA', (e.message || '') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno); });
  window.addEventListener('unhandledrejection', function (e) { LOG.add('HATA', 'promise: ' + fmtErr(e.reason)); });
  LOG.add('INFO', 'açılış · ' + (C && C.getPlatform ? C.getPlatform() : 'web') + ' · ' + navigator.userAgent);
  window.KZ_NATIVE = NATIVE; window.KZ_PLATFORM = PLATFORM;

  function boot() { try { window.__kzBoot && window.__kzBoot(); } finally { if (P.SplashScreen) P.SplashScreen.hide().catch(function () {}); } }
  if (!NATIVE) { boot(); return; }
  if (PLATFORM === 'android') document.documentElement.classList.add('lowfx');

  /* Güvenilir saat: telefon saatine değil sunucu saatine bakılır (saat hilesine karşı) */
  var TIME_URLS = ['https://www.google.com/generate_204', 'https://www.cloudflare.com/cdn-cgi/trace', 'https://www.apple.com/library/test/success.html'];
  function oneTime(url) {
    var H = P.CapacitorHttp, t0 = Date.now();
    if (!H) return Promise.reject('CapacitorHttp yok');
    return H.request({ url: url + (url.indexOf('?') < 0 ? '?' : '&') + 't=' + t0, method: 'GET', connectTimeout: 6000, readTimeout: 6000, headers: { 'Cache-Control': 'no-cache' } }).then(function (r) {
      var rtt = Date.now() - t0, h = r.headers || {}, d = null;
      Object.keys(h).forEach(function (k) { if (k.toLowerCase() === 'date') d = h[k]; });
      var ms = d ? Date.parse(d) : NaN;
      if (isNaN(ms) && typeof r.data === 'string') { var m = /ts=(\d+(\.\d+)?)/.exec(r.data); if (m) ms = parseFloat(m[1]) * 1000; }
      if (isNaN(ms)) throw 'saat bilgisi yok';
      return ms + rtt / 2;
    });
  }
  window.KZNetTime = function () {
    var i = 0;
    function next() { if (i >= TIME_URLS.length) return null; var u = TIME_URLS[i++]; return oneTime(u).then(function (t) { LOG.add('INFO', 'saat alındı (' + u.split('/')[2] + ') fark ' + Math.round((t - Date.now()) / 1000) + ' sn'); return t; }, function (e) { LOG.add('INFO', 'saat alınamadı ' + u.split('/')[2] + ': ' + fmtErr(e)); return next(); }); }
    return Promise.resolve(next());
  };
  var INFO = null;
  var infoP = (P.App && P.App.getInfo ? P.App.getInfo() : Promise.reject()).then(function (i) { INFO = i; window.KZ_VERSION = i.version + ' (' + i.build + ')'; LOG.add('INFO', 'sürüm ' + window.KZ_VERSION + ' ' + i.id); return i; }, function () { return null; });

  /* Yeni sürüm kontrolü: mağazadaysa mağazaya, test döneminde sürüm dosyasına bakar */
  function announce(u) { window.KZUpdate = u; LOG.add('INFO', 'yeni sürüm var: ' + u.version); try { window.dispatchEvent(new Event('kzupdate')); } catch (e) {} }
  function checkUpdate() {
    return infoP.then(function (i) {
      if (CFG.storeLive && P.AppUpdate) {
        return P.AppUpdate.getAppUpdateInfo().then(function (r) {
          if (r && r.updateAvailability === 2) announce({ version: r.availableVersionName || r.availableVersionCode || 'yeni', open: function () { P.AppUpdate.openAppStore().catch(function () {}); } });
        });
      }
      if (!CFG.versionUrl || !i) return;
      return fetch(CFG.versionUrl + '?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (v) {
        var cur = parseInt(i.build, 10) || 0, p = v[PLATFORM] || {};
        if ((p.build || 0) > cur) announce({ version: p.version || ('1.0.' + p.build), notes: v.notes || '', force: !!p.force, open: function () { if (p.url) window.open(p.url, '_system'); } });
        else LOG.add('INFO', 'sürüm güncel (' + cur + ')');
      });
    }).catch(function (e) { LOG.add('INFO', 'sürüm kontrolü yapılamadı: ' + fmtErr(e)); });
  }
  if (P.App) P.App.addListener('resume', function () { if (!window.KZUpdate) checkUpdate(); });

  /* 1) Kalıcı kayıt: localStorage'daki oyun anahtarları Preferences'a da yazılır.
        iOS WebView hafızası silinse bile kayıt Preferences'tan geri yüklenir. */
  var PREFIX = 'kafe-zinciri';
  var Pref = P.Preferences;
  var ls = window.localStorage, origSet = ls.setItem.bind(ls), origRemove = ls.removeItem.bind(ls);
  var pending = {}, timer = null;
  function flush() { timer = null; var q = pending; pending = {}; Object.keys(q).forEach(function (k) {
      if (q[k] === null) Pref.remove({ key: k }).catch(function () {}); else Pref.set({ key: k, value: q[k] }).catch(function () {}); }); }
  /* iCloud yedeği (iOS): kayıt ve cüzdan iCloud'a da yazılır. Android'de Google Yedekleme aynı işi yapar. */
  var Cloud = (PLATFORM === 'ios' && C.registerPlugin) ? C.registerPlugin('KZCloud') : null;
  var CLOUD_KEYS = { 'kafe-zinciri-v1': 1, 'kafe-zinciri-cuzdan': 1 }, cloudQ = {}, cloudT = null;
  function cloudFlush() { cloudT = null; var q = cloudQ; cloudQ = {}; Object.keys(q).forEach(function (k) { Cloud.set(q[k] === null ? { key: k } : { key: k, value: q[k] }).catch(function (e) { LOG.add('INFO', 'iCloud yazılamadı: ' + fmtErr(e)); }); }); }
  function cloudQueue(k, v) { if (!Cloud || !CLOUD_KEYS[k]) return; cloudQ[k] = v; if (!cloudT) cloudT = setTimeout(cloudFlush, 5000); }
  function queue(k, v) { pending[k] = v; cloudQueue(k, v); if (!timer) timer = setTimeout(flush, 400); }
  Storage.prototype.setItem = function (k, v) { origSet(k, v); if (this === ls && String(k).indexOf(PREFIX) === 0) queue(String(k), String(v)); };
  Storage.prototype.removeItem = function (k) { origRemove(k); if (this === ls && String(k).indexOf(PREFIX) === 0) queue(String(k), null); };
  if (P.App) P.App.addListener('pause', function () { if (timer) { clearTimeout(timer); flush(); } if (cloudT) { clearTimeout(cloudT); cloudFlush(); } });
  document.addEventListener('visibilitychange', function () { if (document.hidden && timer) { clearTimeout(timer); flush(); } });

  function restore() {
    if (!Pref) return Promise.resolve();
    return Pref.keys().then(function (r) {
      var keys = (r.keys || []).filter(function (k) { return k.indexOf(PREFIX) === 0; });
      return Promise.all(keys.map(function (k) { return Pref.get({ key: k }).then(function (g) {
        if (g.value != null) { var cur = null; try { cur = ls.getItem(k); } catch (e) {}
          // iki kayıt varsa daha yeni olanı tut
          if (cur && k === 'kafe-zinciri-v1') { try { if ((JSON.parse(cur).savedAt || 0) > (JSON.parse(g.value).savedAt || 0)) { queue(k, cur); return; } } catch (e) {} }
          origSet(k, g.value); } }); }));
    }).then(function () {
      if (!Cloud) return;
      // iCloud'daki kayıt daha yeniyse (ya da cihazda hiç yoksa) onu kullan
      return Promise.all(Object.keys(CLOUD_KEYS).map(function (k) { return Cloud.get({ key: k }).then(function (g) {
        if (!g || g.value == null) return; var cur = null; try { cur = ls.getItem(k); } catch (e) {}
        var take = !cur;
        if (cur && k === 'kafe-zinciri-v1') { try { take = (JSON.parse(g.value).savedAt || 0) > (JSON.parse(cur).savedAt || 0) + 60000; } catch (e) {} }
        if (take) { origSet(k, g.value); LOG.add('INFO', 'iCloud yedeğinden geri yüklendi: ' + k); }
      }); })).catch(function (e) { LOG.add('INFO', 'iCloud okunamadı: ' + fmtErr(e)); });
    }).then(function () {
      // ilk açılış: eski localStorage kaydını Preferences'a taşı
      for (var i = 0; i < ls.length; i++) { var k = ls.key(i); if (k && k.indexOf(PREFIX) === 0) queue(k, ls.getItem(k)); }
    }).catch(function () {});
  }

  /* 2) Ekran: tam ekran, yatay kilit */
  function screen() {
    var ps = [];
    if (P.StatusBar) ps.push(P.StatusBar.hide().catch(function () {}));
    if (P.ScreenOrientation) ps.push(P.ScreenOrientation.lock({ orientation: 'landscape' }).catch(function () {}));
    return Promise.all(ps);
  }

  /* 3) Ödüllü reklamlar (AdMob). Kimlikler config.js'te; boşsa Google'ın test reklamları kullanılır. */
  var TEST_REWARDED = { ios: 'ca-app-pub-3940256099942544/1712485313', android: 'ca-app-pub-3940256099942544/5224354917' };
  var adReady = null, adInit = null;
  function adId() { var ids = CFG.admobRewarded || {}; return (CFG.adsLive && ids[PLATFORM]) || TEST_REWARDED[PLATFORM]; }
  function adTesting() { var ids = CFG.admobRewarded || {}; return !(CFG.adsLive && ids[PLATFORM]); }
  function prepareAd() {
    if (!P.AdMob) return Promise.reject(new Error('AdMob eklentisi yok'));
    LOG.add('REKLAM', 'yükleniyor ' + adId() + (adTesting() ? ' (test)' : ''));
    adReady = P.AdMob.prepareRewardVideoAd({ adId: adId(), isTesting: adTesting() });
    adReady.then(function () { LOG.add('REKLAM', 'yüklendi'); }, function (e) { adReady = null; window.KZAds.lastError = fmtErr(e); LOG.add('REKLAM', 'yüklenemedi: ' + fmtErr(e)); });
    return adReady;
  }
  function initAds() {
    if (!P.AdMob) return Promise.resolve();
    var att = (PLATFORM === 'ios') ? P.AdMob.trackingAuthorizationStatus().then(function (s) {
      if (s && s.status === 'notDetermined') return P.AdMob.requestTrackingAuthorization(); }).catch(function () {}) : Promise.resolve();
    ['onRewardedVideoAdFailedToLoad', 'onRewardedVideoAdFailedToShow', 'onRewardedVideoAdShowed', 'onRewardedVideoAdDismissed'].forEach(function (ev) {
      try { P.AdMob.addListener(ev, function (info) { LOG.add('REKLAM', ev.replace('onRewardedVideoAd', '') + (info ? ' ' + fmtErr(info) : '')); }); } catch (e) {} });
    adInit = att.then(function () { LOG.add('REKLAM', 'AdMob başlatılıyor'); return P.AdMob.initialize({ initializeForTesting: adTesting() }); })
      .then(function () { LOG.add('REKLAM', 'AdMob hazır'); prepareAd().catch(function () {}); }, function (e) { window.KZAds.lastError = 'başlatılamadı: ' + fmtErr(e); LOG.add('REKLAM', 'AdMob başlatılamadı: ' + fmtErr(e)); });
    return adInit;
  }
  window.KZAds = {
    lastError: null,
    showRewarded: function (kind) {
      if (!P.AdMob) { window.KZAds.lastError = 'AdMob eklentisi yok'; return Promise.resolve(false); }
      var earned = false, h = null; window.KZAds.lastError = null; LOG.add('REKLAM', 'gösterim istendi: ' + kind);
      return (adInit || Promise.resolve())
        .then(function () { return P.AdMob.addListener('onRewardedVideoAdReward', function () { earned = true; LOG.add('REKLAM', 'ödül kazanıldı'); }); })
        .then(function (handle) { h = handle; return (adReady || prepareAd()); })
        .then(function () { adReady = null; return P.AdMob.showRewardVideoAd(); })
        .then(function () { return true; }, function (e) { if (!earned) { window.KZAds.lastError = fmtErr(e); LOG.add('REKLAM', 'gösterilemedi: ' + fmtErr(e)); } return earned; })
        .then(function (ok) { if (h) h.remove(); LOG.add('REKLAM', 'sonuç: ' + (ok ? 'ödül verildi' : 'ödül yok')); prepareAd().catch(function () {}); return ok; });
    }
  };

  /* 4) Uygulama içi satın alma (RevenueCat). Anahtar yoksa oyun kendi deneme satın almasını kullanır. */
  var rcKey = CFG.iapLive ? (CFG.revenuecat || {})[PLATFORM] : null;
  function initIAP() {
    if (!P.Purchases || !rcKey) return Promise.resolve();
    return P.Purchases.configure({ apiKey: rcKey }).then(function () {
      window.KZIAP = {
        purchase: function (sku) {
          var id = (CFG.skuPrefix || '') + sku;
          return P.Purchases.getProducts({ productIdentifiers: [id], type: 'NON_SUBSCRIPTION' }).then(function (r) {
            var prod = (r.products || [])[0]; if (!prod) throw new Error('Ürün bulunamadı: ' + id);
            return P.Purchases.purchaseStoreProduct({ product: prod });
          }).then(function () { return true; }, function (e) { if (!(e && (e.userCancelled || e.code === '1'))) console.warn('IAP', e); return false; });
        },
        prices: {},
        // kalıcı ürünleri (Patron Kartı, Hızlı mod, Akademi, Reklamsız) mağazadan geri getirir
        restore: function (silent) {
          return (silent ? P.Purchases.getCustomerInfo() : P.Purchases.restorePurchases()).then(function (r) {
            var ci = (r && r.customerInfo) || {}, set = {};
            (ci.allPurchasedProductIdentifiers || []).forEach(function (x) { set[x] = 1; });
            (ci.nonSubscriptionTransactions || []).forEach(function (t) { set[t.productIdentifier] = 1; });
            var out = Object.keys(set).map(function (x) { return x.replace(CFG.skuPrefix || '', '').split(':')[0]; });
            LOG.add('INFO', 'geri yükleme: ' + (out.join(',') || 'ürün yok'));
            return out;
          });
        }
      };
      window.KZIAP.restore(true).then(function (l) { try { window.dispatchEvent(new CustomEvent('kzrestore', { detail: { list: l, silent: true } })); } catch (e) {} }, function () {});
      // mağazadaki yerel fiyatları oyundaki mağaza ekranına aktar
      var ids = ['starter','melek','zincir','bayram','haftalik_a','haftalik_b','haftalik_c','patron','hizli','akademi','noads','gold_s','gold_m','gold_l','cash_s','cash_m','cash_l'];
      return P.Purchases.getProducts({ productIdentifiers: ids.map(function (x) { return (CFG.skuPrefix || '') + x; }), type: 'NON_SUBSCRIPTION' }).then(function (r) {
        (r.products || []).forEach(function (p) { var k = p.identifier.replace(CFG.skuPrefix || '', ''); window.KZIAP.prices[k] = p.priceString; });
      }).catch(function () {});
    }).catch(function (e) { console.warn('RevenueCat', e); });
  }

  /* 5) Android geri tuşu: açık pencereyi kapatır, yoksa uygulamayı arka plana alır */
  if (P.App) P.App.addListener('backButton', function () {
    var x = document.querySelector('#layer [data-a^="close"]');
    if (x) x.click(); else P.App.minimizeApp && P.App.minimizeApp();
  });

  /* Puan isteme: mağazanın kendi penceresi (Google/Apple ne zaman gösterileceğine kendisi karar verir) */
  window.KZReview = function (why) {
    if (!P.InAppReview) return; LOG.add('INFO', 'puan istendi: ' + why);
    P.InAppReview.requestReview().catch(function (e) { LOG.add('INFO', 'puan penceresi açılamadı: ' + fmtErr(e)); });
  };

  /* Yerel bildirimler: izin ilk şube açılınca istenir; sunucu yok, telefon kendisi zamanlar */
  var LN = P.LocalNotifications;
  if (LN) {
    if (PLATFORM === 'android') LN.createChannel({ id: 'oyun', name: 'Oyun bildirimleri', description: 'Günlük ödül ve şube hatırlatmaları', importance: 3 }).catch(function () {});
    window.KZNotif = {
      permission: function () { return LN.checkPermissions().then(function (p) { if (p.display === 'prompt' || p.display === 'prompt-with-rationale') return LN.requestPermissions(); return p; }).catch(function () {}); },
      clear: function () { return LN.getPending().then(function (r) { if (r && r.notifications && r.notifications.length) return LN.cancel({ notifications: r.notifications.map(function (n) { return { id: n.id }; }) }); }).catch(function () {}); },
      // önce eskileri siler, sonra yenileri kurar (sıralı; yarış olmasın)
      schedule: function (list) {
        window.KZNotif.clear().then(function () { return LN.checkPermissions(); }).then(function (p) { if (!list.length || p.display !== 'granted') return;
          return LN.schedule({ notifications: list.map(function (n) { return { id: n.id, title: n.title, body: n.body, schedule: { at: new Date(n.at) }, channelId: 'oyun', smallIcon: 'ic_stat_kafe', iconColor: '#d4b26a' }; }) });
        }).then(function () { LOG.add('INFO', 'bildirim planlandı: ' + list.length); }).catch(function (e) { LOG.add('INFO', 'bildirim planlanamadı: ' + fmtErr(e)); });
      }
    };
  }

  /* Hata takibi (Firebase Crashlytics): yerel çökmeler otomatik, oyun içi JS hataları burada iletilir */
  var CR = P.FirebaseCrashlytics, crN = 0;
  function crSend(msg, stack) {
    if (!CR || crN >= 20) return; crN++;
    CR.recordException({ message: String(msg).slice(0, 300), stacktrace: stack || undefined }).catch(function () {});
  }
  if (CR) {
    infoP.then(function (i) { CR.setCustomKey({ key: 'surum', value: i.version + ' (' + i.build + ')', type: 'string' }).catch(function () {}); }, function () {});
    window.addEventListener('error', function (e) { crSend((e.message || 'hata') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno); });
    window.addEventListener('unhandledrejection', function (e) { var r = e.reason; crSend('promise: ' + fmtErr(r)); });
  }
  window.KZCrash = { log: function (m) { if (CR) CR.log({ message: String(m).slice(0, 200) }).catch(function () {}); } };

  Promise.all([restore(), screen()]).then(boot, boot).then(function () { initAds(); initIAP(); checkUpdate(); });
})();
