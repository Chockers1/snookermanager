/** A presentation-only fallback; loading and save behavior remain with their existing owners. */
export function BrandLoadingScreen({ fullScreen = false }: { fullScreen?: boolean }) {
  return <section className={'brand-loading' + (fullScreen ? ' brand-loading--fullscreen' : '')} aria-label="Loading Snooker Career Manager">
    <img className="brand-loading-logo" src="/assetts/ingame/in-game-logo.svg" width="821" height="313" alt="Snooker Career Manager" />
    <p role="status">Loading game view…</p>
  </section>;
}
