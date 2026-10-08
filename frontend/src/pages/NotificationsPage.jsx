/**
 * NotificationsPage — Centre de notifications in-app.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, FileText, Star, MessageSquare, Briefcase, ShieldCheck } from 'lucide-react'
import clsx from 'clsx'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import notificationService from '@/services/notificationService'

const TYPE_CONFIG = {
  QUOTE_REQUEST:  { icon: FileText,      color: 'bg-blue-100 text-blue-600' },
  QUOTE_SENT:     { icon: FileText,      color: 'bg-primary-100 text-primary-600' },
  QUOTE_ACCEPTED: { icon: CheckCheck,    color: 'bg-green-100 text-green-600' },
  QUOTE_REFUSED:  { icon: FileText,      color: 'bg-red-100 text-red-600' },
  BOOKING:        { icon: Briefcase,     color: 'bg-purple-100 text-purple-600' },
  WORK_PROGRESS:  { icon: Briefcase,     color: 'bg-amber-100 text-amber-600' },
  WORK_FINISHED:  { icon: CheckCheck,    color: 'bg-green-100 text-green-600' },
  NEW_REVIEW:     { icon: Star,          color: 'bg-amber-100 text-amber-600' },
  PROFILE:        { icon: ShieldCheck,   color: 'bg-primary-100 text-primary-600' },
  MESSAGE:        { icon: MessageSquare, color: 'bg-secondary-100 text-secondary-600' },
}

export default function NotificationsPage() {
  const qc       = useQueryClient()
  const navigate = useNavigate()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => notificationService.getNotifications().then(r => r.data.results ?? r.data),
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries(['notifications'])
      qc.invalidateQueries(['unread-notifications'])
    },
  })

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationService.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries(['notifications'])
      qc.invalidateQueries(['unread-notifications'])
    },
  })

  const handleClick = (notif) => {
    if (!notif.is_read) markReadMutation.mutate(notif.id)
    if (notif.link) navigate(notif.link)
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-secondary-900">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-secondary-500 mt-0.5">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="btn btn-secondary btn-sm gap-2"
          >
            <CheckCheck size={15} />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><span className="spinner w-8 h-8" /></div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-12">
          <Bell size={32} className="mx-auto text-secondary-200 mb-3" />
          <p className="text-secondary-500">Aucune notification pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => {
            const cfg  = TYPE_CONFIG[notif.notif_type] || TYPE_CONFIG.MESSAGE
            const Icon = cfg.icon
            return (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={clsx(
                  'w-full flex items-start gap-4 p-4 rounded-2xl border transition-all text-left',
                  notif.is_read
                    ? 'bg-white border-secondary-100 hover:bg-secondary-50'
                    : 'bg-primary-50 border-primary-100 hover:bg-primary-100'
                )}
              >
                {/* Icône */}
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.color)}>
                  <Icon size={18} />
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-start justify-between gap-2">
                    <p className={clsx(
                      'text-sm font-semibold',
                      notif.is_read ? 'text-secondary-700' : 'text-secondary-900'
                    )}>
                      {notif.title}
                    </p>
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-secondary-500 mt-0.5 leading-relaxed">
                    {notif.message}
                  </p>
                  <p className="text-xs text-secondary-400 mt-1">
                    {format(new Date(notif.created_at), 'dd MMM à HH:mm', { locale: fr })}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
