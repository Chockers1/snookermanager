import { useState } from 'react';
import { useGame } from '../../context/useGame';
import { betweenMatchChoices, betweenMatchEffects, betweenMatchInfo, type BetweenMatchChoice } from '../../game/betweenMatches';

const dateLabel = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export function BetweenMatchPanel({ tournamentId }: { tournamentId?: string }) {
  const { gameState, prepareBetweenMatches } = useGame();
  const [selected, setSelected] = useState<{ key: string; choice: BetweenMatchChoice } | null>(null);
  const info = betweenMatchInfo(gameState, tournamentId ? gameState.tournaments.find(t => t.id === tournamentId) : undefined);
  if (!info || (tournamentId && info.event.id !== tournamentId) || gameState.liveMatch?.status === 'In Progress') return null;
  const choice = selected?.key === info.key ? selected.choice : info.recommended;
  const applied = info.applied;
  return <section aria-label="Between-match preparation" className="min-w-0 rounded-lg border border-border bg-surface p-3 text-xs">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="font-semibold text-white">Before your next match · {info.round}</h2>
      <span className="font-semibold text-amber-300">{info.days === 0 ? 'Same-day turnaround' : info.days === 1 ? 'Overnight break · 1 day between matches' : `${info.days} days between matches`}</span>
    </div>
    <p className="mt-1 text-gray-300">{dateLabel(info.previousDate)} → {dateLabel(info.nextDate)} · Next opponent: {info.opponent}</p>
    {applied ? <p role="status" className="mt-2 text-green-300">{betweenMatchChoices.find(c => c.id === applied.choice)?.label} completed · Fatigue {applied.fatigueBefore.toFixed(2)}% → {applied.fatigueAfter.toFixed(2)}% · Confidence {applied.confidenceBefore.toFixed(2)}% → {applied.confidenceAfter.toFixed(2)}%. Ready for the next match.</p> : <>
      <p className="mt-2 text-gray-300">{gameState.player.fatigue >= 40 ? 'Fatigue is elevated: rest is recommended.' : gameState.player.confidence < 65 ? 'Confidence is low: a calm tactical review is recommended.' : 'You are fresh enough for a short practice routine.'} {info.days === 0 ? 'Only a short recovery window is available.' : 'The overnight gap allows more recovery.'}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-3" role="group" aria-label="Preparation choices">
        {betweenMatchChoices.map(option => {
          const effects = betweenMatchEffects(gameState, info.days, option.id);
          const confidenceGain = effects.confidence - gameState.player.confidence;
          return <button type="button" key={option.id} aria-pressed={choice === option.id} onClick={() => setSelected({ key: info.key, choice: option.id })} className={`min-w-0 rounded border p-2 text-left ${choice === option.id ? 'border-green-500 bg-green-500/10' : 'border-border bg-background/30'}`}>
            <span className="block font-semibold text-white">{option.label}{option.id === info.recommended ? ' · Recommended' : ''}</span>
            <span className="mt-1 block text-[11px] text-gray-400">{option.description}</span>
            <span className="mt-1 block text-[11px] text-gray-200">Fatigue {gameState.player.fatigue.toFixed(2)}% → {effects.fatigue.toFixed(2)}%</span>
            <span className="mt-1 block text-[11px] text-gray-200">Confidence {gameState.player.confidence.toFixed(2)}% → {effects.confidence.toFixed(2)}% ({confidenceGain > 0 ? `+${confidenceGain.toFixed(2)} pts` : 'unchanged'})</span>
          </button>;
        })}
      </div>
      <p className="mt-2 text-[11px] text-gray-400">{gameState.player.confidence >= 90 ? 'Confidence is already at or above the 90% preparation limit; these routines maintain it. Choose for recovery.' : 'Confidence support tapers towards 90%. Same-day breaks give half the confidence benefit of an overnight routine.'}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" className="btn-primary text-xs" onClick={() => prepareBetweenMatches(choice, info.event.id)}>Apply match preparation</button>
        <span className="text-[11px] text-gray-400">Free · one choice per match. Playing or Quick Sim without choosing uses rest automatically.</span>
      </div>
    </>}
    <p className="mt-2 text-[10px] text-gray-500">Estimated round dates, shared with the hotel schedule; exact session times are not available. Recovery is applied once for this fixture gap.</p>
  </section>;
}
