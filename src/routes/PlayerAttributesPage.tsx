import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, BarChart3, ChevronRight, HeartPulse, Shield, Sparkles, Star, TrendingDown, TrendingUp } from 'lucide-react'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/useGame'
import { calculateOverallRating, calculatePotentialRating } from '../utils/calculations'

type AttributeGroup = 'technical' | 'mental' | 'physical'

const groupLabels: Record<AttributeGroup, string> = {
  technical: 'Technical',
  mental: 'Mental',
  physical: 'Physical',
}

function ratingTone(value: number): 'green' | 'amber' | 'red' {
  if (value >= 75) return 'green'
  if (value >= 55) return 'amber'
  return 'red'
}

function conditionLabel(value: number, inverted = false) {
  const score = inverted ? 100 - value : value
  if (score >= 75) return 'Strong'
  if (score >= 55) return 'Managed'
  return 'Fragile'
}

function TrendIcon({ value }: { value: number }) {
  if (value >= 75) return <TrendingUp className="h-3 w-3 text-green-400" />
  if (value < 55) return <TrendingDown className="h-3 w-3 text-red-400" />
  return <BarChart3 className="h-3 w-3 text-amber-400" />
}

export function PlayerAttributesPage() {
  const { gameState } = useGame()
  const navigate = useNavigate()
  const [view, setView] = useState<'grouped' | 'flat'>('grouped')
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
  const matchFitness = Math.max(0, 100 - gameState.player.fatigue)
  const topStrengths = allAttributes.slice().sort((left, right) => right[1] - left[1]).slice(0, 5)
  const topWeaknesses = allAttributes.slice().sort((left, right) => left[1] - right[1]).slice(0, 5)
  const attributeGroups: Array<[AttributeGroup, Record<string, number>]> = [
    ['technical', gameState.attributes.technical],
    ['mental', gameState.attributes.mental],
    ['physical', gameState.attributes.physical],
  ]

  function renderAttributeRow(label: string, value: number) {
    return (
      <div key={label} className="flex items-center gap-2">
        <span className="w-32 shrink-0 truncate text-[11px] text-gray-300">{label}</span>
        <div className="min-w-0 flex-1"><ProgressBar value={value} tone={ratingTone(value)} compact /></div>
        <span className="w-7 shrink-0 text-right text-xs font-medium text-white">{value}</span>
        <div className="w-4 shrink-0"><TrendIcon value={value} /></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase text-gray-500">Player Profile</p>
          <h1 className="mt-1 truncate text-2xl font-bold text-white">Player Attributes - {gameState.player.fullName}</h1>
          <p className="mt-1 text-sm text-gray-400">{gameState.player.careerStage} - Age {gameState.player.age} - {gameState.player.handedness} - {gameState.player.playingStyle}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" className={view === 'grouped' ? 'btn-primary text-xs' : 'btn-secondary text-xs'} onClick={() => setView('grouped')}>Grouped</button>
          <button type="button" className={view === 'flat' ? 'btn-primary text-xs' : 'btn-secondary text-xs'} onClick={() => setView('flat')}>All</button>
          <button type="button" className="btn-secondary text-xs" onClick={() => navigate('/training')}>Training <ChevronRight className="h-3 w-3" /></button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Overall Rating', value: overallRating, sub: '/ 100', icon: Star, tone: 'green' },
          { label: 'Potential', value: potential, sub: '/ 100', icon: Sparkles, tone: 'blue' },
          { label: 'Morale', value: gameState.player.morale, sub: conditionLabel(gameState.player.morale), icon: Activity, tone: 'green' },
          { label: 'Match Fitness', value: matchFitness, sub: `${matchFitness}% ready`, icon: HeartPulse, tone: 'green' },
          { label: 'Fatigue', value: gameState.player.fatigue, sub: conditionLabel(gameState.player.fatigue, true), icon: Shield, tone: gameState.player.fatigue >= 70 ? 'red' : gameState.player.fatigue >= 45 ? 'amber' : 'green' },
        ].map((metric) => {
          const Icon = metric.icon
          return (
            <div key={metric.label} className="card card-body text-center">
              <Icon className="mx-auto mb-1 h-4 w-4 text-green-400" />
              <p className="metric-label">{metric.label}</p>
              <div className={`mx-auto mt-2 flex h-14 w-14 items-center justify-center rounded-full border-2 ${metric.tone === 'red' ? 'border-red-500 bg-red-600/20' : metric.tone === 'amber' ? 'border-amber-500 bg-amber-600/20' : metric.tone === 'blue' ? 'border-blue-500 bg-blue-600/20' : 'border-green-500 bg-green-600/20'}`}>
                <span className="text-xl font-bold text-white">{metric.value}</span>
              </div>
              <p className="mt-1 text-[10px] text-gray-400">{metric.sub}</p>
            </div>
          )
        })}
      </div>

      {view === 'grouped' ? (
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {attributeGroups.map(([group, attributes]) => (
            <div key={group} className="card">
              <div className="card-header"><h3 className="text-sm font-semibold text-white">{groupLabels[group]}</h3></div>
              <div className="card-body space-y-2.5">
                {Object.entries(attributes).map(([label, value]) => renderAttributeRow(label, value))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-header"><h3 className="text-sm font-semibold text-white">All Attributes</h3><span className="text-[10px] text-gray-400">Strongest to weakest</span></div>
          <div className="card-body grid gap-y-2.5 sm:grid-cols-3 sm:gap-x-6">
            {allAttributes.slice().sort((left, right) => right[1] - left[1]).map(([label, value]) => renderAttributeRow(label, value))}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="card card-body lg:col-span-4">
          <h3 className="mb-3 text-xs font-semibold text-white">Strengths</h3>
          <div className="space-y-2">
            {topStrengths.map(([label, value]) => <div key={label} className="flex items-center justify-between rounded bg-surface-light/50 px-3 py-2 text-xs"><span className="text-gray-300">{label}</span><span className="font-semibold text-green-400">{value}</span></div>)}
          </div>
        </div>
        <div className="card card-body lg:col-span-4">
          <h3 className="mb-3 text-xs font-semibold text-white">Development Gaps</h3>
          <div className="space-y-2">
            {topWeaknesses.map(([label, value]) => <div key={label} className="flex items-center justify-between rounded bg-surface-light/50 px-3 py-2 text-xs"><span className="text-gray-300">{label}</span><span className="font-semibold text-amber-400">{value}</span></div>)}
          </div>
        </div>
        <div className="card card-body lg:col-span-4">
          <h3 className="mb-2 text-xs font-semibold text-white">Coach Notes</h3>
          <p className="text-xs leading-relaxed text-gray-400">
            {currentCoach
              ? `${currentCoach.name} rates compatibility at ${currentCoach.compatibility}% and sees the clearest gains in ${topWeaknesses.slice(0, 2).map(([label]) => label).join(' and ')}.`
              : `No active coach is assigned. Prioritise ${topWeaknesses.slice(0, 2).map(([label]) => label).join(' and ')} while protecting ${topStrengths.slice(0, 2).map(([label]) => label).join(' and ')}.`}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
            <button type="button" className="btn-secondary justify-center" onClick={() => navigate('/staff/coaches')}>Staff</button>
            <button type="button" className="btn-primary justify-center" onClick={() => navigate('/training')}>Set Focus</button>
          </div>
        </div>
      </div>
    </div>
  )
}
