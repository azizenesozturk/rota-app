import { useState, useRef } from 'react'
import {
  ArrowLeft, Share, MountainSnow, MapPin, CalendarDays, Tent,
  CircleAlert, CloudRain, Wind, ChevronDown, XCircle,
  Thermometer, Lightbulb, ChevronRight, Clock,
  Footprints, Bike, ShieldAlert, TriangleAlert, Bot, X, Compass
} from 'lucide-react'
import { geocodeLocation, fetchWeather, getAiAdvice, getCampStats, getSwimStats, getGenericStats, findNearbyPlaces } from './weather'
import Calendar from './Calendar'


function SwimmerIcon({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 15c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <circle cx="18" cy="6" r="2" />
      <path d="m10 12 2-3 2 1.5-1 2" />
    </svg>
  )
}

function WaveIcon({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2v8" />
      <path d="M2 15c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="m8 6 4-4 4 4" />
    </svg>
  )
}

const ACTIVITIES = [
  { id: 'kamp', label: 'Kamp', icon: Tent },
  { id: 'yuzme', label: 'Yüzme', icon: SwimmerIcon },
  { id: 'yuruyus', label: 'Yürüyüş', icon: Footprints },
  { id: 'tirmanis', label: 'Dağ Tırmanma', icon: MountainSnow },
  { id: 'bisiklet', label: 'Bisiklet Sürmek', icon: Bike },
  { id: 'gezi', label: 'Gezi', icon: Compass },
]

const ACTIVITY_LABELS: Record<string, string> = {
  kamp: 'kamp', yuzme: 'yüzme', yuruyus: 'yürüyüş', tirmanis: 'dağ tırmanma', bisiklet: 'bisiklet', gezi: 'gezi',
}

const STAT_ICONS: Record<string, any> = {
  temperature: Thermometer,
  rain: CloudRain,
  wind: Wind,
  ground: MountainSnow,
  wave: WaveIcon,
  water_temp: Thermometer,
  humidity: CloudRain,
  uv: ShieldAlert,
}

function StatDisplay({ stat, size = 20 }: { stat: any; size?: number }) {
  const Icon = STAT_ICONS[stat.icon] || Thermometer
  const lines: string[] = stat.lines && stat.lines.length > 0 ? stat.lines : [stat.label || '—']
  return (
    <span className="flex flex-col items-center gap-1 text-center max-w-[80px]">
      <Icon size={size} />
      <span className="flex flex-col leading-tight">
        {lines.map((line, i) => (
          <span key={i}>{line}</span>
        ))}
      </span>
    </span>
  )
}

function shortDate(date: string) {
  const d = new Date(date)
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
  return `${d.getDate()} ${months[d.getMonth()]}`
}

function dayCount(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

function dayLabel(dateStr: string) {
  const d = new Date(dateStr)
  const months = ['May', 'Haz', 'Tem', 'Ağu']
  return `${d.getDate()} ${d.toLocaleDateString('tr-TR', { month: 'short' })}`
}

function dailyVerdict(rainProb: number, waveHeight: number | null) {
  const wave = waveHeight ?? 0
  if (rainProb > 60 || wave > 1.2) return { label: 'Kötü', color: 'bad' as const }
  if (rainProb > 30 || wave > 0.6) return { label: 'Orta', color: 'warning' as const }
  return { label: 'İyi', color: 'good' as const }
}

function App() {
  const todayForInput = new Date().toISOString().slice(0, 10)
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('2026-08-05')
  const [endDate, setEndDate] = useState('2026-08-11')
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [showActivityMenu, setShowActivityMenu] = useState(false)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([])
  const [loadingNearby, setLoadingNearby] = useState(false)
  const [showNearby, setShowNearby] = useState(false)
  const [showDateDetail, setShowDateDetail] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)

  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weatherData, setWeatherData] = useState<any>(null)
  const [resolvedLocationName, setResolvedLocationName] = useState('')
  const [aiAdvice, setAiAdvice] = useState<any>(null)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const dailyScrollRef = useRef<HTMLDivElement>(null)

  

  const toggleActivity = (id: string) => {
    setSelectedActivities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const handleWheelScroll = (ref: React.RefObject<HTMLDivElement | null>) => (e: React.WheelEvent) => {
    if (ref.current) {
      e.preventDefault()
      ref.current.scrollLeft += e.deltaY
    }
  }

  const handleGetAdvice = async () => {
    setLoading(true)
    setError(null)
    setShowResults(false)
    try {
      const rangeDays = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1
      if (rangeDays > 16) {
        setError('En fazla 16 günlük bir tarih aralığı seçebilirsiniz, lütfen aralığı kısaltın.')
        setLoading(false)
        return
      }
      const loc = await geocodeLocation(location)
      setResolvedLocationName(loc.name)

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().slice(0, 10)

      const fetchStart = startDate < todayStr ? startDate : todayStr

      const todayPlus6 = new Date(today)
      todayPlus6.setDate(todayPlus6.getDate() + 6)
      const e = new Date(endDate)
      let fetchEnd = e > todayPlus6 ? e : todayPlus6

      // Open-Meteo en fazla 16 günlük tahmin veriyor
      const maxEnd = new Date(today)
      maxEnd.setDate(maxEnd.getDate() + 15)
      if (fetchEnd > maxEnd) fetchEnd = maxEnd

      const fetchEndStr = fetchEnd.toISOString().slice(0, 10)

      const data = await fetchWeather(loc.latitude, loc.longitude, fetchStart, fetchEndStr)

      if (data.weather?.error) {
        throw new Error('Hava verisi alınamadı, tarih aralığını kısaltmayı deneyin.')
      }
      setWeatherData(data)
      console.log('Çekilen gün sayısı:', data.weather.daily.time.length, data.weather.daily.time)

      const advice = await getAiAdvice(location, startDate, endDate, selectedActivities, data)
      setAiAdvice(advice)

      setShowResults(true)
    } catch (err: any) {
      console.error(err)
      if (err.message === 'Konum bulunamadı') {
        setError('Bu konum bulunamadı. Daha genel bir isim deneyin (örn: şehir adı).')
      } else if (err.message?.includes('Tavsiye alınamadı')) {
        setError('Şu anda tavsiye üretilemiyor, yapay zeka servisi yoğun olabilir. Birazdan tekrar deneyin.')
      } else {
        setError('Bir şeyler ters gitti. Lütfen tekrar deneyin.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFindNearby = async () => {
    setLoadingNearby(true)
    setShowNearby(true)
    try {
      const loc = await geocodeLocation(location)
      const parts = loc.name.split(',').map((p: string) => p.trim())
      const region = parts.slice(-3, -1).join(', ')
      const places = await findNearbyPlaces(loc.latitude, loc.longitude, region)

      const placesWithWeather = await Promise.all(
        places.map(async (p: any) => {
          try {
            const w = await fetchWeather(p.latitude, p.longitude, startDate, endDate)
            const rainProbs: number[] = w.weather.daily.precipitation_probability_max
            const waves: number[] = w.marine?.daily?.wave_height_max ?? []
            const avgRain = rainProbs.reduce((a, b) => a + b, 0) / rainProbs.length
            const avgWave = waves.length ? waves.reduce((a, b) => a + b, 0) / waves.length : 0
            const verdict = dailyVerdict(avgRain, avgWave)
            return { ...p, verdict }
          } catch {
            return { ...p, verdict: null }
          }
        })
      )

      const order: Record<string, number> = { good: 0, warning: 1, bad: 2 }
      placesWithWeather.sort((a, b) => {
        const aRank = a.verdict ? order[a.verdict.color] : 3
        const bRank = b.verdict ? order[b.verdict.color] : 3
        return aRank - bRank
      })

      setNearbyPlaces(placesWithWeather)
    } catch (err) {
      console.error(err)
      setNearbyPlaces([])
    } finally {
      setLoadingNearby(false)
    }
  }
  
  const campAssessment = aiAdvice?.activities?.kamp && selectedActivities.includes('kamp')
    ? { ...aiAdvice.activities.kamp, stats: getCampStats(weatherData.weather) }
    : null

  const swimAssessment = aiAdvice?.activities?.yuzme && selectedActivities.includes('yuzme')
    ? { ...aiAdvice.activities.yuzme, stats: getSwimStats(weatherData.marine, weatherData.weather) }
    : null
 
const genericAssessments = weatherData
    ? selectedActivities
        .filter((id) => !['kamp', 'yuzme'].includes(id))
        .map((id) => {
          const advice = aiAdvice?.activities?.[id]
          if (!advice) return null
          return { ...advice, id, stats: getGenericStats(weatherData.weather) }
        })
        .filter(Boolean)
    : []

    const dayVerdicts = weatherData
    ? weatherData.weather.daily.time.map((_: string, i: number) => {
        const rainProb = weatherData.weather.daily.precipitation_probability_max[i] ?? 0
        const wave = weatherData.marine?.daily?.wave_height_max?.[i] ?? null
        return dailyVerdict(rainProb, wave)
      })
    : []

  const goodDays = dayVerdicts.filter((d: any) => d.color === 'good').length
  const warningDays = dayVerdicts.filter((d: any) => d.color === 'warning').length
  const badDays = dayVerdicts.filter((d: any) => d.color === 'bad').length
  const totalDays = dayVerdicts.length || 1
  const tripScore = ((goodDays * 10 + warningDays * 5 + badDays * 0) / totalDays).toFixed(1)
  const goodPct = (goodDays / totalDays) * 100
  const warnPct = (warningDays / totalDays) * 100
  const badPct = (badDays / totalDays) * 100
  const scoreLabel = Number(tripScore) >= 7 ? 'İyi Bir Gezi' : Number(tripScore) >= 4 ? 'Dikkatli Planlanmalı' : 'Zor Bir Dönem'

  const assessments = [campAssessment, swimAssessment, ...genericAssessments].filter(Boolean)
  const overallBad = assessments.some((a) => a.status === 'bad')
  const overallWarning = !overallBad && assessments.some((a) => a.status === 'warning')
  const overallStatus = overallBad ? 'bad' : overallWarning ? 'warning' : 'good'
  const overallLabel = overallBad ? 'gitme' : overallWarning ? 'dikkatli git' : 'uygun'

  const statusColor: Record<string, string> = { bad: 'text-bad', warning: 'text-warning', good: 'text-good' }

  return (
    <div className="min-h-screen bg-bg p-4 overflow-x-hidden">
      <div className="max-w-md mx-auto break-words">

        {/* Üst Bar */}
        <div className="flex items-center justify-center mb-1">
          <span className="text-brand text-2xl font-bold flex items-center gap-2">
            <img src="/logo.png" alt="DenDen" className="w-10 h-10" />
            DenDen
          </span>
        </div>
        <p className="text-muted text-xs text-center mb-4">
          gideceğin yer için akıllı hava ve rota tavsiyesi
        </p>

        {/* Konum, Tarih ve Aktivite Girişi */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-1 w-full">
              <MapPin className="text-heading flex-shrink-0" size={28} />
              <input
                ref={locationInputRef}
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Konum ara..."
                className="bg-transparent text-heading font-semibold text-sm outline-none flex-1 placeholder:text-muted"
              />
            </div>

            <div className="flex items-center gap-2 w-full">
              <CalendarDays className="text-heading flex-shrink-0" size={28} />
              <div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCalendar((v) => !v)}
                    className="flex items-center gap-1"
                  >
                    <span className="text-heading text-sm font-medium py-2 px-1">
                      {shortDate(startDate)}
                    </span>
                    <span className="text-muted text-sm">–</span>
                    <span className="text-heading text-sm font-medium py-2 px-1">
                      {shortDate(endDate)}
                    </span>
                  </button>

                  {showCalendar && (
                    <div className="absolute z-20 top-full right-0 mt-2 w-72">
                      <Calendar
                        startDate={startDate}
                        endDate={endDate}
                        onChange={(s, e) => {
                          setStartDate(s)
                          setEndDate(e)
                        }}
                        onClose={() => setShowCalendar(false)}
                      />
                    </div>
                  )}
                </div>
                <p className="text-muted text-xs mt-1">{dayCount(startDate, endDate)} gün</p>
              </div>
            </div>
          </div>

          <div className="border-t border-divider pt-3 relative">
            <p className="text-muted text-xs mb-2">Aktiviteler</p>
            <div className="flex gap-2 flex-wrap items-center">
              {selectedActivities.map((id) => {
                const activity = ACTIVITIES.find((a) => a.id === id)!
                const Icon = activity.icon
                return (
                  <button
                    key={id}
                    onClick={() => toggleActivity(id)}
                    className="text-xs pl-3 pr-2 py-1.5 rounded-full flex items-center gap-1.5 border border-border text-heading group"
                  >
                    <Icon size={16} className="text-warning" />
                    {activity.label}
                    <span className="w-4 h-4 rounded-full bg-bg flex items-center justify-center text-muted group-hover:text-bad group-hover:bg-bad/15 transition-colors">
                      <X size={11} />
                    </span>
                  </button>
                )
              })}
              <button
                onClick={() => setShowActivityMenu((v) => !v)}
                className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-dashed border-border text-muted"
              >
                + Aktivite Ekle
              </button>
            </div>

            {showActivityMenu && (
              <div className="absolute z-10 mt-2 bg-card border border-border rounded-xl p-2 flex flex-col gap-1 w-56 shadow-lg">
                {ACTIVITIES.map((activity) => {
                  const isSelected = selectedActivities.includes(activity.id)
                  const Icon = activity.icon
                  return (
                    <button
                      key={activity.id}
                      onClick={() => toggleActivity(activity.id)}
                      className={`text-sm px-3 py-2 rounded-lg flex items-center gap-2 text-left ${
                        isSelected ? 'bg-warning/10 text-heading' : 'text-body hover:bg-bg'
                      }`}
                    >
                      <Icon size={16} className={isSelected ? 'text-warning' : 'text-muted'} />
                      {activity.label}
                    </button>
                  )
                })}
                <button
                  onClick={() => setShowActivityMenu(false)}
                  className="text-xs text-muted text-center py-1.5"
                >
                  kapat
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tavsiye Al Butonu */}
        <button
          onClick={handleGetAdvice}
          disabled={loading}
          className="w-full bg-heading text-bg font-semibold text-sm py-3 rounded-xl mb-4 disabled:opacity-50"
        >
          {loading ? 'Yükleniyor...' : 'Tavsiye Al'}
        </button>

        {error && (
          <p className="text-bad text-sm text-center mb-4">{error}</p>
        )}

        {showResults && weatherData && (
          <>
            

        {/* Genel Değerlendirme */}
            {aiAdvice?.tripSummary && (
              <div className="bg-card border border-border rounded-2xl p-4 mb-3">
                <p className="text-heading font-semibold mb-4">
                  Genel Değerlendirme
                </p>
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="relative w-24 h-24 rounded-full flex-shrink-0"
                    style={{
                      background: `conic-gradient(#83BF3D 0% ${goodPct}%, #F3BE1A ${goodPct}% ${goodPct + warnPct}%, #F04D43 ${goodPct + warnPct}% 100%)`,
                    }}
                  >
                    <div className="absolute inset-2 bg-card rounded-full flex flex-col items-center justify-center">
                      <span className="text-heading text-2xl font-bold">{tripScore}</span>
                      <span className="text-muted text-[10px]">/10</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-muted text-xs mb-0.5">genel değerlendirme</p>
                    <p className={`text-lg font-bold mb-2 ${Number(tripScore) >= 7 ? 'text-good' : Number(tripScore) >= 4 ? 'text-warning' : 'text-bad'}`}>
                      {scoreLabel}
                    </p>
                    <div className="flex flex-col gap-1 text-xs">
                      {goodDays > 0 && (
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-good" />{goodDays} gün <span className="text-good">İyi</span></span>
                      )}
                      {warningDays > 0 && (
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-warning" />{warningDays} gün <span className="text-warning">Dikkatli</span></span>
                      )}
                      {badDays > 0 && (
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-bad" />{badDays} gün <span className="text-bad">Kötü</span></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-bg border border-border rounded-lg p-3">
                  <p className="text-heading text-xs font-semibold mb-2">
                    Genel Yorum
                  </p>
                  <div className="flex flex-col gap-1">
                    {aiAdvice.tripSummary.comment.map((line: string, i: number) => (
                      <p key={i} className="text-body text-xs">{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Özet Şeridi */}
            {assessments.length > 0 && (
              <div className="flex items-center justify-center gap-2 text-xs mb-3 px-1 flex-wrap text-center">
                <span className={`${statusColor[overallStatus]} font-medium`}>● genel: {overallLabel}</span>
                {campAssessment && (
                  <>
                    <span className="text-muted">·</span>
                    <span className={statusColor[campAssessment.status]}>kamp: {campAssessment.statusLabel.toLowerCase()}</span>
                  </>
                )}
                {swimAssessment && (
                  <>
                    <span className="text-muted">·</span>
                    <span className={statusColor[swimAssessment.status]}>yüzme: {swimAssessment.statusLabel.toLowerCase()}</span>
                  </>
                )}
                {genericAssessments.map((a: any) => (
                  <span key={a.id} className="flex items-center gap-2">
                    <span className="text-muted">·</span>
                    <span className={statusColor[a.status as 'bad' | 'warning' | 'good']}>
                      {ACTIVITY_LABELS[a.id]}: {a.statusLabel.toLowerCase()}
                    </span>
                  </span>
                ))}
              </div>
            )}

            {/* Aktivite Kartları */}
            <div className="flex flex-col gap-3 mb-3">

              {campAssessment && (
                <div className={`bg-card border-l-4 rounded-2xl p-4 ${campAssessment.status === 'bad' ? 'border-bad' : campAssessment.status === 'warning' ? 'border-warning' : 'border-good'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold flex items-center gap-2">
                      <Tent size={24} className={statusColor[campAssessment.status]} />
                      <span className="text-heading">Kamp</span>
                    </span>
                    <span className={`border-2 text-sm font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1.5 ${
                      campAssessment.status === 'bad' ? 'border-bad text-bad' : campAssessment.status === 'warning' ? 'border-warning text-warning' : 'border-good text-good'
                    }`}>
                      {campAssessment.status === 'bad' ? <XCircle size={18} /> : <CircleAlert size={18} />}
                      {campAssessment.statusLabel}
                    </span>
                  </div>
                  <p className="text-body text-sm mb-3">{campAssessment.summary}</p>

                  <div className="flex justify-around gap-2 text-xs text-heading border-t border-divider pt-3 mb-2">
                    {campAssessment.stats.map((s: any, i: number) => (
                      <StatDisplay key={i} stat={s} />
                    ))}
                  </div>

                  <div className={`border rounded-lg p-3 mb-2 flex items-center gap-3 ${
                    campAssessment.status === 'bad' ? 'border-bad' : campAssessment.status === 'warning' ? 'border-warning' : 'border-good'
                  }`}>
                    <TriangleAlert size={28} className={`flex-shrink-0 ${
                      campAssessment.status === 'bad' ? 'text-bad' : campAssessment.status === 'warning' ? 'text-warning' : 'text-good'
                    }`} />
                    <div className="text-sm text-body flex flex-col gap-1">
                      {campAssessment.tips.map((tip: string, i: number) => <p key={i}>• {tip}</p>)}
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedCard(expandedCard === 'kamp' ? null : 'kamp')}
                    className={`text-xs flex items-center gap-1 ${
                      campAssessment.status === 'bad' ? 'text-bad' : campAssessment.status === 'warning' ? 'text-warning' : 'text-good'
                    }`}
                  >
                    <ChevronDown size={14} className={`transition-transform ${expandedCard === 'kamp' ? 'rotate-180' : ''}`} />
                    tüm hazırlık listesi
                  </button>

                  {expandedCard === 'kamp' && (
                    <div className="mt-2 flex flex-col gap-1.5 text-sm text-body pl-1">
                      {(campAssessment.detailedTips || []).map((tip: string, i: number) => (
                        <p key={i}>• {tip}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {swimAssessment && (
                <div className={`bg-card border-l-4 rounded-2xl p-4 ${swimAssessment.status === 'bad' ? 'border-bad' : swimAssessment.status === 'warning' ? 'border-warning' : 'border-good'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold flex items-center gap-2">
                      <SwimmerIcon className={statusColor[swimAssessment.status]} size={24} />
                      <span className="text-heading">Yüzme</span>
                    </span>
                    <span className={`border-2 text-sm font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1.5 ${
                      swimAssessment.status === 'bad' ? 'border-bad text-bad' : swimAssessment.status === 'warning' ? 'border-warning text-warning' : 'border-good text-good'
                    }`}>
                      {swimAssessment.status === 'bad' ? <XCircle size={18} /> : <CircleAlert size={18} />}
                      {swimAssessment.statusLabel}
                    </span>
                  </div>
                  <p className="text-body text-sm mb-3">{swimAssessment.summary}</p>

                  <div className="flex justify-between text-xs text-heading border-t border-divider pt-3 mb-2">
                    {swimAssessment.stats.map((s: any, i: number) => (
                      <StatDisplay key={i} stat={s} />
                    ))}
                  </div>

                  <div className={`border rounded-lg p-3 mb-2 flex items-center gap-3 ${
                    swimAssessment.status === 'bad' ? 'border-bad' : swimAssessment.status === 'warning' ? 'border-warning' : 'border-good'
                  }`}>
                    <TriangleAlert size={28} className={`flex-shrink-0 ${
                      swimAssessment.status === 'bad' ? 'text-bad' : swimAssessment.status === 'warning' ? 'text-warning' : 'text-good'
                    }`} />
                    <div className="text-sm text-body flex flex-col gap-1">
                      {swimAssessment.tips.map((tip: string, i: number) => <p key={i}>• {tip}</p>)}
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedCard(expandedCard === 'yuzme' ? null : 'yuzme')}
                    className={`text-xs flex items-center gap-1 ${
                      swimAssessment.status === 'bad' ? 'text-bad' : swimAssessment.status === 'warning' ? 'text-warning' : 'text-good'
                    }`}
                  >
                    <ChevronDown size={14} className={`transition-transform ${expandedCard === 'yuzme' ? 'rotate-180' : ''}`} />
                    tüm hazırlık listesi
                  </button>

                  {expandedCard === 'yuzme' && (
                    <div className="mt-2 flex flex-col gap-1.5 text-sm text-body pl-1">
                      {(swimAssessment.detailedTips || []).map((tip: string, i: number) => (
                        <p key={i}>• {tip}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {genericAssessments.map((a: any) => (
                <div key={a.id} className={`bg-card border-l-4 rounded-2xl p-4 ${a.status === 'bad' ? 'border-bad' : a.status === 'warning' ? 'border-warning' : 'border-good'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold flex items-center gap-2">
                      {(() => {
                        const meta = ACTIVITIES.find((x) => x.id === a.id)!
                        const Icon = meta.icon
                        return <Icon size={24} className={statusColor[a.status as 'bad' | 'warning' | 'good']} />
                      })()}
                      <span className="text-heading capitalize">{ACTIVITY_LABELS[a.id]}</span>
                    </span>
                    <span className={`border-2 text-sm font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1.5 ${
                      a.status === 'bad' ? 'border-bad text-bad' : a.status === 'warning' ? 'border-warning text-warning' : 'border-good text-good'
                    }`}>
                      {a.status === 'bad' ? <XCircle size={18} /> : <CircleAlert size={18} />}
                      {a.statusLabel}
                    </span>
                  </div>
                  <p className="text-body text-sm mb-3">{a.summary}</p>

                  <div className="flex justify-between text-xs text-heading border-t border-divider pt-3 mb-2">
                    {a.stats.map((s: any, i: number) => (
                      <StatDisplay key={i} stat={s} />
                    ))}
                  </div>

                  <div className={`border rounded-lg p-3 flex items-center gap-3 ${a.status === 'bad' ? 'border-bad' : a.status === 'warning' ? 'border-warning' : 'border-good'}`}>
                    <TriangleAlert size={28} className={`flex-shrink-0 ${a.status === 'bad' ? 'text-bad' : a.status === 'warning' ? 'text-warning' : 'text-good'}`} />
                    <div className="text-sm text-body flex flex-col gap-1">
                      {a.tips.map((tip: string, i: number) => <p key={i}>• {tip}</p>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            

            {/* Günlere Genel Bakış */}
            <p className="text-heading font-semibold text-sm mb-2">günlere genel bakış</p>
            <div
              ref={dailyScrollRef}
              onWheel={handleWheelScroll(dailyScrollRef)}
              className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {weatherData.weather.daily.time.map((dateStr: string, i: number) => {
                const rainProb = weatherData.weather.daily.precipitation_probability_max[i] ?? 0
                const wave = weatherData.marine?.daily?.wave_height_max?.[i] ?? null
                const tempMax = weatherData.weather.daily.temperature_2m_max[i] ?? 0
                const tempMin = weatherData.weather.daily.temperature_2m_min[i] ?? 0
                const windSpeed = weatherData.weather.daily.windspeed_10m_max?.[i] ?? 0
               
                const verdict = dailyVerdict(rainProb, wave)
                const styles = {
                  bad: { bg: 'bg-bad/15', border: 'border-bad', text: 'text-bad' },
                  warning: { bg: 'bg-warning/15', border: 'border-warning', text: 'text-warning' },
                  good: { bg: 'bg-good/15', border: 'border-good', text: 'text-good' },
                }[verdict.color]

               

                return (
                  <div key={dateStr} className={`${styles.bg} border ${styles.border} rounded-xl px-3 py-2.5 text-center flex-shrink-0 min-w-[90px]`}>
                    <p className="text-muted text-xs mb-1.5">{dayLabel(dateStr)}</p>
                    
                    <p className={`${styles.text} text-sm font-semibold mb-1`}>{verdict.label}</p>
                    <p className="text-body text-[11px]">{Math.round(tempMin)}°–{Math.round(tempMax)}°</p>
                    <p className="text-muted text-[10px]">%{Math.round(rainProb)} yağış</p>
                    {wave !== null && (
                      <p className="text-muted text-[10px]">{wave.toFixed(1)}m dalga</p>
                    )}
                    <p className="text-muted text-[10px]">{Math.round(windSpeed)} km/sa</p>
                  </div>
                )
              })}
            </div>

            {/* Saat Aralığı - hâlâ statik, sonraki adımda gerçek veriye bağlanacak */}
            {aiAdvice?.dailyWindows && aiAdvice.dailyWindows.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-4 mt-3">
                <p className="text-heading font-semibold flex items-center gap-2 mb-3">
                  <Clock size={18} /> En Uygun Saat Aralığı
                </p>

                {aiAdvice.dailyWindows.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 mb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {aiAdvice.dailyWindows.map((d: any, i: number) => (
                      <button
                        key={d.date}
                        onClick={() => setSelectedDayIndex(i)}
                        className={`text-xs px-3 py-1.5 rounded-full flex-shrink-0 border ${
                          selectedDayIndex === i
                            ? 'border-heading bg-heading text-bg font-semibold'
                            : 'border-border text-muted'
                        }`}
                      >
                        {dayLabel(d.date)}
                      </button>
                    ))}
                  </div>
                )}

                {(() => {
                  const day = aiAdvice.dailyWindows[selectedDayIndex] || aiAdvice.dailyWindows[0]
                  const toMinutes = (t: string) => {
                    const [h, m] = t.split(':').map(Number)
                    return h * 60 + m
                  }
                  const colorMap: Record<string, string> = { good: '#83BF3D', warning: '#F3BE1A', bad: '#F04D43' }

                  return (
                    <>
                      <div className="flex h-2.5 rounded-full overflow-hidden mb-2">
                        {day.segments.map((s: any, i: number) => {
                          const widthPct = ((toMinutes(s.end) - toMinutes(s.start)) / 1440) * 100
                          return (
                            <div
                              key={i}
                              style={{ width: `${widthPct}%`, background: colorMap[s.color] || '#666' }}
                            />
                          )
                        })}
                      </div>
                      <div className="flex justify-between text-xs text-muted mb-4">
                        <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
                      </div>

                      <div className={`grid gap-3 ${day.segments.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                        {day.segments.map((s: any, i: number) => (
                          <div key={i}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ background: colorMap[s.color] || '#666' }}
                              />
                              <span className="text-xs font-medium text-heading">{s.start}–{s.end}</span>
                            </div>
                            <p className={`text-xs font-semibold mb-1 ${statusColor[s.color]}`}>{s.label}</p>
                            <div className="flex flex-col gap-0.5">
                              {s.reasons.map((r: string, j: number) => (
                                <p key={j} className="text-[11px] text-body flex items-start gap-1">
                                  {s.color === 'good' ? '✓' : s.color === 'bad' ? '✕' : '⚠'} {r}
                                </p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )
                })()}
              </div>
            )}

            <div className="bg-card border-l-4 border-good rounded-2xl p-4 mt-3 mb-6">
              <p className="text-heading font-semibold flex items-center gap-2 mb-3">
                <Lightbulb size={18} className="text-good" /> Bunun Yerine
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setShowDateDetail((v) => !v)}
                  className="bg-bg border border-border rounded-lg p-3 flex items-center gap-3 w-full text-left"
                >
                  <CalendarDays size={18} className="text-heading flex-shrink-0" />
                  <span className="text-body text-sm flex-1">
                    {aiAdvice?.betterPeriod?.exists
                      ? aiAdvice.betterPeriod.startDate === aiAdvice.betterPeriod.endDate
                        ? `${dayLabel(aiAdvice.betterPeriod.startDate)} daha iyi bir seçenek`
                        : `${dayLabel(aiAdvice.betterPeriod.startDate)} - ${dayLabel(aiAdvice.betterPeriod.endDate)} daha iyi`
                      : 'Daha iyi bir tarih bulunamadı'}
                  </span>
                  <ChevronDown size={16} className={`text-muted flex-shrink-0 transition-transform ${showDateDetail ? 'rotate-180' : ''}`} />
                </button>

                {showDateDetail && aiAdvice?.betterPeriod?.exists && (
                  <div className="bg-bg border border-border rounded-lg p-3 -mt-1">
                    <p className="text-heading text-sm font-medium mb-1">
                      {aiAdvice.betterPeriod.startDate === aiAdvice.betterPeriod.endDate
                        ? dayLabel(aiAdvice.betterPeriod.startDate)
                        : `${dayLabel(aiAdvice.betterPeriod.startDate)} - ${dayLabel(aiAdvice.betterPeriod.endDate)}`}
                    </p>
                    <p className="text-body text-xs">{aiAdvice.betterPeriod.reason}</p>
                  </div>
                )}
                {showDateDetail && !aiAdvice?.betterPeriod?.exists && (
                  <div className="bg-bg border border-border rounded-lg p-3 -mt-1">
                    <p className="text-muted text-xs">Seçtiğiniz tarih aralığı zaten uygun, belirgin şekilde daha iyi bir seçenek yok.</p>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (!showNearby) handleFindNearby()
                    else setShowNearby(false)
                  }}
                  className="bg-bg border border-border rounded-lg p-3 flex items-center gap-3 w-full text-left"
                >
                  <MapPin size={18} className="text-heading flex-shrink-0" />
                  <span className="text-body text-sm flex-1">
                    {showNearby && nearbyPlaces.length > 0
                      ? `En iyi ve en yakın: ${nearbyPlaces[0].name}`
                      : 'Yakın yerlere bak'}
                  </span>
                  <ChevronDown size={16} className={`text-muted flex-shrink-0 transition-transform ${showNearby ? 'rotate-180' : ''}`} />
                </button>

                {showNearby && (
                  <div className="bg-bg border border-border rounded-lg p-3 -mt-1">
                    {loadingNearby ? (
                      <p className="text-muted text-sm">aranıyor...</p>
                    ) : nearbyPlaces.length === 0 ? (
                      <p className="text-muted text-sm">yakınlarda uygun bir yer bulunamadı</p>
                    ) : (
                      <>
                        <p className="text-heading text-sm font-medium mb-1">{nearbyPlaces[0].name}</p>
                        <p className="text-body text-xs mb-3">
                          {nearbyPlaces[0].distanceKm.toFixed(0)} km uzaklıkta
                          {nearbyPlaces[0].verdict && `, hava durumu ${nearbyPlaces[0].verdict.label.toLowerCase()}`}
                        </p>
                        <button
                          onClick={() => {
                            setLocation(nearbyPlaces[0].name)
                            setShowNearby(false)
                          }}
                          className="text-good text-xs font-medium mb-3"
                        >
                          bu yeri kullan →
                        </button>

                        {nearbyPlaces.length > 1 && (
                          <>
                            <p className="text-muted text-[10px] mb-2">diğer seçenekler</p>
                            <div className="flex flex-col gap-2">
                              {nearbyPlaces.slice(1).map((p: any) => (
                                <button
                                  key={p.name}
                                  onClick={() => {
                                    setLocation(p.name)
                                    setShowNearby(false)
                                  }}
                                  className="bg-card border border-border rounded-lg p-2.5 flex items-center gap-3 w-full text-left"
                                >
                                  <MapPin size={14} className="text-heading flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-heading text-xs font-medium">{p.name}</p>
                                    <p className="text-muted text-[10px]">
                                      {p.distanceKm.toFixed(0)} km
                                      {p.verdict && (
                                        <span className={`ml-1 ${statusColor[p.verdict.color]}`}>· {p.verdict.label}</span>
                                      )}
                                    </p>
                                  </div>
                                  <ChevronRight size={14} className="text-muted flex-shrink-0" />
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default App