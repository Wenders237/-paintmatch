/**
 * AdminPaintersPage — Liste de tous les peintres avec filtre par statut.
 * Accessible uniquement aux administrateurs.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  Search, ChevronRight, Clock, CheckCircle,
  XCircle, AlertCircle, Filter
} from 'lucide-react'
import clsx from 'clsx'
import adminService from '@/services/adminService'

// ---------------------------------------------------------------------------
// Badge de statut de validation
// ---------------------------------------------------------------------------
const STATUS_CONFIG = {
  EN_ATTENTE:  { label: 'En attente',    cls: 'badge-warning',  icon: Clock },
  VALIDE:      { label: 'Validé',        cls: 'badge-success',  icon: CheckCircle },
  REFUSE:      { label: 'Refusé',        cls: 'badge-error',    icon: XCircle },
  SUSPENDU:    { label: 'Suspendu',      cls: 'badge-error',    icon: XCircle },
  COMPLEMENT:  { label: 'Complément',    cls: 'badge-info',     icon: AlertCircle },
}

function StatusBadge({ status }) {
  const cfg  = STATUS_CONFIG[status] || { label: status, cls: 'badge-neutral', icon: Clock }
  const Icon = cfg.icon
  return (
    <span className={`badge ${cfg.cls} flex items-center gap-1`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Filtres de statut
// ---------------------------------------------------------------------------
const FILTERS = [
  { value: '',            label: 'Tous' },
  { value: 'EN_ATTENTE',  label: 'En attente' },
  { value: 'VALIDE',      label: 'Validés' },
  { value: 'REFUSE',      label: 'Refusés' },
  { value: 'COMPLEMENT',  label: 'Complément' },
  { value: 'SUSPENDU',    label: 'Suspendus' },
]

// ---------------------------------------------------------------------------
// Page principale
// ---------------------------------------------------------------------------
export default function AdminPaintersPage() {
  const { t }              = useTranslation('admin')
  const [search, setSearch]   = useState('')
  const [statusFilter, setStatusFilter] = useState('EN_ATTENTE')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-painters', statusFilter, search],
    queryFn:  () => adminService.getPainters({
      validation_status: statusFilter || undefined,
      search: search || undefined,
    }).then(r => r.data.results ?? r.data),
    keepPreviousData: true,
  })

  const painters = data || []

  return (
    <div className="max-w-5xl mx-auto">

      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-secondary-900">
          {t('painters_validation')}
        </h1>
        <p className="text-secondary-500 text-sm mt-1">
          Examinez et validez les dossiers des peintres inscrits.
        </p>
      </div>

      {/* Barre de recherche + filtres */}
      <div className="card mb-5">
        <div className="flex flex-col sm:flex-row gap-3">

          {/* Recherche */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              className="input pl-9"
              placeholder={t('search_painter')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Filtre statut */}
          <div className="flex gap-1 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={clsx(
                  'px-3 py-2 rounded-xl text-xs font-medium transition-colors border',
                  statusFilter === f.value
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-secondary-600 border-secondary-200 hover:border-primary-300'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="spinner w-8 h-8" />
        </div>
      ) : painters.length === 0 ? (
        <div className="card text-center py-12">
          <Clock size={32} className="mx-auto text-secondary-200 mb-3" />
          <p className="text-secondary-500">{t('no_pending')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {painters.map(painter => (
            <Link
              key={painter.id}
              to={`/admin/painters/${painter.id}`}
              className="card-hover flex items-center gap-4 no-underline"
            >
              {/* Avatar initiales */}
              <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
                {painter.full_name?.[0]?.toUpperCase() || '?'}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-secondary-900">{painter.full_name}</p>
                  <StatusBadge status={painter.validation_status} />
                </div>
                <p className="text-sm text-secondary-400 truncate">{painter.email}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-secondary-400">
                  {painter.city && <span>📍 {painter.city}</span>}
                  {painter.years_experience > 0 && (
                    <span>{painter.years_experience} an{painter.years_experience > 1 ? 's' : ''} exp.</span>
                  )}
                  <span>{painter.skills_count} compétence{painter.skills_count > 1 ? 's' : ''}</span>
                  <span>{painter.documents_count} document{painter.documents_count > 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Date inscription */}
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-secondary-400">
                  {new Date(painter.date_joined).toLocaleDateString('fr-FR')}
                </p>
                {painter.validation_note && (
                  <p className="text-xs text-secondary-400 italic mt-0.5 max-w-[120px] truncate">
                    {painter.validation_note}
                  </p>
                )}
              </div>

              <ChevronRight size={16} className="text-secondary-300 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
