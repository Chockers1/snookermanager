import { Link } from 'react-router-dom';
import { Activity, ArrowUpRight, TrendingUp } from 'lucide-react';
import { PlayerLink } from '../components/game/PlayerLink';
import { useGame } from '../context/useGame';
import { formatPercent, formatAttribute, formatAttributeChange } from '../utils/formatters';
import './SupportWorkspaces.css';

const groups = ['technical', 'mental', 'physical'] as const;
export function TrainingReportPage() {
  const { gameState: s } = useGame();
  const report = s.trainingCondition.reportSnapshot?.lastReport;
  const coach = s.coaches.find(c => c.id === s.currentCoachId);
  const changes = report?.changes ?? [];
  const net = changes.reduce((sum, c) => sum + c.delta, 0);
  const focus = Object.values(s.attributes).flatMap(group => Object.entries(group)).sort((a,b) => a[1]-b[1]).slice(0,2);
  const live = [['Confidence',s.player.confidence], ['Fatigue',s.player.fatigue], ['Morale',s.player.morale], ['Strain',s.trainingCondition.strain], ['Burnout',s.trainingCondition.burnout]] as const;
  return <div className="support-workspace report-workspace" data-testid="training-report-workspace">
    <header className="support-header"><div><p className="support-eyebrow">Training · recorded development</p><h1>{report && !report.cadence ? 'Training Report' : 'Monthly Training Report'}</h1><p><PlayerLink name={s.player.fullName}/> · {report ? `${report.startDate} → ${report.endDate}` : 'Awaiting your first monthly report'}</p></div><Link className="btn-primary" to="/training">Training planner <ArrowUpRight size={15}/></Link></header>
    <div className="support-metrics">
      <div><span>Net attribute change</span><strong>{report ? formatAttributeChange(net) : '—'}</strong><small>{report ? 'Across the report period' : 'No completed report yet'}</small></div>
      <div><span>Attributes improved</span><strong>{report ? changes.filter(c=>c.delta>0).length : '—'}<small> / 15</small></strong><small>Permanent development</small></div>
      <div><span>Recorded training load</span><strong>{report ? formatPercent(report.trainingLoad) : '—'}</strong><small>{report ? `${formatPercent(report.adaptation)} adaptation at report close` : 'Available after the first report'}</small></div>
    </div>
    <div className="support-columns report-columns">
      <section className="support-panel report-development"><header><div><p className="support-eyebrow">Development</p><h2>Attribute movement</h2></div><TrendingUp size={19}/></header>
        {report ? <><div className="report-disciplines">{groups.map(group => {
          const entries = changes.filter(c=>c.group===group);
          const total = entries.reduce((sum,c)=>sum+c.delta,0);
          return <section key={group} aria-label={`${group} development`}><div className="report-group-title"><h3>{group}</h3><b>{formatAttributeChange(total)}</b></div><p className="support-muted">Period-end value · change</p><div className="report-attribute-list">{entries.map(c=><div key={c.label}><span>{c.label}</span><div><strong>{formatAttribute(c.current)}</strong><b className={c.delta<0?'support-loss':'support-gain'}>{formatAttributeChange(c.delta)}</b></div></div>)}{!entries.length&&<p>No recorded changes.</p>}</div></section>;
        })}</div><footer className="support-note">Values are saved at report close; your current attributes may have changed since. Reports arrive with the first training update of each new month.</footer></> : <div className="support-empty"><Activity size={32}/><h3>Your development story starts here</h3><p>Complete training weeks to build your first report. Recorded attribute changes will appear here; no daily training history is inferred.</p><Link className="btn-secondary" to="/training">Plan your training</Link></div>}
      </section>
      <aside className="support-stack"><section className="support-panel report-focus"><header><div><p className="support-eyebrow">Plan your next block</p><h2>{s.player.fatigue>=60?'Recovery first':focus[0]?.[0] ?? 'Match readiness'}</h2></div></header><div className="support-panel-body"><p>{s.player.fatigue>=60?'Reduce a heavy session and protect recovery before increasing workload.':`Your lowest current attributes are ${focus.map(([label])=>label).join(' and ')}. Consider targeted work while protecting a recovery block.`}</p><p className="support-muted">{coach ? `${coach.name} · ${coach.type} coach` : 'Independent training · no active lead coach'}</p><Link to="/training" className="support-link">Choose next week’s sessions <ArrowUpRight size={14}/></Link></div></section>
      <section className="support-panel report-condition"><header><div><p className="support-eyebrow">Live · {s.currentDate}</p><h2>Condition now</h2></div></header><dl className="support-detail-list">{live.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{formatPercent(value)}</dd></div>)}</dl>{report&&<footer className="support-note">Report-period change: fatigue {formatAttributeChange(report.fatigueChange)} · strain {formatAttributeChange(report.strainChange)} · burnout {formatAttributeChange(report.burnoutChange)} points.</footer>}</section></aside>
    </div>
  </div>;
}
