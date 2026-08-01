import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

app.post('/api/advice', async (req, res) => {
  try {
    const { location, startDate, endDate, activities, weatherData } = req.body

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' })

    const prompt = `
Sen bir seyahat/kamp asistanısın. Aşağıdaki hava durumu verisine göre, seçilen aktiviteler için değerlendirme yap.

Konum: ${location}
Tarih aralığı: ${startDate} - ${endDate}
Aktiviteler: ${activities.join(', ')}

Hava verisi (JSON):
${JSON.stringify(weatherData)}

Her aktivite için SADECE şu JSON formatında yanıt ver, başka hiçbir metin ekleme:

{
  "activities": {
    "aktivite_id": {
      "status": "good" | "warning" | "bad",
      "statusLabel": "Uygun" | "Dikkatli Git" | "Uygun Değil",
      "summary": "kısa açıklama cümlesi",
      "tips": ["öneri 1", "öneri 2"]
    }
  },
  "bestTimeWindow": {
    "start": "06:30",
    "end": "10:00",
    "reason": "kısa açıklama"
  }
}
`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Gemini bazen ```json ile sarmalayabilir, temizleyelim
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    res.json(parsed)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Tavsiye üretilemedi' })
  }
})

app.listen(3001, () => {
  console.log('Sunucu çalışıyor: http://localhost:3001')
})