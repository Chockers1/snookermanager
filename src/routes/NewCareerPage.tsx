import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Dice5, ShieldCheck, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { AttributeBar } from '../components/ui/AttributeBar'
import { CircularMeter } from '../components/ui/CircularMeter'
import { ProgressBar } from '../components/ui/ProgressBar'
import { SectionCard } from '../components/ui/SectionCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useGame } from '../context/GameStateContext'
import {
  createPlayerBackgroundCatalog,
  createPlayerIdentitySeed,
  createPlayerStartingLevelCatalog,
  createPlayerSliderCatalog,
  starterAttributes,
} from '../data/catalogs'
import { formatMoney } from '../utils/formatters'
import {
  buildAttributeSnapshots,
  buildNewCareerAttributes,
  buildCareerPersonality,
  applyPlayingStyleToSliders,
  getEligibleStartingLevels,
  getCueStyleProfile,
  getPlayingStyleProfile,
  getPlayingStyleSliderDelta,
  getValidatedStartingLevel,
  isStartingLevelEligible,
} from '../utils/newCareerConfig'
import { calculateOverallRating, calculatePotentialRating } from '../utils/calculations'

const steps = [
  { label: 'Identity', description: 'Who is the player and how do they play?' },
  { label: 'Background', description: 'Pick the starting conditions and opening difficulty.' },
  { label: 'Attributes', description: 'Tune temperament and see the final starting profile.' },
  { label: 'Confirm', description: 'Review the full save before creating the new career.' },
] as const

const cueStyles = ['Traditional', 'Touch Focus', 'Power Delivery', 'Compact Rhythm']
const playingStyles = ['Balanced', 'Measured Break Builder', 'Attacking Scorer', 'Safety First']
const MIN_SLIDER_VALUE = 20
const MAX_SLIDER_VALUE = 90
const CREATE_PLAYER_SLIDER_BUDGET = createPlayerSliderCatalog.reduce((sum, slider) => sum + slider.value, 0)
const DEFAULT_STARTING_LEVEL = getValidatedStartingLevel(createPlayerStartingLevelCatalog, createPlayerIdentitySeed.age)
const ATTRIBUTE_PREVIEW_LABELS = ['Long Potting', 'Cue Ball Control', 'Safety Play', 'Break Building', 'Composure', 'Focus', 'Stamina', 'Consistency']

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function normalizeAgeInput(value: string | number) {
  const parsed = Number(value)
  return clamp(Number.isFinite(parsed) ? parsed : 12, 12, 80)
}

function buildBudgetedRandomSliders() {
  const sliderCount = createPlayerSliderCatalog.length
  const baseTotal = sliderCount * MIN_SLIDER_VALUE
  const remainingBudget = Math.max(0, CREATE_PLAYER_SLIDER_BUDGET - baseTotal)
  const weights = createPlayerSliderCatalog.map(() => Math.random() + 0.2)
  const totalWeight = weights.reduce((sum, value) => sum + value, 0)
  const rawValues = weights.map((weight) => MIN_SLIDER_VALUE + Math.round((weight / totalWeight) * remainingBudget))
  const sliders = createPlayerSliderCatalog.map((slider, index) => ({
    ...slider,
    value: clamp(rawValues[index], MIN_SLIDER_VALUE, MAX_SLIDER_VALUE),
  }))

  let difference = CREATE_PLAYER_SLIDER_BUDGET - sliders.reduce((sum, slider) => sum + slider.value, 0)
  let guard = 0

  while (difference !== 0 && guard < 500) {
    guard += 1
    const direction = difference > 0 ? 1 : -1
    const adjustable = sliders.find((slider) => direction > 0 ? slider.value < MAX_SLIDER_VALUE : slider.value > MIN_SLIDER_VALUE)

    if (!adjustable) break

    adjustable.value += direction
    difference -= direction
  }

  return sliders
}

export function NewCareerPage() {
  const { resetCareer, gameState } = useGame()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [form, setForm] = useState({
    fullName: createPlayerIdentitySeed.name,
    nationality: createPlayerIdentitySeed.nationality,
    age: String(createPlayerIdentitySeed.age),
    handedness: createPlayerIdentitySeed.handedness as 'Right-handed' | 'Left-handed',
    cueStyle: createPlayerIdentitySeed.cueStyle,
    playingStyle: createPlayerIdentitySeed.playingStyle,
    personalityArchetype: createPlayerIdentitySeed.personalityArchetype,
    startingLevelId: DEFAULT_STARTING_LEVEL.id,
    sliders: createPlayerSliderCatalog.map((slider) => ({ ...slider })),
  })
  const [selectedBackgroundId, setSelectedBackgroundId] = useState(createPlayerBackgroundCatalog[1]?.id ?? createPlayerBackgroundCatalog[0]?.id ?? '')
  const [previewBackgroundId, setPreviewBackgroundId] = useState(createPlayerBackgroundCatalog[1]?.id ?? createPlayerBackgroundCatalog[0]?.id ?? '')

  const normalizedAge = useMemo(() => normalizeAgeInput(form.age), [form.age])
  const selectedBackground = createPlayerBackgroundCatalog.find((background) => background.id === selectedBackgroundId) ?? createPlayerBackgroundCatalog[0]
  const previewBackground = createPlayerBackgroundCatalog.find((background) => background.id === previewBackgroundId) ?? selectedBackground
  const eligibleStartingLevels = useMemo(() => getEligibleStartingLevels(createPlayerStartingLevelCatalog, normalizedAge), [normalizedAge])
  const selectedStartingLevel = useMemo(() => getValidatedStartingLevel(createPlayerStartingLevelCatalog, normalizedAge, form.startingLevelId), [normalizedAge, form.startingLevelId])
  const activeBackground = currentStep === 1 ? previewBackground : selectedBackground
  const cueStyleProfile = useMemo(() => getCueStyleProfile(form.cueStyle), [form.cueStyle])
  const playingStyleProfile = useMemo(() => getPlayingStyleProfile(form.playingStyle), [form.playingStyle])
  const effectiveSliders = useMemo(() => applyPlayingStyleToSliders(form.sliders, form.playingStyle), [form.playingStyle, form.sliders])
  const derivedPersonality = useMemo(() => buildCareerPersonality(activeBackground.personality, form.playingStyle), [activeBackground.personality, form.playingStyle])
  const sliderPointsUsed = form.sliders.reduce((sum, slider) => sum + slider.value, 0)
  const sliderPointsRemaining = CREATE_PLAYER_SLIDER_BUDGET - sliderPointsUsed
  const previewAttributes = useMemo(() => buildNewCareerAttributes({
    starterAttributes,
    background: activeBackground,
    startingLevel: selectedStartingLevel,
    age: normalizedAge,
    sliders: form.sliders,
    cueStyle: form.cueStyle,
    playingStyle: form.playingStyle,
  }), [activeBackground, form.cueStyle, form.playingStyle, form.sliders, normalizedAge, selectedStartingLevel])
  const attributePreview = useMemo(() => buildAttributeSnapshots(previewAttributes, ATTRIBUTE_PREVIEW_LABELS), [previewAttributes])
  const startingRating = useMemo(() => calculateOverallRating({
    attributes: previewAttributes,
    personalityTraits: effectiveSliders,
    playingStyle: form.playingStyle,
  }), [effectiveSliders, form.playingStyle, previewAttributes])
  const startingPotential = useMemo(() => calculatePotentialRating({
    attributes: previewAttributes,
    personalityTraits: effectiveSliders,
    age: normalizedAge,
    playingStyle: form.playingStyle,
    personalityType: derivedPersonality,
    overallRating: startingRating,
  }), [derivedPersonality, effectiveSliders, form.playingStyle, previewAttributes, normalizedAge, startingRating])

  useEffect(() => {
    if (form.startingLevelId !== selectedStartingLevel.id) {
      setForm((previous) => ({ ...previous, startingLevelId: selectedStartingLevel.id }))
    }
  }, [form.startingLevelId, selectedStartingLevel.id])

  const updateField = <T extends keyof typeof form,>(field: T, value: (typeof form)[T]) => {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  const updateSlider = (label: string, value: number) => {
    setForm((previous) => ({
      ...previous,
      sliders: previous.sliders.map((slider) => {
        if (slider.label !== label) return slider

        const otherTotal = previous.sliders.reduce((sum, item) => item.label === label ? sum : sum + item.value, 0)
        const maxAllowed = Math.min(MAX_SLIDER_VALUE, CREATE_PLAYER_SLIDER_BUDGET - otherTotal)

        return {
          ...slider,
          value: clamp(value, MIN_SLIDER_VALUE, maxAllowed),
        }
      }),
    }))
  }

  const handleRandomise = () => {
    const randomBackground = createPlayerBackgroundCatalog[Math.floor(Math.random() * createPlayerBackgroundCatalog.length)]
    const randomHandedness = Math.random() > 0.2 ? 'Right-handed' : 'Left-handed'
    const randomCueStyle = cueStyles[Math.floor(Math.random() * cueStyles.length)]
    const randomPlayingStyle = playingStyles[Math.floor(Math.random() * playingStyles.length)]
    const randomAge = clamp(Math.round(18 + Math.random() * 10), 17, 28)

    setSelectedBackgroundId(randomBackground.id)
  setPreviewBackgroundId(randomBackground.id)
    setCurrentStep(0)
    setForm((previous) => ({
      ...previous,
      age: String(randomAge),
      handedness: randomHandedness,
      cueStyle: randomCueStyle,
      playingStyle: randomPlayingStyle,
      personalityArchetype: randomBackground.personality,
      startingLevelId: getValidatedStartingLevel(createPlayerStartingLevelCatalog, randomAge).id,
      sliders: buildBudgetedRandomSliders(),
    }))
  }

  const handleConfirm = () => {
    resetCareer({
      fullName: form.fullName,
      nationality: form.nationality,
      age: normalizedAge,
      handedness: form.handedness,
      cueStyle: form.cueStyle,
      playingStyle: form.playingStyle,
      personalityArchetype: selectedBackground.personality,
      sliders: form.sliders,
      backgroundId: selectedBackground.id,
      startingLevelId: selectedStartingLevel.id,
    })
    navigate('/')
  }

  const handleBackgroundContinue = () => {
    setSelectedBackgroundId(previewBackground.id)
    updateField('personalityArchetype', previewBackground.personality)
    setCurrentStep(2)
  }

  const canContinueFromIdentity = form.fullName.trim().length > 1 && form.nationality.trim().length > 1

  const stepActions = (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-scm-border bg-scm-panel/80 px-4 py-4">
      <div className="flex gap-3">
        <ActionButton tone="secondary" icon={<Dice5 className="h-4 w-4" />} onClick={handleRandomise}>Randomise</ActionButton>
        <ActionButton tone="secondary" icon={<ChevronLeft className="h-4 w-4" />} onClick={() => {
          if (currentStep > 0) {
            setCurrentStep((step) => step - 1)
            return
          }

          setSelectedBackgroundId(createPlayerBackgroundCatalog[1]?.id ?? createPlayerBackgroundCatalog[0]?.id ?? '')
          setPreviewBackgroundId(createPlayerBackgroundCatalog[1]?.id ?? createPlayerBackgroundCatalog[0]?.id ?? '')
          setForm({
            fullName: createPlayerIdentitySeed.name,
            nationality: createPlayerIdentitySeed.nationality,
            age: String(createPlayerIdentitySeed.age),
            handedness: createPlayerIdentitySeed.handedness as 'Right-handed' | 'Left-handed',
            cueStyle: createPlayerIdentitySeed.cueStyle,
            playingStyle: createPlayerIdentitySeed.playingStyle,
            personalityArchetype: createPlayerIdentitySeed.personalityArchetype,
            startingLevelId: DEFAULT_STARTING_LEVEL.id,
            sliders: createPlayerSliderCatalog.map((slider) => ({ ...slider })),
          })
        }}>{currentStep > 0 ? 'Back' : 'Reset'}</ActionButton>
      </div>
      <div className="flex gap-3">
        {currentStep < steps.length - 1 ? (
          <ActionButton
            icon={<ChevronRight className="h-4 w-4" />}
            onClick={() => {
              if (currentStep === 1) {
                handleBackgroundContinue()
                return
              }

              setCurrentStep((step) => Math.min(steps.length - 1, step + 1))
            }}
            disabled={!canContinueFromIdentity && currentStep === 0}
          >
            {currentStep === 1 ? `Select ${previewBackground.name} and Continue` : `Continue to ${steps[currentStep + 1].label}`}
          </ActionButton>
        ) : (
          <>
            <ActionButton tone="secondary" icon={<ShieldCheck className="h-4 w-4" />} onClick={handleConfirm}>Confirm Player</ActionButton>
            <ActionButton icon={<ChevronRight className="h-4 w-4" />} onClick={handleConfirm}>Start Career</ActionButton>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Career"
        title="Create Player"
        description="Guide the player through identity, background, temperament, and final confirmation before creating a new locally saved career."
        actions={
          <div className="flex items-center gap-3">
            <ActionButton tone="secondary" icon={<Dice5 className="h-4 w-4" />} onClick={handleRandomise}>
              Randomise
            </ActionButton>
          </div>
        }
      />

      <div className="rounded-2xl border border-scm-border bg-[linear-gradient(135deg,rgba(122,211,75,0.12),rgba(10,19,31,0.9))] px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-scm-green">New Career Journey</p>
            <h2 className="mt-2 text-2xl font-semibold text-scm-text">Make the first hour obvious and rewarding</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-scm-textSoft">Each step is now clickable, the current step is highlighted, and backgrounds can be previewed before they are locked in so the flow feels guided instead of flat.</p>
          </div>
          <div className="rounded-xl border border-scm-border bg-scm-deep/70 px-4 py-3 text-sm text-scm-textSoft">
            <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Current Step</p>
            <p className="mt-1 font-semibold text-scm-text">{currentStep + 1}. {steps[currentStep].label}</p>
            <p className="mt-1">{steps[currentStep].description}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 xl:grid-cols-4">
          {steps.map((step, index) => {
            const active = index === currentStep
            const completed = index < currentStep

            return (
              <button
                key={step.label}
                type="button"
                onClick={() => setCurrentStep(index)}
                className={`rounded-xl border p-4 text-left transition ${active ? 'border-scm-green bg-scm-green/12' : completed ? 'border-emerald-500/30 bg-emerald-500/8' : 'border-scm-border bg-scm-panelSoft/70 hover:border-scm-green/40'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${active ? 'border-scm-green bg-scm-green/15 text-emerald-200' : completed ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200' : 'border-scm-borderStrong bg-scm-deep text-scm-textSoft'}`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-scm-text">{step.label}</p>
                    <p className="text-xs leading-5 text-scm-textMuted">{step.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-6">
          {currentStep === 0 && (
            <SectionCard title="1. Identity" subtitle="Define the player first, including the level where the save begins. Age now gates the junior routes.">
              <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.18em] text-scm-textMuted">Name</p>
                    <input
                      value={form.fullName}
                      onChange={(event) => updateField('fullName', event.target.value)}
                      className="w-full rounded-lg border border-scm-border bg-scm-panelSoft px-4 py-3 text-scm-text outline-none transition focus:border-scm-green/60"
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.18em] text-scm-textMuted">Nationality</p>
                    <input
                      value={form.nationality}
                      onChange={(event) => updateField('nationality', event.target.value)}
                      className="w-full rounded-lg border border-scm-border bg-scm-panelSoft px-4 py-3 text-scm-text outline-none transition focus:border-scm-green/60"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-scm-textMuted">Age</p>
                      <input
                        type="number"
                        min={12}
                        max={80}
                        value={form.age}
                        onChange={(event) => updateField('age', event.target.value)}
                        onBlur={() => updateField('age', String(normalizedAge))}
                        className="w-full rounded-lg border border-scm-border bg-scm-panelSoft px-4 py-3 text-scm-text outline-none transition focus:border-scm-green/60"
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-scm-textMuted">Handedness</p>
                      <select
                        value={form.handedness}
                        onChange={(event) => updateField('handedness', event.target.value as 'Right-handed' | 'Left-handed')}
                        className="w-full rounded-lg border border-scm-border bg-scm-panelSoft px-4 py-3 text-scm-text outline-none transition focus:border-scm-green/60"
                      >
                        <option>Right-handed</option>
                        <option>Left-handed</option>
                      </select>
                    </div>
                  </div>
                  <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-scm-textMuted">Starting Level</p>
                        <p className="mt-2 text-sm text-scm-textSoft">Choose which rung of the pathway this career begins on. Junior routes only stay open while the player is age-eligible.</p>
                      </div>
                      <StatusBadge tone="green">{selectedStartingLevel.name}</StatusBadge>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {createPlayerStartingLevelCatalog.map((level) => {
                        const eligible = isStartingLevelEligible(level, normalizedAge)
                        const selected = level.id === selectedStartingLevel.id

                        return (
                          <button
                            key={level.id}
                            type="button"
                            disabled={!eligible}
                            onClick={() => updateField('startingLevelId', level.id)}
                            className={`rounded-xl border p-4 text-left transition ${selected ? 'border-scm-green bg-scm-green/10' : eligible ? 'border-scm-border bg-scm-deep/50 hover:border-scm-green/35' : 'cursor-not-allowed border-scm-border bg-scm-panel/40 opacity-55'}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-scm-text">{level.name}</p>
                                <p className="mt-2 text-sm text-scm-textSoft">{level.description}</p>
                              </div>
                              {selected && <StatusBadge tone="green">Selected</StatusBadge>}
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-scm-textMuted">
                              <span>Age {level.minAge}-{level.maxAge}</span>
                              <span>•</span>
                              <span>{level.rankingLabel}</span>
                              {!eligible && <><span>•</span><span className="text-rose-300">Age locked</span></>}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    <p className="mt-3 text-xs text-scm-textMuted">Eligible now: {eligibleStartingLevels.map((level) => level.name).join(' / ')}</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-scm-textMuted">Cue Style</p>
                      <select
                        value={form.cueStyle}
                        onChange={(event) => updateField('cueStyle', event.target.value)}
                        className="w-full rounded-lg border border-scm-border bg-scm-panelSoft px-4 py-3 text-scm-text outline-none transition focus:border-scm-green/60"
                      >
                        {cueStyles.map((cueStyle) => (
                          <option key={cueStyle}>{cueStyle}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-scm-textMuted">Playing Style</p>
                      <select
                        value={form.playingStyle}
                        onChange={(event) => updateField('playingStyle', event.target.value)}
                        className="w-full rounded-lg border border-scm-border bg-scm-panelSoft px-4 py-3 text-scm-text outline-none transition focus:border-scm-green/60"
                      >
                        {playingStyles.map((playingStyle) => (
                          <option key={playingStyle}>{playingStyle}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-scm-border bg-scm-panelSoft p-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-scm-green">Style Identity</p>
                    <h3 className="mt-2 text-xl font-semibold text-scm-text">{derivedPersonality}</h3>
                    <p className="mt-2 text-sm text-scm-textSoft">{playingStyleProfile.summary}</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-lg border border-scm-border bg-scm-deep/60 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Temperament</p>
                      <p className="mt-2 text-sm text-scm-text">{playingStyleProfile.temperament}</p>
                    </div>
                    <div className="rounded-lg border border-scm-border bg-scm-deep/60 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Cue Style Edge</p>
                      <p className="mt-2 text-sm text-scm-text">{cueStyleProfile.summary}</p>
                    </div>
                    <div className="rounded-lg border border-scm-border bg-scm-deep/60 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Background Influence</p>
                      <p className="mt-2 text-sm text-scm-text">{selectedBackground.personality}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">What This Style Changes</p>
                    <ul className="mt-3 space-y-2 text-sm text-scm-textSoft">
                      {playingStyleProfile.impactNotes.map((note) => (
                        <li key={note} className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-scm-green" />{note}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">What This Cue Style Changes</p>
                    <ul className="mt-3 space-y-2 text-sm text-scm-textSoft">
                      {cueStyleProfile.impactNotes.map((note) => (
                        <li key={note} className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-scm-gold" />{note}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <SectionCard title="2. Choose Starting Background" subtitle="Click any background to preview its funds, bonuses, weaknesses, and difficulty before you commit to it.">
                <div className="space-y-3">
                  {createPlayerBackgroundCatalog.map((background) => {
                    const previewed = background.id === previewBackground.id
                    const selected = background.id === selectedBackground.id
                    return (
                      <button
                        key={background.id}
                        type="button"
                        onClick={() => setPreviewBackgroundId(background.id)}
                        className={`w-full rounded-xl border p-4 text-left transition ${previewed ? 'border-scm-green bg-scm-green/10' : selected ? 'border-scm-gold/40 bg-scm-gold/10' : 'border-scm-border bg-scm-panelSoft hover:border-scm-green/35'}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <p className="font-semibold text-scm-text">{background.name}</p>
                              <StatusBadge tone={background.difficulty === 'Easy' ? 'green' : background.difficulty === 'Medium' ? 'amber' : 'red'}>{background.difficulty}</StatusBadge>
                              {selected && <StatusBadge tone="gold">Selected</StatusBadge>}
                              {previewed && <StatusBadge tone="green">Previewing</StatusBadge>}
                            </div>
                            <p className="mt-2 text-sm text-scm-textSoft">{background.description}</p>
                            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-scm-textMuted">Click to inspect this start in the summary below</p>
                          </div>
                          <div className={`h-6 w-6 rounded-full border ${previewed ? 'border-scm-green bg-scm-green' : selected ? 'border-scm-gold bg-scm-gold' : 'border-scm-borderStrong bg-transparent'}`} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </SectionCard>

              <SectionCard title={`Background Summary - ${previewBackground.name}`} subtitle="Review how this opening changes the start of the save before deciding whether to lock it in.">
                <div className="grid gap-5 xl:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-scm-green">Starting Bonuses</p>
                    <div className="mt-3 space-y-2 text-sm">
                      {previewBackground.bonuses.map((bonus) => (
                        <div key={bonus.label} className="flex items-center justify-between text-scm-textSoft">
                          <span>{bonus.label}</span>
                          <span className="text-emerald-300">+{bonus.value}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-5 text-xs uppercase tracking-[0.18em] text-scm-red">Starting Weaknesses</p>
                    <div className="mt-3 space-y-2 text-sm">
                      {previewBackground.weaknesses.map((weakness) => (
                        <div key={weakness.label} className="flex items-center justify-between text-scm-textSoft">
                          <span>{weakness.label}</span>
                          <span className="text-rose-300">{weakness.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-scm-gold">Attribute Effect Preview</p>
                    <div className="mt-3 space-y-3">
                      {attributePreview.slice(0, 6).map((attribute, index) => (
                        <AttributeBar
                          key={attribute.label}
                          label={attribute.label}
                          value={attribute.value}
                          trend={index % 3 === 2 ? -2 : 2}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4 rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Starting Funds</p>
                      <p className="mt-1 text-2xl font-semibold text-scm-gold">{formatMoney(previewBackground.funds)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Background Personality</p>
                      <p className="mt-1 text-scm-text">{previewBackground.personality}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Starting Level</p>
                      <p className="mt-1 text-scm-text">{selectedStartingLevel.name}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Career Difficulty</p>
                      <div className="mt-3">
                        <ProgressBar value={previewBackground.difficulty === 'Easy' ? 35 : previewBackground.difficulty === 'Medium' ? 60 : 84} tone={previewBackground.difficulty === 'Easy' ? 'green' : previewBackground.difficulty === 'Medium' ? 'amber' : 'red'} />
                      </div>
                      <p className="mt-2 text-sm text-scm-textSoft">{previewBackground.difficulty}</p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <SectionCard title="3. Temperament & Attributes" subtitle="Temperament sliders are still editable, but playing style now pushes the final values shown below.">
                <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
                  <div className="space-y-4">
                    <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-scm-green">Temperament Budget</p>
                          <p className="mt-2 text-sm text-scm-textSoft">You cannot max every temperament slider. Raising one area means sacrificing points somewhere else.</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Points Remaining</p>
                          <p className={`mt-1 text-2xl font-semibold ${sliderPointsRemaining === 0 ? 'text-scm-gold' : 'text-scm-text'}`}>{sliderPointsRemaining}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <ProgressBar value={Math.round((sliderPointsUsed / CREATE_PLAYER_SLIDER_BUDGET) * 100)} tone="green" />
                      </div>
                    </div>
                    {form.sliders.map((slider) => {
                      const finalSlider = effectiveSliders.find((entry) => entry.label === slider.label) ?? slider
                      const styleDelta = getPlayingStyleSliderDelta(form.playingStyle, slider.label)
                      const deltaLabel = styleDelta === 0 ? 'No style shift' : styleDelta > 0 ? `Style +${styleDelta}` : `Style ${styleDelta}`

                      return (
                        <div key={slider.label} className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-scm-textSoft">{slider.label}</span>
                            <span className="text-scm-text">Final {finalSlider.value}</span>
                          </div>
                          <input
                            type="range"
                            min={20}
                            max={90}
                            value={slider.value}
                            onChange={(event) => updateSlider(slider.label, Number(event.target.value))}
                            className="w-full accent-[#7ad34b]"
                          />
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <div>
                              <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Base slider</p>
                              <p className="mt-1 text-sm text-scm-text">{slider.value}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Style impact</p>
                              <p className="mt-1 text-sm text-scm-text">{deltaLabel}</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <ProgressBar value={finalSlider.value} tone="green" />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="space-y-4 rounded-xl border border-scm-border bg-scm-panelSoft p-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-scm-green">Final Personality Blend</p>
                      <h3 className="mt-2 text-xl font-semibold text-scm-text">{derivedPersonality}</h3>
                      <p className="mt-2 text-sm text-scm-textSoft">{playingStyleProfile.temperament}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-scm-gold">Starting Attribute Projection</p>
                      <div className="mt-3 space-y-3">
                        {attributePreview.slice(0, 8).map((attribute) => (
                          <AttributeBar key={attribute.label} label={attribute.label} value={attribute.value} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <SectionCard title="4. Confirm New Career" subtitle="Review the final build of the player before overwriting the current local save.">
                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="space-y-4 rounded-xl border border-scm-border bg-scm-panelSoft p-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Identity</p>
                      <h3 className="mt-2 text-2xl font-semibold text-scm-text">{form.fullName}</h3>
                      <p className="mt-2 text-sm text-scm-textSoft">{form.nationality} · Age {normalizedAge} · {form.handedness}</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Cue Style</p>
                        <p className="mt-1 text-scm-text">{form.cueStyle}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Playing Style</p>
                        <p className="mt-1 text-scm-text">{form.playingStyle}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Final Personality</p>
                        <p className="mt-1 text-scm-text">{derivedPersonality}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Background</p>
                        <p className="mt-1 text-scm-text">{selectedBackground.name}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Starting Level</p>
                        <p className="mt-1 text-scm-text">{selectedStartingLevel.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-xl border border-scm-border bg-scm-panelSoft p-5">
                    <div className="grid gap-4 md:grid-cols-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Starting Rating</p>
                        <p className="mt-1 text-2xl font-semibold text-scm-text">{startingRating}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Potential</p>
                        <p className="mt-1 text-2xl font-semibold text-scm-green">{startingPotential}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Funds</p>
                        <p className="mt-1 text-2xl font-semibold text-scm-gold">{formatMoney(selectedBackground.funds)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Difficulty</p>
                        <p className="mt-1 text-2xl font-semibold text-scm-text">{selectedBackground.difficulty}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-scm-green">Why This Start Works</p>
                      <ul className="mt-3 space-y-2 text-sm text-scm-textSoft">
                        <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-scm-green" />Playing style now feeds the final temperament sliders and saved personality blend.</li>
                        <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-scm-green" />Background still changes starting funds, bonuses, weaknesses, and difficulty.</li>
                        <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-scm-green" />The save now begins on the chosen pathway rung, with junior starts limited by age.</li>
                        <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-scm-green" />The created save will immediately unlock training, tournaments, travel, sponsors, and season progression.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {stepActions}
        </div>

        <SectionCard title="Player Preview" subtitle="This panel reflects the live career setup you are about to save.">
          <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
            <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
              <div className="flex h-[210px] items-center justify-center rounded-xl border border-scm-borderStrong bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_55%),linear-gradient(180deg,#101d2c,#0b1421)]">
                <UserRound className="h-24 w-24 text-scm-textMuted" />
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-scm-text">{form.fullName}</h2>
                <p className="mt-2 text-sm text-scm-textSoft">{form.nationality}</p>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-scm-textSoft">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Age</p>
                    <p className="mt-1 text-scm-text">{normalizedAge}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Handedness</p>
                    <p className="mt-1 text-scm-text">{form.handedness}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Cue Style</p>
                    <p className="mt-1 text-scm-text">{form.cueStyle}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Playing Style</p>
                    <p className="mt-1 text-scm-text">{form.playingStyle}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Final Personality</p>
                    <p className="mt-1 text-scm-text">{derivedPersonality}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Background</p>
                    <p className="mt-1 text-scm-text">{selectedBackground.name}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Starting Level</p>
                    <p className="mt-1 text-scm-text">{selectedStartingLevel.name}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[140px_1fr]">
              <div className="flex items-center justify-center">
                <CircularMeter value={startingRating} label="Starting" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone="gold">Prospect</StatusBadge>
                  <span className="text-sm text-scm-textMuted">Overall starting profile</span>
                </div>
                <div className="mt-4 space-y-3">
                  {attributePreview.map((attribute) => (
                    <AttributeBar key={attribute.label} label={attribute.label} value={attribute.value} />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-scm-border bg-scm-deep/60 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Potential</p>
                <p className="mt-2 text-xl font-semibold text-scm-green">{startingPotential}</p>
              </div>
              <div className="rounded-xl border border-scm-border bg-scm-deep/60 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Starting Funds</p>
                <p className="mt-2 text-xl font-semibold text-scm-gold">{formatMoney(selectedBackground.funds)}</p>
              </div>
              <div className="rounded-xl border border-scm-border bg-scm-deep/60 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Current Journey Step</p>
                <p className="mt-2 text-xl font-semibold text-scm-text">{currentStep + 1}. {steps[currentStep].label}</p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3 text-sm text-scm-textSoft">
        Active save: <span className="text-scm-text">{gameState.player.fullName}</span>. Creating a new career overwrites the current local save state.
      </div>
    </div>
  )
}