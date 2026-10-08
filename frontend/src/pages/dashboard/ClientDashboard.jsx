/**
 * ClientDashboard — Tableau de bord du client.
 *
 * Affiche :
 * - Message de bienvenue
 * - Raccourcis vers les fonctionnalités principales
 * - Statistiques rapides (devis, réservations — Phase 5+)
 * - Invitation à rechercher un peintre
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import {
  Search, FileText, CalendarCheck,
  Star, ArrowRight, Paintbrush
} from 'lucide-react'

export default function ClientDashboard() {
  const { t }    = useTranslation('common')
  const { user } = useAuthStore()

  const quickActions = [
    {
      icon: Search,
      title: 'Trouver un peintre',
      desc: 'Recherchez parmi nos peintres vérifiés.',
      to: '/painters',
      color: 'bg-primary-50 text-primary-600',
    },
    {
      icon: FileText,
      title: 'Mes devis',
      desc: 'Consultez et gérez vos demandes de devis.',
      to: '/client/quotes',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: CalendarCheck,
      title: 'Mes réservations',
      desc: 'Suivez l\'état de vos réservations.',
      to: '/client/bookings',
      color: 'bg-green-50 text-green-600',
    },
    {
      icon: Star,
      title: 'Mes évaluations',
      desc: 'Vos avis sur les prestations effectuées.',
      to: '/client/reviews',
      color: 'bg-amber-50 text-amber-600',
    },
  ]

  return (
    <div className="max-w-4xl mx-auto">

      {/* Bienvenue */}
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-secondary-900">
          Bonjour, {user?.first_name} 👋
        </h1>
        <p className="text-secondary-500 mt-1">
          Que souhaitez-vous faire aujourd'hui ?
        </p>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {quickActions.map(({ icon: Icon, title, desc, to, color, soon }) => (
          <div key={to} className="relative">
            {soon && (
              <span className="absolute top-3 right-3 badge badge-neutral text-xs z-10">
                Bientôt
              </span>
            )}
            <Link
              to={to}
              className={`card-hover flex gap-4 items-start no-underline ${soon ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-secondary-900">{title}</p>
                <p className="text-sm text-secondary-500 mt-0.5">{desc}</p>
              </div>
              {!soon && <ArrowRight size={16} className="text-secondary-300 mt-1 flex-shrink-0" />}
            </Link>
          </div>
        ))}
      </div>

      {/* CTA principal */}
      <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Paintbrush size={26} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-heading font-bold text-lg">
              Trouvez votre peintre idéal
            </h2>
            <p className="text-primary-100 text-sm mt-0.5">
              Des peintres vérifiés, disponibles partout au Cameroun.
            </p>
          </div>
          <Link
            to="/painters"
            className="btn bg-white text-primary-600 hover:bg-primary-50 font-semibold flex-shrink-0 no-underline"
          >
            Rechercher
          </Link>
        </div>
      </div>
    </div>
  )
}
