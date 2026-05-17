import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { CircularMeter } from '../components/ui/CircularMeter'
import { ProgressBar } from '../components/ui/ProgressBar'
import { SectionCard } from '../components/ui/SectionCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useGame } from '../context/GameStateContext'
import { getCoachAvailability, getCoachContractOptions } from '../utils/coachMarket'
import { formatMoney } from '../utils/formatters'

function getPlayerRanking(fullName: string, rankingRows: { playerName: string; ranking: number }[], fallbackRanking?: number | null) {
  return rankingRows.find((row) => row.playerName === fullName)?.ranking ?? fallbackRanking ?? 0
}

export function CoachProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { gameState, hireCoach } = useGame()
  const coach = gameState.coaches.find((entry) => entry.id === id) ?? gameState.coaches[0]
  const ranking = getPlayerRanking(gameState.player.fullName, gameState.rankings, gameState.player.amateurRanking)
  const availability = getCoachAvailability(coach, ranking, gameState.player.reputation)
  const coachAttributeRatings = [
    { label: 'Technical', value: coach.technical },
    { label: 'Tactical', value: coach.tactical },
    { label: 'Mental', value: coach.mental },
    { label: 'Motivation', value: coach.motivation },
    { label: 'Compatibility', value: coach.compatibility },
  ]
  const predictedImpact = [
    { label: 'Long Potting', value: Math.max(1, Math.round(coach.technical / 18)) },
    { label: 'Safety Play', value: Math.max(1, Math.round(coach.tactical / 18)) },
    { label: 'Focus', value: Math.max(1, Math.round(coach.mental / 18)) },
    { label: 'Stamina', value: Math.max(1, Math.round(coach.motivation / 20)) },
  ]
  const contractOptions = getCoachContractOptions(coach)
  const coachProfile = {
    personality: coach.motivation >= 80 ? 'Demanding Professional' : coach.mental >= 75 ? 'Measured Mentor' : 'Development Specialist',
    summary: `${coach.name} specialises in ${coach.specialism.toLowerCase()} and currently fits this save at ${coach.compatibility}% compatibility.`,
    bestFor: `${coach.type} development with ${coach.level.toLowerCase()}-level expectations.`,
    highlights: coach.strengths.slice(0, 3),
    languages: ['English', coach.level === 'Elite' ? 'International tour experience' : 'Domestic tour experience'],
  }
  const advisorRecommendation = coach.compatibility >= 75 ? 'This is a strong fit if the weekly budget can absorb the staff cost.' : 'Useful specialist coach, but only worth it if the current weakness matches the specialism.'
  const [selectedContractLabel, setSelectedContractLabel] = useState(contractOptions.find((option) => option.selected)?.label ?? contractOptions[0]?.label ?? '')
  const [shortlisted, setShortlisted] = useState(false)

  function handleHireCoach() {
    if (!availability.available) return
    hireCoach(coach.id, selectedContractLabel)
    navigate('/staff/coaches')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Staff"
        title="Coach Profile"
        description="Detailed coach decision screen with strengths, predicted impact, contract options, and advisor guidance."
        actions={<StatusBadge tone={availability.available ? 'green' : 'red'}>{availability.available ? 'Available Now' : 'Stage Locked'}</StatusBadge>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
            <SectionCard title={coach.name} subtitle={coach.specialism}>
              <div className="grid gap-4 grid-cols-[160px_1fr]">
                <div className="flex h-[180px] items-center justify-center rounded-xl border border-scm-borderStrong bg-scm-panelSoft text-4xl text-scm-textMuted">MK</div>
                <div>
                  <div className="flex items-center gap-3"><p className="text-4xl font-semibold text-scm-text">{coach.name}</p><StatusBadge tone="green">Strong Fit</StatusBadge></div>
                  <p className="mt-2 text-sm text-scm-green">Specialism: {coach.type}</p>
                  <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-scm-textSoft">
                    <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Coach Type</p><p className="mt-1 text-scm-text">{coach.type} Coach</p></div>
                    <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Reputation</p><p className="mt-1 text-scm-text">{coach.reputation}</p></div>
                    <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Coach Level</p><p className="mt-1 text-scm-text">{coach.level}</p></div>
                    <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Compatibility</p><p className="mt-1 text-scm-text">{coach.compatibility}%</p></div>
                    <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Weekly Cost</p><p className="mt-1 text-scm-text">{formatMoney(coach.weeklyCost)}</p></div>
                    <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Personality</p><p className="mt-1 text-scm-text">{coachProfile.personality}</p></div>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Summary" subtitle="Career highlights and fit context">
              <p className="text-sm leading-6 text-scm-textSoft">{coachProfile.summary}</p>
              <p className="mt-4 text-sm"><span className="font-semibold text-scm-green">Best For:</span> <span className="text-scm-textSoft">{coachProfile.bestFor}</span></p>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Career Highlights</p>
                  <ul className="mt-3 space-y-2 text-sm text-scm-textSoft">
                    {coachProfile.highlights.map((item) => <li key={item} className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-scm-gold" />{item}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Working Profile</p>
                  <ul className="mt-3 space-y-2 text-sm text-scm-textSoft">
                    {coachProfile.languages.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_0.95fr_1.1fr]">
            <SectionCard title="Coach Attributes" subtitle="Technical and support profile">
              <div className="space-y-4">
                {coachAttributeRatings.map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-sm"><span className="text-scm-textSoft">{item.label}</span><span className="text-scm-text">{item.value}</span></div>
                    <ProgressBar value={item.value} tone={item.value >= 85 ? 'green' : item.value >= 75 ? 'green' : item.value >= 60 ? 'amber' : 'red'} />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Predicted Impact On Player Attributes" subtitle="12-week projection">
              <div className="space-y-4">
                {predictedImpact.map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-sm"><span className="text-scm-textSoft">{item.label}</span><span className="text-emerald-300">+{item.value}</span></div>
                    <ProgressBar value={item.value * 12} tone="green" />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Contract Options" subtitle="Choose the length and weekly spend before signing.">
              <div className="space-y-3">
                {contractOptions.map((option) => (
                  <button key={option.label} type="button" onClick={() => setSelectedContractLabel(option.label)} className={`w-full rounded-xl border p-4 text-left ${selectedContractLabel === option.label ? 'border-scm-green bg-scm-green/10' : 'border-scm-border bg-scm-panelSoft'}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-scm-text">{option.label}</p>
                        <p className="mt-1 text-sm text-scm-textSoft">{formatMoney(option.weeklyCost)} / week</p>
                      </div>
                      <p className="text-sm text-scm-text">Total {formatMoney(option.totalCost)}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-scm-red/35 bg-scm-red/10 p-4 text-sm text-rose-100">
                Selected contract: {selectedContractLabel}. {availability.available ? 'This coach is available to sign now if the budget works.' : availability.reason}.
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_0.9fr_0.8fr_1.1fr]">
            <SectionCard title="Strengths">
              <ul className="space-y-3 text-sm text-scm-textSoft">
                {coach.strengths.map((item) => <li key={item} className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-scm-green" />{item}</li>)}
              </ul>
            </SectionCard>
            <SectionCard title="Weaknesses">
              <ul className="space-y-3 text-sm text-scm-textSoft">
                {coach.weaknesses.map((item) => <li key={item} className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-scm-red" />{item}</li>)}
              </ul>
            </SectionCard>
            <SectionCard title="Style Fit">
              <div className="flex items-center justify-center py-4"><CircularMeter value={coach.compatibility} label="Fit" /></div>
              <p className="text-sm text-scm-textSoft">{coach.name}'s coaching style aligns with the current player profile and development priorities.</p>
            </SectionCard>
            <SectionCard title="Advisor Recommendation">
              <p className="text-sm leading-6 text-scm-textSoft">{advisorRecommendation}</p>
              <p className="mt-4 text-lg font-semibold text-emerald-300">Recommendation: Hire</p>
            </SectionCard>
          </div>
        </div>

        <SectionCard title="Decision Row" subtitle="Primary actions exposed exactly where the user needs them.">
          <div className="space-y-4">
            <Link to="/staff/coaches"><ActionButton tone="secondary" className="w-full justify-center">Back to Market</ActionButton></Link>
            <ActionButton className="w-full justify-center" disabled={!availability.available} onClick={handleHireCoach}>Hire Coach</ActionButton>
            <ActionButton tone="secondary" className="w-full justify-center" onClick={() => setSelectedContractLabel(contractOptions.at(-1)?.label ?? selectedContractLabel)}>Negotiate Contract</ActionButton>
            <ActionButton tone="secondary" className="w-full justify-center" onClick={() => setShortlisted((value) => !value)}>{shortlisted ? 'Remove From Shortlist' : 'Add to Shortlist'}</ActionButton>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}