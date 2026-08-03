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
  const res = await fetch('/api/advice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location, startDate, endDate, activities, weatherData }),
  })

  if (!res.ok) {
    throw new Error('Tavsiye alınamadı')
  }

  return res.json()
}



function windLevel(speed: number): string {
  if (speed < 10) return 'Yok'
  if (speed < 20) return 'Hafif'
  if (speed < 35) return 'Orta'
  return 'Çok'
}

function waveLevel(height: number): string {
  if (height < 0.2) return 'Yok'
  if (height < 0.5) return 'Hafif'
  if (height < 1.0) return 'Orta'
  return 'Çok'
}

function rainLevel(prob: number): string {
  if (prob < 10) return 'Yok'
  if (prob < 35) return 'Hafif'
  if (prob < 65) return 'Orta'
  return 'Çok'
}

function groundCondition(maxRainProb: number): string {
  if (maxRainProb < 20) return 'Kuru'
  if (maxRainProb < 55) return 'Çamurlu'
  return 'Kaygan'
}

function minMax(arr: number[]) {
  return { min: Math.min(...arr), max: Math.max(...arr) }
}

export function getCampStats(weather: any) {
  const temps = [...weather.daily.temperature_2m_min, ...weather.daily.temperature_2m_max]
  const { min: tMin, max: tMax } = minMax(temps)
  const rainProbs: number[] = weather.daily.precipitation_probability_max
  const { min: rMin, max: rMax } = minMax(rainProbs)
  const winds: number[] = weather.daily.windspeed_10m_max
  const { min: wMin, max: wMax } = minMax(winds)

  return [
    { icon: 'temperature', lines: [`En soğuk ${Math.round(tMin)}°C`, `En sıcak ${Math.round(tMax)}°C`] },
    { icon: 'rain', lines: [`${rainLevel(rMax)} yağış`, `%${Math.round(rMin)}-${Math.round(rMax)}`] },
    { icon: 'wind', lines: [`${windLevel(wMax)} rüzgar`, `${Math.round(wMin)}-${Math.round(wMax)} km/sa`] },
  ]
}

export function getSwimStats(marine: any, weather: any) {
  const waves: number[] = marine?.daily?.wave_height_max ?? [0]
  const { min: waveMin, max: waveMax } = minMax(waves)
  const temps: number[] = weather.daily.temperature_2m_max
  const { min: tMin, max: tMax } = minMax(temps)
  const winds: number[] = weather.daily.windspeed_10m_max
  const { min: wMin, max: wMax } = minMax(winds)

  return [
    { icon: 'wave', lines: [`${waveLevel(waveMax)} dalga`, `${waveMin.toFixed(1)}-${waveMax.toFixed(1)}m`] },
    { icon: 'temperature', lines: [`En soğuk ${Math.round(tMin)}°C`, `En sıcak ${Math.round(tMax)}°C`] },
    { icon: 'wind', lines: [`${windLevel(wMax)} rüzgar`, `${Math.round(wMin)}-${Math.round(wMax)} km/sa`] },
  ]
}

export function getGenericStats(weather: any) {
  const temps = [...weather.daily.temperature_2m_min, ...weather.daily.temperature_2m_max]
  const { min: tMin, max: tMax } = minMax(temps)
  const rainProbs: number[] = weather.daily.precipitation_probability_max
  const rMax = Math.max(...rainProbs)
  const winds: number[] = weather.daily.windspeed_10m_max
  const { min: wMin, max: wMax } = minMax(winds)

  return [
    { icon: 'temperature', lines: [`En soğuk ${Math.round(tMin)}°C`, `En sıcak ${Math.round(tMax)}°C`] },
    { icon: 'ground', lines: [groundCondition(rMax)] },
    { icon: 'wind', lines: [`${windLevel(wMax)} rüzgar`, `${Math.round(wMin)}-${Math.round(wMax)} km/sa`] },
  ]
}

export async function findNearbyPlaces(currentLat: number, currentLon: number, _region: string) {
  // Yaklaşık 60km'lik bir kutu oluştur (enlem/boylam derecesi ~111km)
  const delta = 0.55
  const minLon = currentLon - delta
  const maxLon = currentLon + delta
  const minLat = currentLat - delta
  const maxLat = currentLat + delta

  const url = `https://nominatim.openstreetmap.org/search?q=plaj&format=json&limit=10&accept-language=tr&viewbox=${minLon},${maxLat},${maxLon},${minLat}&bounded=1`

  console.log('Arama URL:', url)
  const res = await fetch(url)
  const data = await res.json()
  console.log('Nominatim sonucu:', data)

  if (!data || data.length === 0) return []

  function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  return data
    .map((r: any) => ({
      name: r.display_name.split(',')[0],
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
      distanceKm: distanceKm(currentLat, currentLon, parseFloat(r.lat), parseFloat(r.lon)),
    }))
    .filter((p: any) => p.distanceKm > 1)
    .sort((a: any, b: any) => a.distanceKm - b.distanceKm)
    .slice(0, 3)
}