import { useState } from 'react';
import { Activity, ShieldCheck, Target, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGame } from '../../context/useGame';
import type { RecoveryRoute } from '../../game/seasonLife/types';
import { formatPercent } from '../../utils/formatters';
import { SectionTabs } from '../ui/SectionTabs';
import { ProgressBar } from '../ui/ProgressBar';

const tabs = ['Assessment & recovery', 'Match evidence'] as const;
const routes: Record<RecoveryRoute, {label:string; detail:string; commitment:string}> = {
  training: {label:'Targeted training', detail:'Work on the affected part of your game in your existing timetable.', commitment:'3 relevant sessions per free week'},
  coach: {label:'Coach-supported recovery', detail:'Use your employed coach to support the same focused work.', commitment:'2 relevant sessions · employed coach required'},
  protect: {label:'Tactical protection', detail:'A safety-first approach reduces exposure, at the cost of attacking openings.', commitment:'3 safety or match-preparation sessions'},
  patience: {label:'Patience', detail:'Allow the temporary concern to fade over time without targeted recovery work.', commitment:'Ends by the recorded recovery deadline'},
};

export function FormAssessmentEditor() {
  const {gameState,actOnCareer}=useGame();
  const life=gameState.careerDepth?.seasonLife, form=life?.form, evidence=life?.evidence??[];
  const [tab,setTab]=useState<typeof tabs[number]>('Assessment & recovery');
  const [changed,setChanged]=useState(false);
  const recent=evidence.slice(-6).reverse();
  const heading=form ? form.kind==='long-pot'?'Long-opening reliability':'Closing frames from a strong lead' : evidence.length?'Building your performance baseline':'No match evidence recorded yet';
  const sessions=form?.kind==='closing'?'Match practice, Mental Training and Safety Exchanges':'Long Pot Routine and Line-Up Drill';
  return <div className="form-assessment-editor">
    <div className="development-editor-intro"><span>{form?'A recovery plan for your current form':'Understand patterns in your game'}</span><p>Assess your own recorded performances. One bad match does not create a form concern.</p></div>
    <SectionTabs id="form-editor-tabs" label="Form assessment sections" tabs={tabs} active={tab} onChange={setTab}/>
    <div className="form-editor-content" role="tabpanel" id="form-editor-tabs-panel" aria-labelledby={`form-editor-tabs-tab-${tabs.indexOf(tab)}`}>
      {tab==='Assessment & recovery'&&<div className="form-assessment-grid">
        <section className="development-project-card" aria-label="Form assessment"><header className="development-card-heading"><div><Activity/><h3>Current assessment</h3></div><span className="development-status">{form?'Concern active':'No active concern'}</span></header><div className="development-card-body">
          <h3 className="form-assessment-title">{heading}</h3><p className="form-assessment-explanation">{form?.evidence??`${evidence.length} matches with recorded simulation evidence. Diagnosis needs an earlier baseline and at least three consistently weaker matches. Isolated bad luck causes no penalty.`}</p>
          {form?<><div className="form-recovery-progress"><div><span>Recovery progress</span><strong>{formatPercent(form.progress)}</strong></div><ProgressBar value={form.progress} compact/><div className="development-dates"><span>Assessed <b>{form.started}</b></span><span>Ends by <b>{form.ends}</b></span></div></div>
            <div className="form-assessment-metrics"><div><span>Fatigue at assessment</span><strong>{formatPercent(form.fatigue)}</strong></div><div><span>Confidence at assessment</span><strong>{formatPercent(form.confidence)}</strong></div></div><p className="form-muted-note">Fatigue and confidence can contribute; they do not prove causation.</p>
            <div className="form-safeguard"><ShieldCheck/><div><h4>Temporary, situational effect</h4><p>At most three effective skill points in relevant situations. Permanent attributes remain unchanged. A cue-action rebuild keeps its existing adjustment cost, without a duplicate form penalty.</p></div></div>
          </>:<><div className="form-safeguard"><ShieldCheck/><div><h4>No active form penalty</h4><p>Keep your normal training routine. You do not need to start a recovery programme without an established concern.</p></div></div><div className="form-baseline-count"><strong>{evidence.length}</strong><div><span>recorded matches</span><p>Evidence history is bounded to the latest 15 matches.</p></div></div></>}
        </div><footer className="development-card-footer"><span>Modelled match evidence, not measured shot distances.</span><button className="btn-secondary text-xs" onClick={()=>setTab('Match evidence')}>Review evidence</button></footer></section>
        {form?<section className="development-partner-card" aria-label="Form recovery choices"><header className="development-card-heading"><div><Target/><h3>Choose your recovery</h3></div><span className="development-status">One approach</span></header><div className="development-card-body">
          <p className="form-current-route">Current approach <strong>{routes[form.route].label}</strong></p><div className="form-recovery-options">{(Object.keys(routes) as RecoveryRoute[]).map(route=>{const option=routes[route],disabled=route==='coach'&&!gameState.coachContracts.length;return <button key={route} type="button" aria-label={option.label} aria-pressed={form.route===route} disabled={disabled} onClick={()=>{actOnCareer({type:'life-recovery',route});setChanged(true)}}><span className="form-option-title">{option.label}<span aria-hidden="true">{form.route===route?'✓':'○'}</span></span><span>{option.detail}</span><strong>{disabled?'No employed coach · unavailable':option.commitment}</strong></button>})}</div>
          <div className="form-recovery-guidance"><h4>Relevant work for this concern</h4><p>{sessions}. Use your existing training sessions.</p><p>Benefits do not stack. Suitable weekly work aims for about three weeks; patience allows recovery within six weeks. Changing approach gives no immediate recovery credit.</p></div>
          {changed&&<p role="status" className="form-choice-feedback">{routes[form.route].label} selected. Recovery progress remains {formatPercent(form.progress)}.</p>}
        </div><footer className="development-card-footer"><Link className="btn-secondary text-xs" to="/training">Open training and existing technique projects</Link></footer></section>:<section className="development-partner-card"><header className="development-card-heading"><div><BookOpen/><h3>How assessment works</h3></div></header><div className="development-card-body"><ol className="form-assessment-steps"><li><b>1</b><div><h4>Build your baseline</h4><p>At least three earlier matches establish your own comparison, with enough relevant opportunities.</p></div></li><li><b>2</b><div><h4>Look for a repeated pattern</h4><p>Three consistently weaker matches are needed. The system checks long-opening reliability and lost strong late-frame leads.</p></div></li><li><b>3</b><div><h4>Choose a proportionate response</h4><p>If a concern is diagnosed, choose training, coach support, tactical protection or patience. Only one form concern is active at a time.</p></div></li></ol><div className="form-recovery-guidance"><h4>Build evidence through play</h4><p>Match Centre, Auto Play and Sim Match record modelled visits. Aggregate Quick Sim results without visit evidence are excluded.</p></div></div></section>}
      </div>}
      {tab==='Match evidence'&&<section className="form-evidence-panel" aria-label="Recorded form evidence"><header className="development-card-heading"><div><Activity/><h3>Recent match evidence</h3></div><span className="development-status">{recent.length} recent / {evidence.length} recorded</span></header><div className="form-evidence-body">
        {recent.length?<><p>Latest {recent.length} recorded matches, newest first. Counts describe modelled long openings and strong late-frame leads.</p><div className="form-evidence-labels"><span>Match date</span><span>Long openings made / attempted</span><span>Strong leads lost / established</span></div>{recent.map(record=><dl className="form-evidence-row" key={record.id}><div><dt>Match date</dt><dd>{record.date}</dd></div><div><dt>Long openings made</dt><dd>{record.openingsMade} <span>of</span> {record.openings}</dd></div><div><dt>Strong leads lost</dt><dd>{record.leadsLost} <span>of</span> {record.strongLeads}</dd></div></dl>)}</>:<div className="form-evidence-empty"><Activity/><h3>Your evidence record starts here</h3><p>Play matches in Match Centre to build an evidence record. Auto Play and Sim Match both record visits.</p></div>}
      </div><footer className="form-evidence-footer">These are modelled Match Centre visits. Aggregate Quick Sim results without visit evidence are excluded. With an active form issue, Quick Sim also uses the visit engine.</footer></section>}
    </div>
  </div>;
}
