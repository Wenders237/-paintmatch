/**
 * PainterCard — Carte d'un peintre dans les résultats de recherche.
 *
 * Affiche :
 * - Photo / avatar
 * - Nom, ville, expérience
 * - Note moyenne avec étoiles
 * - Badge "Recommandé" + explication IA
 * - Aperçu des compétences
 * - Photo de réalisation si disponible
 * - Boutons : Voir le profil / Demander un devis
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Star, Briefcase, Lightbulb, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import clsx from 'clsx'

const LEVEL_COLORS = {
  EXPERT:   'badge-success',
  CONFIRME: 'badge-info',
  DEBUTANT: 'badge-neutral',
}

function StarRating({ rating, count }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(rating))
  return (
    <div className="flex items-center gap-1">
      {stars.map((filled, i) => (
        <Star
          key={i}
          size={13}
          className={filled
            ? 'text-amber-400 fill-amber-400'
            : 'text-secondary-200 fill-secondary-200'}
        />
      ))}
      <span className="text-sm font-medium text-secondary-700 ml-1">
        {rating > 0 ? Number(rating).toFixed(1) : 'Nouveau'}
      </span>
      {count > 0 && (
        <span className="text-xs text-secondary-400">({count})</span>
      )}
    </div>
  )
}

export default function PainterCard({ painter, rank }) {
  const { t }               = useTranslation('services')
  const { isAuthenticated, user } = useAuthStore()

  const {
    id, full_name, first_name, city,
    bio, years_experience, average_rating, total_reviews,
    is_featured, skills_preview = [], avatar_url,
    portfolio_cover, score, explanation,
  } = painter

  const isTopResult = rank <= 3

  return (
    <article className={clsx(
      'bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden flex flex-col',
      is_featured && 'ring-2 ring-primary-400',
    )}>

      {/* Image de réalisation ou dégradé */}
      <div className="relative h-40 bg-gradient-to-br from-primary-100 to-primary-200 overflow-hidden">
        {portfolio_cover ? (
          <img
            src={portfolio_cover}
            alt={`Réalisation de ${full_name}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Briefcase size={36} className="text-primary-300" />
          </div>
        )}

        {/* Badge mis en avant */}
        {is_featured && (
          <span className="absolute top-2 left-2 badge badge-warning shadow">
            ⭐ Mis en avant
          </span>
        )}

        {/* Rang dans les recommandations */}
        {isTopResult && (
          <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center shadow">
            #{rank}
          </span>
        )}

        {/* Avatar chevauchant l'image */}
        <div className="absolute -bottom-6 left-4">
          <div className="w-12 h-12 rounded-xl border-2 border-white shadow bg-primary-100 overflow-hidden">
            {avatar_url ? (
              <img src={avatar_url} alt={full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary-700 font-bold text-lg">
                {first_name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="pt-8 px-4 pb-4 flex flex-col flex-1 gap-3">

        {/* Nom + localisation */}
        <div>
          <h2 className="font-heading font-bold text-secondary-900 text-base leading-tight">
            {full_name}
          </h2>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {city && (
              <span className="flex items-center gap-1 text-xs text-secondary-500">
                <MapPin size={11} /> {city}
              </span>
            )}
            {years_experience > 0 && (
              <span className="text-xs text-secondary-500">
                {years_experience} an{years_experience > 1 ? 's' : ''} exp.
              </span>
            )}
          </div>
        </div>

        {/* Note */}
        <StarRating rating={average_rating} count={total_reviews} />

        {/* Compétences */}
        {skills_preview.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills_preview.map((s, i) => (
              <span key={i} className={`badge ${LEVEL_COLORS[s.level] || 'badge-neutral'} text-xs`}>
                {s.name}
              </span>
            ))}
          </div>
        )}

        {/* Bio courte */}
        {bio && (
          <p className="text-xs text-secondary-500 line-clamp-2 leading-relaxed">
            {bio}
          </p>
        )}

        {/* Explication IA */}
        {explanation && (
          <div className="flex gap-2 items-start bg-primary-50 rounded-xl p-2.5">
            <Lightbulb size={13} className="text-primary-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-primary-700 leading-relaxed">{explanation}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-2">
          <Link
            to={`/painters/${id}`}
            className="btn btn-secondary btn-sm flex-1 no-underline"
          >
            Voir le profil
          </Link>
          {isAuthenticated && user?.role === 'CLIENT' ? (
            <Link
              to={`/client/quotes/new?painter=${id}`}
              className="btn btn-primary btn-sm flex-1 no-underline"
            >
              Devis
            </Link>
          ) : !isAuthenticated ? (
            <Link
              to="/auth/login"
              className="btn btn-primary btn-sm flex-1 no-underline"
            >
              Connexion
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  )
}
