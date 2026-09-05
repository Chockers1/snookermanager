import { useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Dice5, ShieldCheck, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/useGame'
import {
  createPlayerBackgroundCatalog,
  createPlayerIdentitySeed,
  createPlayerSliderCatalog,
  createPlayerStartingLevelCatalog,
  starterAttributes,
} from '../data/catalogs'
import { nationalityOptions } from '../data/nationalities'
import { formatMoney } from '../utils/formatters'
import {
  applyPlayingStyleToSliders,
  buildAttributeSnapshots,
  buildCareerPersonality,
  buildNewCareerAttributes,
  getCueStyleProfile,
  getEligibleStartingLevels,
  getPlayingStyleProfile,
  getPlayingStyleSliderDelta,
  getValidatedStartingLevel,
  isStartingLevelEligible,
} from '../utils/newCareerConfig'
import { calculateOverallRating, calculatePotentialRating } from '../utils/calculations'

const steps = ['Identity', 'Background', 'Attributes', 'Confirm'] as const
const cueStyles = ['Traditional', 'Touch Focus', 'Power Delivery', 'Compact Rhythm']
const playingStyles = ['Balanced', 'Measured Break Builder', 'Attacking Scorer', 'Safety First']
const careerStartDate = '2026-05-11'
const earliestDateOfBirth = '1945-05-12'
const latestDateOfBirth = '2014-05-11'
const minSliderValue = 20
const maxSliderValue = 90
const sliderBudget = createPlayerSliderCatalog.reduce((sum, slider) => sum + slider.value, 0)
const defaultStartingLevel = getValidatedStartingLevel(createPlayerStartingLevelCatalog, createPlayerIdentitySeed.age)
const previewLabels = ['Long Potting', 'Cue Ball Control', 'Safety Play', 'Break Building', 'Composure', 'Focus', 'Stamina', 'Consistency']

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function dateOfBirthForAge(age: number) {
  return `${2026 - age}-01-01`
}

function getAgeAtCareerStart(dateOfBirth: string) {
  const birthDate = new Date(`${dateOfBirth}T00:00:00Z`)
  const startDate = new Date(`${careerStartDate}T00:00:00Z`)
  if (Number.isNaN(birthDate.getTime())) return createPlayerIdentitySeed.age
  let age = startDate.getUTCFullYear() - birthDate.getUTCFullYear()
  const birthdayHasPassed =
    startDate.getUTCMonth() > birthDate.getUTCMonth() ||
    (startDate.getUTCMonth() === birthDate.getUTCMonth() &&
      startDate.getUTCDate() >= birthDate.getUTCDate())
  if (!birthdayHasPassed) age -= 1
  return clamp(age, 12, 80)
}

function buildBudgetedRandomSliders() {
  const sliderCount = createPlayerSliderCatalog.length
  const baseTotal = sliderCount * minSliderValue
  const remainingBudget = Math.max(0, sliderBudget - baseTotal)
  const weights = createPlayerSliderCatalog.map(() => Math.random() + 0.2)
  const totalWeight = weights.reduce((sum, value) => sum + value, 0)
  const rawValues = weights.map((weight) => minSliderValue + Math.round((weight / totalWeight) * remainingBudget))
  const sliders = createPlayerSliderCatalog.map((slider, index) => ({ ...slider, value: clamp(rawValues[index], minSliderValue, maxSliderValue) }))
  let difference = sliderBudget - sliders.reduce((sum, slider) => sum + slider.value, 0)
  let guard = 0

  while (difference !== 0 && guard < 500) {
    guard += 1
    const direction = difference > 0 ? 1 : -1
    const adjustable = sliders.find((slider) => direction > 0 ? slider.value < maxSliderValue : slider.value > minSliderValue)
    if (!adjustable) break
    adjustable.value += direction
    difference -= direction
  }

  return sliders
}

function difficultyClass(difficulty: string) {
  if (difficulty === 'Easy') return 'bg-green-600/20 text-green-400'
  if (difficulty === 'Medium') return 'bg-amber-600/20 text-amber-400'
  return 'bg-red-600/20 text-red-400'
}

export function NewCareerPage() {
  const { resetCareer } = useGame()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [creationError, setCreationError] = useState<string | null>(null)
  const [form, setForm] = useState({
    fullName: createPlayerIdentitySeed.name,
    nationality: createPlayerIdentitySeed.nationality,
    dateOfBirth: dateOfBirthForAge(createPlayerIdentitySeed.age),
    handedness: createPlayerIdentitySeed.handedness as 'Right-handed' | 'Left-handed',
    cueStyle: createPlayerIdentitySeed.cueStyle,
    playingStyle: createPlayerIdentitySeed.playingStyle,
    personalityArchetype: createPlayerIdentitySeed.personalityArchetype,
    startingLevelId: defaultStartingLevel.id,
    sliders: createPlayerSliderCatalog.map((slider) => ({ ...slider })),
  })
  const [selectedBackgroundId, setSelectedBackgroundId] = useState(createPlayerBackgroundCatalog[1]?.id ?? createPlayerBackgroundCatalog[0]?.id ?? '')
  const [previewBackgroundId, setPreviewBackgroundId] = useState(createPlayerBackgroundCatalog[1]?.id ?? createPlayerBackgroundCatalog[0]?.id ?? '')
  const normalizedAge = useMemo(() => getAgeAtCareerStart(form.dateOfBirth), [form.dateOfBirth])
  const selectedBackground = createPlayerBackgroundCatalog.find((background) => background.id === selectedBackgroundId) ?? createPlayerBackgroundCatalog[0]
  const previewBackground = createPlayerBackgroundCatalog.find((background) => background.id === previewBackgroundId) ?? selectedBackground
  const eligibleStartingLevels = useMemo(() => getEligibleStartingLevels(createPlayerStartingLevelCatalog, normalizedAge), [normalizedAge])
  const selectedStartingLevel = useMemo(() => getValidatedStartingLevel(createPlayerStartingLevelCatalog, normalizedAge, form.startingLevelId), [form.startingLevelId, normalizedAge])
  const activeBackground = currentStep === 1 ? previewBackground : selectedBackground
  const cueStyleProfile = useMemo(() => getCueStyleProfile(form.cueStyle), [form.cueStyle])
  const playingStyleProfile = useMemo(() => getPlayingStyleProfile(form.playingStyle), [form.playingStyle])
  const effectiveSliders = useMemo(() => applyPlayingStyleToSliders(form.sliders, form.playingStyle), [form.playingStyle, form.sliders])
  const derivedPersonality = useMemo(() => buildCareerPersonality(activeBackground.personality, form.playingStyle), [activeBackground.personality, form.playingStyle])
  const sliderPointsUsed = form.sliders.reduce((sum, slider) => sum + slider.value, 0)
  const sliderPointsRemaining = sliderBudget - sliderPointsUsed
  const previewAttributes = useMemo(() => buildNewCareerAttributes({ starterAttributes, background: activeBackground, startingLevel: selectedStartingLevel, age: normalizedAge, sliders: form.sliders, cueStyle: form.cueStyle, playingStyle: form.playingStyle }), [activeBackground, form.cueStyle, form.playingStyle, form.sliders, normalizedAge, selectedStartingLevel])
  const attributePreview = useMemo(() => buildAttributeSnapshots(previewAttributes, previewLabels), [previewAttributes])
  const startingRating = useMemo(() => calculateOverallRating({ attributes: previewAttributes, personalityTraits: effectiveSliders, playingStyle: form.playingStyle }), [effectiveSliders, form.playingStyle, previewAttributes])
  const startingPotential = useMemo(() => calculatePotentialRating({ attributes: previewAttributes, personalityTraits: effectiveSliders, age: normalizedAge, playingStyle: form.playingStyle, personalityType: derivedPersonality, overallRating: startingRating }), [derivedPersonality, effectiveSliders, form.playingStyle, normalizedAge, previewAttributes, startingRating])
  const canContinueFromIdentity = form.fullName.trim().length > 1 && form.nationality.trim().length > 1 && form.dateOfBirth.length === 10

  const updateField = <T extends keyof typeof form,>(field: T, value: (typeof form)[T]) => setForm((previous) => ({ ...previous, [field]: value }))

  function updateSlider(label: string, value: number) {
    setForm((previous) => ({
      ...previous,
      sliders: previous.sliders.map((slider) => {
        if (slider.label !== label) return slider
        const otherTotal = previous.sliders.reduce((sum, item) => item.label === label ? sum : sum + item.value, 0)
        const maxAllowed = Math.min(maxSliderValue, sliderBudget - otherTotal)
        return { ...slider, value: clamp(value, minSliderValue, maxAllowed) }
      }),
    }))
  }

  function handleRandomise() {
    const randomBackground = createPlayerBackgroundCatalog[Math.floor(Math.random() * createPlayerBackgroundCatalog.length)]
    const randomAge = clamp(Math.round(18 + Math.random() * 10), 17, 28)
    setSelectedBackgroundId(randomBackground.id)
    setPreviewBackgroundId(randomBackground.id)
    setCurrentStep(0)
    setForm((previous) => ({
      ...previous,
      dateOfBirth: dateOfBirthForAge(randomAge),
      handedness: Math.random() > 0.2 ? 'Right-handed' : 'Left-handed',
      cueStyle: cueStyles[Math.floor(Math.random() * cueStyles.length)],
      playingStyle: playingStyles[Math.floor(Math.random() * playingStyles.length)],
      personalityArchetype: randomBackground.personality,
      startingLevelId: getValidatedStartingLevel(createPlayerStartingLevelCatalog, randomAge).id,
      sliders: buildBudgetedRandomSliders(),
    }))
  }

  async function handleConfirm() {
    if (isCreating) return
    if (!canContinueFromIdentity) {
      setCreationError('Enter a player name, nationality and date of birth before starting your career.')
      setCurrentStep(0)
      return
    }
    setCreationError(null)
    setIsCreating(true)
    // Give the browser a chance to paint feedback before building the world.
    await new Promise(resolve => setTimeout(resolve, 0))
    try {
      resetCareer({
      fullName: form.fullName,
      nationality: form.nationality,
      age: normalizedAge,
      dateOfBirth: form.dateOfBirth,
      handedness: form.handedness,
      cueStyle: form.cueStyle,
      playingStyle: form.playingStyle,
      personalityArchetype: selectedBackground.personality,
      sliders: form.sliders,
      backgroundId: selectedBackground.id,
      startingLevelId: selectedStartingLevel.id,
    })
      navigate('/')
    } catch (error) {
      setCreationError(error instanceof Error ? error.message : 'Career creation failed. Your player setup is still here; please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  function resetForm() {
    setSelectedBackgroundId(createPlayerBackgroundCatalog[1]?.id ?? createPlayerBackgroundCatalog[0]?.id ?? '')
    setPreviewBackgroundId(createPlayerBackgroundCatalog[1]?.id ?? createPlayerBackgroundCatalog[0]?.id ?? '')
    setForm({
      fullName: createPlayerIdentitySeed.name,
      nationality: createPlayerIdentitySeed.nationality,
      dateOfBirth: dateOfBirthForAge(createPlayerIdentitySeed.age),
      handedness: createPlayerIdentitySeed.handedness as 'Right-handed' | 'Left-handed',
      cueStyle: createPlayerIdentitySeed.cueStyle,
      playingStyle: createPlayerIdentitySeed.playingStyle,
      personalityArchetype: createPlayerIdentitySeed.personalityArchetype,
      startingLevelId: defaultStartingLevel.id,
      sliders: createPlayerSliderCatalog.map((slider) => ({ ...slider })),
    })
  }

  function continueStep() {
    if (currentStep === 1) {
      setSelectedBackgroundId(previewBackground.id)
      updateField('personalityArchetype', previewBackground.personality)
    }
    setCurrentStep((step) => Math.min(steps.length - 1, step + 1))
  }

  return (
    <div className="flex min-h-screen min-w-0 flex-col gap-3 bg-background p-3 sm:p-4 xl:h-screen xl:gap-2 xl:overflow-hidden xl:p-1.5">
      <div className="rounded-xl border border-border bg-surface/85 px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">Career</p>
            <h1 className="mt-1 text-2xl font-bold leading-tight text-white">Create Player</h1>
            <p className="mt-1 truncate text-xs text-gray-400">Set up identity, background, temperament, and the starting profile for a new local career.</p>
          </div>
          <button type="button" className="btn-secondary shrink-0 px-3 py-2 text-xs" onClick={handleRandomise}><Dice5 className="h-3.5 w-3.5" /> Randomise</button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface/70 px-3 py-2.5">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-thin">
          {steps.map((step, index) => (
            <button key={step} type="button" onClick={() => setCurrentStep(index)} className="flex shrink-0 items-center gap-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${index === currentStep ? 'bg-green-600 text-white' : index < currentStep ? 'bg-green-600/20 text-green-400' : 'bg-surface text-gray-500'}`}>
                {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span className={index === currentStep ? 'text-sm font-medium text-white' : 'text-sm text-gray-500'}>{step}</span>
              {index < steps.length - 1 ? <span className="h-px w-8 bg-border" /> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-12 xl:gap-2">
        <div className="min-h-0 xl:col-span-5">
          {currentStep === 0 ? (
            <div className="card min-h-0 flex h-full flex-col overflow-hidden">
              <div className="card-header px-3 py-2"><h2 className="text-sm font-semibold uppercase tracking-wider text-white">1. Identity</h2><span className="text-[10px] text-gray-500">Starting setup</span></div>
              <div className="card-body min-h-0 flex-1 overflow-auto px-3 py-3 scrollbar-thin">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="mb-1 block text-xs text-gray-400">Name</label><input value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-white outline-none focus:border-green-500" /></div>
                  <div><label className="mb-1 block text-xs text-gray-400" htmlFor="career-nationality">Nationality</label><select id="career-nationality" value={form.nationality} onChange={(event) => updateField('nationality', event.target.value)} className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-white outline-none focus:border-green-500">{nationalityOptions.map((nationality) => <option key={nationality} value={nationality}>{nationality}</option>)}</select></div>
                  <div><label className="mb-1 block text-xs text-gray-400" htmlFor="career-date-of-birth">Date of Birth</label><input id="career-date-of-birth" type="date" min={earliestDateOfBirth} max={latestDateOfBirth} value={form.dateOfBirth} onChange={(event) => updateField('dateOfBirth', event.target.value)} className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-white outline-none focus:border-green-500" /><p className="mt-1 text-[10px] text-gray-500">Age {normalizedAge} when the career starts on 11 May 2026</p></div>
                  <div><label className="mb-1 block text-xs text-gray-400">Handedness</label><select value={form.handedness} onChange={(event) => updateField('handedness', event.target.value as 'Right-handed' | 'Left-handed')} className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-white outline-none focus:border-green-500"><option>Right-handed</option><option>Left-handed</option></select></div>
                  <div><label className="mb-1 block text-xs text-gray-400">Cue Style</label><select value={form.cueStyle} onChange={(event) => updateField('cueStyle', event.target.value)} className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-white outline-none focus:border-green-500">{cueStyles.map((style) => <option key={style}>{style}</option>)}</select></div>
                  <div><label className="mb-1 block text-xs text-gray-400">Playing Style</label><select value={form.playingStyle} onChange={(event) => updateField('playingStyle', event.target.value)} className="w-full rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-white outline-none focus:border-green-500">{playingStyles.map((style) => <option key={style}>{style}</option>)}</select></div>
                </div>
                <div className="mt-3">
                  <p className="mb-2 text-xs text-gray-400">Starting Level</p>
                  <div className="grid grid-cols-2 gap-2">
                    {createPlayerStartingLevelCatalog.map((level) => {
                      const eligible = isStartingLevelEligible(level, normalizedAge)
                      const selected = level.id === selectedStartingLevel.id

                      return <button key={level.id} type="button" disabled={!eligible} onClick={() => updateField('startingLevelId', level.id)} className={`rounded-lg border p-2.5 text-left text-xs ${selected ? 'border-green-600/40 bg-green-600/10' : eligible ? 'border-border bg-surface-light/50 hover:border-green-600/30' : 'cursor-not-allowed border-border bg-surface-light/20 opacity-50'}`}><div className="flex justify-between gap-2"><span className="font-semibold text-white">{level.name}</span><span className="shrink-0 text-gray-500">Age {level.minAge}-{level.maxAge}</span></div><p className="mt-1 text-gray-400">{level.rankingLabel}</p></button>
                    })}
                  </div>
                  <p className="mt-2 text-[10px] text-gray-500">Eligible now: {eligibleStartingLevels.map((level) => level.name).join(' / ')}</p>
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 1 ? (
            <div className="card min-h-0 flex h-full flex-col overflow-hidden">
              <div className="card-header px-3 py-2"><h2 className="text-sm font-semibold uppercase tracking-wider text-white">2. Background</h2><span className="text-[10px] text-gray-500">Choose a starting route</span></div>
              <div className="card-body min-h-0 flex-1 space-y-2 overflow-auto px-3 py-3 scrollbar-thin">
                {createPlayerBackgroundCatalog.map((background) => <button key={background.id} type="button" onClick={() => setPreviewBackgroundId(background.id)} className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${previewBackground.id === background.id ? 'border-green-500 bg-green-600/5' : 'border-transparent bg-surface-light/50 hover:border-border-light'}`}><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-light"><ShieldCheck className="h-4 w-4 text-green-400" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-white">{background.name}</span><span className={`rounded px-1.5 py-0.5 text-[10px] ${difficultyClass(background.difficulty)}`}>Difficulty: {background.difficulty}</span>{selectedBackground.id === background.id ? <span className="rounded bg-amber-600/20 px-1.5 py-0.5 text-[10px] text-amber-400">Selected</span> : null}</div><p className="mt-0.5 text-xs text-gray-400">{background.description}</p></div>{previewBackground.id === background.id ? <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600"><Check className="h-3 w-3 text-white" /></div> : null}</button>)}
              </div>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="card min-h-0 flex h-full flex-col overflow-hidden">
              <div className="card-header px-3 py-2"><h2 className="text-sm font-semibold uppercase tracking-wider text-white">3. Attributes</h2><span className={sliderPointsRemaining === 0 ? 'text-[10px] text-green-400' : 'text-[10px] text-amber-400'}>{sliderPointsRemaining} pts left</span></div>
              <div className="card-body min-h-0 flex-1 overflow-auto px-3 py-3 scrollbar-thin">
                <ProgressBar value={Math.round((sliderPointsUsed / sliderBudget) * 100)} compact />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {form.sliders.map((slider) => {
                    const finalSlider = effectiveSliders.find((entry) => entry.label === slider.label) ?? slider
                    const styleDelta = getPlayingStyleSliderDelta(form.playingStyle, slider.label)

                    return <div key={slider.label} className="rounded-lg bg-surface-light/50 p-2.5"><div className="mb-1.5 flex items-center justify-between text-xs"><span className="text-gray-300">{slider.label}</span><span className="text-white">Final {finalSlider.value}</span></div><input type="range" min={20} max={90} value={slider.value} onChange={(event) => updateSlider(slider.label, Number(event.target.value))} className="w-full accent-green-500" /><div className="mt-1.5 flex justify-between text-[10px] text-gray-500"><span>Base {slider.value}</span><span>{styleDelta === 0 ? 'No style shift' : styleDelta > 0 ? `Style +${styleDelta}` : `Style ${styleDelta}`}</span></div><div className="mt-1.5"><ProgressBar value={finalSlider.value} compact /></div></div>
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="card min-h-0 flex h-full flex-col overflow-hidden">
              <div className="card-header px-3 py-2"><h2 className="text-sm font-semibold uppercase tracking-wider text-white">4. Confirm</h2><span className="text-[10px] text-gray-500">Ready to start</span></div>
              <div className="card-body min-h-0 flex-1 overflow-auto px-3 py-3 scrollbar-thin">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {[['Name', form.fullName], ['Nationality', form.nationality], ['Date of Birth', form.dateOfBirth], ['Starting Age', String(normalizedAge)], ['Handedness', form.handedness], ['Background', selectedBackground.name], ['Starting Level', selectedStartingLevel.name], ['Starting Overall', `${startingRating} / 100`], ['Potential', `${startingPotential} / 100`], ['Starting Funds', formatMoney(selectedBackground.funds)]].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 rounded-lg bg-surface-light/35 px-3 py-2"><span className="text-gray-400">{label}</span><span className="text-right text-white">{value}</span></div>)}
                </div>
                <p className="mt-3 text-xs text-green-300">This career will be saved in its own autosaving slot. Your other careers remain available from Load Career.</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="min-h-0 xl:col-span-7">
          <div className="card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header px-3 py-2"><h3 className="text-sm font-semibold uppercase text-gray-500">Player Preview</h3><span className="text-[10px] text-gray-500">Live projection</span></div>
            <div className="card-body flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-3 py-3">
              <div className="rounded-xl border border-border bg-surface-light/35 px-4 py-3">
                <div className="grid gap-3 sm:grid-cols-[112px_1fr_auto] sm:gap-4">
                  <div className="flex h-28 w-24 items-center justify-center rounded-xl bg-surface-light"><UserRound className="h-10 w-10 text-gray-600" /></div>
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-bold text-white">{form.fullName}</h2>
                    <p className="mt-0.5 text-sm text-gray-400">{form.nationality}</p>
                    <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3 sm:gap-3">
                      <div><span className="text-gray-500">Age</span><p className="text-white">{normalizedAge}</p></div>
                      <div><span className="text-gray-500">Handedness</span><p className="text-white">{form.handedness}</p></div>
                      <div><span className="text-gray-500">Cue Style</span><p className="text-white">{form.cueStyle}</p></div>
                      <div><span className="text-gray-500">Playing Style</span><p className="text-white">{form.playingStyle}</p></div>
                      <div><span className="text-gray-500">Personality</span><p className="text-white">{derivedPersonality}</p></div>
                      <div><span className="text-gray-500">Background</span><p className="text-white">{activeBackground.name}</p></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-green-600/30"><div><p className="text-2xl font-bold text-white">{startingRating}</p><p className="text-[9px] text-gray-500">/100</p></div></div>
                    <p className="mt-1 text-[10px] text-gray-400">PROSPECT</p>
                  </div>
                </div>
              </div>

              <div className="grid min-h-0 flex-1 gap-3 sm:grid-cols-[0.95fr_1.05fr] sm:overflow-hidden">
                <div className="grid min-h-0 grid-rows-[0.56fr_0.44fr] gap-3">
                  <div className="rounded-xl border border-border bg-surface-light/35 px-3 py-3">
                    <h4 className="mb-2 text-xs font-semibold uppercase text-gray-500">Background Summary - {activeBackground.name}</h4>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                      <div>
                        <p className="mb-1 text-[10px] text-gray-500">Starting Bonuses</p>
                        <div className="space-y-1">{activeBackground.bonuses.map((bonus) => <p key={bonus.label} className="text-xs text-green-400">+{bonus.label} {bonus.value}</p>)}</div>
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] text-gray-500">Starting Weaknesses</p>
                        <div className="space-y-1">{activeBackground.weaknesses.map((weakness) => <p key={weakness.label} className="text-xs text-red-400">{weakness.label} {weakness.value}</p>)}</div>
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] text-gray-500">Start Pack</p>
                        <p className="text-lg font-bold text-white">{formatMoney(activeBackground.funds)}</p>
                        <p className={`mt-2 inline-flex rounded px-1.5 py-0.5 text-[10px] ${difficultyClass(activeBackground.difficulty)}`}>{activeBackground.difficulty}</p>
                        <p className="mt-2 text-[10px] text-gray-400">{selectedStartingLevel.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-surface-light/35 px-3 py-3">
                    <h4 className="mb-2 text-xs font-semibold uppercase text-gray-500">Style Notes</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
                      <div><p className="font-semibold text-white">{playingStyleProfile.summary}</p><p className="mt-2">{playingStyleProfile.temperament}</p></div>
                      <div><p className="font-semibold text-white">{cueStyleProfile.summary}</p><p className="mt-2">Potential {startingPotential} with {selectedStartingLevel.name} start.</p></div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface-light/35 px-3 py-3">
                  <h4 className="mb-2 text-xs font-semibold uppercase text-gray-500">Attribute Projection</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {attributePreview.map((attribute) => <div key={attribute.label}><div className="mb-1 flex justify-between text-xs"><span className="text-gray-400">{attribute.label}</span><span className="text-white">{attribute.value}</span></div><ProgressBar value={attribute.value} compact /></div>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {creationError && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{creationError}</p>}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-light/40 px-3 py-2.5">
        <div className="text-xs text-gray-500">New save: <span className="text-white">{form.fullName.trim() || 'Unnamed career'}</span> <span className="text-green-400">· separate autosave</span></div>
        <div className="flex gap-2"><button type="button" disabled={isCreating} className="btn-secondary px-3 py-2 text-xs" onClick={() => { if (currentStep > 0) setCurrentStep((step) => step - 1); else resetForm() }}><ChevronLeft className="h-3.5 w-3.5" /> {currentStep > 0 ? 'Back' : 'Reset'}</button>{currentStep < steps.length - 1 ? <button type="button" className="btn-primary px-3 py-2 text-xs" disabled={currentStep === 0 && !canContinueFromIdentity} onClick={continueStep}>Continue <ChevronRight className="h-3.5 w-3.5" /></button> : <button type="button" className="btn-primary px-3 py-2 text-xs" disabled={isCreating} onClick={handleConfirm}>{isCreating ? 'Creating Career…' : 'Start Career'} <ChevronRight className="h-3.5 w-3.5" /></button>}</div>
      </div>
    </div>
  )
}
