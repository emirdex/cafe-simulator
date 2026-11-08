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
  function queue(k, v) { pending[k] = v; if (!timer) timer = setTimeout(flush, 400); }
  Storage.prototype.setItem = function (k, v) { origSet(k, v); if (this === ls && String(k).indexOf(PREFIX) === 0) queue(String(k), String(v)); };
  Storage.prototype.removeItem = function (k) { origRemove(k); if (this === ls && String(k).indexOf(PREFIX) === 0) queue(String(k), null); };
  if (P.App) P.App.addListener('pause', function () { if (timer) { clearTimeout(timer); flush(); } });
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
        prices: {}
      };
      // mağazadaki yerel fiyatları oyundaki mağaza ekranına aktar
      var ids = ['starter','cash_s','cash_m','cash_l','rep_s','rep_l','fol','tickets','moral','score','noads'];
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

  Promise.all([restore(), screen()]).then(boot, boot).then(function () { initAds(); initIAP(); checkUpdate(); });
})();
