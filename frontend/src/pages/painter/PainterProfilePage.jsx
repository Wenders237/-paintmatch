/**
 * PainterProfilePage — Espace professionnel du peintre connecté.
 *
 * Onglets :
 *  - Présentation   : bio, expérience, infos personnelles
 *  - Compétences    : ajout/suppression compétences
 *  - Qualifications : diplômes et certifications
 *  - Documents      : upload documents professionnels
 *  - Réalisations   : portfolio avec photos
 *  - Tarifs         : offres de services
 *  - Disponibilités : calendrier de disponibilité
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  User, Award, GraduationCap, FileText,
  Image, Tag, CalendarDays, AlertCircle, CheckCircle, Clock,
} from 'lucide-react'
import clsx from 'clsx'

import authService      from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import SkillsSection        from '@/components/painter/SkillsSection'
import QualificationsSection from '@/components/painter/QualificationsSection'
import DocumentsSection     from '@/components/painter/DocumentsSection'
import PortfolioSection     from '@/components/painter/PortfolioSection'
import ServiceOffersSection from '@/components/painter/ServiceOffersSection'
import AvailabilitySection  from '@/components/painter/AvailabilitySection'
import PainterBioForm       from '@/components/painter/PainterBioForm'

// ---------------------------------------------------------------------------
// Définition des onglets
// ---------------------------------------------------------------------------
const TABS = [
  { id: 'overview',      label: 'Présentation',    icon: User },
  { id: 'skills',        label: 'Compétences',      icon: Award },
  { id: 'qualifications',label: 'Qualifications',   icon: GraduationCap },
  { id: 'documents',     label: 'Documents',        icon: FileText },
  { id: 'portfolio',     label: 'Réalisations',     icon: Image },
  { id: 'offers',        label: 'Tarifs',           icon: Tag },
  { id: 'availability',  label: 'Disponibilités',   icon: CalendarDays },
]

// ---------------------------------------------------------------------------
// Bandeau statut de validation
// ---------------------------------------------------------------------------
function ValidationBanner({ status }) {
  const config = {
    EN_ATTENTE: {
      icon: Clock,
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      msg: 'Votre profil est en attente de validation par notre équipe. Vous pourrez recevoir des demandes de devis une fois validé.',
    },
    COMPLEMENT: {
      icon: AlertCircle,
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      msg: 'Des informations complémentaires ont été demandées. Vérifiez vos documents et complétez votre profil.',
    },
    REFUSE: {
      icon: AlertCircle,
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      msg: 'Votre profil a été refusé. Contactez le support pour plus d\'informations.',
    },
    VALIDE: {
      icon: CheckCircle,
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      msg: 'Profil validé — Votre profil est visible et actif sur la plateforme.',
    },
  }
  const c = config[status]
  if (!c) return null
  const Icon = c.icon
  return (
    <div className={`flex gap-3 items-start p-4 rounded-xl border mb-6 ${c.bg}`}>
      <Icon size={18} className={`${c.text} flex-shrink-0 mt-0.5`} />
      <p className={`text-sm ${c.text}`}>{c.msg}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page principale
// ---------------------------------------------------------------------------
export default function PainterProfilePage() {
  const { t }    = useTranslation('services')
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: profile } = useQuery({
    queryKey: ['painter-profile-me'],
    queryFn:  () => authService.getPainterProfile().then(r => r.data),
  })

  return (
    <div className="max-w-5xl mx-auto">

      {/* En-tête */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600 text-2xl font-bold flex-shrink-0">
          {user?.first_name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-secondary-900">
            {user?.first_name} {user?.last_name}
          </h1>
          <p className="text-sm text-secondary-500">
            {profile?.years_experience
              ? `${profile.years_experience} an${profile.years_experience > 1 ? 's' : ''} d'expérience`
              : 'Peintre en bâtiment'
            }
          </p>
          {profile?.average_rating > 0 && (
            <p className="text-sm text-amber-500 font-medium">
              ★ {Number(profile.average_rating).toFixed(1)} ({profile.total_reviews} avis)
            </p>
          )}
        </div>
      </div>

      {/* Bandeau de validation */}
      {profile && <ValidationBanner status={profile.validation_status} />}

      {/* Navigation par onglets — scroll horizontal sur mobile */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 border-b border-secondary-100">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0',
              activeTab === id
                ? 'bg-primary-500 text-white'
                : 'text-secondary-600 hover:bg-secondary-100'
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Contenu de l'onglet actif */}
      <div>
        {activeTab === 'overview'       && <PainterBioForm profile={profile} />}
        {activeTab === 'skills'         && <SkillsSection />}
        {activeTab === 'qualifications' && <QualificationsSection />}
        {activeTab === 'documents'      && <DocumentsSection />}
        {activeTab === 'portfolio'      && <PortfolioSection />}
        {activeTab === 'offers'         && <ServiceOffersSection />}
        {activeTab === 'availability'   && <AvailabilitySection />}
      </div>
    </div>
  )
}
