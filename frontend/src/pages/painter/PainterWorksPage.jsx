/**
 * PainterWorksPage — Travaux et réservations du peintre.
 * Permet de confirmer, démarrer, mettre à jour l'avancement et terminer les travaux.
 */

import { useState, useRef } from 'react'
import { useForm }  from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Briefcase, ChevronRight, Clock, CheckCircle,
  XCircle, Wrench, Plus, Send, Image, Star
} from 'lucide-react'
import clsx from 'clsx'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import transactionService from '@/services/transactionService'
import WorkTimeline from '@/components/booking/WorkTimeline'

const STATUS_CONFIG = {
  EN_ATTENTE: { label: 'En attente de paiement', cls: 'badge-warning', icon: Clock },
  CONFIRME:   { label: 'Confirmée',              cls: 'badge-info',    icon: CheckCircle },
  EN_COURS:   { label: 'En cours',               cls: 'badge-info',    icon: Wrench },
  TERMINE:    { label: 'Terminée',               cls: 'badge-success', icon: CheckCircle },
  ANNULE:     { label: 'Annulée',                cls: 'badge-error',   icon: XCircle },
}

// Transitions autorisées pour le peintre
const NEXT_ACTIONS = {
  EN_ATTENTE: { label: 'Confirmer la réservation', action: 'CONFIRME', cls: 'bg-blue-500 hover:bg-blue-600 text-white' },
  CONFIRME:   { label: 'Démarrer les travaux',     action: 'EN_COURS', cls: 'bg-primary-500 hover:bg-primary-600 text-white' },
  EN_COURS:   { label: 'Déclarer les travaux terminés', action: 'TERMINE', cls: 'bg-green-500 hover:bg-green-600 text-white' },
}

// ---------------------------------------------------------------------------
// Formulaire d'ajout d'étape
// ---------------------------------------------------------------------------
function ProgressForm({ bookingId, onSuccess, onCancel }) {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const qc     = useQueryClient()
  const fileRef = useRef(null)
  const [photo, setPhoto]   = useState(null)
  const [preview, setPreview] = useState(null)

  const mutation = useMutation({
    mutationFn: (data) => {
      const fd = new FormData()
      fd.append('step_label',  data.step_label)
      fd.append('description', data.description || '')
      fd.append('percentage',  data.percentage || 0)
      if (photo) fd.append('photo', photo)
      return transactionService.addWorkProgress(bookingId, fd)
    },
    onSuccess: () => {
      qc.invalidateQueries(['booking', bookingId])
      qc.invalidateQueries(['painter-bookings'])
      toast.success('Étape ajoutée.')
      onSuccess()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur.'),
  })

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))}
      className="card border border-primary-100 bg-primary-50 space-y-3 mt-4">
      <div>
        <label className="label">Titre de l'étape *</label>
        <input
          className={`input ${errors.step_label ? 'input-error' : ''}`}
          placeholder="Ex : Préparation des surfaces terminée"
          {...register('step_label', { required: 'Obligatoire' })}
        />
        {errors.step_label && <p className="error-msg">{errors.step_label.message}</p>}
      </div>
      <div>
        <label className="label">Description (optionnel)</label>
        <textarea rows={2} className="input resize-none"
          placeholder="Détails sur cette étape..."
          {...register('description')} />
      </div>
      <div>
        <label className="label">Avancement global (%)</label>
        <input type="range" min="0" max="100" step="5"
          className="w-full accent-primary-500"
          {...register('percentage', { valueAsNumber: true })} />
        <div className="flex justify-between text-xs text-secondary-400 mt-1">
          <span>0%</span><span>50%</span><span>100%</span>
        </div>
      </div>

      {/* Upload photo */}
      <div>
        <label className="label">Photo de l'étape (optionnel)</label>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-secondary-300 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 transition-colors"
        >
          {preview ? (
            <img src={preview} alt="preview" className="w-full h-32 object-cover rounded-lg" />
          ) : (
            <div>
              <Image size={24} className="mx-auto text-secondary-300 mb-1" />
              <p className="text-xs text-secondary-400">Cliquer pour ajouter une photo</p>
              <p className="text-xs text-secondary-300">JPG, PNG — max 10 Mo</p>
            </div>
          )}
          <input ref={fileRef} type="file" className="hidden"
            accept=".jpg,.jpeg,.png,.webp" onChange={handlePhotoChange} />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn btn-secondary btn-sm">
          Annuler
        </button>
        <button type="submit" disabled={mutation.isPending} className="btn btn-primary btn-sm flex-1">
          {mutation.isPending ? <span className="spinner w-4 h-4" /> : <><Send size={14} /> Publier</>}
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Modal détail travaux
// ---------------------------------------------------------------------------
function WorkModal({ booking, onClose }) {
  const qc = useQueryClient()
  const [showProgressForm, setShowProgressForm] = useState(false)

  const { data: detail, isLoading } = useQuery({
    queryKey: ['booking', booking.id],
    queryFn:  () => transactionService.getBooking(booking.id).then(r => r.data),
    refetchInterval: booking.status === 'EN_COURS' ? 30000 : false,
  })

  const actionMutation = useMutation({
    mutationFn: (action) => transactionService.painterBookingAction(booking.id, action),
    onSuccess: (res) => {
      qc.invalidateQueries(['painter-bookings'])
      qc.invalidateQueries(['booking', booking.id])
      toast.success(`Statut mis à jour : ${res.data.status}`)
      if (res.data.status === 'TERMINE') onClose()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erreur.'),
  })

  const cfg        = STATUS_CONFIG[booking.status] || STATUS_CONFIG.EN_ATTENTE
  const nextAction = NEXT_ACTIONS[booking.status]
  const lastPct    = detail?.progress_updates?.length > 0
    ? detail.progress_updates[detail.progress_updates.length - 1].percentage
    : 0

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">

          {/* En-tête */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-xl font-heading font-bold text-secondary-900">
                Travaux — {booking.client_name}
              </h2>
              <span className={`badge ${cfg.cls} mt-1`}>{cfg.label}</span>
            </div>
            <p className="font-bold text-primary-600">
              {Number(booking.quote_amount).toLocaleString('fr-FR')} FCFA
            </p>
          </div>

          {/* Infos */}
          {booking.scheduled_date && (
            <p className="text-sm text-secondary-500 mb-4">
              📅 Date prévue : {format(new Date(booking.scheduled_date), 'dd MMMM yyyy', { locale: fr })}
            </p>
          )}

          {/* Suivi des travaux */}
          <div className="card mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-secondary-900">Suivi des travaux</h3>
              {booking.status === 'EN_COURS' && !showProgressForm && (
                <button
                  onClick={() => setShowProgressForm(true)}
                  className="btn btn-primary btn-sm gap-1"
                >
                  <Plus size={13} /> Ajouter une étape
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-4"><span className="spinner w-6 h-6" /></div>
            ) : (
              <WorkTimeline
                updates={detail?.progress_updates || []}
                currentPercentage={lastPct}
                bookingId={booking.id}
              />
            )}

            {showProgressForm && (
              <ProgressForm
                bookingId={booking.id}
                onSuccess={() => setShowProgressForm(false)}
                onCancel={() => setShowProgressForm(false)}
              />
            )}
          </div>

          {/* Travaux terminés — bandeau récapitulatif */}
          {booking.status === 'TERMINE' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle size={22} className="text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-green-800">Travaux terminés !</p>
                  <p className="text-xs text-green-700">
                    Le client a validé et payé le solde. Prestation finalisée.
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-secondary-500">Montant total</span>
                  <span className="font-bold text-green-700">
                    {Number(booking.quote_amount).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Client</span>
                  <span className="font-medium">{booking.client_name}</span>
                </div>
              </div>
              <Link
                to="/painter/reviews"
                className="btn bg-green-500 hover:bg-green-600 text-white w-full mt-3 no-underline gap-2"
                onClick={onClose}
              >
                <Star size={15} />
                Voir l'évaluation du client
              </Link>
            </div>
          )}

          {/* Action principale (si pas terminé) */}
          {nextAction && (
            <button
              onClick={() => actionMutation.mutate(nextAction.action)}
              disabled={actionMutation.isPending}
              className={clsx('btn w-full mb-3', nextAction.cls)}
            >
              {actionMutation.isPending
                ? <span className="spinner w-4 h-4" />
                : nextAction.label}
            </button>
          )}

          <button onClick={onClose} className="btn btn-secondary w-full">
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page principale
// ---------------------------------------------------------------------------
export default function PainterWorksPage() {
  const [selected, setSelected] = useState(null)
  const [filter, setFilter]     = useState('active') // 'active' | 'done'

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['painter-bookings'],
    queryFn:  () => transactionService.getPainterBookings().then(r => r.data.results ?? r.data),
    refetchInterval: 30000,
  })

  const active = bookings.filter(b => !['TERMINE', 'ANNULE'].includes(b.status))
  const done   = bookings.filter(b => ['TERMINE', 'ANNULE'].includes(b.status))
  const shown  = filter === 'active' ? active : done

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-secondary-900">Mes travaux</h1>
        <p className="text-secondary-500 text-sm mt-1">
          Gérez vos réservations et mettez à jour l'avancement.
        </p>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'active', label: `En cours (${active.length})` },
          { key: 'done',   label: `Terminés (${done.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
              filter === tab.key
                ? 'bg-primary-500 text-white'
                : 'bg-white border border-secondary-200 text-secondary-600 hover:border-primary-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><span className="spinner w-8 h-8" /></div>
      ) : shown.length === 0 ? (
        <div className="card text-center py-12">
          <Briefcase size={32} className="mx-auto text-secondary-200 mb-3" />
          <p className="text-secondary-500">
            {filter === 'active' ? 'Aucun travail en cours.' : 'Aucun travail terminé.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map(booking => {
            const cfg  = STATUS_CONFIG[booking.status] || STATUS_CONFIG.EN_ATTENTE
            const Icon = cfg.icon
            const lastPct = booking.progress_updates?.length > 0
              ? booking.progress_updates[booking.progress_updates.length - 1].percentage
              : 0

            return (
              <button
                key={booking.id}
                onClick={() => setSelected(booking)}
                className="card-hover flex items-center gap-4 w-full text-left"
              >
                <div className={clsx(
                  'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
                  booking.status === 'TERMINE' ? 'bg-green-100' :
                  booking.status === 'EN_COURS' ? 'bg-blue-100' :
                  booking.status === 'CONFIRME' ? 'bg-primary-100' :
                  booking.status === 'ANNULE'   ? 'bg-red-100' : 'bg-amber-100'
                )}>
                  <Icon size={20} className={
                    booking.status === 'TERMINE' ? 'text-green-600' :
                    booking.status === 'EN_COURS' ? 'text-blue-600' :
                    booking.status === 'CONFIRME' ? 'text-primary-600' :
                    booking.status === 'ANNULE'   ? 'text-red-600' : 'text-amber-600'
                  } />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-secondary-900">{booking.client_name}</p>
                    <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                  </div>
                  <p className="text-sm text-secondary-500">
                    {Number(booking.quote_amount).toLocaleString('fr-FR')} FCFA
                  </p>
                  {booking.status === 'EN_COURS' && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-secondary-100 rounded-full h-1.5">
                        <div
                          className="bg-primary-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${lastPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-secondary-400">{lastPct}%</span>
                    </div>
                  )}
                </div>

                {booking.scheduled_date && (
                  <p className="text-xs text-secondary-400 flex-shrink-0">
                    {format(new Date(booking.scheduled_date), 'dd MMM', { locale: fr })}
                  </p>
                )}
                <ChevronRight size={16} className="text-secondary-300 flex-shrink-0" />
              </button>
            )
          })}
        </div>
      )}

      {selected && (
        <WorkModal
          booking={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
