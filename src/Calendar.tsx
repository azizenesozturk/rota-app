import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const DAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']

function toDateStr(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function Calendar({
  startDate,
  endDate,
  onChange,
  onClose,
}: {
  startDate: string
  endDate: string
  onChange: (start: string, end: string) => void
  onClose: () => void
}) {
  const [viewDate, setViewDate] = useState(new Date(startDate))
  const [selecting, setSelecting] = useState<'start' | 'end'>('start')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const startWeekday = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  const handleDayClick = (d: Date) => {
    if (d < today) return
    const dateStr = toDateStr(d)

    if (selecting === 'start') {
      onChange(dateStr, dateStr)
      setSelecting('end')
    } else {
      if (dateStr < startDate) {
        onChange(dateStr, dateStr)
      } else {
        onChange(startDate, dateStr)
        setSelecting('start')
        onClose()
      }
    }
  }

  return (
    <div
      className="bg-bg border border-border rounded-2xl p-3"
      style={{ width: '300px', boxShadow: '0 10px 40px rgba(0,0,0,0.6)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="text-heading p-1 flex-shrink-0">
          <ChevronLeft size={18} />
        </button>
        <span className="text-heading text-sm font-semibold whitespace-nowrap">{MONTHS[month]} {year}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="text-heading p-1 flex-shrink-0">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1" style={{ gap: '2px' }}>
        {DAYS.map((d) => (
          <div key={d} className="text-muted text-[10px] text-center py-1 whitespace-nowrap">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7" style={{ gap: '2px' }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const dateStr = toDateStr(d)
          const isPast = d < today
          const isStart = dateStr === startDate
          const isEnd = dateStr === endDate
          const inRange = dateStr > startDate && dateStr < endDate

          return (
            <button
              key={i}
              onClick={() => handleDayClick(d)}
              disabled={isPast}
              className={`text-xs h-9 rounded-lg flex items-center justify-center transition-colors ${
                isPast
                  ? 'text-muted opacity-30 cursor-not-allowed'
                  : isStart || isEnd
                  ? 'bg-good text-bg font-semibold'
                  : inRange
                  ? 'bg-good/20 text-heading'
                  : 'text-body hover:bg-card'
              }`}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>

      <p className={`text-xs text-center mt-3 font-medium ${selecting === 'start' ? 'text-heading' : 'text-good'}`}>
        {selecting === 'start' ? '1. adım: başlangıç gününü seçin' : '2. adım: bitiş gününü seçin'}
      </p>
    </div>
  )
}