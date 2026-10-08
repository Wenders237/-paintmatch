/**
 * ComingSoonPage — Page générique pour les fonctionnalités à venir.
 * Affiche le nom de la fonctionnalité et la phase de développement prévue.
 */

import { Link } from 'react-router-dom'
import { Clock, ArrowLeft } from 'lucide-react'
import SEOHead from '@/components/common/SEOHead'

export default function ComingSoonPage({ title = 'Fonctionnalité', phase = '?' }) {
  return (
    <div className="max-w-lg mx-auto text-center py-16 px-4">
      <SEOHead title={title} noindex={true} />
      <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Clock size={28} className="text-primary-400" />
      </div>
      <h1 className="text-2xl font-heading font-bold text-secondary-900 mb-2">
        {title}
      </h1>
      <p className="text-secondary-500 mb-2">
        Cette fonctionnalité est en cours de développement.
      </p>
      <p className="text-sm text-secondary-400 mb-8">
        Disponible en <span className="font-semibold text-primary-600">Phase {phase}</span>
      </p>
      <Link to="/dashboard" className="btn btn-primary no-underline gap-2">
        <ArrowLeft size={16} />
        Retour au tableau de bord
      </Link>
    </div>
  )
}
