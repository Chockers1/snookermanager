import { CalendarDays, ChevronRight, MapPin, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useGame } from '../../context/useGame'
import { getTournamentEntryAccess } from '../../hooks/useGameState'
import type { Tournament } from '../../types/game'

type EventGroup = { title: string; stage: string; events: Tournament[] }

export function PathwayEvents({ groups }: { groups: EventGroup[] }) {
  const { gameState } = useGame()
  return <div className="pathway-events" data-testid="pathway-events">
    <div className="pathway-events-columns">
      {groups.map((group, index) => <section key={group.title} className={`pathway-events-group ${index ? 'pathway-events-group--next' : ''}`} aria-label={group.title}>
        <header className="pathway-events-heading">
          <span className="pathway-overview-icon">{index ? <Trophy aria-hidden="true" /> : <CalendarDays aria-hidden="true" />}</span>
          <div><p>{group.title}</p><h2>{group.stage}</h2></div>
          <span className="pathway-events-count">{group.events.length}<small>{group.events.length === 1 ? 'event' : 'events'}</small></span>
        </header>
        <div className="pathway-events-list">
          {group.events.map(event => {
            const past = (event.endDate ?? event.startDate) < gameState.currentDate
            const committed = event.status === 'Entered' || event.status === 'Booked'
            const access = getTournamentEntryAccess(gameState, event)
            const status = event.status === 'Completed' ? 'Completed' : past ? 'Event ended' : committed ? 'Entry secured' : event.status === 'Skipped' ? 'Skipped' : access.allowed ? 'Eligible to enter' : 'Entry unavailable'
            const date = new Date(`${event.startDate}T12:00:00Z`)
            return <Link key={event.id} to={`/calendar?tournament=${encodeURIComponent(event.id)}`} className="pathway-event" aria-label={`${event.name} · ${status} · View event and eligibility`}>
              <time className="pathway-event-date" dateTime={event.startDate}>
                <span>{date.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })}</span>
                <strong>{date.getUTCDate()}</strong><small>{date.getUTCFullYear()}</small>
              </time>
              <div className="pathway-event-copy">
                <div className="pathway-event-topline"><span>{event.type}</span><span className={`pathway-event-status ${!past && (committed || access.allowed) && event.status !== 'Completed' && event.status !== 'Skipped' ? 'pathway-event-status--open' : ''}`}>{status}</span></div>
                <h3>{event.name}</h3>
                <p className="pathway-event-location"><MapPin aria-hidden="true" />{event.location}</p>
                {event.progressionImpact && <p className="pathway-event-impact">{event.progressionImpact}</p>}
                {!past && !committed && !access.allowed && event.status !== 'Completed' && <p className="pathway-event-reason">{access.reason}</p>}
                <span className="pathway-event-link">View event & eligibility <ChevronRight aria-hidden="true" /></span>
              </div>
            </Link>
          })}
          {group.events.length === 0 && <div className="pathway-events-empty"><CalendarDays aria-hidden="true" /><h3>No stage events scheduled</h3><p>Check the full calendar for other events you can enter.</p><Link to="/calendar">Explore calendar <ChevronRight aria-hidden="true" /></Link></div>}
        </div>
        <footer className="pathway-events-footer"><span>{index ? 'Plan your next step' : 'Explore your current stage'}</span><Link to="/calendar">Full calendar <ChevronRight aria-hidden="true" /></Link></footer>
      </section>)}
    </div>
    <p className="pathway-events-note">Stage suggestions are a guide. Eligibility uses the current entry rules; deadlines, selection cutoffs, commitments and costs are checked in Calendar.</p>
  </div>
}
