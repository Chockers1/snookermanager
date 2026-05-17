import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, HeartPulse, Shield, Sparkles, Star } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { SectionCard } from '../components/ui/SectionCard'
import { MetricCard } from '../components/ui/MetricCard'
import { AttributeGroupPanel } from '../components/game/AttributeGroupPanel'
import { useGame } from '../context/GameStateContext'
import { calculateOverallRating, calculatePotentialRating } from '../utils/calculations'

export function PlayerAttributesPage() {
  const { gameState } = useGame()
  const navigate = useNavigate()
  const [showSummaryView, setShowSummaryView] = useState(false)
  const currentCoach = gameState.coaches.find((coach) => coach.id === gameState.currentCoachId)
  const allAttributes = Object.entries({
    ...gameState.attributes.technical,
    ...gameState.attributes.mental,
    ...gameState.attributes.physical,
  })
  const overallRating = calculateOverallRating({
    attributes: gameState.attributes,
    personalityTraits: gameState.player.personalityTraits,
    playingStyle: gameState.player.playingStyle,
  })
  const potential = calculatePotentialRating({
    attributes: gameState.attributes,
    personalityTraits: gameState.player.personalityTraits,
    age: gameState.player.age,
    playingStyle: gameState.player.playingStyle,
    personalityType: gameState.player.personalityType,
    overallRating,
  })
  const topStrengths = [...allAttributes].sort((left, right) => right[1] - left[1]).slice(0, 4).map(([label, value]) => `${label} ${value}`)
  const topWeaknesses = [...allAttributes].sort((left, right) => left[1] - right[1]).slice(0, 4).map(([label, value]) => `${label} ${value}`)
  const matchFitness = Math.max(0, 100 - gameState.player.fatigue)
  const firstName = gameState.player.fullName.split(' ')[0]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Player"
        title={`Player Attributes - ${gameState.player.fullName}`}
        description={`${gameState.player.careerStage} · Age ${gameState.player.age} · ${gameState.player.handedness}. Current technical, mental, and physical profile with coach notes and style context.`}
        actions={
          <div className="flex items-center gap-3">
            <ActionButton tone="secondary" onClick={() => navigate('/rankings')}>Compare</ActionButton>
            <ActionButton tone="secondary" onClick={() => setShowSummaryView((value) => !value)}>{showSummaryView ? 'Grouped View' : 'Attribute View'}</ActionButton>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-5">
        <MetricCard label="Overall Rating" value={`${overallRating} / 100`} tone="gold" icon={<Star className="h-5 w-5" />} />
        <MetricCard label="Potential" value={`${potential} / 100`} tone="gold" icon={<Sparkles className="h-5 w-5" />} />
        <MetricCard label="Morale" value={gameState.player.morale >= 75 ? 'High' : gameState.player.morale >= 55 ? 'Steady' : 'Fragile'} subValue={`${gameState.player.morale}%`} tone="green" icon={<Activity className="h-5 w-5" />} />
        <MetricCard label="Match Fitness" value={`${matchFitness}%`} tone="green" icon={<HeartPulse className="h-5 w-5" />} />
        <MetricCard label="Fatigue" value={gameState.player.fatigue >= 70 ? 'Heavy' : gameState.player.fatigue >= 45 ? 'Managed' : 'Fresh'} subValue={`${gameState.player.fatigue}%`} tone="amber" icon={<Shield className="h-5 w-5" />} />
      </div>

      <div className="rounded-xl border border-scm-border bg-scm-panel/80 px-4 py-3 text-sm text-scm-textSoft">
        Live attribute profile for the active save, including current ratings, strengths, weaknesses, and coach feedback.
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.9fr_360px]">
        <div className="grid gap-6 2xl:grid-cols-3">
          {showSummaryView ? (
            <SectionCard title="All Attributes" subtitle="Sorted from strongest to weakest.">
              <div className="space-y-3 text-sm text-scm-textSoft">
                {allAttributes.slice().sort((left, right) => right[1] - left[1]).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3"><span>{label}</span><span className="text-scm-text">{value}</span></div>
                ))}
              </div>
            </SectionCard>
          ) : (
            <>
              <AttributeGroupPanel title="Technical" attributes={gameState.attributes.technical} />
              <AttributeGroupPanel title="Mental" attributes={gameState.attributes.mental} />
              <AttributeGroupPanel title="Physical" attributes={gameState.attributes.physical} />
            </>
          )}
        </div>

        <div className="space-y-6">
          <SectionCard title="Playing Style" subtitle="Current tactical identity and personality framing.">
            <p className="text-sm leading-6 text-scm-textSoft">{gameState.player.playingStyle}. The live profile currently blends attacking scoring with enough tactical control to protect close frames when confidence dips.</p>
          </SectionCard>

          <SectionCard title="Personality Type" subtitle={gameState.player.personalityType}>
            <p className="text-sm leading-6 text-scm-textSoft">The save currently shows a player profile built around ambition, consistent standards, and momentum-driven confidence changes from week to week.</p>
          </SectionCard>

          <SectionCard title="Strengths" subtitle="What is already separating the profile from the field.">
            <ul className="space-y-3 text-sm text-scm-textSoft">
              {topStrengths.map((item) => (
                <li key={item} className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-scm-green" />{item}</li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Weaknesses" subtitle="Key development gaps still visible in the current profile.">
            <ul className="space-y-3 text-sm text-scm-textSoft">
              {topWeaknesses.map((item) => (
                <li key={item} className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-scm-red" />{item}</li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Coach Notes" subtitle={`Coach: ${currentCoach?.name ?? 'Support Team'} development review`}>
            <p className="text-sm leading-6 text-scm-textSoft">{currentCoach ? `${currentCoach.name} rates compatibility at ${currentCoach.compatibility}% and sees the clearest next gains in ${topWeaknesses.slice(0, 2).join(' and ')}. The current profile is strongest in ${topStrengths.slice(0, 2).join(' and ')}.` : `${firstName} currently has no active coach assigned. The next development priority is to stabilise ${topWeaknesses.slice(0, 2).join(' and ')} while preserving the current strengths.`}</p>
          </SectionCard>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-scm-border bg-scm-panel/80 px-4 py-4">
        <div className="flex gap-3">
          <ActionButton tone="secondary" onClick={() => navigate(-1)}>Back</ActionButton>
          <ActionButton tone="secondary" onClick={() => navigate('/training')}>View Training Plan</ActionButton>
          <ActionButton tone="secondary" onClick={() => navigate('/career/stats')}>Attribute History</ActionButton>
          <ActionButton tone="secondary" onClick={() => navigate('/training')}>Set Development Focus</ActionButton>
        </div>
        <ActionButton onClick={() => navigate('/')}>Continue</ActionButton>
      </div>
    </div>
  )
}