import type { SeasonTourChanges, TourChangePerson } from '../../game/seasonTourChanges';
function PersonRow({person}:{person:TourChangePerson}) {
  return <li className="min-w-0 py-1"><div className="flex flex-wrap items-baseline justify-between gap-x-2"><span className="text-xs font-medium text-white">{person.name}</span><span className="text-[10px] text-gray-400">{person.nation} · Age {person.age}</span></div><p className="mt-0.5 break-words text-[10px] leading-3.5 text-gray-400">{person.detail}</p></li>;
}
export function SeasonTourChangesReport({report}:{report:SeasonTourChanges}) {
  return <section aria-label="Season tour changes" className="mt-3 min-w-0 max-w-3xl space-y-3">
    <p className="text-[11px] leading-4 text-gray-400">{report.previousSeason} → {report.season} · Saved on {report.asOf}. {report.complete ? 'Confirmed changes across the simulated tours.' : 'Reconstructed from retained records; the full new-player intake was not saved.'}</p>
    <div className="rounded-lg border border-border bg-background/30"><div className="border-b border-border px-4 py-2"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">Report summary</p></div><div className="divide-y divide-border/70">{report.sections.map(section=><section key={section.id} aria-label={section.title} className="min-w-0 px-4 py-3">
      <div className="flex items-center justify-between gap-2"><h3 className="text-xs font-semibold text-gray-300">{section.title}</h3><span className="rounded bg-surface-light px-1.5 py-0.5 text-[10px] text-white">{section.people.length}{!report.complete?' recorded':''}</span></div>
      {section.people.length ? <><ul className="mt-1 divide-y divide-border/50">{section.people.slice(0,2).map(person=><PersonRow key={person.id} person={person}/>)}</ul>{section.people.length>2 && <details className="mt-1"><summary className="cursor-pointer text-[10px] text-green-400">Show {section.people.length-2} more</summary><ul className="mt-1 divide-y divide-border/50">{section.people.slice(2).map(person=><PersonRow key={person.id} person={person}/>)}</ul></details>}</>:<p className="py-2 text-[10px] leading-4 text-gray-500">{report.complete?'No changes this season.':'No confirmed changes in the retained records.'}</p>}
    </section>)}</div></div>
    <p className="text-[10px] text-gray-500">Seniors arrivals are confirmed field changes. A player can also appear under tour-card losses.</p>
  </section>;
}
