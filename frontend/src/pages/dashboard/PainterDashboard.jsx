/**
 * PainterDashboard — Tableau de bord du peintre.
 *
 * Affiche :
 * - Statut de validation du profil (avec actions selon le statut)
 * - Raccourcis vers les fonctionnalités
 * - Complétude du profil (invitation à renseigner les infos manquantes)
 */

import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useQuery } from '@tanstack/react-query'
import authService from '@/services/authService'
import {
  User, FileText, Briefcase, Star,
  AlertCircle, CheckCircle, Clock, XCircle,
  ArrowRight, MessageSquare, ChevronRight
} from 'lucide-react'
import clsx from 'clsx'

// ---------------------------------------------------------------------------
// Bandeau de statut de validation
// ---------------------------------------------------------------------------
const VALIDATION_CONFIG = {
  EN_ATTENTE: {
    icon: Clock,
    bg: 'bg-amber-50 border-amber-200',
    iconColor: 'text-amber-500',
    title: 'Profil en attente de validation',
    msg: 'Notre équipe examine votre profil. Vous recevrez une notification dès qu\'il sera validé. En attendant, complétez votre profil pour accélérer le processus.',
    action: { label: 'Compléter mon profil', to: '/painter/profile' },
  },
  VALIDE: {
    icon: CheckCircle,
    bg: 'bg-green-50 border-green-200',
    iconColor: 'text-green-500',
    title: 'Profil validé ✓',
    msg: 'Votre profil est visible et actif. Les clients peuvent vous contacter et vous envoyer des demandes de devis.',
    action: null,
  },
  REFUSE: {
    icon: XCircle,
    bg: 'bg-red-50 border-red-200',
    iconColor: 'text-red-500',
    title: 'Profil refusé',
    msg: 'Votre profil n\'a pas été validé. Vérifiez vos documents et contactez le support pour plus d\'informations.',
    action: { label: 'Modifier mon profil', to: '/painter/profile' },
  },
  SUSPENDU: {
    icon: XCircle,
    bg: 'bg-red-50 border-red-200',
    iconColor: 'text-red-500',
    title: 'Compte suspendu',
    msg: 'Votre compte a été suspendu. Contactez l\'administration.',
    action: null,
  },
  COMPLEMENT: {
    icon: AlertCircle,
    bg: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-500',
    title: 'Informations complémentaires requises',
    msg: 'L\'administrateur a besoin d\'informations supplémentaires. Complétez votre profil avec les documents demandés.',
    action: { label: 'Compléter mon profil', to: '/painter/profile' },
  },
}

function ValidationBanner({ status, note }) {
  const config = VALIDATION_CONFIG[status] || VALIDATION_CONFIG['EN_ATTENTE']
  const Icon = config.icon

  return (
    <div className={`rounded-xl border p-4 mb-6 ${config.bg}`}>
      <div className="flex gap-3 items-start">
        <Icon size={20} className={`${config.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <p className={`font-semibold text-sm ${config.iconColor}`}>{config.title}</p>
          <p className="text-sm text-secondary-600 mt-1">{config.msg}</p>
          {note && (
            <p className="text-sm text-secondary-500 mt-1 italic">
              Note de l'administrateur : {note}
            </p>
          )}
          {config.action && (
            <Link
              to={config.action.to}
              className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-primary-600 hover:text-primary-700 no-underline"
            >
              {config.action.label} <ChevronRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dashboard principal
// ---------------------------------------------------------------------------
export default function PainterDashboard() {
  const { user } = useAuthStore()

  const { data: profile } = useQuery({
    queryKey: ['painter-profile-me'],
    queryFn: () => authService.getPainterProfile().then(r => r.data),
  })

  const isValidated = profile?.validation_status === 'VALIDE'

  // Calcul de la complétude du profil
  const profileItems = [
    { label: 'Photo de profil',   done: !!user?.avatar,              to: '/painter/profile' },
    { label: 'Bio renseignée',    done: !!profile?.bio,              to: '/painter/profile' },
    { label: 'Compétences',       done: false,                        to: '/painter/profile' },
    { label: 'Documents pro',     done: false,                        to: '/painter/profile' },
    { label: 'Réalisations',      done: false,                        to: '/painter/profile' },
  ]
  const doneCount    = profileItems.filter(i => i.done).length
  const completeness = Math.round((doneCount / profileItems.length) * 100)

  const quickActions = [
    {
      icon: User,
      title: 'Mon profil professionnel',
      desc: 'Compétences, qualifications, portfolio, disponibilités.',
      to: '/painter/profile',
      color: 'bg-primary-50 text-primary-600',
      locked: false,
    },
    {
      icon: FileText,
      title: 'Mes devis',
      desc: 'Consultez et rédigez vos devis.',
      to: '/painter/quotes',
      color: 'bg-blue-50 text-blue-600',
      locked: !isValidated,
    },
    {
      icon: Briefcase,
      title: 'Mes travaux',
      desc: 'Travaux en cours et terminés.',
      to: '/painter/works',
      color: 'bg-green-50 text-green-600',
      locked: !isValidated,
    },
    {
      icon: MessageSquare,
      title: 'Messages',
      desc: 'Échangez avec vos clients.',
      to: '/messages',
      color: 'bg-purple-50 text-purple-600',
      locked: !isValidated,
    },
    {
      icon: Star,
      title: 'Mes évaluations',
      desc: 'Notes et avis de vos clients.',
      to: '/painter/reviews',
      color: 'bg-amber-50 text-amber-600',
      locked: !isValidated,
    },
  ]

  return (
    <div className="max-w-4xl mx-auto">

      {/* Bienvenue */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-secondary-900">
          Bonjour, {user?.first_name} 👋
        </h1>
        <p className="text-secondary-500 mt-1">Espace professionnel peintre</p>
      </div>

      {/* Statut validation */}
      {profile && (
        <ValidationBanner
          status={profile.validation_status}
          note={profile.validation_note}
        />
      )}

      {/* Complétude du profil */}
      {completeness < 100 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-secondary-900 text-sm">
              Complétude du profil
            </p>
            <span className="text-sm font-bold text-primary-600">{completeness}%</span>
          </div>
          <div className="w-full bg-secondary-100 rounded-full h-2 mb-3">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
          <div className="space-y-1.5">
            {profileItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={clsx(
                  'flex items-center gap-2 text-xs no-underline',
                  item.done ? 'text-green-600' : 'text-secondary-500 hover:text-primary-600'
                )}
              >
                <div className={clsx(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                  item.done ? 'border-green-500 bg-green-500' : 'border-secondary-300'
                )}>
                  {item.done && <CheckCircle size={10} className="text-white" />}
                </div>
                {item.label}
                {!item.done && <ChevronRight size={12} className="ml-auto" />}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickActions.map(({ icon: Icon, title, desc, to, color, locked }) => (
          <div key={to} className="relative">
            {locked && (
              <div className="absolute inset-0 bg-white/70 rounded-2xl z-10 flex items-center justify-center">
                <span className="badge badge-warning text-xs">
                  Disponible après validation
                </span>
              </div>
            )}
            <Link
              to={locked ? '#' : to}
              className="card-hover flex gap-4 items-start no-underline"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-secondary-900">{title}</p>
                <p className="text-sm text-secondary-500 mt-0.5">{desc}</p>
              </div>
              {!locked && <ArrowRight size={16} className="text-secondary-300 mt-1 flex-shrink-0" />}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
