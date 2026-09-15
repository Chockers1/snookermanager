import { useState } from 'react';
import { Target, Users, Activity } from 'lucide-react';
import { useGame } from '../../context/useGame';
import { depthOf } from '../../game/careerDepth/shared';
import { PROJECTS, partnerAvailable } from '../../game/careerDepth/developmentProjects';
import { partnerCandidates } from '../../game/careerDepth/relationships';
import type { ProjectKind } from '../../game/careerDepth/types';
import { formatAttribute, formatAttributeChange, formatPercent } from '../../utils/formatters';
import { ProgressBar } from '../ui/ProgressBar';
import { PlayerLink } from '../game/PlayerLink';
import { PlayerNames } from '../game/PlayerNames';

export function DevelopmentEditor() {
  const { gameState, actOnCareer } = useGame();
  const depth = depthOf(gameState), project = depth.project;
  const [kind, setKind] = useState<ProjectKind>(project?.kind ?? 'long-pot');
  const [showFeedback, setShowFeedback] = useState(false);
  const active = project?.status === 'active';
  const selectedKind = active ? project.kind : kind;
  const selected = PROJECTS[selectedKind];
  const attributes = project?.closingAttributes ?? { ...gameState.attributes.technical, ...gameState.attributes.mental, ...gameState.attributes.physical };
  const candidates = partnerCandidates(gameState);
  const partner = gameState.worldPlayers.find(player => player.id === depth.partnerId);
  const available = partnerAvailable(gameState);
  const progress = project ? Math.min(100, project.completedWeeks / PROJECTS[project.kind].weeks * 100) : 0;
  const perform = (action: Parameters<typeof actOnCareer>[0]) => { setShowFeedback(true); actOnCareer(action); };

  return <div className="development-editor">
    <div className="development-editor-intro"><span>Build a repeatable practice routine</span><p>Choose a longer-term focus and a player to practise with. Both use sessions in your weekly timetable.</p></div>
    <div className="development-editor-grid">
      <section className={`development-project-card${active ? ' is-active' : ''}`} aria-label="Project plan">
        <header className="development-card-heading"><div><Target/><h3>Development project</h3></div><span className="development-status">{active ? 'In progress' : project?.status === 'completed' ? 'Completed' : 'Choose a focus'}</span></header>
        <div className="development-card-body">
          <label className="development-field">Project focus<select aria-label="Development project" disabled={active} value={selectedKind} onChange={event=>setKind(event.target.value as ProjectKind)}>{Object.entries(PROJECTS).map(([id, option])=><option key={id} value={id}>{option.name} · {option.weeks} weeks</option>)}</select></label>
          {!active&&<div className="development-plan-facts"><div><span>Programme length</span><strong>{selected.weeks} <small>training weeks</small></strong></div><div><span>Weekly commitment</span><strong>3 <small>relevant sessions</small></strong></div></div>}
          <div className="development-sessions"><h4>Sessions to include</h4><div>{selected.sessions.map(session=><span key={session}>{session}</span>)}</div><p>Complete three relevant sessions per week. Projects do not auto-fill or add sessions; competition or injury pauses progress.</p></div>
          {selectedKind==='cue-action'&&<p className="development-warning">Temporary effective consistency −2 during the first two completed training weeks. This does not reduce your permanent consistency.</p>}
          {project ? <section className="development-progress" aria-label="Project progress">
            <div className="development-progress-heading"><h4>{active?'Your progress':PROJECTS[project.kind].name}</h4><strong>{project.completedWeeks} / {PROJECTS[project.kind].weeks} weeks</strong></div><ProgressBar value={progress} compact/>
            <div className="development-dates"><span>Started <b>{project.startedDate}</b></span><span>Review <b>{project.reviewDate}</b></span></div><p>{project.note}</p>
            <div className="development-gains">{Object.entries(project.baseline).map(([skill,before])=>{const now=attributes[skill]??before;return <article key={skill}><h4>{skill}</h4><p>{formatAttribute(before)} → {formatAttribute(now)} ({formatAttributeChange(now-before)})</p><span>{project.status==='completed'?'Recorded project outcome':'Change since project started'}</span></article>})}</div>
            <details className="development-evidence"><summary><Activity/>Match evidence <strong>{project.evidenceMatches} matches</strong></summary><p>{project.evidenceMatches<5?'Small sample; no reliable performance conclusion yet.':'Compare match statistics separately from training gains.'}</p>{project.matchEvidence&&project.matchEvidence.matches>0&&<p>Recorded across {project.matchEvidence.matches} matches: potting {formatPercent(project.matchEvidence.pottingTotal/project.matchEvidence.matches)} · safety {formatPercent(project.matchEvidence.safetyTotal/project.matchEvidence.matches)} · highest break {project.matchEvidence.highestBreak} · long matches won {project.matchEvidence.longMatchWins}/{project.matchEvidence.longMatches}. These results do not award attributes.</p>}</details>
          </section> : <div className="development-empty-project"><h4>What this develops</h4><p>{selected.skills.join(' · ')}</p><span>Progress is earned through your weekly training. Finishing adds no separate attribute bonus.</span></div>}
        </div>
        <footer className="development-card-footer"><span>{active?'Cancelling retains earned attribute gains.':'Choose a focus, then add its sessions to your timetable.'}</span>{active&&<button className="btn-secondary text-xs" onClick={()=>perform({type:'cancel-project'})}>Cancel project</button>}<button className="btn-primary text-xs" disabled={active} onClick={()=>perform({type:'project',kind:selectedKind})}>Start project</button></footer>
      </section>
      <section className="development-partner-card" aria-label="Practice setup">
        <header className="development-card-heading"><div><Users/><h3>Practice partner</h3></div><span className="development-status">{partner?available?'Available':'Unavailable':`${candidates.length} candidates`}</span></header>
        <div className="development-card-body">
          <label className="development-field">Choose your partner<select aria-label="Practice partner" value={depth.partnerId??''} onChange={event=>perform({type:'partner',id:event.target.value||null})}><option value="">No practice partner</option>{partner&&!candidates.some(p=>p.id===partner.id)&&<option value={partner.id}>{partner.playerName} · current partner</option>}{candidates.map(player=><option key={player.id} value={player.id}>{player.playerName} · age {player.age} · OVR {player.overallRating==null?'—':formatAttribute(player.overallRating)}</option>)}</select></label>
          {partner ? <div className="development-partner-profile"><div className="development-partner-avatar">{partner.playerName.split(' ').map(part=>part[0]).slice(0,2).join('')}</div><h4><PlayerLink name={partner.playerName} id={partner.id}/></h4><p>Age {partner.age} · Overall {partner.overallRating==null?'—':formatAttribute(partner.overallRating)}</p><span>{depth.practiceHistory?.[partner.id]?.sessions??0} shared sessions completed</span></div> : <div className="development-partner-profile development-partner-empty"><Users/><h4>Build a practice partnership</h4><p>Select a partner to share one existing technical session in your week.</p>{candidates.length===0&&<span>No eligible partners are currently available.</span>}</div>}
          {depth.partnerId&&<label className="development-field">Shared practice skill<select aria-label="Shared practice skill" value={depth.partnerFocus??'Long Potting'} onChange={event=>perform({type:'partner-focus',skill:event.target.value})}>{['Long Potting','Break Building','Cue Ball Control','Safety Play'].map(skill=><option key={skill}>{skill}</option>)}</select></label>}
          <div className="development-practice-note"><h4>How shared practice works</h4><p>{depth.partnerId&&!available?'Partner unavailable during competition, travel or injury. No extra sessions or bonus this week.':'One existing technical session becomes shared practice. No extra training day is added.'}</p><p>Benefits target your selected skill. Project and partner efficiency combined is capped at +10%.</p></div>
          <details className="development-candidates"><summary>Practice partner profiles <span>{candidates.length}</span></summary><div>{candidates.map(player=><article key={player.id}><PlayerLink name={player.playerName} id={player.id}/><span>Age {player.age} · OVR {player.overallRating==null?'—':formatAttribute(player.overallRating)}</span></article>)}</div></details>
        </div>
      </section>
    </div>
    {showFeedback&&<p role="status" className="development-feedback"><PlayerNames text={gameState.lastAction}/></p>}
  </div>;
}
