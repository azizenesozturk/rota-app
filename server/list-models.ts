import dotenv from 'dotenv'
dotenv.config()

async function listModels() {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
  )
  const data = await res.json()
  data.models?.forEach((m: any) => {
    if (m.supportedGenerationMethods?.includes('generateContent')) {
      console.log(m.name)
    }
  })
}

listModels()