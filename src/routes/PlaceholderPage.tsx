import { ArrowLeft, Home, MapPinOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[65vh] items-center justify-center px-4">
      <div className="card card-body w-full max-w-xl p-8 text-center sm:p-12">
        <MapPinOff className="mx-auto h-12 w-12 text-amber-400" />
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">404 · Route not found</p>
        <h1 className="mt-2 text-2xl font-bold text-white">That part of the venue does not exist</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-400">The address may be outdated or mistyped. Your career has not been changed.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn-secondary text-xs" onClick={() => navigate(-1)}><ArrowLeft className="h-3.5 w-3.5" /> Go Back</button>
          <button type="button" className="btn-primary text-xs" onClick={() => navigate('/')}><Home className="h-3.5 w-3.5" /> Dashboard</button>
        </div>
      </div>
    </div>
  )
}
