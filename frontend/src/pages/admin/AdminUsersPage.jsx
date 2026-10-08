/**
 * AdminUsersPage — Gestion de tous les utilisateurs de la plateforme.
 * L'admin peut rechercher, filtrer par rôle, activer/désactiver les comptes.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Search, Users, Paintbrush, ShieldCheck,
  CheckCircle, XCircle, ToggleLeft, ToggleRight
} from 'lucide-react'
import clsx from 'clsx'
import adminService from '@/services/adminService'
import { useAuthStore } from '@/store/authStore'

// ---------------------------------------------------------------------------
// Badge rôle
// ---------------------------------------------------------------------------
const ROLE_CONFIG = {
  CLIENT:  { label: 'Client',         cls: 'badge-info',    icon: Users },
  PEINTRE: { label: 'Peintre',        cls: 'badge-warning', icon: Paintbrush },
  ADMIN:   { label: 'Administrateur', cls: 'badge-neutral', icon: ShieldCheck },
}

function RoleBadge({ role }) {
  const cfg  = ROLE_CONFIG[role] || { label: role, cls: 'badge-neutral', icon: Users }
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
}

// ---------------------------------------------------------------------------
// Filtres rôle
// ---------------------------------------------------------------------------
const ROLE_FILTERS = [
  { value: '',        label: 'Tous les rôles' },
  { value: 'CLIENT',  label: 'Clients' },
  { value: 'PEINTRE', label: 'Peintres' },
  { value: 'ADMIN',   label: 'Admins' },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminUsersPage() {
  const { t }       = useTranslation('admin')
  const { user: me } = useAuthStore()
  const qc          = useQueryClient()

  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter, search],
    queryFn:  () => adminService.getUsers({
      role:   roleFilter || undefined,
      search: search || undefined,
    }).then(r => r.data.results ?? r.data),
    keepPreviousData: true,
  })

  const users = data || []

  const toggleMutation = useMutation({
    mutationFn: (id) => adminService.toggleUserActive(id),
    onSuccess: (res, id) => {
      qc.invalidateQueries(['admin-users'])
      const isActive = res.data.is_active
      toast.success(isActive ? 'Compte activé.' : 'Compte désactivé.')
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Erreur.')
    },
  })

  return (
    <div className="max-w-5xl mx-auto">

      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-secondary-900">
          {t('users_management')}
        </h1>
        <p className="text-secondary-500 text-sm mt-1">
          Gérez les comptes clients, peintres et administrateurs.
        </p>
      </div>

      {/* Filtres */}
      <div className="card mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              className="input pl-9"
              placeholder={t('search_user')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {ROLE_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setRoleFilter(f.value)}
                className={clsx(
                  'px-3 py-2 rounded-xl text-xs font-medium transition-colors border',
                  roleFilter === f.value
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

      {/* Compteur */}
      {!isLoading && (
        <p className="text-sm text-secondary-400 mb-3">
          {users.length} utilisateur{users.length > 1 ? 's' : ''}
        </p>
      )}

      {/* Liste */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="spinner w-8 h-8" />
        </div>
      ) : users.length === 0 ? (
        <div className="card text-center py-12">
          <Users size={32} className="mx-auto text-secondary-200 mb-3" />
          <p className="text-secondary-500">Aucun utilisateur trouvé.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(user => {
            const isMe = user.id === me?.id
            return (
              <div
                key={user.id}
                className={clsx(
                  'card flex items-center gap-4',
                  !user.is_active && 'opacity-60'
                )}
              >
                {/* Avatar */}
                <div className={clsx(
                  'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0',
                  user.role === 'ADMIN'   ? 'bg-purple-100 text-purple-700' :
                  user.role === 'PEINTRE' ? 'bg-primary-100 text-primary-700' :
                                            'bg-blue-100 text-blue-700'
                )}>
                  {user.first_name?.[0]?.toUpperCase() || '?'}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-secondary-900 text-sm">
                      {user.first_name} {user.last_name}
                      {isMe && (
                        <span className="ml-1 text-xs text-secondary-400">(vous)</span>
                      )}
                    </p>
                    <RoleBadge role={user.role} />
                    {!user.is_active && (
                      <span className="badge badge-error">Désactivé</span>
                    )}
                    {user.validation_status && user.validation_status !== 'VALIDE' && (
                      <span className="badge badge-warning text-xs">
                        {user.validation_status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-secondary-400 truncate">{user.email}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-secondary-400">
                    {user.city && <span>📍 {user.city}</span>}
                    <span>
                      Inscrit le {new Date(user.date_joined).toLocaleDateString('fr-FR')}
                    </span>
                    <span>
                      Dernière connexion : {
                        user.last_login
                          ? new Date(user.last_login).toLocaleDateString('fr-FR')
                          : t('never')
                      }
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {!isMe && (
                  <button
                    onClick={() => toggleMutation.mutate(user.id)}
                    disabled={toggleMutation.isPending}
                    title={user.is_active ? 'Désactiver le compte' : 'Activer le compte'}
                    className={clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors flex-shrink-0',
                      user.is_active
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    )}
                  >
                    {toggleMutation.isPending ? (
                      <span className="spinner w-3 h-3" />
                    ) : user.is_active ? (
                      <><ToggleRight size={14} /> Désactiver</>
                    ) : (
                      <><ToggleLeft size={14} /> Activer</>
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
