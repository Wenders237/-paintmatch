/**
 * AdminDashboard — Tableau de bord administrateur.
 *
 * Affiche :
 * - Statistiques globales de la plateforme
 * - Peintres en attente de validation
 * - Raccourcis vers les outils d'administration
 */

import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import {
  Users, Paintbrush, FileText, Star,
  Clock, CheckCircle, XCircle, ArrowRight,
  BarChart3, Settings, ShieldCheck
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Carte statistique
// ---------------------------------------------------------------------------
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-heading font-bold text-secondary-900">
          {value ?? <span className="spinner w-5 h-5 inline-block" />}
        </p>
        <p className="text-sm text-secondary-500">{label}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export default function AdminDashboard() {

  // Statistiques globales
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin-panel/stats/').then(r => r.data).catch(() => null),
    retry: false,
  })

  // Peintres en attente de validation
  const { data: pendingPainters = [] } = useQuery({
    queryKey: ['admin-pending-painters'],
    queryFn: () => api.get('/admin-panel/painters/?validation_status=EN_ATTENTE').then(r => r.data.results ?? r.data).catch(() => []),
    retry: false,
  })

  const adminActions = [
    {
      icon: Paintbrush,
      title: 'Validation des peintres',
      desc: `${pendingPainters.length} dossier(s) en attente`,
      to: '/admin/painters',
      color: 'bg-amber-50 text-amber-600',
      badge: pendingPainters.length > 0 ? pendingPainters.length : null,
    },
    {
      icon: Users,
      title: 'Gestion des utilisateurs',
      desc: 'Consulter, modifier, désactiver des comptes.',
      to: '/admin/users',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: BarChart3,
      title: 'Statistiques',
      desc: 'Activité de la plateforme.',
      to: '/admin/stats',
      color: 'bg-green-50 text-green-600',
    },
    {
      icon: Settings,
      title: 'Paramètres',
      desc: 'Configuration de la plateforme.',
      to: '/admin/settings',
      color: 'bg-secondary-100 text-secondary-600',
    },
  ]

  return (
    <div className="max-w-5xl mx-auto">

      {/* En-tête */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
          <ShieldCheck size={20} className="text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-secondary-900">
            Administration PaintMatch
          </h1>
          <p className="text-secondary-500 text-sm">Vue d'ensemble de la plateforme</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Users}
          label="Clients"
          value={stats?.clients_count ?? '—'}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={Paintbrush}
          label="Peintres validés"
          value={stats?.painters_validated ?? '—'}
          color="bg-primary-50 text-primary-600"
        />
        <StatCard
          icon={Clock}
          label="En attente"
          value={pendingPainters.length}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={FileText}
          label="Devis émis"
          value={stats?.quotes_count ?? '—'}
          color="bg-green-50 text-green-600"
        />
      </div>

      {/* Peintres en attente de validation */}
      {pendingPainters.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-secondary-900">
              Peintres en attente de validation
            </h2>
            <Link to="/admin/painters" className="text-sm text-primary-600 hover:text-primary-700 no-underline font-medium">
              Voir tout →
            </Link>
          </div>
          <div className="space-y-3">
            {pendingPainters.slice(0, 5).map((painter) => (
              <div key={painter.id} className="flex items-center gap-3 p-3 bg-secondary-50 rounded-xl">
                <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm flex-shrink-0">
                  {painter.user?.first_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-900 truncate">
                    {painter.user?.first_name} {painter.user?.last_name}
                  </p>
                  <p className="text-xs text-secondary-400 truncate">{painter.user?.email}</p>
                </div>
                <span className="badge badge-warning flex-shrink-0">En attente</span>
                <Link
                  to={`/admin/painters/${painter.id}`}
                  className="btn btn-primary btn-sm no-underline flex-shrink-0"
                >
                  Examiner
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions administratives */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {adminActions.map(({ icon: Icon, title, desc, to, color, badge }) => (
          <Link key={to} to={to} className="card-hover flex gap-4 items-center no-underline">
            <div className="relative">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={22} />
              </div>
              {badge && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {badge}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-secondary-900">{title}</p>
              <p className="text-sm text-secondary-500">{desc}</p>
            </div>
            <ArrowRight size={16} className="text-secondary-300 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
