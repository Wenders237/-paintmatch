/**
 * PainterReviewsPage — Évaluations reçues par le peintre.
 * Affiche la note moyenne, les avis clients et permet de répondre.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Star, MessageSquare, TrendingUp } from 'lucide-react'
import clsx from 'clsx'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import reviewService from '@/services/reviewService'
import authService from '@/services/authService'

export default function PainterReviewsPage() {
  const qc = useQueryClient()
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText]   = useState('')

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['my-reviews-received'],
    queryFn:  () => reviewService.getMyReceivedReviews().then(r => r.data.results ?? r.data),
  })

  const { data: profile } = useQuery({
    queryKey: ['painter-profile-me'],
    queryFn:  () => authService.getPainterProfile().then(r => r.data),
  })

  const replyMutation = useMutation({
    mutationFn: ({ id, reply }) => reviewService.replyToReview(id, reply),
    onSuccess: () => {
      qc.invalidateQueries(['my-reviews-received'])
      toast.success('Réponse publiée.')
      setReplyingTo(null)
      setReplyText('')
    },
    onError: (err) => {
      toast.error(err.response?.data?.painter_reply?.[0] || 'Erreur.')
    },
  })

  // Calcul distribution des notes
  const distribution = [5,4,3,2,1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct:   reviews.length > 0
      ? Math.round(reviews.filter(r => r.rating === star).length / reviews.length * 100)
      : 0,
  }))

  const avgRating = profile?.average_rating || 0
  const total     = profile?.total_reviews  || 0

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-secondary-900">
          Mes évaluations
        </h1>
        <p className="text-secondary-500 text-sm mt-1">
          Avis laissés par vos clients.
        </p>
      </div>

      {/* Résumé des notes */}
      <div className="card mb-6">
        <div className="flex gap-6 items-center">

          {/* Note globale */}
          <div className="text-center flex-shrink-0">
            <p className="text-5xl font-heading font-bold text-secondary-900">
              {Number(avgRating).toFixed(1)}
            </p>
            <div className="flex justify-center gap-0.5 my-1">
              {[1,2,3,4,5].map(s => (
                <span key={s} className={clsx(
                  'text-xl',
                  s <= Math.round(avgRating) ? 'text-amber-400' : 'text-secondary-200'
                )}>★</span>
              ))}
            </div>
            <p className="text-xs text-secondary-400">{total} avis</p>
          </div>

          {/* Distribution */}
          <div className="flex-1 space-y-1.5">
            {distribution.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="text-secondary-500 w-4 text-right">{star}</span>
                <span className="text-amber-400">★</span>
                <div className="flex-1 bg-secondary-100 rounded-full h-2">
                  <div
                    className="bg-amber-400 h-2 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-secondary-400 w-6">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des avis */}
      {isLoading ? (
        <div className="flex justify-center py-12"><span className="spinner w-8 h-8" /></div>
      ) : reviews.length === 0 ? (
        <div className="card text-center py-12">
          <Star size={32} className="mx-auto text-secondary-200 mb-3" />
          <p className="text-secondary-500">Aucune évaluation reçue pour le moment.</p>
          <p className="text-xs text-secondary-400 mt-1">
            Les clients pourront vous évaluer après chaque prestation terminée.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="card">

              {/* En-tête */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                    {review.client_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-secondary-900 text-sm">
                      {review.client_name}
                    </p>
                    {review.client_city && (
                      <p className="text-xs text-secondary-400">{review.client_city}</p>
                    )}
                    <p className="text-xs text-secondary-400">
                      {format(new Date(review.created_at), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5 flex-shrink-0">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={clsx(
                      'text-lg',
                      s <= review.rating ? 'text-amber-400' : 'text-secondary-200'
                    )}>★</span>
                  ))}
                </div>
              </div>

              {/* Commentaire */}
              {review.comment && (
                <p className="text-sm text-secondary-600 leading-relaxed mb-3">
                  "{review.comment}"
                </p>
              )}

              {/* Réponse existante */}
              {review.painter_reply && (
                <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 mb-3">
                  <p className="text-xs font-semibold text-primary-600 mb-1">
                    Votre réponse
                  </p>
                  <p className="text-sm text-secondary-600">{review.painter_reply}</p>
                </div>
              )}

              {/* Formulaire de réponse */}
              {!review.painter_reply && replyingTo === review.id ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    className="input resize-none text-sm"
                    placeholder="Répondez à cet avis de façon professionnelle..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    maxLength={500}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => { setReplyingTo(null); setReplyText('') }}
                      className="btn btn-secondary btn-sm"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => replyMutation.mutate({ id: review.id, reply: replyText })}
                      disabled={replyText.trim().length < 10 || replyMutation.isPending}
                      className="btn btn-primary btn-sm"
                    >
                      {replyMutation.isPending ? <span className="spinner w-4 h-4" /> : 'Publier'}
                    </button>
                  </div>
                </div>
              ) : !review.painter_reply && (
                <button
                  onClick={() => { setReplyingTo(review.id); setReplyText('') }}
                  className="flex items-center gap-1 text-xs text-secondary-400 hover:text-primary-600 transition-colors"
                >
                  <MessageSquare size={13} /> Répondre à cet avis
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
