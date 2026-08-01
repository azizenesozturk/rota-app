import { useState, useRef } from 'react'
import {
  ArrowLeft, Share, MountainSnow, MapPin, CalendarDays, Tent,
  CircleAlert, CloudRain, Wind, ChevronDown, XCircle,
  Thermometer, Lightbulb, ChevronRight, Clock,
  Footprints, Bike, ShieldAlert, TriangleAlert
} from 'lucide-react'
import { geocodeLocation, fetchWeather, assessCamping, assessSwimming, type ActivityAssessment } from './weather'

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
]

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
  const [location, setLocation] = useState('Burnaz Plajı, Hatay')
  const [startDate, setStartDate] = useState('2026-08-05')
  const [endDate, setEndDate] = useState('2026-08-11')
  const [selectedActivities, setSelectedActivities] = useState<string[]>(['kamp', 'yuzme'])
  const [showActivityMenu, setShowActivityMenu] = useState(false)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weatherData, setWeatherData] = useState<any>(null)
  const [resolvedLocationName, setResolvedLocationName] = useState('')

  const startDateRef = useRef<HTMLInputElement>(null)
  const endDateRef = useRef<HTMLInputElement>(null)

  const toggleActivity = (id: string) => {
    setSelectedActivities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const handleGetAdvice = async () => {
    setLoading(true)
    setError(null)
    setShowResults(false)
    try {
      const loc = await geocodeLocation(location)
      setResolvedLocationName(loc.name)
      const data = await fetchWeather(loc.latitude, loc.longitude, startDate, endDate)
      setWeatherData(data)
      setShowResults(true)
    } catch (err) {
      console.error(err)
      setError('Konum bulunamadı veya veri çekilemedi. Farklı bir yer adı deneyin.')
    } finally {
      setLoading(false)
    }
  }

  const campAssessment: ActivityAssessment | null =
    weatherData && selectedActivities.includes('kamp')
      ? assessCamping(weatherData.weather)
      : null

  const swimAssessment: ActivityAssessment | null =
    weatherData && selectedActivities.includes('yuzme')
      ? assessSwimming(weatherData.marine, weatherData.weather)
      : null

  const assessments = [campAssessment, swimAssessment].filter(Boolean) as ActivityAssessment[]
  const overallBad = assessments.some((a) => a.status === 'bad')
  const overallWarning = !overallBad && assessments.some((a) => a.status === 'warning')
  const overallStatus = overallBad ? 'bad' : overallWarning ? 'warning' : 'good'
  const overallLabel = overallBad ? 'gitme' : overallWarning ? 'dikkatli git' : 'uygun'

  const statusColor = { bad: 'text-bad', warning: 'text-warning', good: 'text-good' }

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="max-w-md mx-auto">

        {/* Üst Bar */}
        <div className="flex items-center justify-between mb-1">
          <ArrowLeft className="text-heading" size={22} />
          <span className="text-brand text-2xl font-bold flex items-center gap-2">
            <img src="/logo.png" alt="DenDen" className="w-10 h-10" />
            DenDen
          </span>
          <Share className="text-heading" size={20} />
        </div>
        <p className="text-muted text-xs text-center mb-4">
          gideceğin yer için akıllı hava ve rota tavsiyesi
        </p>

        {/* Konum, Tarih ve Aktivite Girişi */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-1">
              <MapPin className="text-heading flex-shrink-0" size={24} />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Konum ara..."
                className="bg-transparent text-heading font-semibold text-sm outline-none flex-1 placeholder:text-muted"
              />
            </div>

            <div className="w-px h-10 bg-divider mx-3" />

            <div className="flex items-center gap-2">
              <CalendarDays className="text-heading flex-shrink-0" size={24} />
              <div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startDateRef.current?.showPicker()}
                    className="text-heading text-sm font-medium py-2 px-1"
                  >
                    {shortDate(startDate)}
                  </button>
                  <input
                    ref={startDateRef}
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-0 h-0 opacity-0 absolute"
                  />
                  <span className="text-muted text-sm">–</span>
                  <button
                    type="button"
                    onClick={() => endDateRef.current?.showPicker()}
                    className="text-heading text-sm font-medium py-2 px-1"
                  >
                    {shortDate(endDate)}
                  </button>
                  <input
                    ref={endDateRef}
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-0 h-0 opacity-0 absolute"
                  />
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
                  <span
                    key={id}
                    onClick={() => toggleActivity(id)}
                    className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-border text-heading cursor-pointer"
                  >
                    <Icon size={16} className="text-warning" />
                    {activity.label}
                  </span>
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
            {/* Çözümlenen konum */}
            <p className="text-muted text-xs mb-2 px-1">{resolvedLocationName}</p>

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

                  <div className="flex justify-between text-xs text-heading border-t border-divider pt-3 mb-2">
                    <span className="flex flex-col items-center gap-1"><CloudRain size={20} /> {campAssessment.stats[0].label}</span>
                    <span className="flex flex-col items-center gap-1"><MountainSnow size={20} /> {campAssessment.stats[1].label}</span>
                    <span className="flex flex-col items-center gap-1"><Wind size={20} /> {campAssessment.stats[2].label}</span>
                  </div>

                  <div className={`border rounded-lg p-3 mb-2 flex items-center gap-3 ${campAssessment.status === 'bad' ? 'border-bad' : 'border-warning'}`}>
                    <TriangleAlert size={28} className={`flex-shrink-0 ${campAssessment.status === 'bad' ? 'text-bad' : 'text-warning'}`} />
                    <div className="text-sm text-body flex flex-col gap-1">
                      {campAssessment.tips.map((tip, i) => <p key={i}>• {tip}</p>)}
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedCard(expandedCard === 'kamp' ? null : 'kamp')}
                    className="text-warning text-xs flex items-center gap-1"
                  >
                    <ChevronDown size={14} className={`transition-transform ${expandedCard === 'kamp' ? 'rotate-180' : ''}`} />
                    tüm hazırlık listesi
                  </button>

                  {expandedCard === 'kamp' && (
                    <div className="mt-2 flex flex-col gap-1.5 text-sm text-body pl-1">
                      <p>• yedek kıyafet ve havlu al</p>
                      <p>• çadırı rüzgara karşı sabitle</p>
                      <p>• ekipmanı su geçirmez torbaya koy</p>
                      <p>• ateş için yedek plan yap</p>
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
                    <span className="flex flex-col items-center gap-1"><WaveIcon size={20} /> {swimAssessment.stats[0].label}</span>
                    <span className="flex flex-col items-center gap-1"><Thermometer size={20} /> {swimAssessment.stats[1].label}</span>
                    <span className="flex flex-col items-center gap-1"><ShieldAlert size={20} /> {swimAssessment.stats[2].label}</span>
                  </div>

                  <div className={`border rounded-lg p-3 mb-2 flex items-center gap-3 ${swimAssessment.status === 'bad' ? 'border-bad' : 'border-warning'}`}>
                    <TriangleAlert size={28} className={`flex-shrink-0 ${swimAssessment.status === 'bad' ? 'text-bad' : 'text-warning'}`} />
                    <div className="text-sm text-body flex flex-col gap-1">
                      {swimAssessment.tips.map((tip, i) => <p key={i}>• {tip}</p>)}
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedCard(expandedCard === 'yuzme' ? null : 'yuzme')}
                    className="text-bad text-xs flex items-center gap-1"
                  >
                    <ChevronDown size={14} className={`transition-transform ${expandedCard === 'yuzme' ? 'rotate-180' : ''}`} />
                    tüm hazırlık listesi
                  </button>

                  {expandedCard === 'yuzme' && (
                    <div className="mt-2 flex flex-col gap-1.5 text-sm text-body pl-1">
                      <p>• çocukları yakından takip et</p>
                      <p>• akıntıya karşı yüzmeye çalışma</p>
                      <p>• yalnız yüzme, yanında biri olsun</p>
                    </div>
                  )}
                </div>
              )}

              {selectedActivities.some((id) => !['kamp', 'yuzme'].includes(id)) && (
                <p className="text-muted text-xs text-center px-2">
                  yürüyüş / dağ tırmanma / bisiklet için tavsiye motoru henüz eklenmedi
                </p>
              )}
            </div>

            {/* Bunun Yerine Kartı - sadece kötü durumda */}
            {overallBad && (
              <div className="bg-card border-l-4 border-good rounded-2xl p-4 mb-3">
                <p className="text-heading font-semibold flex items-center gap-2 mb-3">
                  <Lightbulb size={24} className="text-good" /> Bunun Yerine
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      const s = new Date(startDate)
                      const e = new Date(endDate)
                      s.setDate(s.getDate() + 5)
                      e.setDate(e.getDate() + 5)
                      setStartDate(s.toISOString().slice(0, 10))
                      setEndDate(e.toISOString().slice(0, 10))
                    }}
                    className="bg-bg border border-border rounded-lg p-3 flex items-center gap-3 w-full text-left"
                  >
                    <CalendarDays size={18} className="text-heading" />
                    <span className="text-body text-sm flex-1">birkaç gün sonrasını dene</span>
                    <ChevronRight size={16} className="text-muted" />
                  </button>
                </div>
              </div>
            )}

            {/* Günlere Genel Bakış */}
            <p className="text-heading font-semibold text-sm mb-2">günlere genel bakış</p>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {weatherData.weather.daily.time.map((dateStr: string, i: number) => {
                const rainProb = weatherData.weather.daily.precipitation_probability_max[i] ?? 0
                const wave = weatherData.marine?.daily?.wave_height_max?.[i] ?? null
                const verdict = dailyVerdict(rainProb, wave)
                const styles = {
                  bad: { bg: 'bg-bad/25', text: 'text-bad' },
                  warning: { bg: 'bg-warning/25', text: 'text-warning' },
                  good: { bg: 'bg-good/25', text: 'text-good' },
                }[verdict.color]
                return (
                  <div key={dateStr} className={`${styles.bg} rounded-xl px-3 py-2 text-center flex-shrink-0 min-w-[76px]`}>
                    <p className="text-muted text-xs mb-1">{dayLabel(dateStr)}</p>
                    <p className={`${styles.text} text-sm font-semibold`}>{verdict.label}</p>
                  </div>
                )
              })}
            </div>

            {/* Saat Aralığı - hâlâ statik, sonraki adımda gerçek veriye bağlanacak */}
            <div className="bg-card border border-border rounded-2xl p-4 mt-3">
              <p className="text-heading font-semibold flex items-center gap-2 mb-3">
                <Clock size={18} /> En Uygun Saat Aralığı
              </p>
              <div
                className="h-2 rounded-full mb-2"
                style={{ background: 'linear-gradient(to right, #F04D43, #F3BE1A, #83BF3D, #F3BE1A, #F04D43)' }}
              />
              <div className="flex justify-between text-xs text-muted mb-3">
                <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
              </div>
              <span className="bg-good text-bg text-xs font-medium px-3 py-1 rounded-full">06:30-10:00</span>
              <p className="text-muted text-xs mt-2">*bu bölüm henüz saatlik gerçek veriye bağlanmadı</p>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default App