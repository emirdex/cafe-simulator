/* Kafe Zinciri · uygulama ayarları
   adsLive / iapLive false iken oyun test modunda çalışır:
   Google test reklamları ve oyunun kendi deneme satın alması. Mağaza yayınından hemen önce true yapılır. */
window.KZ_CONFIG = {
  adsLive: false,
  iapLive: false,
  // AdMob › Cafe Simulator › Reklam birimleri › "Odullu - Oyun ici"
  admobRewarded: { ios: 'ca-app-pub-4439830504674079/2355113204', android: 'ca-app-pub-4439830504674079/2631454536' },
  // RevenueCat › Cafe Simulator › API keys (public SDK anahtarları; gizli değildir)
  revenuecat: { ios: '', android: 'goog_UJTDBzkPjwWamtcVBtAXIanQHOx' },
  // Yeni sürüm uyarısı. storeLive: mağazaya çıkınca true (Play / App Store'dan kontrol eder).
  // Test döneminde herkese açık sürüm dosyası okunur: { "notes": "...", "android": { "build": 9, "version": "1.0.9", "url": "..." }, "ios": {...} }
  storeLive: false,
  versionUrl: 'https://raw.githubusercontent.com/emirdex/cafe-simulator-surum/main/version.json',
  // Mağazadaki ürün kimliklerinin ön eki: 'io.arcbyte.kafezinciri.' + 'cash_m'
  skuPrefix: 'io.arcbyte.kafezinciri.'
};
