import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Trophy, Radio, MonitorPlay, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/players', label: 'Players', icon: Users, end: false },
  { to: '/admin/matches', label: 'Matches', icon: Trophy, end: false },
  { to: '/admin/live', label: 'Live Match', icon: Radio, end: false },
]

export default function Sidebar() {
  const { signOut } = useAuth()
  const base = 'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium'
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-white/10 bg-[#0e1530] p-3">
      <div className="px-4 py-4 text-lg font-bold text-yellow-400">LIVE SCORE</div>
      <nav className="flex flex-1 flex-col gap-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `${base} ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5'}`}>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
        <a href="/projection" target="_blank" rel="noreferrer" className={`${base} text-slate-300 hover:bg-white/5`}>
          <MonitorPlay size={18} /> Projection
        </a>
      </nav>
      <button onClick={signOut} className={`${base} text-slate-400 hover:bg-white/5`}><LogOut size={18} /> Sign out</button>
    </aside>
  )
}
