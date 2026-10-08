/**
 * PaymentPage — Page de paiement (acompte ou solde).
 * Accessible via /client/bookings/:id/pay?type=ACOMPTE|SOLDE
 */

import { useState } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  CreditCard, Phone, CheckCircle, ChevronLeft,
  ShieldCheck, AlertCircle, Smartphone
} from 'lucide-react'
import clsx from 'clsx'
import transactionService from '@/services/transactionService'

// ---------------------------------------------------------------------------
// Moyens de paiement disponibles
// ---------------------------------------------------------------------------
const PAYMENT_METHODS = [
  {
    id:    'MTN_MOMO',
    label: 'MTN Mobile Money',
    icon:  '🟡',
    color: 'border-yellow-400 bg-yellow-50',
    activeColor: 'border-yellow-500 bg-yellow-100',
    prefix: '237 6[7-9]X XXX XXX',
  },
  {
    id:    'ORANGE_MONEY',
    label: 'Orange Money',
    icon:  '🟠',
    color: 'border-orange-400 bg-orange-50',
    activeColor: 'border-orange-500 bg-orange-100',
    prefix: '237 6[5-6]X XXX XXX',
  },
  {
    id:    'SIMULATION',
    label: 'Simulation (test)',
    icon:  '🔵',
    color: 'border-blue-300 bg-blue-50',
    activeColor: 'border-blue-500 bg-blue-100',
    prefix: 'Tout numéro',
  },
]

// ---------------------------------------------------------------------------
// Page principale
// ---------------------------------------------------------------------------
export default function PaymentPage() {
  const { id }          = useParams()
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()
  const qc              = useQueryClient()

  const paymentType = searchParams.get('type') || 'ACOMPTE'
  const [method, setMethod]   = useState('MTN_MOMO')
  const [phone, setPhone]     = useState('')
  const [percentage, setPercentage] = useState(30)
  const [success, setSuccess] = useState(null)

  // Historique des paiements
  const { data: paymentData } = useQuery({
    queryKey: ['payments', id],
    queryFn:  () => transactionService.getPaymentHistory(id).then(r => r.data),
  })

  const booking = useQuery({
    queryKey: ['booking', id],
    queryFn:  () => transactionService.getBooking(id).then(r => r.data),
  })

  const total = paymentData?.total ? Number(paymentData.total) : 0
  const acomptePaid = paymentData?.payments?.find(
    p => p.payment_type === 'ACOMPTE' && p.status === 'TRAITE'
  )
  const soldePaid = paymentData?.payments?.find(
    p => p.payment_type === 'SOLDE' && p.status === 'TRAITE'
  )

  const amountToPay = paymentType === 'ACOMPTE'
    ? Math.round(total * percentage / 100)
    : total - (acomptePaid ? Number(acomptePaid.amount) : 0)

  const mutation = useMutation({
    mutationFn: () => transactionService.initiatePayment(id, {
      payment_type: paymentType,
      method,
      phone,
      percentage,
    }),
    onSuccess: (res) => {
      setSuccess(res.data)
      qc.invalidateQueries(['payments', id])
      qc.invalidateQueries(['client-bookings'])
      toast.success(res.data.message)
      // Si solde payé → rediriger vers évaluation après 2s
      if (res.data.payment_type === 'SOLDE') {
        setTimeout(() => navigate('/client/reviews'), 2000)
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Erreur lors du paiement.')
    },
  })

  // Succès
  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-secondary-900 mb-2">
          Paiement réussi !
        </h1>
        <p className="text-secondary-500 mb-2">{success.message}</p>
        <div className="card bg-green-50 border border-green-200 mb-6 text-left">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-secondary-500">Type</span>
              <span className="font-medium">{success.payment_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-500">Montant</span>
              <span className="font-bold text-green-600">
                {Number(success.amount).toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-500">Référence</span>
              <span className="font-mono text-xs">{success.transaction_ref}</span>
            </div>
          </div>
        </div>
        <Link to="/client/bookings" className="btn btn-primary no-underline w-full">
          Voir mes réservations
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">

      {/* Retour */}
      <Link
        to="/client/bookings"
        className="inline-flex items-center gap-1 text-sm text-secondary-500 hover:text-secondary-800 mb-5 no-underline"
      >
        <ChevronLeft size={16} /> Retour aux réservations
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
          <CreditCard size={20} className="text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-secondary-900">
            {paymentType === 'ACOMPTE' ? 'Payer l\'acompte' : 'Payer le solde'}
          </h1>
          <p className="text-sm text-secondary-500">
            {paymentType === 'ACOMPTE'
              ? 'Confirmez votre réservation avec un acompte'
              : 'Finalisez le paiement après les travaux'}
          </p>
        </div>
      </div>

      {/* Résumé montant */}
      <div className="card mb-5 bg-primary-50 border border-primary-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-secondary-500">
              {paymentType === 'ACOMPTE'
                ? `Acompte ${percentage}% sur`
                : 'Solde restant sur'}
            </p>
            <p className="text-xs text-secondary-400">
              Total : {total.toLocaleString('fr-FR')} FCFA
            </p>
          </div>
          <p className="text-2xl font-heading font-bold text-primary-600">
            {amountToPay.toLocaleString('fr-FR')} FCFA
          </p>
        </div>

        {/* Slider pourcentage acompte */}
        {paymentType === 'ACOMPTE' && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-secondary-500 mb-1">
              <span>Acompte : {percentage}%</span>
              <span>{amountToPay.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <input
              type="range" min="10" max="100" step="10"
              value={percentage}
              onChange={e => setPercentage(Number(e.target.value))}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-xs text-secondary-400 mt-1">
              <span>10%</span><span>50%</span><span>100%</span>
            </div>
          </div>
        )}
      </div>

      {/* Moyen de paiement */}
      <div className="mb-5">
        <p className="label mb-3">Moyen de paiement</p>
        <div className="space-y-2">
          {PAYMENT_METHODS.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={clsx(
                'w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
                method === m.id ? m.activeColor : m.color
              )}
            >
              <span className="text-2xl">{m.icon}</span>
              <div>
                <p className="font-semibold text-secondary-900 text-sm">{m.label}</p>
                <p className="text-xs text-secondary-500">{m.prefix}</p>
              </div>
              <div className={clsx(
                'ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center',
                method === m.id ? 'border-primary-500 bg-primary-500' : 'border-secondary-300'
              )}>
                {method === m.id && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Numéro de téléphone */}
      <div className="mb-5">
        <label className="label">Numéro Mobile Money</label>
        <div className="relative">
          <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
          <input
            type="tel"
            className="input pl-9"
            placeholder="237 6XX XXX XXX"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </div>
        <p className="text-xs text-secondary-400 mt-1">
          Le paiement sera initié sur ce numéro. Vous recevrez une confirmation par SMS.
        </p>
      </div>

      {/* Sécurité */}
      <div className="flex items-start gap-2 bg-secondary-50 rounded-xl p-3 mb-5">
        <ShieldCheck size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-secondary-500">
          Votre paiement est sécurisé. Aucune information bancaire n'est stockée sur nos serveurs.
        </p>
      </div>

      {/* Bouton payer */}
      <button
        onClick={() => mutation.mutate()}
        disabled={!phone.trim() || mutation.isPending}
        className="btn btn-primary w-full text-base py-4"
      >
        {mutation.isPending ? (
          <span className="spinner w-5 h-5" />
        ) : (
          <>
            <Smartphone size={18} />
            Payer {amountToPay.toLocaleString('fr-FR')} FCFA
          </>
        )}
      </button>

      {/* Historique des paiements */}
      {paymentData?.payments?.length > 0 && (
        <div className="mt-6 card">
          <h3 className="font-semibold text-secondary-900 mb-3 text-sm">
            Historique des paiements
          </h3>
          <div className="space-y-2">
            {paymentData.payments.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{p.payment_type}</span>
                  <span className="text-secondary-400 text-xs ml-2">{p.method}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {Number(p.amount).toLocaleString('fr-FR')} FCFA
                  </span>
                  <span className={clsx(
                    'badge text-xs',
                    p.status === 'TRAITE' ? 'badge-success' :
                    p.status === 'ECHOUE' ? 'badge-error' : 'badge-warning'
                  )}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
