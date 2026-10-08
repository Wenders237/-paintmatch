/**
 * ClientReviewsPage — Évaluations données par le client.
 * Affiche les prestations terminées non évaluées + les évaluations déjà soumises.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Star, CheckCircle, Clock } from 'lucide-react'
import clsx from 'clsx'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import transactionService from '@/services/transactionService'
import reviewService from '@/services/reviewService'

// ---------------------------------------------------------------------------
// Composant étoiles interactives
// ---------------------------------------------------------------------------
function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={clsx(
            'text-2xl transition-colors',
            (hovered || value) >= star ? 'text-amber-400' : 'text-secondary-200',
            !readonly && 'hover:scale-110 cursor-pointer'
          )}
        >
          ★
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modal d'évaluation
// ---------------------------------------------------------------------------
function ReviewModal({ booking, onClose }) {
  const qc = useQueryClient()
  const [rating, setRating]   = useState(0)
  const [comment, setComment] = useState('')

  const mutation = useMutation({
    mutationFn: () => reviewService.createReview({
      booking: booking.id,
      rating,
      comment,
    }),
    onSuccess: () => {
      qc.invalidateQueries(['client-bookings'])
      qc.invalidateQueries(['my-reviews'])
      toast.success('Évaluation envoyée ! Merci pour votre retour.')
      onClose()
    },
    onError: (err) => {
      const msg = err.response?.data?.booking?.[0]
               || err.response?.data?.rating?.[0]
               || err.response?.data?.detail
               || 'Erreur lors de l\'envoi.'
      toast.error(msg)
    },
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">

        <h2 className="text-xl font-heading font-bold text-secondary-900 mb-1">
          Évaluer la prestation
        </h2>
        <p className="text-sm text-secondary-500 mb-5">
          Travaux réalisés par <strong>{booking.painter_name}</strong>
        </p>

        {/* Étoiles */}
        <div className="mb-4 text-center">
          <p className="text-sm font-medium text-secondary-700 mb-2">Votre note</p>
          <div className="flex justify-center">
            <StarRating value={rating} onChange={setRating} />
          </div>
          {rating > 0 && (
            <p className="text-sm text-amber-600 font-medium mt-1">
              {['', 'Très insatisfait', 'Insatisfait', 'Correct', 'Satisfait', 'Excellent !'][rating]}
            </p>
          )}
        </div>

        {/* Commentaire */}
        <div className="mb-5">
          <label className="label">Commentaire (optionnel)</label>
          <textarea
            rows={4}
            className="input resize-none"
            placeholder="Décrivez votre expérience : qualité des travaux, ponctualité, communication..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={1000}
          />
          <p className="text-xs text-secondary-400 mt-1 text-right">
            {comment.length}/1000
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn btn-secondary flex-1">
            Annuler
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={rating === 0 || mutation.isPending}
            className="btn btn-primary flex-1"
          >
            {mutation.isPending
              ? <span className="spinner w-4 h-4" />
              : 'Envoyer mon évaluation'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page principale
// ---------------------------------------------------------------------------
export default function ClientReviewsPage() {
  const [toReview, setToReview] = useState(null)

  // Réservations terminées
  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['client-bookings'],
    queryFn:  () => transactionService.getClientBookings().then(r => r.data.results ?? r.data),
  })

  // Évaluations déjà soumises
  const { data: reviews = [], isLoading: loadingReviews } = useQuery({
    queryKey: ['my-reviews'],
    queryFn:  () => reviewService.getMyReviews().then(r => r.data.results ?? r.data),
  })

  const finishedBookings = bookings.filter(b => b.status === 'TERMINE')
  const reviewedIds      = new Set(reviews.map(r => r.booking_id))
  const pendingBookings  = finishedBookings.filter(b => !reviewedIds.has(b.id))

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-secondary-900">
          Mes évaluations
        </h1>
        <p className="text-secondary-500 text-sm mt-1">
          Évaluez vos prestations terminées et consultez vos avis.
        </p>
      </div>

      {/* Prestations à évaluer */}
      {pendingBookings.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-secondary-700 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
            <Clock size={15} className="text-amber-500" />
            À évaluer ({pendingBookings.length})
          </h2>
          <div className="space-y-3">
            {pendingBookings.map(booking => (
              <div key={booking.id} className="card flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Star size={20} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-secondary-900">{booking.painter_name}</p>
                  <p className="text-sm text-secondary-500">
                    {Number(booking.quote_amount).toLocaleString('fr-FR')} FCFA
                    {booking.scheduled_date && ` · ${format(new Date(booking.scheduled_date), 'dd MMM yyyy', { locale: fr })}`}
                  </p>
                </div>
                <button
                  onClick={() => setToReview(booking)}
                  className="btn btn-primary btn-sm flex-shrink-0"
                >
                  Évaluer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Évaluations déjà soumises */}
      <div>
        <h2 className="font-semibold text-secondary-700 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
          <CheckCircle size={15} className="text-green-500" />
          Évaluations soumises ({reviews.length})
        </h2>

        {loadingReviews ? (
          <div className="flex justify-center py-8"><span className="spinner w-6 h-6" /></div>
        ) : reviews.length === 0 ? (
          <div className="card text-center py-8">
            <Star size={28} className="mx-auto text-secondary-200 mb-2" />
            <p className="text-secondary-400 text-sm">
              Aucune évaluation soumise pour le moment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="card">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold text-secondary-900">{review.painter_name}</p>
                    <p className="text-xs text-secondary-400">
                      {format(new Date(review.created_at), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div className="flex gap-0.5 flex-shrink-0">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={s <= review.rating ? 'text-amber-400' : 'text-secondary-200'}>★</span>
                    ))}
                  </div>
                </div>

                {review.comment && (
                  <p className="text-sm text-secondary-600 leading-relaxed">{review.comment}</p>
                )}

                {/* Réponse du peintre */}
                {review.painter_reply && (
                  <div className="mt-3 bg-primary-50 border border-primary-100 rounded-xl p-3">
                    <p className="text-xs font-semibold text-primary-600 mb-1">
                      Réponse du peintre
                    </p>
                    <p className="text-sm text-secondary-600">{review.painter_reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal d'évaluation */}
      {toReview && (
        <ReviewModal
          booking={toReview}
          onClose={() => setToReview(null)}
        />
      )}
    </div>
  )
}
