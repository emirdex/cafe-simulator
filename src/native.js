/* Kafe Zinciri · uygulama köprüsü (iOS / Android)
   Oyun kodu tarayıcıda da aynen çalışır; bu dosya yalnızca uygulamada devreye girer. */
(function () {
  var C = window.Capacitor, P = (C && C.Plugins) || {};
  var NATIVE = !!(C && C.isNativePlatform && C.isNativePlatform());
  var PLATFORM = NATIVE ? C.getPlatform() : 'web';
  var CFG = window.KZ_CONFIG || {};
  window.KZ_NATIVE = NATIVE; window.KZ_PLATFORM = PLATFORM;

  function boot() { try { window.__kzBoot && window.__kzBoot(); } finally { if (P.SplashScreen) P.SplashScreen.hide().catch(function () {}); } }
  if (!NATIVE) { boot(); return; }

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
  var adReady = null;
  function adId() { var ids = CFG.admobRewarded || {}; return ids[PLATFORM] || TEST_REWARDED[PLATFORM]; }
  function adTesting() { var ids = CFG.admobRewarded || {}; return !ids[PLATFORM]; }
  function prepareAd() {
    if (!P.AdMob) return Promise.reject(new Error('AdMob yok'));
    adReady = P.AdMob.prepareRewardVideoAd({ adId: adId(), isTesting: adTesting() });
    adReady.catch(function () { adReady = null; });
    return adReady;
  }
  function initAds() {
    if (!P.AdMob) return Promise.resolve();
    var att = (PLATFORM === 'ios') ? P.AdMob.trackingAuthorizationStatus().then(function (s) {
      if (s && s.status === 'notDetermined') return P.AdMob.requestTrackingAuthorization(); }).catch(function () {}) : Promise.resolve();
    return att.then(function () { return P.AdMob.initialize({ initializeForTesting: adTesting() }); })
      .then(function () { prepareAd().catch(function () {}); }).catch(function () {});
  }
  window.KZAds = {
    showRewarded: function (kind) {
      if (!P.AdMob) return Promise.resolve(false);
      var earned = false, h = null;
      return P.AdMob.addListener('onRewardedVideoAdReward', function () { earned = true; }).then(function (handle) { h = handle;
        return (adReady || prepareAd()); })
        .then(function () { adReady = null; return P.AdMob.showRewardVideoAd(); })
        .then(function () { return true; }, function () { return earned; })
        .then(function (ok) { if (h) h.remove(); prepareAd().catch(function () {}); return ok; });
    }
  };

  /* 4) Uygulama içi satın alma (RevenueCat). Anahtar yoksa oyun kendi deneme satın almasını kullanır. */
  var rcKey = (CFG.revenuecat || {})[PLATFORM];
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
        }
      };
    }).catch(function (e) { console.warn('RevenueCat', e); });
  }

  /* 5) Android geri tuşu: açık pencereyi kapatır, yoksa uygulamayı arka plana alır */
  if (P.App) P.App.addListener('backButton', function () {
    var x = document.querySelector('#layer [data-a^="close"]');
    if (x) x.click(); else P.App.minimizeApp && P.App.minimizeApp();
  });

  Promise.all([restore(), screen()]).then(boot, boot).then(function () { initAds(); initIAP(); });
})();
