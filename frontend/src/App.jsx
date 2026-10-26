
import { useCallback, useEffect, useState } from 'react'
import {
  Search, Plus, Users, BookOpen, ClipboardList,
  GraduationCap, Pencil, Trash2, X, RefreshCw, SlidersHorizontal,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts'
import Sidebar from './components/Sidebar'
import api from './services/api'

const chartColors = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

const statusLabel = status => ({
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
}[status] || status || 'Non défini')

const emptyStudent = {
  matricule: '',
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  date_naissance: '',
}

const emptyFormation = {
  code: '',
  intitule: '',
  description: '',
  duree_mois: '',
  cout: '0',
}

const emptyInscription = {
  etudiant_id: '',
  formation_id: '',
  date_inscription: new Date().toISOString().slice(0, 10),
  statut: 'en_cours',
}

const labels = {
  dashboard: 'Tableau de bord',
  etudiants: 'Étudiants',
  formations: 'Formations',
  inscriptions: 'Inscriptions',
}

const money = value =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

const cleanParams = values => Object.fromEntries(
  Object.entries(values).filter(([, value]) => value !== '' && value !== null && value !== undefined)
)

function App() {
  const [page, setPage] = useState('dashboard')
  const [stats, setStats] = useState({
    total_etudiants: 0,
    total_formations: 0,
    total_inscriptions: 0,
    inscriptions_en_cours: 0,
  })
  const [students, setStudents] = useState([])
  const [formations, setFormations] = useState([])
  const [inscriptions, setInscriptions] = useState([])
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    nom: '', prenom: '', matricule: '', email: '',
    duree_min: '', duree_max: '', cout_min: '', cout_max: '',
    etudiant_id: '', formation_id: '', statut: '', date_debut: '', date_fin: '',
  })
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyStudent)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const studentParams = page === 'etudiants'
        ? cleanParams({ recherche: search, nom: filters.nom, prenom: filters.prenom, matricule: filters.matricule, email: filters.email, per_page: 100 })
        : { per_page: 100 }
      const formationParams = page === 'formations'
        ? cleanParams({ recherche: search, duree_min: filters.duree_min, duree_max: filters.duree_max, cout_min: filters.cout_min, cout_max: filters.cout_max, per_page: 100 })
        : { per_page: 100 }
      const inscriptionParams = page === 'inscriptions'
        ? cleanParams({ recherche: search, etudiant_id: filters.etudiant_id, formation_id: filters.formation_id, statut: filters.statut, date_debut: filters.date_debut, date_fin: filters.date_fin, per_page: 100 })
        : { per_page: 100 }

      const [dashboard, studentData, formationData, inscriptionData] =
        await Promise.all([
          api.get('/dashboard'),
          api.get('/etudiants', { params: studentParams }),
          api.get('/formations', { params: formationParams }),
          api.get('/inscriptions', { params: inscriptionParams }),
        ])

      setStats(dashboard.data)
      setStudents(studentData.data.data)
      setFormations(formationData.data.data)
      setInscriptions(inscriptionData.data.data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Impossible de joindre l'API Laravel. Vérifie que le serveur fonctionne."
      )
    } finally {
      setLoading(false)
    }
  }, [search, page, filters])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openCreate = () => {
    setEditing(null)
    setError('')
    setForm(
      page === 'etudiants' ? { ...emptyStudent } :
      page === 'formations' ? { ...emptyFormation } :
      { ...emptyInscription }
    )
    setModal(true)
  }

  const openEdit = item => {
    setEditing(item.id)
    setError('')

    if (page === 'etudiants') {
      setForm({
        matricule: item.matricule,
        nom: item.nom,
        prenom: item.prenom,
        email: item.email,
        telephone: item.telephone || '',
        date_naissance: item.date_naissance?.slice(0, 10) || '',
      })
    } else if (page === 'formations') {
      setForm({
        code: item.code,
        intitule: item.intitule,
        description: item.description || '',
        duree_mois: item.duree_mois || '',
        cout: item.cout ?? '0',
      })
    } else {
      setForm({
        etudiant_id: String(item.etudiant_id),
        formation_id: String(item.formation_id),
        date_inscription: item.date_inscription?.slice(0, 10) || '',
        statut: item.statut,
      })
    }

    setModal(true)
  }

  const save = async event => {
    event.preventDefault()
    setError('')

    const endpoint = `/${page}`
    const payload = { ...form }

    if (page === 'formations') {
      payload.duree_mois = payload.duree_mois || null
      payload.cout = Number(payload.cout)
    }

    if (page === 'inscriptions') {
      payload.etudiant_id = Number(payload.etudiant_id)
      payload.formation_id = Number(payload.formation_id)
    }

    setSaving(true)
    try {
      if (editing) {
        await api.put(`${endpoint}/${editing}`, payload)
      } else {
        await api.post(endpoint, payload)
      }

      setModal(false)
      setNotice(editing ? 'Modification réussie.' : 'Ajout réussi.')
      await loadData()
    } catch (err) {
      const errors = err.response?.data?.errors
      setError(
        errors
          ? Object.values(errors).flat().join(' ')
          : err.response?.data?.message || 'Une erreur est survenue.'
      )
    } finally {
      setSaving(false)
    }
  }

  const remove = async item => {
    if (!window.confirm('Confirmer la suppression de cet élément ?')) return

    try {
      await api.delete(`/${page}/${item.id}`)
      setNotice('Suppression réussie.')
      await loadData()
    } catch (err) {
      setError(err.response?.data?.message || 'Échec de la suppression.')
    }
  }

  const changePage = nextPage => {
    setPage(nextPage)
    setSearch('')
    setFilters({ nom: '', prenom: '', matricule: '', email: '', duree_min: '', duree_max: '', cout_min: '', cout_max: '', etudiant_id: '', formation_id: '', statut: '', date_debut: '', date_fin: '' })
    setNotice('')
    setError('')
  }

  const currentRows =
    page === 'etudiants' ? students :
    page === 'formations' ? formations :
    page === 'inscriptions' ? inscriptions : []

  const fields =
    page === 'etudiants'
      ? [
          ['matricule', 'Matricule', 'text', true],
          ['nom', 'Nom', 'text', true],
          ['prenom', 'Prénom', 'text', true],
          ['email', 'Adresse email', 'email', true],
          ['telephone', 'Téléphone', 'tel', false],
          ['date_naissance', 'Date de naissance', 'date', false],
        ]
      : page === 'formations'
      ? [
          ['code', 'Code formation', 'text', true],
          ['intitule', 'Intitulé', 'text', true],
          ['description', 'Description', 'text', false],
          ['duree_mois', 'Durée (mois)', 'number', false],
          ['cout', 'Coût (FCFA)', 'number', true],
        ]
      : [
          ['etudiant_id', 'Étudiant', 'select-student', true],
          ['formation_id', 'Formation', 'select-formation', true],
          ['date_inscription', "Date d'inscription", 'date', true],
          ['statut', 'Statut', 'select-status', true],
        ]

  const columns =
    page === 'etudiants'
      ? [
          ['matricule', 'Matricule'],
          ['nom', 'Nom'],
          ['prenom', 'Prénom'],
          ['email', 'Email'],
          ['telephone', 'Téléphone'],
        ]
      : page === 'formations'
      ? [
          ['code', 'Code'],
          ['intitule', 'Intitulé'],
          ['duree_mois', 'Durée (mois)'],
          ['cout', 'Coût'],
        ]
      : [
          ['etudiant', 'Étudiant'],
          ['formation', 'Formation'],
          ['date_inscription', 'Date'],
          ['statut', 'Statut'],
        ]

  const renderValue = (item, key) => {
    if (key === 'etudiant') {
      return item.etudiant
        ? `${item.etudiant.prenom} ${item.etudiant.nom}`
        : '—'
    }

    if (key === 'formation') return item.formation?.intitule || '—'
    if (key === 'cout') return money(item.cout)
    if (key === 'date_inscription') return item.date_inscription?.slice(0, 10) || '—'
    if (key === 'statut') {
      return (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
          item.statut === 'en_cours'
            ? 'bg-blue-50 text-blue-700'
            : item.statut === 'terminee'
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-700'
        }`}>
          {item.statut}
        </span>
      )
    }

    return item[key] ?? '—'
  }

  const statsCards = [
    {
      label: 'Étudiants',
      value: stats.total_etudiants,
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Formations',
      value: stats.total_formations,
      icon: BookOpen,
      color: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Inscriptions',
      value: stats.total_inscriptions,
      icon: ClipboardList,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'En cours',
      value: stats.inscriptions_en_cours,
      icon: GraduationCap,
      color: 'bg-emerald-50 text-emerald-600',
    },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar page={page} setPage={changePage} />

      <main className="min-w-0 flex-1 p-5 sm:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Administration / {labels[page]}</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {labels[page]}
            </h2>
          </div>

          {page !== 'dashboard' && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <Plus size={18} />
              Ajouter
            </button>
          )}
        </header>

        {error && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p>{error}</p>
            <button onClick={() => setError('')} aria-label="Fermer">
              <X size={18} />
            </button>
          </div>
        )}

        {notice && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {notice}
            <button className="ml-3 underline" onClick={() => setNotice('')}>
              Fermer
            </button>
          </div>
        )}

        {page === 'dashboard' ? (
          <>
            <section className="mb-7 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-600 p-7 text-white shadow-sm">
              <p className="text-sm text-blue-100">Bienvenue sur EduGest</p>
              <h3 className="mt-2 text-2xl font-bold">
                Gérez votre établissement simplement.
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
                Retrouvez vos étudiants, vos formations et vos inscriptions depuis un seul espace.
              </p>
              <button
                onClick={() => changePage('etudiants')}
                className="mt-5 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                Gérer les étudiants
              </button>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statsCards.map(({ label, value, icon: Icon, color }) => (
                <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <div className={`rounded-xl p-3 ${color}`}>
                      <Icon size={21} />
                    </div>
                  </div>
                  <p className="mt-5 text-3xl font-bold text-slate-900">{value}</p>
                </article>
              ))}
            </section>

            <section className="mt-7 grid gap-5 xl:grid-cols-2">
              <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5">
                  <h3 className="font-semibold text-slate-900">Inscriptions par formation</h3>
                  <p className="mt-1 text-sm text-slate-500">Nombre d'inscriptions enregistrées pour chaque formation.</p>
                </div>
                {stats.inscriptions_par_formation && stats.inscriptions_par_formation.length > 0 ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.inscriptions_par_formation} margin={{ top: 8, right: 12, left: -16, bottom: 24 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="intitule" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" interval={0} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="total" name="Inscriptions" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-72 items-center justify-center rounded-xl bg-slate-50 px-4 text-center text-sm text-slate-500">
                    Aucune inscription par formation à afficher pour le moment.
                  </div>
                )}
              </article>

              <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5">
                  <h3 className="font-semibold text-slate-900">Répartition par statut</h3>
                  <p className="mt-1 text-sm text-slate-500">État actuel des inscriptions.</p>
                </div>
                {stats.inscriptions_par_statut && stats.inscriptions_par_statut.length > 0 ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.inscriptions_par_statut}
                          dataKey="total"
                          nameKey="statut"
                          cx="50%"
                          cy="46%"
                          outerRadius={88}
                          paddingAngle={3}
                          label={({ statut, total }) => `${statusLabel(statut)} (${total})`}
                        >
                          {stats.inscriptions_par_statut.map((entry, index) => (
                            <Cell key={entry.statut || index} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, statusLabel(name)]} />
                        <Legend formatter={value => statusLabel(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-72 items-center justify-center rounded-xl bg-slate-50 px-4 text-center text-sm text-slate-500">
                    Aucune inscription à répartir par statut.
                  </div>
                )}
              </article>

              <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                <div className="mb-5">
                  <h3 className="font-semibold text-slate-900">Évolution mensuelle</h3>
                  <p className="mt-1 text-sm text-slate-500">Nombre d'inscriptions enregistrées par mois.</p>
                </div>
                {stats.inscriptions_par_mois && stats.inscriptions_par_mois.length > 0 ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={stats.inscriptions_par_mois.map(item => ({
                          ...item,
                          mois_libelle: item.mois
                            ? new Date(`${item.mois}-01T00:00:00`).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
                            : item.mois,
                        }))}
                        margin={{ top: 8, right: 20, left: -16, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="mois_libelle" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="total" name="Inscriptions" stroke="#0EA5E9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-72 items-center justify-center rounded-xl bg-slate-50 px-4 text-center text-sm text-slate-500">
                    Les données mensuelles apparaîtront après l'enregistrement des inscriptions.
                  </div>
                )}
              </article>
            </section>

            <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-slate-900">Accès rapide</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ['etudiants', 'Gérer les étudiants', Users],
                  ['formations', 'Gérer les formations', BookOpen],
                  ['inscriptions', 'Gérer les inscriptions', ClipboardList],
                ].map(([id, label, Icon]) => (
                  <button
                    key={id}
                    onClick={() => changePage(id)}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left hover:border-blue-300 hover:bg-blue-50"
                  >
                    <Icon size={21} className="text-blue-600" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder={
                    page === 'etudiants'
                      ? 'Rechercher par nom, matricule ou email...'
                      : page === 'formations'
                      ? 'Rechercher une formation...'
                      : 'Filtrer les inscriptions avec les données disponibles...'
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                onClick={loadData}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 hover:bg-slate-100"
              >
                <RefreshCw size={16} />
                Actualiser
              </button>
            </section>

            <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-blue-600" />
                <h3 className="font-semibold text-slate-900">Filtres avancés</h3>
                <span className="text-xs text-slate-500">Combine plusieurs critères si nécessaire.</span>
              </div>
              {page === 'etudiants' && (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ['nom', 'Nom'], ['prenom', 'Prénom'], ['matricule', 'Matricule'], ['email', 'Email'],
                  ].map(([key, label]) => (
                    <label key={key} className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">
                      {label}
                      <input value={filters[key]} onChange={event => setFilters({ ...filters, [key]: event.target.value })} placeholder={`Filtrer par ${label.toLowerCase()}`} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                    </label>
                  ))}
                </div>
              )}
              {page === 'formations' && (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ['duree_min', 'Durée min. (mois)'], ['duree_max', 'Durée max. (mois)'], ['cout_min', 'Coût min. (FCFA)'], ['cout_max', 'Coût max. (FCFA)'],
                  ].map(([key, label]) => (
                    <label key={key} className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">
                      {label}
                      <input type="number" min="0" value={filters[key]} onChange={event => setFilters({ ...filters, [key]: event.target.value })} placeholder="Toutes valeurs" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                    </label>
                  ))}
                </div>
              )}
              {page === 'inscriptions' && (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">Étudiant
                    <select value={filters.etudiant_id} onChange={event => setFilters({ ...filters, etudiant_id: event.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500">
                      <option value="">Tous les étudiants</option>
                      {students.map(student => <option key={student.id} value={student.id}>{student.prenom} {student.nom} — {student.matricule}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">Formation
                    <select value={filters.formation_id} onChange={event => setFilters({ ...filters, formation_id: event.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500">
                      <option value="">Toutes les formations</option>
                      {formations.map(formation => <option key={formation.id} value={formation.id}>{formation.intitule}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">Statut
                    <select value={filters.statut} onChange={event => setFilters({ ...filters, statut: event.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500">
                      <option value="">Tous les statuts</option><option value="en_cours">En cours</option><option value="terminee">Terminée</option><option value="annulee">Annulée</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">Date de début
                    <input type="date" value={filters.date_debut} onChange={event => setFilters({ ...filters, date_debut: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500" />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">Date de fin
                    <input type="date" value={filters.date_fin} onChange={event => setFilters({ ...filters, date_fin: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500" />
                  </label>
                </div>
              )}
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button onClick={() => { setSearch(''); setFilters({ nom: '', prenom: '', matricule: '', email: '', duree_min: '', duree_max: '', cout_min: '', cout_max: '', etudiant_id: '', formation_id: '', statut: '', date_debut: '', date_fin: '' }) }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Réinitialiser</button>
                <button onClick={loadData} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Appliquer les filtres</button>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{labels[page]}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {currentRows.length} résultat(s) sur cette page
                  </p>
                </div>
                {loading && <span className="text-xs text-slate-500">Chargement...</span>}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      {columns.map(([key, label]) => (
                        <th key={key} className="whitespace-nowrap px-5 py-4 font-semibold">
                          {label}
                        </th>
                      ))}
                      <th className="px-5 py-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentRows.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        {columns.map(([key]) => (
                          <td key={key} className="whitespace-nowrap px-5 py-4 text-slate-600">
                            {renderValue(item, key)}
                          </td>
                        ))}
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEdit(item)}
                              title="Modifier"
                              className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                            >
                              <Pencil size={17} />
                            </button>
                            <button
                              onClick={() => remove(item)}
                              title="Supprimer"
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!loading && currentRows.length === 0 && (
                      <tr>
                        <td colSpan={columns.length + 1} className="px-5 py-12 text-center text-slate-500">
                          Aucun résultat pour le moment.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={event => {
            if (event.target === event.currentTarget && !saving) setModal(false)
          }}
        >
          <div className="my-auto max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b-2 border-indigo-200 bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 px-5 py-5 text-white">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/20">
                  {page === 'etudiants' ? <Users size={22} /> : page === 'formations' ? <BookOpen size={22} /> : <ClipboardList size={22} />}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                    EduGest · Formulaire
                  </p>
                  <h3 className="mt-1 text-xl font-bold sm:text-2xl">
                    {editing ? 'Modifier' : 'Nouvel élément'} — {labels[page]}
                  </h3>
                  <p className="mt-1 text-sm text-blue-100">
                    {page === 'etudiants'
                      ? 'Renseigne les informations personnelles de l’étudiant.'
                      : page === 'formations'
                      ? 'Décris la formation et ses informations financières.'
                      : 'Associe un étudiant à une formation et définis le statut.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => setModal(false)}
                aria-label="Fermer le formulaire"
                className="rounded-xl p-2 text-white/90 transition hover:bg-white/15 disabled:opacity-50"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={save} className="space-y-5 border-t border-slate-100 px-5 py-5">
              <div className="grid grid-cols-1 gap-y-4">
                {fields.map(([key, label, type, required]) => (
                  <label
                    key={key}
                    className={`flex min-w-0 flex-col gap-2 text-sm font-semibold text-slate-700 ${
                      key === 'description' ? 'w-full' : ''
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {label}
                      {required && <span className="text-rose-500" aria-label="obligatoire">*</span>}
                    </span>

                    {type === 'select-student' ? (
                      <select
                        required={required}
                        value={form[key]}
                        onChange={event => setForm({ ...form, [key]: event.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-normal text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                      >
                        <option value="">Choisir un étudiant</option>
                        {students.map(student => (
                          <option key={student.id} value={student.id}>
                            {student.prenom} {student.nom} — {student.matricule}
                          </option>
                        ))}
                      </select>
                    ) : type === 'select-formation' ? (
                      <select
                        required={required}
                        value={form[key]}
                        onChange={event => setForm({ ...form, [key]: event.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-normal text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                      >
                        <option value="">Choisir une formation</option>
                        {formations.map(formation => (
                          <option key={formation.id} value={formation.id}>
                            {formation.intitule}
                          </option>
                        ))}
                      </select>
                    ) : type === 'select-status' ? (
                      <select
                        required={required}
                        value={form[key]}
                        onChange={event => setForm({ ...form, [key]: event.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-normal text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                      >
                        <option value="en_cours">En cours</option>
                        <option value="terminee">Terminée</option>
                        <option value="annulee">Annulée</option>
                      </select>
                    ) : (
                      <input
                        type={type}
                        required={required}
                        min={type === 'number' ? 0 : undefined}
                        step={key === 'cout' ? '1' : undefined}
                        value={form[key]}
                        onChange={event => setForm({ ...form, [key]: event.target.value })}
                        placeholder={
                          key === 'matricule' ? 'Ex. ETU-2026-001' :
                          key === 'nom' ? 'Nom de famille' :
                          key === 'prenom' ? 'Prénom(s)' :
                          key === 'email' ? 'exemple@domaine.com' :
                          key === 'telephone' ? 'Ex. 01 90 00 00 00' :
                          key === 'code' ? 'Ex. INFO-L3' :
                          key === 'intitule' ? 'Nom de la formation' :
                          key === 'description' ? 'Présente brièvement la formation…' :
                          key === 'duree_mois' ? 'Durée en mois' :
                          key === 'cout' ? 'Montant en FCFA' : ''
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-normal text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                      />
                    )}
                    {key === 'cout' && <span className="text-xs font-normal text-slate-500">Montant exprimé en FCFA.</span>}
                    {key === 'matricule' && <span className="text-xs font-normal text-slate-500">Doit être unique pour chaque étudiant.</span>}
                    {key === 'description' && <span className="text-xs font-normal text-slate-500">Une description courte et compréhensible suffit.</span>}
                  </label>
                ))}
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  <span className="mt-0.5 font-bold">!</span>
                  <p>{error}</p>
                </div>
              )}

              <div className="sticky bottom-0 z-20 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 pb-5 pt-4 shadow-[0_-8px_18px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between">
                <p className="self-center text-xs text-slate-400"><span className="text-rose-500">*</span> Champs obligatoires</p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{ backgroundColor: saving ? '#9CA3AF' : '#4F46E5', color: '#FFFFFF', minWidth: '145px' }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? <RefreshCw size={16} className="animate-spin" /> : editing ? <Pencil size={16} /> : <Plus size={17} />}
                    {saving ? 'Enregistrement…' : editing ? 'Enregistrer les modifications' : 'Créer'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
