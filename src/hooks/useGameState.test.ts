import { afterEach, describe, expect, it, vi } from 'vitest'
import { chalkCatalog, createPlayerBackgroundCatalog, createPlayerIdentitySeed, createPlayerSliderCatalog, cueMarketplaceCatalog, tipCatalog } from '../data/gameContent'
import {
  createNewCareerState,
  createStarterState,
  advanceWeekState,
  bookTravelState,
  buyChalkState,
  buyCueState,
  buyTipState,
  continueToNextTournamentState,
  enterTournamentState,
  getNextEligibleTournament,
  getTournamentEntryAccess,
  getTournamentPlayability,
  recordFinanceExpenseState,
  repairGameState,
  SAVE_SCHEMA_VERSION,
  simulateTournamentMatchState,
  updateBudgetTargetsState,
  withdrawTournamentState,
} from './useGameState'

afterEach(() => {
  vi.restoreAllMocks()
})

function createProfessionalStart(startingLevelId: 'start-rookie-pro' | 'start-bottom-tour') {
  return createNewCareerState({
    fullName: createPlayerIdentitySeed.name,
    nationality: createPlayerIdentitySeed.nationality,
    age: 18,
    handedness: createPlayerIdentitySeed.handedness as 'Right-handed' | 'Left-handed',
    cueStyle: createPlayerIdentitySeed.cueStyle,
    playingStyle: createPlayerIdentitySeed.playingStyle,
    personalityArchetype: createPlayerIdentitySeed.personalityArchetype,
    sliders: createPlayerSliderCatalog.map((slider) => ({ ...slider })),
    backgroundId: createPlayerBackgroundCatalog[1]?.id ?? createPlayerBackgroundCatalog[0].id,
    startingLevelId,
  })
}

describe('tournament entry and match-start rules', () => {
  it('does not select an ineligible entered junior event for the starter professional', () => {
    const state = createStarterState()
    const junior = state.tournaments.find((tournament) => tournament.type === 'Junior')
    expect(junior).toBeDefined()
    if (!junior) return

    junior.status = 'Entered'
    expect(getTournamentEntryAccess(state, junior).allowed).toBe(false)

    const nextTournament = getNextEligibleTournament(state)
    expect(nextTournament).toBeDefined()
    expect(nextTournament?.id).not.toBe(junior.id)
    expect(nextTournament && getTournamentEntryAccess(state, nextTournament).allowed).toBe(true)
  })

  it('requires entry, tournament week, and booked travel before a match can start', () => {
    const state = createStarterState()
    const tournament = getNextEligibleTournament(state)
    expect(tournament).toBeDefined()
    if (!tournament) return

    expect(getTournamentPlayability(state, tournament).reason).toMatch(/Enter/)
    tournament.status = 'Entered'
    expect(getTournamentPlayability(state, tournament).reason).toMatch(/starts in .* days/)

    state.currentDate = tournament.startDate
    expect(getTournamentPlayability(state, tournament).reason).toMatch(/travel/i)

    state.travel.bookings[tournament.id] = {
      tournamentId: tournament.id,
      travelOptionId: 'test-travel',
      hotelOptionId: 'test-hotel',
      totalCost: 0,
      bookedWeek: state.week,
      bookedDate: state.currentDate,
    }
    expect(getTournamentPlayability(state, tournament)).toMatchObject({ canPlay: true, reason: null, travelBooked: true })
  })

  it('repairs legacy impossible entries and match records when a save is loaded', () => {
    const state = createStarterState()
    const junior = state.tournaments.find((tournament) => tournament.type === 'Junior')
    expect(junior).toBeDefined()
    if (!junior) return
    junior.status = 'Entered'
    state.matches.push({
      id: 'impossible-match', tournamentId: junior.id, round: 'Round 1', bestOf: 7,
      playerName: state.player.fullName, opponentName: 'Test Player', playerRanking: 20, opponentRanking: 120,
      playerFrames: 4, opponentFrames: 0, result: 'Won', highestBreak: 72, opponentHighestBreak: 24,
      fifties: 1, centuries: 0, potSuccess: 89, longPotSuccess: 48, safetySuccess: 71, fouls: 2,
      confidenceChange: 2, fatigueChange: 4, prizeMoneyEarned: 0, rankingPointsGained: 0,
      playedOn: '2025-05-11',
    })

    const repaired = repairGameState(state)
    expect(repaired.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(repaired.tournaments.find((event) => event.id === junior.id)?.status).not.toBe('Entered')
    expect(repaired.matches.some((match) => match.id === 'impossible-match')).toBe(false)
  })

  it('allows only one active event and supports an early withdrawal refund', () => {
    const state = createStarterState()
    const first = getNextEligibleTournament(state)
    expect(first).toBeDefined()
    if (!first) return
    const entered = enterTournamentState(state, first.id)
    expect(entered.tournaments.find((event) => event.id === first.id)?.status).toBe('Entered')

    const second = entered.tournaments.find((event) => event.id !== first.id && event.status === 'Available' && getTournamentEntryAccess(entered, event).allowed)
    expect(second).toBeDefined()
    if (!second) return
    const blocked = enterTournamentState(entered, second.id)
    expect(blocked.tournaments.find((event) => event.id === second.id)?.status).not.toBe('Entered')
    expect(blocked.lastAction).toMatch(/withdraw from or finish/i)

    const withdrawn = withdrawTournamentState(entered, first.id)
    expect(withdrawn.tournaments.find((event) => event.id === first.id)?.status).toBe('Available')
    expect(withdrawn.tournamentProgress.tournamentId).toBeNull()
    expect(withdrawn.player.cash).toBeGreaterThanOrEqual(entered.player.cash)
  })

  it('advances to an entered event without auto-playing or bypassing travel', () => {
    const state = createStarterState()
    const tournament = getNextEligibleTournament(state)
    expect(tournament).toBeDefined()
    if (!tournament) return

    const entered = enterTournamentState(state, tournament.id)
    const advanced = continueToNextTournamentState(entered)

    expect(advanced.currentDate).toBe(tournament.startDate)
    expect(advanced.tournaments.find((event) => event.id === tournament.id)?.status).toBe('Entered')
    expect(advanced.matches).toHaveLength(entered.matches.length)
    expect(advanced.tournamentProgress.tournamentId).toBe(tournament.id)
    expect(getTournamentPlayability(advanced, advanced.tournaments.find((event) => event.id === tournament.id)!)).toMatchObject({
      canPlay: false,
      travelBooked: false,
    })
    expect(advanced.lastAction).toMatch(/book travel/i)
  })
})

describe('finance state', () => {
  it('stores budget targets in the save and records a cash expense', () => {
    const state = createStarterState()
    const budgeted = updateBudgetTargetsState(state, { Competition: 45, Coaching: 25 })
    expect(budgeted.finance.budgetTargets).toMatchObject({ Competition: 45, Coaching: 25 })

    const expensed = recordFinanceExpenseState(budgeted, 'Club membership', 'Training', 125)
    expect(expensed.player.cash).toBe(budgeted.player.cash - 125)
    expect(expensed.finance.cash).toBe(budgeted.finance.cash - 125)
    expect(expensed.finance.ledger[0]).toMatchObject({ description: 'Club membership', category: 'Training', amount: -125, type: 'Expense' })
  })

  it('rejects invalid or unaffordable expenses', () => {
    const state = createStarterState()
    expect(recordFinanceExpenseState(state, '', 'Other', 20).finance.ledger).toHaveLength(0)
    expect(recordFinanceExpenseState(state, 'Impossible', 'Other', state.player.cash + 1).finance.ledger).toHaveLength(0)
  })
})

describe('career lifecycle presets', () => {
  it('gives rookie-pro and bottom-tour starts meaningfully different survival pressure', () => {
    const rookie = createProfessionalStart('start-rookie-pro')
    const bottomTour = createProfessionalStart('start-bottom-tour')

    expect(rookie.careerSystems.pro.worldRank).toBeLessThan(bottomTour.careerSystems.pro.worldRank ?? 999)
    expect(rookie.careerSystems.pro.yearsRemaining).toBe(2)
    expect(bottomTour.careerSystems.pro.yearsRemaining).toBe(1)
    expect(rookie.player.cash).toBeGreaterThan(bottomTour.player.cash)
    expect(rookie.finance.cashFlow).toBeGreaterThan(bottomTour.finance.cashFlow)
  })

  it('migrates CPU lifecycle records to explicit non-retired state', () => {
    const state = createStarterState()
    const legacy = structuredClone(state) as typeof state
    for (const record of legacy.worldPlayers) {
      delete (record as Partial<typeof record>).retired
      delete (record as Partial<typeof record>).retiredSeason
    }

    const repaired = repairGameState(legacy)
    expect(repaired.worldPlayers.every((record) => record.retired === false && record.retiredSeason === null)).toBe(true)
  })

  it('archives a season and explicitly retires an over-age CPU player', () => {
    const state = createStarterState()
    state.currentDate = '2027-06-29'
    const cpuPlayer = state.worldPlayers.find((record) => record.playerName !== state.player.fullName)
    expect(cpuPlayer).toBeDefined()
    if (!cpuPlayer) return
    cpuPlayer.age = 79

    const rolledOver = advanceWeekState(state)
    const retiredPlayer = rolledOver.worldPlayers.find((record) => record.id === cpuPlayer.id)

    expect(rolledOver.season).not.toBe(state.season)
    expect(rolledOver.history.seasonRecords).toHaveLength(1)
    expect(retiredPlayer).toMatchObject({ retired: true, hasTourCard: false, tourSurvivalStatus: 'Amateur' })
    expect(retiredPlayer?.retiredSeason).toBe(rolledOver.season)
  })
})

describe('complete tournament journey', () => {
  it('creates a career, enters an event, books travel, plays, records a result, and advances the tournament state', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    const career = createProfessionalStart('start-rookie-pro')
    const equipped = buyTipState(buyChalkState(buyCueState(career, cueMarketplaceCatalog[0].id), chalkCatalog[0].id), tipCatalog[0].id)
    const tournament = getNextEligibleTournament(equipped)
    expect(tournament).toBeDefined()
    if (!tournament) return

    const entered = enterTournamentState(equipped, tournament.id)
    const atEvent = continueToNextTournamentState(entered)
    const travelled = bookTravelState(atEvent, tournament.id)
    expect(getTournamentPlayability(travelled, travelled.tournaments.find((event) => event.id === tournament.id)!)).toMatchObject({ canPlay: true })

    const afterMatch = simulateTournamentMatchState(travelled, tournament.id)
    const result = afterMatch.matches[0]

    expect(result?.tournamentId).toBe(tournament.id)
    expect(result?.playedOn).toBe(tournament.startDate)
    expect(['Won', 'Lost']).toContain(result?.result)
    expect(afterMatch.history.matchLog[0]?.tournamentName).toBe(tournament.name)
    expect(afterMatch.history.tournamentHistory.some((entry) => entry.tournamentId === tournament.id && entry.canonicalResult?.matchesPlayed === 1)).toBe(true)
    expect(afterMatch.tournamentProgress.tournamentId === tournament.id || afterMatch.tournamentProgress.tournamentId === null).toBe(true)
  })
})
