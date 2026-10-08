/**
 * WorkTimeline — Timeline d'avancement des travaux avec photos et réactions.
 * Le client peut commenter ou envoyer une photo sur chaque étape.
 */

import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CheckCircle, Circle, Clock, Image, MessageCircle, Send, ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import transactionService from '@/services/transactionService'
import { useAuthStore } from '@/store/authStore'

// ---------------------------------------------------------------------------
// Formulaire de réaction
// ---------------------------------------------------------------------------
function ReactionForm({ progressId, bookingId, onDone }) {
  const qc      = useQueryClient()
  const fileRef = useRef(null)
  const [comment, setComment] = useState('')
  const [photo, setPhoto]     = useState(null)
  const [preview, setPreview] = useState(null)

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      if (comment.trim()) fd.append('comment', comment.trim())
      if (photo) fd.append('photo', photo)
      return transactionService.addProgressReaction(progressId, fd)
    },
    onSuccess: () => {
      qc.invalidateQueries(['booking', bookingId])
      toast.success('Réaction envoyée.')
      onDone()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur.'),
  })

  return (
    <div className="mt-3 bg-secondary-50 rounded-xl p-3 space-y-2">
      <textarea
        rows={2}
        className="input resize-none text-sm"
        placeholder="Votre commentaire sur cette étape..."
        value={comment}
        onChange={e => setComment(e.target.value)}
      />

      {/* Upload photo */}
      <div
        onClick={() => fileRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors',
          preview ? 'border-primary-300' : 'border-secondary-300 hover:border-primary-300'
        )}
      >
        {preview ? (
          <img src={preview} alt="preview" className="w-full h-24 object-cover rounded-lg" />
        ) : (
          <div className="flex items-center justify-center gap-2 text-secondary-400">
            <Image size={16} />
            <span className="text-xs">Ajouter une photo (optionnel)</span>
          </div>
        )}
        <input
          ref={fileRef} type="file" className="hidden"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={e => {
            const f = e.target.files[0]
            if (f) { setPhoto(f); setPreview(URL.createObjectURL(f)) }
          }}
        />
      </div>

      <div className="flex gap-2">
        <button onClick={onDone} className="btn btn-secondary btn-sm">Annuler</button>
        <button
          onClick={() => mutation.mutate()}
          disabled={(!comment.trim() && !photo) || mutation.isPending}
          className="btn btn-primary btn-sm flex-1 gap-1"
        >
          {mutation.isPending ? <span className="spinner w-3 h-3" /> : <><Send size={13} /> Envoyer</>}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Timeline principale
// ---------------------------------------------------------------------------
export default function WorkTimeline({ updates = [], currentPercentage = 0, bookingId }) {
  const { user }  = useAuthStore()
  const [reactingTo, setReactingTo]   = useState(null)
  const [expandedReactions, setExpanded] = useState({})

  if (updates.length === 0) {
    return (
      <div className="text-center py-6">
        <Clock size={24} className="mx-auto text-secondary-200 mb-2" />
        <p className="text-sm text-secondary-400">Aucune mise à jour pour le moment.</p>
        <p className="text-xs text-secondary-300 mt-1">
          Le peintre mettra à jour l'avancement avec des photos.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Barre de progression */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-medium text-secondary-700">Avancement global</p>
          <span className="text-sm font-bold text-primary-600">{currentPercentage}%</span>
        </div>
        <div className="w-full bg-secondary-100 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-primary-400 to-primary-600 h-3 rounded-full transition-all duration-700"
            style={{ width: `${currentPercentage}%` }}
          />
        </div>
      </div>

      {/* Étapes */}
      <div className="relative">
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-secondary-200" />

        <div className="space-y-5">
          {updates.map((update, index) => {
            const isLast       = index === updates.length - 1
            const reactions    = update.reactions || []
            const isExpanded   = expandedReactions[update.id]
            const isReacting   = reactingTo === update.id

            return (
              <div key={update.id || index} className="flex gap-4 items-start relative">
                {/* Icône */}
                <div className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10',
                  isLast ? 'bg-primary-500 text-white shadow-md' : 'bg-white border-2 border-secondary-300'
                )}>
                  {isLast ? <CheckCircle size={16} /> : <Circle size={12} className="text-secondary-400" />}
                </div>

                {/* Contenu */}
                <div className={clsx('flex-1 pb-4', !isLast && 'border-b border-secondary-100')}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-semibold text-secondary-900 text-sm">{update.step_label}</p>
                    <span className="badge badge-info text-xs">{update.percentage}%</span>
                  </div>

                  {update.description && (
                    <p className="text-sm text-secondary-500 mt-1 leading-relaxed">{update.description}</p>
                  )}

                  {/* Photo de l'étape */}
                  {update.photo_url && (
                    <div className="mt-2">
                      <a href={update.photo_url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={update.photo_url}
                          alt={update.step_label}
                          className="w-full max-w-sm h-48 object-cover rounded-xl border border-secondary-200 hover:opacity-90 transition-opacity cursor-zoom-in"
                        />
                      </a>
                    </div>
                  )}

                  <p className="text-xs text-secondary-400 mt-1.5">
                    {format(new Date(update.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                  </p>

                  {/* Réactions existantes */}
                  {reactions.length > 0 && (
                    <div className="mt-2">
                      <button
                        onClick={() => setExpanded(prev => ({ ...prev, [update.id]: !prev[update.id] }))}
                        className="flex items-center gap-1 text-xs text-secondary-500 hover:text-primary-600"
                      >
                        <MessageCircle size={13} />
                        {reactions.length} réaction{reactions.length > 1 ? 's' : ''}
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-2 pl-2 border-l-2 border-secondary-200">
                          {reactions.map(r => (
                            <div key={r.id} className="bg-secondary-50 rounded-lg p-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={clsx(
                                  'text-xs font-semibold',
                                  r.author_role === 'CLIENT' ? 'text-blue-600' : 'text-primary-600'
                                )}>
                                  {r.author}
                                </span>
                                <span className="text-xs text-secondary-400">
                                  {format(new Date(r.created_at), 'dd/MM HH:mm', { locale: fr })}
                                </span>
                              </div>
                              {r.comment && <p className="text-xs text-secondary-700">{r.comment}</p>}
                              {r.photo_url && (
                                <a href={r.photo_url} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={r.photo_url}
                                    alt="réaction"
                                    className="mt-1 w-full max-w-xs h-32 object-cover rounded-lg hover:opacity-90"
                                  />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bouton réagir (client et peintre) */}
                  {!isReacting && update.id && (
                    <button
                      onClick={() => setReactingTo(update.id)}
                      className="mt-2 flex items-center gap-1 text-xs text-secondary-400 hover:text-primary-600 transition-colors"
                    >
                      <MessageCircle size={13} />
                      {user?.role === 'CLIENT' ? 'Commenter cette étape' : 'Répondre'}
                    </button>
                  )}

                  {/* Formulaire de réaction */}
                  {isReacting && (
                    <ReactionForm
                      progressId={update.id}
                      bookingId={bookingId}
                      onDone={() => setReactingTo(null)}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
