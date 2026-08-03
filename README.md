# DenDen — Akıllı Hava ve Rota Tavsiyesi

Konum, tarih ve aktivitene göre gerçek hava durumu ve yapay zeka destekli, kişiselleştirilmiş seyahat/kamp tavsiyesi veren web uygulaması.

🔗 **Canlı demo:** [rota-app-alpha.vercel.app](https://rota-app-alpha.vercel.app)

## Ne İşe Yarar?

Gideceğin yeri, tarihi ve yapacağın aktiviteyi (kamp, yüzme, yürüyüş, dağ tırmanma, bisiklet, gezi) seçtiğinde:

- O gün/günler için gerçek hava durumu ve deniz/dalga verisini çeker
- Yapay zekaya bu veriyi yorumlatıp **"git / dikkatli git / gitme"** şeklinde net bir tavsiye üretir
- Aktiviteye özel pratik öneriler sunar (örn. "su geçirmez çadır kullan", "bugün suya girme")
- Gün içindeki en uygun saat aralığını gösterir
- Seçtiğin tarihten daha uygun bir gün varsa, veya yakında daha iyi bir yer varsa otomatik önerir

## Özellikler

- 🌤️ Gerçek zamanlı hava durumu ve deniz verisi ([Open-Meteo](https://open-meteo.com))
- 🤖 Google Gemini ile üretilen, bağlama duyarlı tavsiyeler
- 📅 Özel takvim bileşeni ile tarih aralığı seçimi
- 🏖️ Aktivite bazlı değerlendirme (her aktivite kendi kriterlerine göre değerlendirilir)
- 📍 Yakın yer önerisi (hava durumu karşılaştırmalı)
- 📱 Mobil uyumlu, koyu tema arayüz

## Teknolojiler

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Vercel Serverless Functions
- **Yapay Zeka:** Google Gemini API
- **Hava Durumu:** Open-Meteo API (ücretsiz, API anahtarı gerektirmez)
- **Konum Arama:** Nominatim (OpenStreetMap)

## Kurulum

```bash
# Bağımlılıkları kur
npm install

# .env dosyası oluştur ve Gemini API anahtarını ekle
echo "GEMINI_API_KEY=senin_api_anahtarin" > .env

# Geliştirme sunucusunu başlat
npm run dev
```

Uygulama `http://localhost:5173` adresinde açılır.

## Ortam Değişkenleri

| Değişken | Açıklama |
|---|---|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey)'dan alınan ücretsiz Gemini API anahtarı |

## Proje Yapısı

```
rota-app/
├── src/
│   ├── App.tsx          # Ana uygulama ve arayüz
│   ├── Calendar.tsx      # Özel takvim bileşeni
│   ├── weather.ts         # Hava durumu, geocoding ve AI istekleri
│   └── index.css          # Renk paleti ve global stiller
├── api/
│   └── advice.ts          # Gemini AI ile tavsiye üreten serverless function
└── public/
    └── logo.png            # Uygulama logosu
```

## Yol Haritası

- [ ] Rota kaydetme sistemiyle entegrasyon
- [ ] Kullanıcı hesapları ve geçmiş sorgular
- [ ] Bildirim/hatırlatma sistemi (kaydedilen rotalar için otomatik güncel tahmin)
- [ ] Daha fazla aktivite tipi

## Lisans

Bu proje kişisel bir projedir.

## Geliştirici

**Aziz Enes Öztürk**

- GitHub: [@azizenesozturk](https://github.com/azizenesozturk)
- E-posta: ozturkazizenes@gmail.com