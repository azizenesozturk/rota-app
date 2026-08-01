export async function geocodeLocation(query: string) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&accept-language=tr`

  try {
    const res = await fetch(url)
    console.log('HTTP durum kodu:', res.status)

    const data = await res.json()
    console.log('Nominatim yanıtı:', data)

    if (!data || data.length === 0) {
      throw new Error('Konum bulunamadı')
    }

    const result = data[0]
    return {
      name: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    }
  } catch (err) {
    console.error('Geocoding hatası:', err)
    throw err
  }
}

// Hava durumu + deniz verisi çekme
export async function fetchWeather(latitude: number, longitude: number, startDate: string, endDate: string) {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max&hourly=temperature_2m,precipitation_probability,windspeed_10m&start_date=${startDate}&end_date=${endDate}&timezone=auto`

  const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&daily=wave_height_max&hourly=wave_height&start_date=${startDate}&end_date=${endDate}&timezone=auto`

  const [weatherRes, marineRes] = await Promise.all([
    fetch(weatherUrl),
    fetch(marineUrl),
  ])

  const weather = await weatherRes.json()
  const marine = await marineRes.ok ? await marineRes.json() : null

  return { weather, marine }
}

export interface ActivityAssessment {
  status: 'good' | 'warning' | 'bad'
  statusLabel: string
  summary: string
  stats: { icon: string; label: string }[]
  tips: string[]
}

export function assessCamping(weather: any): ActivityAssessment {
  const rainProb = weather.daily.precipitation_probability_max[0] ?? 0
  const windSpeed = weather.daily.windspeed_10m_max[0] ?? 0

  let status: 'good' | 'warning' | 'bad' = 'good'
  let statusLabel = 'Uygun'
  let summary = 'Hava kamp için uygun görünüyor.'

  if (rainProb > 60 || windSpeed > 40) {
    status = 'bad'
    statusLabel = 'Uygun Değil'
    summary = 'Şiddetli yağış veya rüzgar bekleniyor, kamp önerilmez.'
  } else if (rainProb > 30 || windSpeed > 20) {
    status = 'warning'
    statusLabel = 'Dikkatli Git'
    summary = 'Zemin ıslak olabilir, yağış ihtimali var.'
  }

  return {
    status,
    statusLabel,
    summary,
    stats: [
      { icon: 'rain', label: `%${Math.round(rainProb)} yağış` },
      { icon: 'ground', label: rainProb > 30 ? 'ıslak zemin' : 'kuru zemin' },
      { icon: 'wind', label: `${Math.round(windSpeed)} km/sa` },
    ],
    tips:
      status === 'bad'
        ? ['bugün kamp kurmayı erteleyin', 'güvenli bir yer bulana kadar bekleyin']
        : status === 'warning'
        ? ['su geçirmez çadır kullan', 'kaymaz ayakkabı giy']
        : ['hava kampa uygun, iyi eğlenceler'],
  }
}

export function assessSwimming(marine: any, weather: any): ActivityAssessment {
  const waveHeight = marine?.daily?.wave_height_max?.[0] ?? 0
  const waterTemp = weather.daily.temperature_2m_min[0] ?? 20

  let status: 'good' | 'warning' | 'bad' = 'good'
  let statusLabel = 'Uygun'
  let summary = 'Deniz yüzme için uygun görünüyor.'

  if (waveHeight > 1.2) {
    status = 'bad'
    statusLabel = 'Uygun Değil'
    summary = 'Dalga boyu yüksek, yüzmek riskli olabilir.'
  } else if (waveHeight > 0.6) {
    status = 'warning'
    statusLabel = 'Dikkatli Git'
    summary = 'Hafif dalgalanma var, dikkatli olun.'
  }

  return {
    status,
    statusLabel,
    summary,
    stats: [
      { icon: 'wave', label: `${waveHeight.toFixed(1)}m` },
      { icon: 'temp', label: `${Math.round(waterTemp)}°C` },
      { icon: 'risk', label: status === 'bad' ? 'risk yüksek' : status === 'warning' ? 'orta risk' : 'düşük risk' },
    ],
    tips:
      status === 'bad'
        ? ['bugün suya girme', 'cankurtaran yoksa yaklaşma']
        : status === 'warning'
        ? ['dikkatli yüzün', 'çocukları yakından takip edin']
        : ['yüzmek için uygun, keyifli günler'],
  }
}

export async function getAiAdvice(
  location: string,
  startDate: string,
  endDate: string,
  activities: string[],
  weatherData: any
) {
  const res = await fetch('http://localhost:3001/api/advice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location, startDate, endDate, activities, weatherData }),
  })

  if (!res.ok) {
    throw new Error('Tavsiye alınamadı')
  }

  return res.json()
}

export function getCampStats(weather: any) {
  const rainProb = weather.daily.precipitation_probability_max[0] ?? 0
  const windSpeed = weather.daily.windspeed_10m_max[0] ?? 0
  return [
    { label: `%${Math.round(rainProb)} yağış` },
    { label: rainProb > 30 ? 'ıslak zemin' : 'kuru zemin' },
    { label: `${Math.round(windSpeed)} km/sa` },
  ]
}

export function getSwimStats(marine: any, weather: any) {
  const waveHeight = marine?.daily?.wave_height_max?.[0] ?? 0
  const waterTemp = weather.daily.temperature_2m_min[0] ?? 20
  return [
    { label: `${waveHeight.toFixed(1)}m` },
    { label: `${Math.round(waterTemp)}°C` },
    { label: waveHeight > 1.2 ? 'risk yüksek' : waveHeight > 0.6 ? 'orta risk' : 'düşük risk' },
  ]
}