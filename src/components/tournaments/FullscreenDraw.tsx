import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2 } from 'lucide-react';
import './FullscreenDraw.css';

/** Expand a draw without changing the route, save or original scroll position. */
export function FullscreenDraw({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="btn-secondary draw-fullscreen-trigger" title="Expand draw to fullscreen" aria-label="Expand draw to fullscreen" aria-haspopup="dialog" onClick={() => setOpen(true)}>
      <Maximize2 size={17} aria-hidden="true" />
    </button>
    {open && <FullscreenDrawDialog title={title} onClose={() => setOpen(false)}>{children}</FullscreenDrawDialog>}
  </>;
}

function FullscreenDrawDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.showModal();
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);
  return createPortal(<dialog ref={dialog} className="draw-fullscreen-dialog" aria-label={`${title} · Fullscreen draw`} onClose={onClose}>
    <header>
      <div><h2>{title}</h2><p>Fullscreen draw · Scroll to explore every match · Esc to return</p></div>
      <button type="button" className="btn-secondary" onClick={() => dialog.current?.close()} aria-label="Exit fullscreen draw" title="Exit fullscreen draw (Esc)"><Minimize2 size={17} aria-hidden="true"/><span>Exit fullscreen</span></button>
    </header>
    <div className="draw-fullscreen-content" tabIndex={0} aria-label="Fullscreen draw scroll area">{children}</div>
  </dialog>, document.body);
}
