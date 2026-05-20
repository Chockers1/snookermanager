import { useState } from 'react';
import { ChevronRight, ChevronLeft, User, Globe, Dumbbell, Check } from 'lucide-react';
import ProgressBar from '../components/ui/ProgressBar';

const steps = ['Identity', 'Background', 'Attributes', 'Confirm'];

const backgrounds = [
  { id: 'club', name: 'Club Junior', desc: 'Honed your skills in local club competition.', difficulty: 'Easy', bonuses: ['+Cue Ball Control +8', '+Break Building +6', '+Focus +6'] },
  { id: 'academy', name: 'Academy Prospect', desc: 'Trained in a structured academy environment.', difficulty: 'Easy', bonuses: ['+Cue Ball Control +8', '+Break Building +8', '+Focus +6'] },
  { id: 'family', name: 'Family-Funded Talent', desc: 'Backed by your family\'s investment.', difficulty: 'Medium', bonuses: ['+Long Potting +6', '+Composure +4', '+Stamina +4'] },
  { id: 'grinder', name: 'Working-Class Grinder', desc: 'Earned your chance through hard work.', difficulty: 'Hard', bonuses: ['+Fighting Spirit +8', '+Resilience +6', '+Stamina +6'] },
  { id: 'prodigy', name: 'Overseas Prodigy', desc: 'Moved abroad to chase your dream.', difficulty: 'Hard', bonuses: ['+Long Potting +8', '+Temperament +4', '+Focus +4'] },
];

const startingAttributes = [
  { name: 'Long Potting', value: 56 },
  { name: 'Cue Ball Control', value: 58 },
  { name: 'Safety Play', value: 52 },
  { name: 'Break Building', value: 54 },
  { name: 'Composure', value: 61 },
  { name: 'Focus', value: 59 },
  { name: 'Stamina', value: 55 },
  { name: 'Consistency', value: 57 },
];

export default function NewCareer() {
  const [currentStep, setCurrentStep] = useState(0);
  const [playerName, setPlayerName] = useState('Alex Carter');
  const [nationality, setNationality] = useState('England');
  const [age, setAge] = useState(18);
  const [handedness, setHandedness] = useState('Right-Handed');
  const [selectedBg, setSelectedBg] = useState('academy');

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Create Player</h1>
        <p className="text-sm text-gray-400 mt-1">Set up your player's identity, background and starting profile.</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              i === currentStep ? 'bg-green-600 text-white' :
              i < currentStep ? 'bg-green-600/20 text-green-400' :
              'bg-surface text-gray-500'
            }`}>
              {i < currentStep ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-sm ${i === currentStep ? 'text-white font-medium' : 'text-gray-500'}`}>{step}</span>
            {i < steps.length - 1 && <div className="w-12 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left - Form */}
        <div className="col-span-5">
          {currentStep === 0 && (
            <div className="card card-body space-y-4">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">1. Identity</h2>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Name</label>
                <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Nationality</label>
                <select value={nationality} onChange={(e) => setNationality(e.target.value)} className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500">
                  <option>England</option>
                  <option>Scotland</option>
                  <option>Wales</option>
                  <option>China</option>
                  <option>Australia</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Age</label>
                <select value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500">
                  {[16, 17, 18, 19, 20, 21, 22].map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Handedness</label>
                <select value={handedness} onChange={(e) => setHandedness(e.target.value)} className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500">
                  <option>Right-Handed</option>
                  <option>Left-Handed</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Cue Style</label>
                <select className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500">
                  <option>Traditional</option>
                  <option>Modern</option>
                  <option>Hybrid</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Playing Style</label>
                <select className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500">
                  <option>Balanced</option>
                  <option>Attacking</option>
                  <option>Defensive</option>
                  <option>All-Round</option>
                </select>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">2. Choose Starting Background</h2>
              {backgrounds.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setSelectedBg(bg.id)}
                  className={`w-full text-left card card-body flex items-start gap-4 transition-colors ${
                    selectedBg === bg.id ? 'border-green-500 bg-green-600/5' : 'hover:border-border-light'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-light flex items-center justify-center shrink-0">
                    <Globe size={18} className="text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{bg.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        bg.difficulty === 'Easy' ? 'bg-green-600/20 text-green-400' :
                        bg.difficulty === 'Medium' ? 'bg-amber-600/20 text-amber-400' :
                        'bg-red-600/20 text-red-400'
                      }`}>Difficulty: {bg.difficulty}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{bg.desc}</p>
                  </div>
                  {selectedBg === bg.id && (
                    <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {currentStep === 2 && (
            <div className="card card-body space-y-4">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Starting Attribute Preview</h2>
              <div className="space-y-3">
                {startingAttributes.map((attr) => (
                  <div key={attr.name} className="flex items-center gap-3">
                    <ProgressBar label={attr.name} value={attr.value} size="md" />
                    <span className="text-xs text-gray-400 w-12 text-right">{attr.value}/100</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-border">
                <p className="text-[10px] text-gray-500">These early choices shape your player's development, relationships and career path.</p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="card card-body space-y-4">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Confirm Player</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Name</span><span className="text-white">{playerName}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Nationality</span><span className="text-white">{nationality}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Age</span><span className="text-white">{age}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Handedness</span><span className="text-white">{handedness}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Background</span><span className="text-green-400">{backgrounds.find((b) => b.id === selectedBg)?.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Starting Overall</span><span className="text-white">57 / 100</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Starting Funds</span><span className="text-white">£8,000</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Right - Player Preview */}
        <div className="col-span-7">
          <div className="card card-body">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Player Preview</h3>
            <div className="flex items-start gap-6">
              <div className="w-32 h-40 bg-surface-light rounded-xl flex items-center justify-center">
                <User size={48} className="text-gray-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{playerName}</h2>
                <p className="text-sm text-gray-400 mt-0.5">🇬🇧 {nationality}</p>
                <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                  <div><span className="text-gray-500">Age</span><p className="text-white">{age}</p></div>
                  <div><span className="text-gray-500">Handedness</span><p className="text-white">{handedness}</p></div>
                  <div><span className="text-gray-500">Cue Style</span><p className="text-white">Traditional</p></div>
                  <div><span className="text-gray-500">Playing Style</span><p className="text-white">Balanced</p></div>
                </div>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 rounded-full border-4 border-green-600/30 flex items-center justify-center">
                  <div>
                    <p className="text-2xl font-bold text-white">57</p>
                    <p className="text-[9px] text-gray-500">/100</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">PROSPECT</p>
              </div>
            </div>

            {currentStep >= 1 && (
              <div className="mt-6 pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Background Summary - {backgrounds.find((b) => b.id === selectedBg)?.name}</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1">Starting Bonuses</p>
                    {backgrounds.find((b) => b.id === selectedBg)?.bonuses.map((bonus) => (
                      <p key={bonus} className="text-xs text-green-400">{bonus}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1">Starting Funds</p>
                    <p className="text-lg font-bold text-white">£8,000</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1">Career Difficulty</p>
                    <p className="text-sm font-medium text-green-400">
                      {backgrounds.find((b) => b.id === selectedBg)?.difficulty}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentStep >= 2 && (
              <div className="mt-6 pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Temperament & Personality</h4>
                <div className="space-y-2">
                  {[
                    { name: 'Competitiveness', value: 70 },
                    { name: 'Risk Appetite', value: 45 },
                    { name: 'Perseverance', value: 65 },
                    { name: 'Sportsmanship', value: 60 },
                  ].map((t) => (
                    <ProgressBar key={t.name} label={t.name} value={t.value} size="sm" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="btn-secondary disabled:opacity-30"
        >
          <ChevronLeft size={16} /> Back
        </button>
        {currentStep < 3 ? (
          <button onClick={() => setCurrentStep(currentStep + 1)} className="btn-primary">
            Continue <ChevronRight size={16} />
          </button>
        ) : (
          <button className="btn-primary">
            <Dumbbell size={16} /> Confirm Player <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
