import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Trophy, Crown } from 'lucide-react';
import type { victoryCelebration } from '../../game/victoryCelebration';
import { formatMoney } from '../../utils/formatters';
type Victory = NonNullable<ReturnType<typeof victoryCelebration>>;
function VictoryContent({ victory, ceremony = false }: { victory: Victory; ceremony?: boolean }) {
  return <div className={`relative min-w-0 ${ceremony ? 'p-5 text-center sm:p-8' : 'p-5 sm:p-7'}`}>
    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300">{victory.season} · {victory.exhibition ? 'Exhibition achievement' : victory.ranking ? 'Ranking title secured' : 'Tournament title secured'}</p>
    <div className={`mt-4 flex gap-5 ${ceremony ? 'flex-col items-center' : 'flex-col sm:flex-row sm:items-center'}`}>
      <div aria-hidden="true" className={`grid shrink-0 place-items-center rounded-full border border-amber-300/30 bg-amber-300/10 shadow-[0_0_60px_rgba(251,191,36,0.13)] ${ceremony ? 'h-28 w-28' : 'h-20 w-20'}`}><Trophy className={ceremony ? 'h-16 w-16 text-amber-200' : 'h-12 w-12 text-amber-200'} strokeWidth={1.3}/></div>
      <div className="min-w-0">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">{victory.headline}</p>
        <h2 className={`mt-1 break-words font-black tracking-tight text-white ${ceremony ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'}`}>{victory.name}</h2>
        <p className="mt-2 text-xl font-bold text-white">{victory.player} <span className="mx-1 text-amber-200">{victory.score}</span> {victory.opponent}</p>
        <p className="mt-1 text-xs text-gray-300">{victory.location}</p>
      </div>
    </div>
    <p className="mt-4 text-sm leading-relaxed text-amber-100">{victory.highlight}</p>
    <p className="mt-1 text-xs text-gray-300">{[victory.frameHighlight, victory.breakHighlight].filter(Boolean).join(' · ')}</p>
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-amber-300/20 bg-black/20 p-3 text-sm text-amber-200"><Crown aria-hidden="true" className="h-4 w-4 shrink-0"/><span>{victory.milestone}</span>{victory.trophyRecorded && <span className="text-xs text-gray-300">· Added to your trophy cabinet</span>}</div>
    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg bg-black/20 p-3"><dt className="text-[10px] uppercase tracking-wide text-gray-400">Prize secured</dt><dd className="mt-1 text-2xl font-bold text-white">{formatMoney(victory.prize)}</dd></div>
      <div className="rounded-lg bg-black/20 p-3"><dt className="text-[10px] uppercase tracking-wide text-gray-400">{victory.ranking ? 'Ranking credit' : 'Career record'}</dt><dd className="mt-1 text-sm font-semibold text-white">{victory.ranking ? victory.credit === undefined ? 'See event report' : formatMoney(victory.credit) : victory.exhibition ? 'Exhibition achievement' : 'Non-ranking title'}</dd><p className="mt-1 text-[10px] text-gray-400">{victory.ranking ? `${victory.pending ? 'Publishes' : 'Published'} ${victory.publication ?? 'at event finish'}` : 'No world-ranking credit'}</p></div>
    </dl>
  </div>;
}
export function VictoryCelebration({ victory }: { victory: Victory }) {
  const ref = useRef<HTMLDialogElement>(null);
  const receipt = `snooker-victory-viewed:${victory.key}`;
  useEffect(() => {
    const dialog = ref.current;
    let seen = false;
    try { seen = localStorage.getItem(receipt) === '1'; } catch { /* Presentation still works without storage. */ }
    if (!seen) dialog?.showModal();
    return () => dialog?.close();
  }, [receipt]);
  const acknowledge = () => { try { localStorage.setItem(receipt, '1'); } catch { /* Optional UI receipt. */ } };
  const close = () => { acknowledge(); ref.current?.close(); };
  const panelStyle = 'border-amber-300/35 bg-gradient-to-br from-[#302515] via-surface to-background';
  return <>
    <section aria-label="Tournament victory" className={`overflow-hidden rounded-2xl border ${panelStyle}`}>
      <VictoryContent victory={victory}/>
      <div className="flex flex-wrap gap-2 border-t border-amber-300/15 px-5 py-3">
        <Link className="btn-primary text-xs" to={victory.exhibition ? '/career/stats#exhibition-achievements' : '/career/stats#trophy-cabinet'}>{victory.exhibition ? 'View career achievements' : 'View trophy cabinet'}</Link>
        <Link className="btn-secondary text-xs" to={victory.bracketRoute}>View winning route</Link>
        <button type="button" className="btn-secondary text-xs" onClick={() => ref.current?.showModal()}>Relive the celebration</button>
      </div>
    </section>
    {createPortal(<dialog ref={ref} aria-label={`${victory.name} victory celebration`} onCancel={acknowledge} className={`m-auto w-[min(42rem,calc(100vw-1.5rem))] max-w-none overflow-hidden rounded-2xl border p-0 text-white shadow-2xl backdrop:bg-black/85 ${panelStyle}`}>
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <div className="min-h-0 overflow-y-auto"><VictoryContent victory={victory} ceremony/></div>
        <footer className="flex shrink-0 flex-wrap justify-center gap-2 border-t border-amber-300/15 p-3">
          <button type="button" autoFocus className="btn-primary text-xs" onClick={close}>Continue to match review</button>
          <Link className="btn-secondary text-xs" onClick={close} to={victory.exhibition ? '/career/stats#exhibition-achievements' : '/career/stats#trophy-cabinet'}>{victory.exhibition ? 'View career achievements' : 'View trophy cabinet'}</Link>
        </footer>
      </div>
    </dialog>, document.body)}
  </>;
}
