
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  GraduationCap,
} from 'lucide-react'

const menus = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'etudiants', label: 'Étudiants', icon: Users },
  { id: 'formations', label: 'Formations', icon: BookOpen },
  { id: 'inscriptions', label: 'Inscriptions', icon: ClipboardList },
]

export default function Sidebar({ page, setPage }) {
  return (
    <aside className="flex w-64 shrink-0 flex-col bg-slate-950 p-5 text-white">
      <div className="mb-10 flex items-center gap-3">
        <div className="rounded-xl bg-blue-600 p-2">
          <GraduationCap size={25} />
        </div>
        <div>
          <h1 className="text-lg font-bold">EduGest</h1>
          <p className="text-xs text-slate-400">Administration scolaire</p>
        </div>
      </div>

      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Menu principal
      </p>

      <nav className="space-y-2">
        {menus.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
              page === id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Icon size={19} />
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-auto rounded-xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-sm font-semibold">EduGest</p>
        <p className="mt-1 text-xs text-slate-400">
          Gestion des étudiants et des formations
        </p>
      </div>
    </aside>
  )
}
