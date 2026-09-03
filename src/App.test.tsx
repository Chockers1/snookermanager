// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from './App'
import { AppErrorBoundary } from './components/errors/AppErrorBoundary'
import { GameStateProvider } from './context/GameStateContext'

const routes = [
  '/', '/new-career', '/career/progression', '/career/stats', '/player/attributes',
  '/training', '/training/report', '/staff/coaches', '/staff/coaches/coach-1', '/finance',
  '/equipment/cues', '/equipment/chalk-tips', '/equipment/cases', '/equipment/maintenance',
  '/equipment/table-setup', '/calendar', '/travel', '/tournaments/hub', '/tournaments/draw',
  '/match/preview', '/match/live', '/match/result', '/rankings', '/sponsorship',
  '/sponsorship/contract', '/inbox', '/mental', '/health', '/season-review', '/saves',
]

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  window.localStorage.clear()
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('application routes', () => {
  it.each(routes)('renders %s without crashing', async (route) => {
    render(
      <GameStateProvider>
        <MemoryRouter initialEntries={[route]}>
          <AppRoutes />
        </MemoryRouter>
      </GameStateProvider>,
    )

    await waitFor(() => {
      expect(document.body.textContent).not.toContain('Loading table view...')
      expect((document.body.textContent ?? '').trim().length).toBeGreaterThan(20)
    }, { timeout: 5_000 })
  })

  it('shows a useful not-found screen for an unknown address', async () => {
    render(
      <GameStateProvider>
        <MemoryRouter initialEntries={['/definitely-not-a-game-route']}>
          <AppRoutes />
        </MemoryRouter>
      </GameStateProvider>,
    )

    await waitFor(() => expect(document.body).toHaveTextContent('Route not found'))
    expect(document.body).toHaveTextContent('Your career has not been changed')
  })
})

describe('application recovery', () => {
  it('shows a reload-safe fallback when a route component throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    function BrokenRoute(): never {
      throw new Error('route failed')
    }

    render(<AppErrorBoundary><BrokenRoute /></AppErrorBoundary>)

    expect(document.body).toHaveTextContent('The table view failed to load')
    expect(document.body).toHaveTextContent('Your career remains saved in this browser')
  })
})
