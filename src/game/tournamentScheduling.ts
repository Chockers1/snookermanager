import type { Tournament } from '../types/game'

type TournamentScheduleState = {
  currentDate: string
  tournaments: Tournament[]
  travel: { bookings: Record<string, { preparation?: unknown } | undefined> }
}

type EntryAccess = { allowed: boolean; reason: string | null }
type EntryAccessEvaluator<TState extends TournamentScheduleState> = (state: TState, tournament: Tournament) => EntryAccess

const ENTERABLE_STATUSES = new Set<Tournament['status']>(['Booked', 'Available', 'High Cost'])

export function getTournamentDateValue(dateValue: string) {
  return new Date(`${dateValue}T00:00:00`).getTime()
}

export function selectNextEligibleTournament<TState extends TournamentScheduleState>(state: TState, getEntryAccess: EntryAccessEvaluator<TState>) {
  const currentDateValue = getTournamentDateValue(state.currentDate)
  const activeEntry = state.tournaments.find((tournament) => tournament.status === 'Entered'
    && getTournamentDateValue(tournament.endDate ?? tournament.startDate) >= currentDateValue
    && getEntryAccess(state, tournament).allowed)
  if (activeEntry) return activeEntry

  return [...state.tournaments]
    .filter((tournament) => ENTERABLE_STATUSES.has(tournament.status)
      && getTournamentDateValue(tournament.endDate ?? tournament.startDate) >= currentDateValue
      && getEntryAccess(state, tournament).allowed)
    .sort((left, right) => getTournamentDateValue(left.startDate) - getTournamentDateValue(right.startDate))[0]
}

export type TournamentPlayability = {
  canPlay: boolean
  reason: string | null
  daysUntilStart: number
  travelBooked: boolean
  preparationConfirmed: boolean
}

export function evaluateTournamentPlayability<TState extends TournamentScheduleState>(state: TState, tournament: Tournament, getEntryAccess: EntryAccessEvaluator<TState>): TournamentPlayability {
  const currentDateValue = getTournamentDateValue(state.currentDate)
  const startDateValue = getTournamentDateValue(tournament.startDate)
  const endDateValue = getTournamentDateValue(tournament.endDate ?? tournament.startDate)
  const daysUntilStart = Math.ceil((startDateValue - currentDateValue) / 86_400_000)
  const booking = state.travel.bookings[tournament.id]
  const travelBooked = Boolean(booking)
  const preparationConfirmed = Boolean(booking?.preparation)

  if (tournament.status !== 'Entered') return { canPlay: false, reason: `Enter ${tournament.name} before starting a match.`, daysUntilStart, travelBooked, preparationConfirmed }

  const entryAccess = getEntryAccess(state, tournament)
  if (!entryAccess.allowed) return { canPlay: false, reason: entryAccess.reason, daysUntilStart, travelBooked, preparationConfirmed }
  if (currentDateValue > endDateValue) return { canPlay: false, reason: `${tournament.name} has already finished.`, daysUntilStart, travelBooked, preparationConfirmed }
  if (daysUntilStart > 0) return { canPlay: false, reason: `${tournament.name} starts in ${daysUntilStart} day${daysUntilStart === 1 ? '' : 's'}. Advance to its start date first.`, daysUntilStart, travelBooked, preparationConfirmed }
  if (!travelBooked) return { canPlay: false, reason: `Book travel and accommodation for ${tournament.name} before starting a match.`, daysUntilStart, travelBooked, preparationConfirmed }
  if (!preparationConfirmed) return { canPlay: false, reason: `Confirm a preparation plan for ${tournament.name} before starting the match.`, daysUntilStart, travelBooked, preparationConfirmed }

  return { canPlay: true, reason: null, daysUntilStart, travelBooked, preparationConfirmed }
}
