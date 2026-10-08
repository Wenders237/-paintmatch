/**
 * ClientBookingsPage — Réservations du client.
 * Affiche la liste des réservations avec leur statut et le suivi des travaux.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  CalendarCheck, ChevronRight, Clock, CheckCircle,
  XCircle, Wrench, AlertCircle, CreditCard, Star
} from 'lucide-react'
import clsx from 'clsx'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import transactionService from '@/services/transactionService'
import WorkTimeline from '@/components/booking/WorkTimeline'

// ---------------------------------------------------------------------------
// Configuration des statuts
// ---------------------------------------------------------------------------
const STATUS_CONFIG = {
  EN_ATTENTE: { label: 'En attente de paiement', cls: 'badge-warning', icon: Clock },
  CONFIRME:   { label: 'Confirmée',              cls: 'badge-info',    icon: CheckCircle },
  EN_COURS:   { label: 'En cours',               cls: 'badge-info',    icon: Wrench },
  TERMINE:    { label: 'Terminée',               cls: 'badge-success', icon: CheckCircle },
  ANNULE:     { label: 'Annulée',                cls: 'badge-error',   icon: XCircle },
}

// ---------------------------------------------------------------------------
// Modal détail réservation
// ---------------------------------------------------------------------------
function BookingModal({ booking, onClose }) {
  const qc = useQueryClient()

  const { data: detail, isLoading } = useQuery({
    queryKey: ['booking', booking.id],
    queryFn:  () => transactionService.getBooking(booking.id).then(r => r.data),
  })

  const { data: paymentData } = useQuery({
    queryKey: ['payments', booking.id],
    queryFn:  () => transactionService.getPaymentHistory(booking.id).then(r => r.data),
  })

  const soldePaidCheck = paymentData?.payments?.find(
    p => p.payment_type === 'SOLDE' && p.status === 'TRAITE'
  )

  const confirmMutation = useMutation({
    mutationFn: () => transactionService.clientBookingAction(booking.id, 'TERMINE'),
    onSuccess: () => {
      qc.invalidateQueries(['client-bookings'])
      qc.invalidateQueries(['booking', booking.id])
      toast.success('Travaux confirmés comme terminés !')
      onClose()
    },
    onError: () => toast.error('Erreur lors de la confirmation.'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => transactionService.clientBookingAction(booking.id, 'ANNULE'),
    onSuccess: () => {
      qc.invalidateQueries(['client-bookings'])
      toast.success('Réservation annulée.')
      onClose()
    },
    onError: () => toast.error('Erreur lors de l\'annulation.'),
  })

  const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.EN_ATTENTE
  const lastPercentage = detail?.progress_updates?.length > 0
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
                Réservation
              </h2>
              <p className="text-sm text-secondary-500">
                {booking.painter_name}
              </p>
            </div>
            <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
          </div>

          {/* Infos */}
          <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
            <div className="card bg-secondary-50 p-3">
              <p className="text-secondary-400 text-xs mb-1">Peintre</p>
              <p className="font-medium text-secondary-900">{booking.painter_name}</p>
            </div>
            <div className="card bg-secondary-50 p-3">
              <p className="text-secondary-400 text-xs mb-1">Montant total</p>
              <p className="font-bold text-primary-600">
                {Number(booking.quote_amount).toLocaleString('fr-FR')} FCFA
              </p>
            </div>
            {booking.scheduled_date && (
              <div className="card bg-secondary-50 p-3">
                <p className="text-secondary-400 text-xs mb-1">Date prévue</p>
                <p className="font-medium text-secondary-900">
                  {format(new Date(booking.scheduled_date), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            )}
            <div className="card bg-secondary-50 p-3">
              <p className="text-secondary-400 text-xs mb-1">Créée le</p>
              <p className="font-medium text-secondary-900">
                {format(new Date(booking.created_at), 'dd/MM/yyyy', { locale: fr })}
              </p>
            </div>
          </div>

          {/* Suivi des travaux */}
          <div className="card mb-5">
            <h3 className="font-semibold text-secondary-900 mb-4">
              Suivi des travaux
            </h3>
            {isLoading ? (
              <div className="flex justify-center py-6"><span className="spinner w-6 h-6" /></div>
            ) : (
              <WorkTimeline
                updates={detail?.progress_updates || []}
                currentPercentage={lastPercentage}
                bookingId={booking.id}
              />
            )}
          </div>

          {/* Actions client */}
          <div className="space-y-2">
            {/* Travaux en cours → paiement solde OBLIGATOIRE */}
            {booking.status === 'EN_COURS' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Le peintre a déclaré les travaux terminés
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Vérifiez les travaux. Si vous êtes satisfait, procédez au paiement du solde pour finaliser la prestation.
                    </p>
                  </div>
                </div>
                <Link
                  to={`/client/bookings/${booking.id}/pay?type=SOLDE`}
                  className="btn bg-amber-500 hover:bg-amber-600 text-white w-full no-underline gap-2"
                >
                  <CreditCard size={16} />
                  Payer le solde et finaliser
                </Link>
              </div>
            )}

            {/* Réservation terminée → évaluer */}
            {booking.status === 'TERMINE' && soldePaidCheck && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <CheckCircle size={24} className="mx-auto text-green-500 mb-2" />
                <p className="text-sm font-medium text-green-800 mb-3">
                  Prestation terminée et payée !
                </p>
                <Link
                  to="/client/reviews"
                  className="btn bg-green-500 hover:bg-green-600 text-white w-full no-underline gap-2"
                >
                  <Star size={16} />
                  Évaluer le peintre
                </Link>
              </div>
            )}

            {/* Solde non encore payé */}
            {booking.status === 'TERMINE' && !soldePaidCheck && (
              <Link
                to={`/client/bookings/${booking.id}/pay?type=SOLDE`}
                className="btn btn-primary w-full no-underline gap-2"
              >
                <CreditCard size={16} />
                Payer le solde
              </Link>
            )}

            <button onClick={onClose} className="btn btn-secondary w-full">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page principale
// ---------------------------------------------------------------------------
export default function ClientBookingsPage() {
  const [selected, setSelected] = useState(null)

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['client-bookings'],
    queryFn:  () => transactionService.getClientBookings().then(r => r.data.results ?? r.data),
  })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-secondary-900">
          Mes réservations
        </h1>
        <p className="text-secondary-500 text-sm mt-1">
          Suivez l'avancement de vos travaux de peinture.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><span className="spinner w-8 h-8" /></div>
      ) : bookings.length === 0 ? (
        <div className="card text-center py-12">
          <CalendarCheck size={32} className="mx-auto text-secondary-200 mb-3" />
          <p className="text-secondary-500 mb-2">Aucune réservation pour le moment.</p>
          <p className="text-sm text-secondary-400">
            Acceptez un devis pour créer votre première réservation.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(booking => {
            const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.EN_ATTENTE
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
                  booking.status === 'ANNULE' ? 'bg-red-100' : 'bg-amber-100'
                )}>
                  <Icon size={20} className={
                    booking.status === 'TERMINE' ? 'text-green-600' :
                    booking.status === 'EN_COURS' ? 'text-blue-600' :
                    booking.status === 'ANNULE' ? 'text-red-600' : 'text-amber-600'
                  } />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-secondary-900">
                      {booking.painter_name}
                    </p>
                    <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                  </div>
                  <p className="text-sm text-secondary-500">
                    {Number(booking.quote_amount).toLocaleString('fr-FR')} FCFA
                  </p>
                  {booking.status === 'EN_COURS' && lastPct > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-secondary-100 rounded-full h-1.5">
                        <div
                          className="bg-primary-500 h-1.5 rounded-full"
                          style={{ width: `${lastPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-secondary-400">{lastPct}%</span>
                    </div>
                  )}
                </div>

                {booking.scheduled_date && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-secondary-400">
                      {format(new Date(booking.scheduled_date), 'dd MMM', { locale: fr })}
                    </p>
                  </div>
                )}
                <ChevronRight size={16} className="text-secondary-300 flex-shrink-0" />
              </button>
            )
          })}
        </div>
      )}

      {selected && (
        <BookingModal
          booking={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
