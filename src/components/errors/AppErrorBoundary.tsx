import { Component, type ErrorInfo, type ReactNode } from 'react'

type AppErrorBoundaryProps = {
  children: ReactNode
}

type AppErrorBoundaryState = {
  error: Error | null
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('The game interface could not render.', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="flex min-h-screen items-center justify-center bg-scm-deep p-6 text-scm-text">
        <section className="w-full max-w-lg rounded-2xl border border-red-500/30 bg-scm-panel p-8 text-center shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">Interface recovery</p>
          <h1 className="mt-3 text-2xl font-bold text-white">The table view failed to load</h1>
          <p className="mt-3 text-sm leading-relaxed text-scm-textSoft">Your career remains saved in this browser. Reload the interface to return to the latest saved state.</p>
          <button type="button" className="btn-primary mt-6" onClick={() => window.location.reload()}>Reload Game</button>
        </section>
      </main>
    )
  }
}
