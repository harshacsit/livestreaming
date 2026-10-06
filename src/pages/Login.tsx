import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { session, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/admin" replace />

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    const msg = await signIn(email, password)
    setBusy(false)
    if (msg) setError(msg); else navigate('/admin')
  }
  const input = 'w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-3 outline-none focus:border-blue-500'
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-[#111a3a] p-8">
        <h1 className="text-2xl font-bold text-yellow-400">Admin Login</h1>
        <input type="email" required placeholder="Email" className={input} value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" required placeholder="Password" className={input} value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-blue-600 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50">{busy ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </div>
  )
}
