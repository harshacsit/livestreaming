import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { isConfigured } from './lib/supabase'
import Sidebar from './components/admin/Sidebar'
import Login from './pages/Login'
import Players from './pages/Players'
import Matches from './pages/Matches'
import LiveMatch from './pages/LiveMatch'
import Projection from './pages/Projection'
import AdminDashboard from './pages/AdminDashboard'

function AdminLayout() {
  const { session, loading } = useAuth()
  if (loading) return <div className="p-10 text-slate-400">Loading...</div>
  if (!session) return <Navigate to="/login" replace />
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6"><Outlet /></main>
    </div>
  )
}

export default function App() {
  if (!isConfigured) {
    return <div className="p-10 text-yellow-300">Missing Supabase settings. Copy .env.example to .env and fill in both values, then restart npm run dev.</div>
  }
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/projection" element={<Projection />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="players" element={<Players />} />
        <Route path="matches" element={<Matches />} />
        <Route path="live" element={<LiveMatch />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}
