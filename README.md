# Kafe Zinciri

Türkiye'de kafe zinciri kurma simülasyonu. iOS ve Android uygulaması **Capacitor** ile paketlenir; oyunun kendisi `game/` klasöründeki tek sayfalık HTML oyunudur ve tarayıcıda da aynen çalışır.

| | |
|---|---|
| Uygulama kimliği | `io.arcbyte.kafezinciri` |
| Ekran | Yalnızca yatay, tam ekran |
| Kayıt | Cihazda kalıcı (Capacitor Preferences) |
| Reklam | AdMob ödüllü video (kimlik girilmezse Google test reklamı) |
| Satın alma | RevenueCat (anahtar girilmezse oyunun deneme satın alması) |

## Klasörler

```
game/            Oyunun kaynak kodu (core.js simülasyon, app.js arayüz, app.css)
src/native.js    Uygulama köprüsü: kayıt, ekran, AdMob, RevenueCat, geri tuşu
src/config.js    AdMob ve RevenueCat kimlikleri (yayından önce doldurulur)
build-app.sh     game/ → www/ (fontlar uygulamanın içine gömülür)
android/  ios/   Yerel projeler
resources/       İkon (1024) ve açılış ekranı (2732) kaynakları
.github/         Otomatik derleme: her push'ta Android APK ve iOS derlemesi
```

## Otomatik derleme (GitHub Actions)

Her `main` push'unda:

- **Android:** telefona doğrudan kurulabilen test APK'sı üretilir → Actions › çalışma › *Artifacts*.
  İmza anahtarı eklenmişse Play Store paketi (AAB) de üretilir; Play servis hesabı eklenmişse iç teste yüklenir.
- **iOS:** Apple anahtarı yoksa yalnızca derleme kontrolü yapılır. Anahtar eklenmişse imzalanıp **TestFlight'a** yüklenir.

### Gerekli gizli anahtarlar (Settings › Secrets and variables › Actions)

| Anahtar | Ne işe yarar |
|---|---|
| `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8` | App Store Connect API anahtarı (rol: Admin veya App Manager). `.p8` dosyasının içeriği olduğu gibi yapıştırılır |
| `APPLE_TEAM_ID` | Apple Developer › Membership'teki 10 karakterlik takım kimliği |
| `ANDROID_KEYSTORE_BASE64` | Yükleme anahtarı (`base64 -w0 upload.keystore`) |
| `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | Anahtarın şifreleri |
| `PLAY_SERVICE_ACCOUNT_JSON` | (İsteğe bağlı) Google Play'e otomatik yükleme için servis hesabı |

> Anahtar dosyalarını asla depoya koyma. Android yükleme anahtarını kaybetmek, Google Play'de anahtar sıfırlama talebi gerektirir; güvenli bir yerde yedekle.

## Bilgisayarda çalıştırma

```bash
npm ci
npm run android   # Android Studio açılır (Windows/Mac/Linux)
npm run ios       # Xcode açılır (yalnızca Mac)
npm run web       # game/kafe-zinciri.html (tarayıcı sürümü)
```

## Yayından önce

1. `src/config.js`: AdMob ödüllü reklam birimleri ve RevenueCat anahtarları.
2. AdMob uygulama kimlikleri: `android/app/src/main/res/values/strings.xml` (`admob_app_id`) ve `ios/App/App/Info.plist` (`GADApplicationIdentifier`). Şu an Google'ın test kimlikleri var.
3. Mağaza ürünleri: `io.arcbyte.kafezinciri.<sku>` — sku listesi `game/core.js` içindeki `IAP` dizisinde (starter, cash_s, cash_m, cash_l, rep_s, rep_l, fol, tickets, moral, score, noads). Hepsi tüketilebilir ürün, `starter` ve `noads` tek seferlik.
4. Gizlilik politikası: arcbyte.io üzerinde yayınlanır, mağaza kayıtlarına bağlantısı girilir.
