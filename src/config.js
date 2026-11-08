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
  // Mağazadaki ürün kimliklerinin ön eki: 'io.arcbyte.kafezinciri.' + 'cash_m'
  skuPrefix: 'io.arcbyte.kafezinciri.'
};
