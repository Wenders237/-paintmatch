/**
 * Sidebar — Menu latéral de l'espace connecté.
 * Les liens sont strictement filtrés selon le rôle de l'utilisateur.
 * Un CLIENT ne voit jamais les liens PEINTRE et vice-versa.
 */

import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, User, FileText, CalendarCheck,
  MessageSquare, Bell, Star, Users, Settings,
  Paintbrush, LogOut, Briefcase, BarChart3,
  ShieldCheck, Clock
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import authService from '@/services/authService'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// ---------------------------------------------------------------------------
// Liens par rôle — chaque rôle a ses propres liens, aucun partage non voulu
// ---------------------------------------------------------------------------

const getClientLinks = (t) => [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/profile',         icon: User,            label: 'Mon profil' },
  { to: '/painters',        icon: Paintbrush,      label: 'Trouver un peintre' },
  { to: '/client/quotes',   icon: FileText,        label: 'Mes devis' },
  { to: '/client/bookings', icon: CalendarCheck,   label: 'Mes réservations' },
  { to: '/client/reviews',  icon: Star,            label: 'Mes évaluations' },
  { to: '/messages',        icon: MessageSquare,   label: 'Messages' },
  { to: '/notifications',   icon: Bell,            label: 'Notifications' },
]

const getPainterLinks = (t) => [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/painter/profile', icon: User,            label: 'Mon profil pro' },
  { to: '/painter/quotes',  icon: FileText,        label: 'Mes devis' },
  { to: '/painter/works',   icon: Briefcase,       label: 'Mes travaux' },
  { to: '/messages',        icon: MessageSquare,   label: 'Messages' },
  { to: '/notifications',   icon: Bell,            label: 'Notifications' },
  { to: '/painter/reviews', icon: Star,            label: 'Mes évaluations' },
]

const getAdminLinks = (t) => [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Vue d\'ensemble' },
  { to: '/admin/painters',  icon: ShieldCheck,     label: 'Validation peintres' },
  { to: '/admin/users',     icon: Users,           label: 'Utilisateurs' },
  { to: '/admin/stats',     icon: BarChart3,       label: 'Statistiques' },
  { to: '/admin/settings',  icon: Settings,        label: 'Paramètres' },
]

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------
export default function Sidebar() {
  const { t }                    = useTranslation()
  const { user, refreshToken, logout } = useAuthStore()
  const navigate                 = useNavigate()

  // Compteur de notifications non lues
  const { data: unreadData } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn:  () => import('@/services/notificationService')
      .then(m => m.default.getUnreadCount())
      .then(r => r.data),
    refetchInterval: 30000,
  })
  const unreadCount = unreadData?.unread_count || 0

  // Sélection stricte des liens selon le rôle
  const links =
    user?.role === 'ADMIN'   ? getAdminLinks(t) :
    user?.role === 'PEINTRE' ? getPainterLinks(t) :
                               getClientLinks(t)

  const handleLogout = async () => {
    try {
      if (refreshToken) await authService.logout(refreshToken)
    } catch (_) {
      // On déconnecte même si l'API échoue
    }
    logout()
    toast.success('Vous avez été déconnecté.')
    navigate('/')
  }

  // Badge de rôle
  const roleBadge = {
    CLIENT:  { label: 'Client',        bg: 'bg-blue-50 text-blue-700' },
    PEINTRE: { label: 'Peintre',       bg: 'bg-primary-50 text-primary-700' },
    ADMIN:   { label: 'Administrateur', bg: 'bg-purple-50 text-purple-700' },
  }[user?.role] || { label: user?.role, bg: 'bg-secondary-100 text-secondary-600' }

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-secondary-100 min-h-screen">

      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-secondary-100">
        <Paintbrush size={22} className="text-primary-500" />
        <span className="font-heading font-bold text-lg text-secondary-900">PaintMatch</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon: Icon, label, soon }) => (
          <div key={to} className="relative">
            <NavLink
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors no-underline',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900',
                  soon && 'opacity-50 pointer-events-none'
                )
              }
            >
              <Icon size={17} />
              <span className="flex-1">{label}</span>
              {/* Badge rouge notifications */}
              {to === '/notifications' && unreadCount > 0 && (
                <span className="w-5 h-5 bg-error text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              {soon && (
                <span className="text-xs bg-secondary-100 text-secondary-400 px-1.5 py-0.5 rounded-md">
                  Bientôt
                </span>
              )}
            </NavLink>
          </div>
        ))}
      </nav>

      {/* Profil + déconnexion */}
      <div className="px-3 py-4 border-t border-secondary-100">

        {/* Infos utilisateur */}
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
            {user?.first_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-secondary-900 truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${roleBadge.bg}`}>
              {roleBadge.label}
            </span>
          </div>
        </div>

        {/* Lien profil */}
        <NavLink
          to={user?.role === 'PEINTRE' ? '/painter/profile' : '/profile'}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors no-underline mb-0.5',
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-secondary-600 hover:bg-secondary-50'
            )
          }
        >
          <User size={17} />
          Mon profil
        </NavLink>

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-secondary-600 hover:bg-red-50 hover:text-error transition-colors"
        >
          <LogOut size={17} />
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}
