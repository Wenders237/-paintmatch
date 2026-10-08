/**
 * PainterDetailPage — Profil public d'un peintre validé.
 * Accessible aux visiteurs et clients.
 *
 * Sections :
 *  - En-tête : avatar, nom, note, localisation, badge vérifié
 *  - Onglets : Présentation / Compétences / Réalisations / Tarifs / Disponibilités / Avis
 */

import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  MapPin, Star, ShieldCheck, Clock, Briefcase,
  MessageSquare, FileText, ChevronLeft,
} from 'lucide-react'
import clsx from 'clsx'
import servicesService from '@/services/servicesService'
import { useAuthStore } from '@/store/authStore'

// ---------------------------------------------------------------------------
// Onglets
// ---------------------------------------------------------------------------
const TABS = ['overview', 'skills', 'portfolio', 'offers', 'availability', 'reviews']

// ---------------------------------------------------------------------------
// Bloc note + étoiles
// ---------------------------------------------------------------------------
function StarRating({ rating, count }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(rating))
  return (
    <div className="flex items-center gap-1">
      {stars.map((filled, i) => (
        <Star
          key={i}
          size={14}
          className={filled ? 'text-amber-400 fill-amber-400' : 'text-secondary-200 fill-secondary-200'}
        />
      ))}
      <span className="text-sm font-medium text-secondary-700 ml-1">
        {Number(rating).toFixed(1)}
      </span>
      {count > 0 && (
        <span className="text-xs text-secondary-400">({count} avis)</span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Onglet Présentation
// ---------------------------------------------------------------------------
function OverviewTab({ profile }) {
  return (
    <div className="space-y-4">
      {profile.bio ? (
        <div className="card">
          <h3 className="font-semibold text-secondary-900 mb-2">À propos</h3>
          <p className="text-sm text-secondary-600 leading-relaxed whitespace-pre-wrap">
            {profile.bio}
          </p>
        </div>
      ) : (
        <p className="text-sm text-secondary-400 text-center py-8">
          Ce peintre n'a pas encore renseigné de présentation.
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Onglet Compétences
// ---------------------------------------------------------------------------
function SkillsTab({ skills }) {
  const { t } = useTranslation('services')
  const levelColor = {
    DEBUTANT: 'badge-neutral',
    CONFIRME: 'badge-info',
    EXPERT:   'badge-success',
  }
  const grouped = skills.reduce((acc, ps) => {
    const cat = ps.category_name || 'Autre'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(ps)
    return acc
  }, {})

  if (skills.length === 0) {
    return <p className="text-sm text-secondary-400 text-center py-8">{t('no_skills')}</p>
  }

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="card">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wide mb-3">{cat}</p>
          <div className="flex flex-wrap gap-2">
            {items.map((ps, i) => (
              <div key={i} className="flex items-center gap-2 bg-secondary-50 border border-secondary-200 rounded-xl px-3 py-2">
                <span className="text-sm text-secondary-800">{ps.skill_name}</span>
                <span className={`badge ${levelColor[ps.level] || 'badge-neutral'}`}>
                  {t(`level_${ps.level}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Onglet Portfolio
// ---------------------------------------------------------------------------
function PortfolioTab({ portfolio }) {
  const [selected, setSelected] = useState(null)

  if (portfolio.length === 0) {
    return <p className="text-sm text-secondary-400 text-center py-8">Aucune réalisation publiée.</p>
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {portfolio.map(item => (
          <div
            key={item.id}
            className="card-hover cursor-pointer"
            onClick={() => setSelected(item)}
          >
            {/* Image de couverture */}
            <div className="w-full h-48 rounded-xl bg-secondary-100 overflow-hidden mb-3">
              {item.cover_image ? (
                <img
                  src={item.cover_image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-secondary-300">
                  <Briefcase size={32} />
                </div>
              )}
            </div>
            <h3 className="font-semibold text-secondary-900">{item.title}</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {item.category_name && <span className="badge badge-info">{item.category_name}</span>}
              {item.location && <span className="text-xs text-secondary-400">{item.location}</span>}
            </div>
            {item.images?.length > 0 && (
              <p className="text-xs text-secondary-400 mt-1">{item.images.length} photo{item.images.length > 1 ? 's' : ''}</p>
            )}
          </div>
        ))}
      </div>

      {/* Modal détail réalisation */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-secondary-900 mb-1">{selected.title}</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {selected.category_name && <span className="badge badge-info">{selected.category_name}</span>}
                {selected.location && <span className="text-xs text-secondary-400">{selected.location}</span>}
                {selected.date_completed && (
                  <span className="text-xs text-secondary-400">
                    {new Date(selected.date_completed).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
              {selected.description && (
                <p className="text-sm text-secondary-600 mb-4 leading-relaxed">{selected.description}</p>
              )}
              {selected.images?.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selected.images.map(img => (
                    <img
                      key={img.id}
                      src={img.image}
                      alt={img.caption || selected.title}
                      className="w-full h-40 object-cover rounded-xl"
                    />
                  ))}
                </div>
              )}
              <button
                onClick={() => setSelected(null)}
                className="btn btn-secondary w-full mt-4"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Onglet Tarifs
// ---------------------------------------------------------------------------
function OffersTab({ offers }) {
  if (offers.length === 0) {
    return <p className="text-sm text-secondary-400 text-center py-8">Aucune offre publiée.</p>
  }
  return (
    <div className="space-y-3">
      {offers.map((offer, i) => (
        <div key={i} className="card flex gap-4 items-start">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-secondary-900">{offer.title}</p>
            <p className="text-xs text-secondary-400">{offer.category_name}</p>
            {offer.description && (
              <p className="text-sm text-secondary-600 mt-1">{offer.description}</p>
            )}
          </div>
          {(offer.price_range_min || offer.price_range_max) && (
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-semibold text-primary-600">
                {offer.price_range_min && `${Number(offer.price_range_min).toLocaleString('fr-FR')}`}
                {offer.price_range_min && offer.price_range_max && ' – '}
                {offer.price_range_max && `${Number(offer.price_range_max).toLocaleString('fr-FR')}`}
              </p>
              <p className="text-xs text-secondary-400">FCFA/m²</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Onglet Disponibilités
// ---------------------------------------------------------------------------
function AvailabilityPublicTab({ painterId }) {
  const { data: availabilities = [], isLoading } = useQuery({
    queryKey: ['painter-availabilities', painterId],
    queryFn:  () =>
      import('@/services/api').then(m =>
        m.default.get(`/marketplace/painters/${painterId}/availabilities/`).then(r => r.data.results ?? r.data)
      ),
  })

  if (isLoading) return <div className="flex justify-center py-8"><span className="spinner w-6 h-6" /></div>

  if (availabilities.length === 0) {
    return <p className="text-sm text-secondary-400 text-center py-8">Aucune disponibilité renseignée.</p>
  }

  return (
    <div className="space-y-2">
      {availabilities.map(a => (
        <div key={a.id} className="card flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${a.is_available ? 'bg-success' : 'bg-error'}`} />
          <div>
            <p className="text-sm font-medium text-secondary-900">
              {new Date(a.date_start).toLocaleDateString('fr-FR')}
              {' → '}
              {new Date(a.date_end).toLocaleDateString('fr-FR')}
            </p>
            {a.note && <p className="text-xs text-secondary-400">{a.note}</p>}
          </div>
          <span className={`ml-auto badge ${a.is_available ? 'badge-success' : 'badge-error'}`}>
            {a.is_available ? 'Disponible' : 'Indisponible'}
          </span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Onglet Avis (public)
// ---------------------------------------------------------------------------
function ReviewsTab({ painterId }) {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['painter-reviews-public', painterId],
    queryFn:  () => import('@/services/reviewService')
      .then(m => m.default.getPainterReviews(painterId))
      .then(r => r.data.results ?? r.data),
  })

  if (isLoading) return <div className="flex justify-center py-8"><span className="spinner w-6 h-6" /></div>

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-secondary-400 text-sm">Aucun avis pour le moment.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map(review => (
        <div key={review.id} className="card">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className="font-semibold text-secondary-900 text-sm">{review.client_name}</p>
              {review.client_city && (
                <p className="text-xs text-secondary-400">{review.client_city}</p>
              )}
            </div>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => (
                <span key={s} className={s <= review.rating ? 'text-amber-400' : 'text-secondary-200'}>★</span>
              ))}
            </div>
          </div>
          {review.comment && (
            <p className="text-sm text-secondary-600 leading-relaxed">"{review.comment}"</p>
          )}
          {review.painter_reply && (
            <div className="mt-2 bg-primary-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-primary-600 mb-1">Réponse du peintre</p>
              <p className="text-sm text-secondary-600">{review.painter_reply}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------
export default function PainterDetailPage() {
  const { id }          = useParams()
  const { t }           = useTranslation('services')
  const { isAuthenticated, user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['painter-public', id],
    queryFn:  () => servicesService.getPainterPublicProfile(id).then(r => r.data),
    retry: 1,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <span className="spinner w-10 h-10" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-secondary-500 mb-4">Ce profil est introuvable ou n'est pas disponible.</p>
        <Link to="/painters" className="btn btn-secondary no-underline">
          <ChevronLeft size={16} /> Retour aux peintres
        </Link>
      </div>
    )
  }

  const { profile, skills = [], portfolio = [], offers = [] } = data

  const tabLabels = {
    overview:     t('tabs.overview'),
    skills:       t('tabs.skills'),
    portfolio:    t('tabs.portfolio'),
    offers:       t('tabs.offers'),
    availability: t('tabs.availability'),
    reviews:      t('tabs.reviews'),
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Bouton retour */}
      <Link to="/painters" className="inline-flex items-center gap-1 text-sm text-secondary-500 hover:text-secondary-800 mb-6 no-underline">
        <ChevronLeft size={16} /> Retour aux peintres
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* --- Colonne gauche : carte identité --- */}
        <aside className="lg:col-span-1 space-y-4">

          {/* Carte principale */}
          <div className="card text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600 text-3xl font-bold mx-auto mb-3">
              {profile?.user?.first_name?.[0]?.toUpperCase()}
            </div>
            <h1 className="text-xl font-heading font-bold text-secondary-900">
              {profile?.user?.first_name} {profile?.user?.last_name}
            </h1>
            {profile?.user?.city && (
              <p className="flex items-center justify-center gap-1 text-sm text-secondary-500 mt-1">
                <MapPin size={13} /> {profile.user.city}
              </p>
            )}

            {/* Note */}
            {profile?.average_rating > 0 && (
              <div className="flex justify-center mt-2">
                <StarRating rating={profile.average_rating} count={profile.total_reviews} />
              </div>
            )}

            {/* Badge vérifié */}
            <div className="mt-3">
              {profile?.is_validated ? (
                <span className="badge badge-success mx-auto">
                  <ShieldCheck size={12} className="mr-1" />
                  {t('verified_painter')}
                </span>
              ) : (
                <span className="badge badge-warning mx-auto">
                  <Clock size={12} className="mr-1" />
                  {t('pending_painter')}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary-500">Expérience</span>
              <span className="font-medium text-secondary-900">
                {profile?.years_experience
                  ? `${profile.years_experience} an${profile.years_experience > 1 ? 's' : ''}`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary-500">Compétences</span>
              <span className="font-medium text-secondary-900">{skills.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary-500">Réalisations</span>
              <span className="font-medium text-secondary-900">{portfolio.length}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {isAuthenticated && user?.role === 'CLIENT' ? (
              <>
                <Link
                  to={`/client/quotes/new?painter=${id}`}
                  className="btn btn-primary w-full no-underline"
                >
                  <FileText size={16} />
                  {t('request_quote')}
                </Link>
                <Link
                  to={`/messages?painter=${id}`}
                  className="btn btn-secondary w-full no-underline"
                >
                  <MessageSquare size={16} />
                  {t('contact_painter')}
                </Link>
              </>
            ) : isAuthenticated && user?.role !== 'CLIENT' ? (
              // Peintre ou Admin connecté — pas d'action disponible sur ce profil
              <div className="card bg-secondary-50 text-center py-3">
                <p className="text-xs text-secondary-500">
                  {user?.role === 'PEINTRE'
                    ? 'Vous êtes peintre — vous ne pouvez pas demander un devis.'
                    : 'Vue administrateur.'}
                </p>
              </div>
            ) : (
              // Visiteur non connecté
              <div className="space-y-2">
                <Link
                  to={`/auth/login`}
                  state={{ from: { pathname: `/painters/${id}` } }}
                  className="btn btn-primary w-full no-underline"
                >
                  <FileText size={16} />
                  Demander un devis
                </Link>
                <p className="text-xs text-secondary-400 text-center">
                  Connectez-vous ou créez un compte client pour contacter ce peintre.
                </p>
                <Link
                  to="/auth/register"
                  className="btn btn-secondary w-full no-underline"
                >
                  Créer un compte gratuit
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* --- Colonne droite : contenu avec onglets --- */}
        <div className="lg:col-span-2">

          {/* Navigation onglets */}
          <div className="flex gap-1 overflow-x-auto pb-1 mb-5 border-b border-secondary-100">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  'px-4 py-2.5 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0',
                  activeTab === tab
                    ? 'bg-primary-500 text-white'
                    : 'text-secondary-600 hover:bg-secondary-100'
                )}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>

          {/* Contenu */}
          {activeTab === 'overview'     && <OverviewTab profile={profile} />}
          {activeTab === 'skills'       && <SkillsTab skills={skills} />}
          {activeTab === 'portfolio'    && <PortfolioTab portfolio={portfolio} />}
          {activeTab === 'offers'       && <OffersTab offers={offers} />}
          {activeTab === 'availability' && <AvailabilityPublicTab painterId={id} />}
          {activeTab === 'reviews'      && <ReviewsTab painterId={id} />}
        </div>
      </div>
    </div>
  )
}
