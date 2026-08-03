import { GoogleGenerativeAI } from '@google/generative-ai'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST kabul edilir' })
  }

  try {
    const { location, startDate, endDate, activities, weatherData } = req.body

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' })

    const prompt = `
Sen bir seyahat/kamp asistanısın. Aşağıdaki hava durumu verisine göre, seçilen aktiviteler için değerlendirme yap.

Konum: ${location}
Tarih aralığı: ${startDate} - ${endDate}
Aktiviteler (bu id'leri JSON anahtarı olarak birebir kullan): ${activities.join(', ')}

Hava verisi (JSON):
${JSON.stringify(weatherData)}

Her aktivite için, o aktiviteye GERÇEKTEN uygun 3 istatistik seç. Her istatistik ZORUNLU olarak "lines" adında, İÇİNDE EN AZ 1 ELEMAN OLAN bir dizi içermeli. Asla boş dizi gönderme.

KESIN ÖRNEK - Kamp için:
"stats": [
  { "icon": "temperature", "lines": ["Gece 24°C", "Gündüz 32°C"] },
  { "icon": "rain", "lines": ["%18 yağış"] },
  { "icon": "wind", "lines": ["0-24 km/sa"] }
]

KESIN ÖRNEK - Yüzme için:
"stats": [
  { "icon": "wave", "lines": ["0.2-0.6m"] },
  { "icon": "water_temp", "lines": ["25°C"] },
  { "icon": "wind", "lines": ["Hafif"] }
]

KESIN ÖRNEK - Yürüyüş/Tırmanış/Bisiklet için:
"stats": [
  { "icon": "temperature", "lines": ["31°C"] },
  { "icon": "ground", "lines": ["Kuru Zemin"] },
  { "icon": "wind", "lines": ["Orta"] }
]

Yukarıdaki örnekleri BİREBİR kopyalama, kendi hava verine göre gerçek sayıları hesapla, ama FORMATI (her zaman "icon" ve dolu bir "lines" dizisi) AYNEN böyle kullan.

KRİTİK KURAL: Her "lines" elemanı EN FAZLA 12 karakter olmalı. "Maksimum", "ihtimali", "genel olarak" gibi dolgu kelimeler KULLANMA. Sadece sayı+birim veya tek kelime durum yaz. Örnek: "%18 yağış" DOĞRU, "Maksimum %18 yağış ihtimali" YANLIŞ. "Kuru zemin" DOĞRU, "Genel olarak kuru" YANLIŞ.

"tips" alanı kart üzerinde HER ZAMAN görünen en kritik 2 öneri olsun, her biri 6-10 kelime, spesifik ve aksiyona dönük olsun (örn "Gölgede, iyi havalandırılan bir alana çadır kurun" gibi — sadece "Gölge alan seç" gibi 2 kelimelik olmasın).

"detailedTips" alanı "tüm hazırlık listesi" açılınca görünecek EK 3-4 öneri olsun, "tips" ile TEKRARLAMASIN, farklı ve tamamlayıcı bilgiler versin (malzeme önerileri, zamanlama önerileri, güvenlik önerileri gibi çeşitli açılardan).

"summary" alanı SADECE genel bir tümce olmasın, MUTLAKA seçilen tarih aralığındaki (${startDate} - ${endDate}) somut hava olaylarına değinsin: hangi günler yağmur var, hangi gün rüzgar en yüksek, hangi gün en uygun, varsa dikkat çekici bir uyarı (örn "7 Ağustos'ta %60 yağış ihtimali var, 8-9 Ağustos daha uygun görünüyor" gibi). En az 2, en fazla 3 cümle olsun. Bu kural TÜM aktiviteler için geçerli — sadece kamp değil, yüzme, yürüyüş, tırmanış, bisiklet için de aynı derinlikte, o aktiviteye özel somut gün bilgisi ver.

"tripSummary.comment" alanı, seçilen TÜM tarih aralığını ve TÜM seçilen aktiviteleri kapsayan, 3-4 kısa cümlelik bir dizi olsun. Somut tarihlere değinsin (örn "5 Ağustos'ta kuvvetli yağmur bekleniyor", "İlk üç gün genel olarak elverişli" gibi), genel bir yol haritası niteliğinde olsun.

"betterPeriod" alanı için ÇOK ÖNEMLİ BİR KURAL VAR: kullanıcının seçtiği tarih aralığı ${startDate} - ${endDate} kaç gün sürüyorsa (örneğin 3 gün), önereceğin alternatif de AYNI SÜREDE olmalı (yine 3 gün). Tek gün seçtiyse tek gün öner, 3 gün seçtiyse 3 günlük bir pencere öner — süreyi ASLA değiştirme.

Hava verisi (JSON) kullanıcının seçtiğinden daha GENİŞ bir pencere içerebilir (ek günler olabilir). Veri setindeki tüm olası aynı-uzunlukta pencereleri (örneğin 3 günlükse: 1-3, 2-4, 3-5, 4-6... gibi kaydırmalı pencereler) zihninde karşılaştır. Eğer kullanıcının seçtiğinden belirgin şekilde daha uygun bir pencere varsa, "exists": true yap, o pencerenin başlangıç ve bitiş tarihlerini "startDate"/"endDate" alanlarına yaz (YYYY-MM-DD), "reason" alanına neden daha iyi olduğunu 1 cümleyle açıkla. Eğer kullanıcının seçtiği pencere zaten en iyisiyse veya belirgin fark yoksa "exists": false yap. Sadece hava verisinde GERÇEKTEN bulunan tarihleri kullan, uydurma.

SADECE şu JSON formatında yanıt ver, başka hiçbir metin ekleme:

{
  "activities": {
    "aktivite_id": {
      "status": "good" | "warning" | "bad",
      "statusLabel": "Uygun" | "Dikkatli Git" | "Uygun Değil",
      "summary": "detaylı, günlere referans veren 2-3 cümlelik özet",
      
      "tips": ["kısa öneri 1", "kısa öneri 2"],
      "detailedTips": ["ek öneri 1", "ek öneri 2", "ek öneri 3", "ek öneri 4"]
    }
  },
  "dailyWindows": [
    {
      "date": "2026-08-05",
      "segments": [
        { "start": "00:00", "end": "06:00", "label": "Erken Saat", "color": "warning", "reasons": ["Rüzgar düşük ama karanlık"] },
        { "start": "06:00", "end": "10:30", "label": "En İyi Zaman", "color": "good", "reasons": ["Deniz daha sakin", "Yağış beklenmiyor", "Rüzgar düşük"] },
        { "start": "10:30", "end": "17:00", "label": "Dikkatli Ol", "color": "warning", "reasons": ["Dalga artıyor", "Rüzgar kuvvetleniyor", "Güneş etkisi yüksek"] },
        { "start": "17:00", "end": "21:00", "label": "Önerilmez", "color": "bad", "reasons": ["Yağış ihtimali yüksek", "Dalga yüksek", "Rüzgar kuvvetli"] },
        { "start": "21:00", "end": "24:00", "label": "Gece", "color": "warning", "reasons": ["Görüş düşük"] }
      ]
    }
  ]

"tripSummary": {
    "comment": ["kısa cümle 1", "kısa cümle 2", "kısa cümle 3"]
  }

  "betterPeriod": {
    "exists": true,
    "startDate": "2026-08-08",
    "endDate": "2026-08-10",
    "reason": "Bu 3 günlük dönemde hem yağış hem rüzgar en düşük"
  }

"dailyWindows" alanı, seçilen tarih aralığındaki HER GÜN için ayrı bir obje içermeli (${startDate} ile ${endDate} arasındaki her tarih için bir tane). Her günün "segments" dizisi, o günü baştan sona (00:00-24:00) kesintisiz kaplayan 3-5 zaman dilimine bölünmeli. Her segment "color" olarak "good", "warning" veya "bad" olmalı. "reasons" dizisinde o segmentin neden o renkte olduğuna dair 2-3 kısa madde (3-5 kelime) olmalı. Saatlik hava verisini (hourly alanları) kullanarak gerçekçi geçişler belirle — örneğin öğleden sonra rüzgar artıyorsa, akşamüstü yağış riski varsa bunu segment sınırlarına yansıt.

}
`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    res.json(parsed)
  } catch (err: any) {
    console.error(err)
    if (err.status === 429 || err.status === 503) {
      res.status(503).json({ error: 'Yapay zeka servisi şu anda yoğun, birazdan tekrar deneyin.' })
    } else {
      res.status(500).json({ error: 'Tavsiye üretilemedi' })
    }
  }
}