/**
 * DashboardHeader — Barre supérieure de l'espace connecté.
 * Affiche le rôle, le nom et les raccourcis (notifications, messages).
 */

import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, MessageSquare, LogOut } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import authService from '@/services/authService'
import notificationService from '@/services/notificationService'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import toast from 'react-hot-toast'

const ROLE_LABELS = {
  CLIENT:  { label: 'Client',         bg: 'bg-blue-50 text-blue-700' },
  PEINTRE: { label: 'Peintre',        bg: 'bg-primary-50 text-primary-700' },
  ADMIN:   { label: 'Administrateur', bg: 'bg-purple-50 text-purple-700' },
}

export default function DashboardHeader() {
  const { user, refreshToken, logout } = useAuthStore()
  const navigate = useNavigate()

  // Compteur de notifications non lues — polling toutes les 30s
  const { data: unreadData } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn:  () => notificationService.getUnreadCount().then(r => r.data),
    refetchInterval: 30000,
  })
  const unreadCount = unreadData?.unread_count || 0

  const role = ROLE_LABELS[user?.role] || { label: user?.role, bg: 'bg-secondary-100 text-secondary-600' }

  const handleLogout = async () => {
    try {
      if (refreshToken) await authService.logout(refreshToken)
    } catch (_) {}
    logout()
    toast.success('Vous avez été déconnecté.')
    navigate('/')
  }

  return (
    <header className="bg-white border-b border-secondary-100 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">

      {/* Gauche — identité */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
          {user?.first_name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-secondary-900 truncate">
            {user?.first_name} {user?.last_name}
          </p>
          <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${role.bg}`}>
            {role.label}
          </span>
        </div>
      </div>

      {/* Droite — actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <LanguageSwitcher />

        <Link
          to="/notifications"
          className="relative p-2 text-secondary-400 hover:text-primary-600 transition-colors rounded-lg hover:bg-secondary-50"
          aria-label="Notifications"
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <Link
          to="/messages"
          className="p-2 text-secondary-400 hover:text-primary-600 transition-colors rounded-lg hover:bg-secondary-50"
          aria-label="Messages"
        >
          <MessageSquare size={19} />
        </Link>

        {/* Déconnexion rapide */}
        <button
          onClick={handleLogout}
          className="p-2 text-secondary-400 hover:text-error transition-colors rounded-lg hover:bg-red-50"
          aria-label="Se déconnecter"
          title="Se déconnecter"
        >
          <LogOut size={19} />
        </button>
      </div>
    </header>
  )
}
