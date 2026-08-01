import { useState, useRef } from 'react'
import {
  ArrowLeft, Share, MountainSnow, MapPin, CalendarDays, Tent,
  CircleAlert, CloudRain, Wind, Shield, ChevronDown, XCircle,
  Thermometer, OctagonAlert, Lightbulb, ChevronRight, Clock,
  Footprints, Bike, ShieldAlert, TriangleAlert
} from 'lucide-react'

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

function WaveIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
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






function dayCount(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

function shortDate(date: string) {
  const d = new Date(date)
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
  return `${d.getDate()} ${months[d.getMonth()]}`
}

function App() {
  const [location, setLocation] = useState('Burnaz Plajı, İzmir')
  const [startDate, setStartDate] = useState('2026-05-20')
  const [endDate, setEndDate] = useState('2026-05-26')
  const [selectedActivities, setSelectedActivities] = useState<string[]>(['kamp', 'yuzme'])
  const startDateRef = useRef<HTMLInputElement>(null)
  const endDateRef = useRef<HTMLInputElement>(null)
  const [showResults, setShowResults] = useState(true)
  const [showActivityMenu, setShowActivityMenu] = useState(false)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  

  const toggleActivity = (id: string) => {
    setSelectedActivities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="max-w-md mx-auto">

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
              <div className="flex-1">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Konum ara..."
                  className="bg-transparent text-heading font-semibold text-sm outline-none w-full placeholder:text-muted"
                />
              </div>
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
                    <Icon className="text-warning" size={16} />
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
          onClick={() => setShowResults(true)}
          className="w-full bg-heading text-bg font-semibold text-sm py-3 rounded-xl mb-4"
        >
          Tavsiye Al
        </button>

        {showResults && (
          <>
            {/* Özet Şeridi */}
            <div className="flex items-center justify-center gap-2 text-xs mb-3 px-1 flex-wrap text-center">
              <span className="text-bad font-medium">● genel: gitme</span>
              <span className="text-muted">·</span>
              <span className="text-warning">kamp: dikkatli</span>
              <span className="text-muted">·</span>
              <span className="text-bad">yüzme: uygun değil</span>
            </div>

            {/* Aktivite Kartları */}
            <div className="flex flex-col gap-3 mb-3">

              {/* Kamp Kartı */}
              <div className="bg-card border-l-4 border-warning rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold flex items-center gap-2">
                    <Tent size={24} className="text-warning" />
                    <span className="text-heading">Kamp</span>
                  </span>
                  <span className="border-2 border-warning text-warning text-sm font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1.5">
                    <CircleAlert size={18} /> Dikkatli Git
                  </span>
                </div>
                <p className="text-body text-sm mb-3">zemin ıslak olabilir, yağış ihtimali var</p>

                <div className="flex justify-between text-xs text-heading border-t border-divider pt-3 mb-2">
                  <span className="flex flex-col items-center gap-1"><CloudRain size={20} /> %70 yağış</span>
                  <span className="flex flex-col items-center gap-1"><MountainSnow size={20} /> ıslak zemin</span>
                  <span className="flex flex-col items-center gap-1"><Wind size={20} /> 18 km/sa</span>
                </div>

                <div className="border border-warning rounded-lg p-3 mb-2 flex items-center gap-3">
              <TriangleAlert size={28} className="text-warning flex-shrink-0" />
              <div className="text-sm text-body flex flex-col gap-1">
                <p>• su geçirmez çadır kullan</p>
                <p>• kaymaz ayakkabı giy</p>
              </div>
            </div>

            <button
              onClick={() => setExpandedCard(expandedCard === 'kamp' ? null : 'kamp')}
              className="text-warning text-xs flex items-center gap-1"
            >
              <ChevronDown
                size={14}
                className={`transition-transform ${expandedCard === 'kamp' ? 'rotate-180' : ''}`}
              />
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

              {/* Yüzme Kartı */}
              <div className="bg-card border-l-4 border-bad rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold flex items-center gap-2">
                    <SwimmerIcon className="w-6 h-6 text-bad" />
                    <span className="text-heading">Yüzme</span>
                  </span>
                  <span className="border-2 border-bad text-bad text-sm font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1.5">
                    <XCircle size={18} /> Uygun Değil
                  </span>
                </div>
                <p className="text-body text-sm mb-3">dalga boyu yüksek, yüzmek riskli olabilir</p>

                <div className="flex justify-between text-xs text-heading border-t border-divider pt-3 mb-2">
                  <span className="flex flex-col items-center gap-1"><WaveIcon className="w-5 h-5" /> 1.6-1.8m</span>
                  <span className="flex flex-col items-center gap-1"><Thermometer size={20} /> 17°C</span>
                  <span className="flex flex-col items-center gap-1"><ShieldAlert size={20} /> risk yüksek</span>
                </div>

                <div className="border border-bad rounded-lg p-3 mb-2 flex items-center gap-3">
              <TriangleAlert size={28} className="text-bad flex-shrink-0" />
              <div className="text-sm text-body flex flex-col gap-1">
                <p>• bugün suya girme</p>
                <p>• cankurtaran yoksa yaklaşma</p>
              </div>
            </div>

            <button
              onClick={() => setExpandedCard(expandedCard === 'yuzme' ? null : 'yuzme')}
              className="text-bad text-xs flex items-center gap-1"
            >
              <ChevronDown
                size={14}
                className={`transition-transform ${expandedCard === 'yuzme' ? 'rotate-180' : ''}`}
              />
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

            </div>

            {/* Bunun Yerine Kartı */}
            <div className="bg-card border-l-4 border-good rounded-2xl p-4 mb-3">
              <p className="text-heading font-semibold flex items-center gap-2 mb-3">
                <Lightbulb size={24} className="text-good" /> Bunun Yerine
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setStartDate('2026-05-25')
                    setEndDate('2026-05-26')
                  }}
                  className="bg-bg border border-border rounded-lg p-3 flex items-center gap-3 w-full text-left"
                >
                  <CalendarDays size={18} className="text-heading" />
                  <span className="text-body text-sm flex-1">25-26 Mayıs, aynı yer, dalga düşük</span>
                  <ChevronRight size={16} className="text-muted" />
                </button>
                <button
                  onClick={() => setLocation('Akkum Plajı')}
                  className="bg-bg border border-border rounded-lg p-3 flex items-center gap-3 w-full text-left"
                >
                  <MapPin size={18} className="text-heading" />
                  <span className="text-body text-sm flex-1">Akkum Plajı, 18 km, bugün dalgasız</span>
                  <ChevronRight size={16} className="text-muted" />
                </button>
              </div>
            </div>

            {/* Saat Aralığı */}
            <div className="bg-card border border-border rounded-2xl p-4 mb-3">
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
            </div>

            {/* Günlere Genel Bakış */}
            <p className="text-heading font-semibold text-sm mb-2">günlere genel bakış</p>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[
                { d: '20 May', s: 'Kötü', c: 'bad' as const },
                { d: '21 May', s: 'Kötü', c: 'bad' as const },
                { d: '22 May', s: 'Orta', c: 'warning' as const },
                { d: '23 May', s: 'İyi', c: 'good' as const },
                { d: '24 May', s: 'Orta', c: 'warning' as const },
                { d: '25 May', s: 'İyi', c: 'good' as const },
                { d: '26 May', s: 'Orta', c: 'warning' as const },
              ].map((day) => {
                const styles = {
                  bad: { bg: 'bg-bad/25', text: 'text-bad' },
                  warning: { bg: 'bg-warning/25', text: 'text-warning' },
                  good: { bg: 'bg-good/25', text: 'text-good' },
                }[day.c]
                return (
                  <div key={day.d} className={`${styles.bg} rounded-xl px-3 py-2 text-center flex-shrink-0 min-w-[76px]`}>
                    <p className="text-muted text-xs mb-1">{day.d}</p>
                    <p className={`${styles.text} text-sm font-semibold`}>{day.s}</p>
                  </div>
                )
              })}
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default App