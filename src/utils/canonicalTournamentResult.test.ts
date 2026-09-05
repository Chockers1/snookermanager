import { describe, expect, it } from 'vitest'
import { getBestRecordedFinish } from './canonicalTournamentResult'

describe('audit finish labels', () => {
  it.each(['Semi Final', 'Quarter Final', 'Final'])('preserves %s without promoting it', (finish) => {
    expect(getBestRecordedFinish([{ result: `Lost in ${finish}` }])).toBe(finish)
  })
  it('only reports a title when a recorded result says it was won', () => {
    expect(getBestRecordedFinish(Array.from({ length: 5 }, () => ({ result: 'Lost in Final' })))).toBe('Final')
    expect(getBestRecordedFinish([{ result: 'Winner' }, { result: 'Lost in Final' }])).toBe('Winner')
  })
  it('selects the best result rather than the most recent', () => {
    expect(getBestRecordedFinish([{ result: 'Lost in Last 16' }, { result: 'Lost in Semi Final' }, { result: 'Lost in Quarter Final' }])).toBe('Semi Final')
    expect(getBestRecordedFinish([{ result: 'Skipped' }])).toBe('No main draw win')
  })
})
