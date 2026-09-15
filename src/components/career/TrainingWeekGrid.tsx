import { useState } from 'react'
import { CalendarDays, ChevronDown, LockKeyhole, Moon, Sun, Sunset } from 'lucide-react'
import type { TrainingPlannerDay } from '../../types/game'
import { getTrainingSessionOption, getTrainingSessionOptionId, TRAINING_SESSION_OPTIONS, type TrainingSessionKey } from '../../utils/trainingPlan'

const rows = [
  { key: 'morning', label: 'Morning', time: '08:00–11:00', icon: <Sun /> },
  { key: 'afternoon', label: 'Afternoon', time: '13:00–16:00', icon: <Sunset /> },
  { key: 'evening', label: 'Evening', time: '18:00–21:00', icon: <Moon /> },
] as const

export function TrainingWeekGrid({ week, onChange, eventName }: { week: TrainingPlannerDay[]; onChange: (day: number, session: TrainingSessionKey, option: string) => void; eventName?: string }) {
  const [mobileDay, setMobileDay] = useState(0)
  function sessionCell(day: TrainingPlannerDay, dayIndex: number, row: typeof rows[number]) {
    const session = day[row.key], option = getTrainingSessionOption(getTrainingSessionOptionId(session))
    const locked = Boolean(day.careerCommitmentId || day.planningBlockKind)
    return <label key={`${day.day}-${row.key}`} className={`training-session training-session--${session.category.toLowerCase().replaceAll(' ', '-')} ${locked ? 'training-session--locked' : ''}`}>
      <select aria-label={`${day.day} ${row.label}`} disabled={locked} title={day.planningBlockKind ? 'Reserved on the season planning board' : `${option.title} · ${session.subtitle}`} value={getTrainingSessionOptionId(session)} onChange={e => onChange(dayIndex, row.key, e.target.value)}>
        <option value="" disabled>Select session</option>
        {TRAINING_SESSION_OPTIONS.map(choice => <option key={choice.id} value={choice.id}>{choice.title}</option>)}
      </select>
      <span className="training-session-top"><span>{session.category}</span>{locked ? <LockKeyhole aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}</span>
      <strong>{session.title}</strong>
      <span className="training-session-load">{locked ? 'Reserved' : `Load ${option.load}`}<span aria-hidden="true" style={{ width: `${Math.min(100, option.load)}%` }} /></span>
    </label>
  }
  return <section className="training-timetable" aria-label="Weekly timetable">
    <header><div><CalendarDays aria-hidden="true" /><div><h2>Weekly Timetable</h2><p>Select a session to change it</p></div></div><span>{eventName ?? 'No event entered'}</span></header>
    <div className="training-desktop-week"><div className="training-week-grid">
      <div className="training-session-label">Session</div>
      {week.map(day => <div className="training-day" key={day.day}><div><strong>{day.day}</strong><span className={`training-load-${day.load >= 70 ? 'high' : day.load >= 50 ? 'medium' : 'low'}`}>{day.loadLabel}</span></div><p>{day.dateLabel}</p>{day.planningBlockKind && <small>{day.competitionName}</small>}</div>)}
      {rows.flatMap(row => [<div className="training-time" key={row.key}>{row.icon}<strong>{row.label}</strong><span>{row.time}</span></div>, ...week.map((day, index) => sessionCell(day, index, row))])}
    </div></div>
    <div className="training-mobile-week"><div className="training-mobile-days" role="group" aria-label="Choose training day">{week.map((day, index) => <button key={day.day} aria-pressed={index === mobileDay} onClick={() => setMobileDay(index)}>{day.day}</button>)}</div>
      {week[mobileDay] && <div className="training-mobile-sessions"><p>{week[mobileDay].dateLabel} · {week[mobileDay].loadLabel} load</p>{rows.map(row => <div key={row.key}><span className="training-mobile-time">{row.label} · {row.time}</span>{sessionCell(week[mobileDay], mobileDay, row)}</div>)}</div>}
    </div>
  </section>
}
