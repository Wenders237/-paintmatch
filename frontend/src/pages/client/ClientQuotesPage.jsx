/**
 * ClientQuotesPage — Devis et demandes de devis du client.
 *
 * Onglet 1 : Demandes envoyées (QuoteRequests)
 * Onglet 2 : Devis reçus (Quotes) avec actions accepter/refuser/discuter
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  FileText, CheckCircle, XCircle, Clock,
  ChevronRight, Lightbulb, MessageSquare,
  Send, Plus, AlertCircle
} from 'lucide-react'
import clsx from 'clsx'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import transactionService from '@/services/transactionService'
import messagingService from '@/services/messagingService'

// ---------------------------------------------------------------------------
// Statuts
// ---------------------------------------------------------------------------
const REQUEST_STATUS = {
  EN_ATTENTE: { label: 'En attente de devis', cls: 'badge-warning', icon: Clock },
  REPONDU:    { label: 'Devis reçu',          cls: 'badge-info',    icon: FileText },
  EXPIRE:     { label: 'Expiré',              cls: 'badge-neutral', icon: Clock },
  ANNULE:     { label: 'Annulé',              cls: 'badge-neutral', icon: XCircle },
}

const QUOTE_STATUS = {
  ENVOYE:  { label: 'À examiner',  cls: 'badge-info',    icon: FileText },
  ACCEPTE: { label: 'Accepté',     cls: 'badge-success', icon: CheckCircle },
  REFUSE:  { label: 'Refusé',      cls: 'badge-error',   icon: XCircle },
  EXPIRE:  { label: 'Expiré',      cls: 'badge-neutral', icon: Clock },
  ANNULE:  { label: 'Annulé',      cls: 'badge-neutral', icon: XCircle },
}

// ---------------------------------------------------------------------------
// Modal devis — visualisation + actions
// ---------------------------------------------------------------------------
function QuoteModal({ quote, onClose, onRespond, onDiscuss }) {
  const [action, setAction] = useState(null)
  const [note, setNote]     = useState('')

  if (!quote) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">

          {/* En-tête */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-xl font-heading font-bold text-secondary-900">
                Devis de {quote.painter_name}
              </h2>
              <p className="text-sm text-secondary-500">{quote.request_title}</p>
            </div>
            <span className={`badge ${QUOTE_STATUS[quote.status]?.cls || 'badge-neutral'}`}>
              {QUOTE_STATUS[quote.status]?.label || quote.status}
            </span>
          </div>

          {/* Intro */}
          {quote.intro_text && (
            <p className="text-sm text-secondary-600 bg-secondary-50 rounded-xl p-3 mb-4 leading-relaxed">
              {quote.intro_text}
            </p>
          )}

          {/* Lignes du devis */}
          <div className="mb-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-secondary-200 text-left">
                  <th className="pb-2 text-secondary-500 font-medium">Description</th>
                  <th className="pb-2 text-secondary-500 font-medium text-right">Qté</th>
                  <th className="pb-2 text-secondary-500 font-medium text-right">P.U.</th>
                  <th className="pb-2 text-secondary-500 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {quote.items?.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-right">{item.quantity} {item.unit}</td>
                    <td className="py-2 text-right">{Number(item.unit_price).toLocaleString('fr-FR')}</td>
                    <td className="py-2 text-right font-medium">{Number(item.total_price).toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-secondary-200">
                  <td colSpan={3} className="pt-3 font-bold text-secondary-900">TOTAL</td>
                  <td className="pt-3 font-bold text-primary-600 text-right text-lg">
                    {Number(quote.total_amount).toLocaleString('fr-FR')} FCFA
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Badge IA */}
          {quote.ai_assisted && (
            <div className="flex items-center gap-2 text-xs text-primary-600 bg-primary-50 rounded-xl px-3 py-2 mb-4">
              <Lightbulb size={13} />
              Ce devis a été préparé avec l'assistance IA de PaintMatch.
            </div>
          )}

          {/* Notes */}
          {quote.notes && (
            <div className="bg-secondary-50 rounded-xl p-3 mb-4">
              <p className="text-xs font-semibold text-secondary-500 mb-1">Conditions</p>
              <p className="text-sm text-secondary-600 whitespace-pre-line">{quote.notes}</p>
            </div>
          )}

          {/* Validité */}
          {quote.valid_until && (
            <p className="text-xs text-secondary-400 mb-4">
              Valable jusqu'au {format(new Date(quote.valid_until), 'dd MMMM yyyy', { locale: fr })}
            </p>
          )}

          {/* Actions si devis envoyé */}
          {quote.status === 'ENVOYE' && (
            <div className="space-y-3 border-t border-secondary-100 pt-4">

              {/* Bouton discuter */}
              <button
                onClick={() => onDiscuss(quote)}
                className="btn btn-secondary w-full gap-2"
              >
                <MessageSquare size={16} />
                Discuter avec le peintre
              </button>

              {!action ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setAction('REFUSE')}
                    className="btn btn-danger flex-1"
                  >
                    <XCircle size={16} /> Refuser
                  </button>
                  <button
                    onClick={() => setAction('ACCEPTE')}
                    className="btn bg-green-500 hover:bg-green-600 text-white flex-1"
                  >
                    <CheckCircle size={16} /> Accepter
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={clsx(
                    'flex items-start gap-2 rounded-xl p-3',
                    action === 'ACCEPTE' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  )}>
                    <AlertCircle size={16} className={action === 'ACCEPTE' ? 'text-green-600' : 'text-red-600'} />
                    <p className="text-sm font-medium">
                      {action === 'ACCEPTE'
                        ? 'En acceptant, une réservation sera créée automatiquement et vous pourrez procéder au paiement de l\'acompte.'
                        : 'Motif de refus (optionnel)'}
                    </p>
                  </div>
                  {action === 'REFUSE' && (
                    <textarea
                      rows={2}
                      className="input resize-none"
                      placeholder="Expliquez votre refus..."
                      value={note}
                      onChange={e => setNote(e.target.value)}
                    />
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => setAction(null)} className="btn btn-secondary">
                      Retour
                    </button>
                    <button
                      onClick={() => onRespond(quote.id, action, note)}
                      className={clsx(
                        'btn flex-1',
                        action === 'ACCEPTE'
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'btn-danger'
                      )}
                    >
                      Confirmer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Si devis accepté → lien vers la réservation */}
          {quote.status === 'ACCEPTE' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
              <p className="text-sm text-green-800 font-medium mb-2">
                ✓ Devis accepté — Réservation créée
              </p>
              <Link
                to="/client/bookings"
                className="btn bg-green-500 hover:bg-green-600 text-white w-full no-underline"
                onClick={onClose}
              >
                Voir mes réservations et payer l'acompte
              </Link>
            </div>
          )}

          <button onClick={onClose} className="btn btn-secondary w-full mt-3">
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
export default function ClientQuotesPage() {
  const qc                  = useQueryClient()
  const navigate            = useNavigate()
  const [activeTab, setActiveTab] = useState('quotes')
  const [selected, setSelected]   = useState(null)

  // Devis reçus
  const { data: quotes = [], isLoading: loadingQuotes } = useQuery({
    queryKey: ['client-quotes'],
    queryFn:  () => transactionService.getMyQuotes().then(r => r.data.results ?? r.data),
  })

  // Demandes envoyées
  const { data: requests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['client-quote-requests'],
    queryFn:  () => transactionService.getMyQuoteRequests().then(r => r.data.results ?? r.data),
  })

  const respondMutation = useMutation({
    mutationFn: ({ id, action, note }) => transactionService.respondQuote(id, action, note),
    onSuccess: (res) => {
      qc.invalidateQueries(['client-quotes'])
      setSelected(null)
      if (res.data.booking_id) {
        toast.success('Devis accepté ! Votre réservation a été créée.')
        navigate('/client/bookings')
      } else {
        toast.success('Devis refusé.')
      }
    },
    onError: () => toast.error('Erreur lors de la réponse.'),
  })

  // Ouvrir la messagerie avec le peintre
  const handleDiscuss = async (quote) => {
    if (!quote.painter_id) {
      navigate('/messages')
      return
    }
    try {
      const res = await messagingService.startConversation(quote.painter_id)
      const convId = res.data.conversation.id
      navigate(`/messages?conv=${convId}`)
    } catch {
      navigate('/messages')
    }
    setSelected(null)
  }

  const pendingQuotes = quotes.filter(q => q.status === 'ENVOYE')

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-secondary-900">
            Mes devis
          </h1>
          <p className="text-secondary-500 text-sm mt-1">
            Gérez vos demandes et répondez aux devis reçus.
          </p>
        </div>
        <Link to="/painters" className="btn btn-primary btn-sm no-underline gap-2">
          <Plus size={15} /> Nouveau devis
        </Link>
      </div>

      {/* Alerte devis en attente */}
      {pendingQuotes.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 flex items-center gap-3">
          <AlertCircle size={18} className="text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            <strong>{pendingQuotes.length} devis</strong> en attente de votre réponse.
          </p>
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'quotes',   label: `Devis reçus (${quotes.length})` },
          { key: 'requests', label: `Demandes envoyées (${requests.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-primary-500 text-white'
                : 'bg-white border border-secondary-200 text-secondary-600 hover:border-primary-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Onglet devis reçus */}
      {activeTab === 'quotes' && (
        loadingQuotes ? (
          <div className="flex justify-center py-12"><span className="spinner w-8 h-8" /></div>
        ) : quotes.length === 0 ? (
          <div className="card text-center py-12">
            <FileText size={32} className="mx-auto text-secondary-200 mb-3" />
            <p className="text-secondary-500 mb-4">Aucun devis reçu pour le moment.</p>
            <Link to="/painters" className="btn btn-primary no-underline">
              Trouver un peintre
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {quotes.map(quote => {
              const cfg = QUOTE_STATUS[quote.status] || { label: quote.status, cls: 'badge-neutral' }
              return (
                <button
                  key={quote.id}
                  onClick={() => setSelected(quote)}
                  className="card-hover flex items-center gap-4 w-full text-left"
                >
                  <div className={clsx(
                    'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
                    quote.status === 'ENVOYE' ? 'bg-blue-100' :
                    quote.status === 'ACCEPTE' ? 'bg-green-100' :
                    'bg-secondary-100'
                  )}>
                    <FileText size={18} className={
                      quote.status === 'ENVOYE' ? 'text-blue-600' :
                      quote.status === 'ACCEPTE' ? 'text-green-600' :
                      'text-secondary-500'
                    } />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-secondary-900">{quote.request_title}</p>
                      <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                      {quote.ai_assisted && <Lightbulb size={13} className="text-primary-400" />}
                    </div>
                    <p className="text-sm text-secondary-500">De {quote.painter_name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-primary-600">
                      {Number(quote.total_amount).toLocaleString('fr-FR')} FCFA
                    </p>
                    {quote.sent_at && (
                      <p className="text-xs text-secondary-400">
                        {format(new Date(quote.sent_at), 'dd/MM/yyyy', { locale: fr })}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-secondary-300 flex-shrink-0" />
                </button>
              )
            })}
          </div>
        )
      )}

      {/* Onglet demandes envoyées */}
      {activeTab === 'requests' && (
        loadingRequests ? (
          <div className="flex justify-center py-12"><span className="spinner w-8 h-8" /></div>
        ) : requests.length === 0 ? (
          <div className="card text-center py-12">
            <Send size={32} className="mx-auto text-secondary-200 mb-3" />
            <p className="text-secondary-500 mb-4">Aucune demande envoyée.</p>
            <Link to="/painters" className="btn btn-primary no-underline">
              Trouver un peintre
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => {
              const cfg = REQUEST_STATUS[req.status] || { label: req.status, cls: 'badge-neutral', icon: Clock }
              const Icon = cfg.icon
              return (
                <div key={req.id} className="card flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-secondary-100 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-secondary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-secondary-900">{req.title}</p>
                      <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                    </div>
                    <p className="text-sm text-secondary-500">À {req.painter_name}</p>
                    {req.location && (
                      <p className="text-xs text-secondary-400">{req.location}</p>
                    )}
                    <p className="text-xs text-secondary-400 mt-1">
                      {format(new Date(req.created_at), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  {req.has_quote && (
                    <button
                      onClick={() => setActiveTab('quotes')}
                      className="btn btn-primary btn-sm flex-shrink-0"
                    >
                      Voir le devis
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Modal devis */}
      {selected && (
        <QuoteModal
          quote={selected}
          onClose={() => setSelected(null)}
          onRespond={(id, action, note) => respondMutation.mutate({ id, action, note })}
          onDiscuss={handleDiscuss}
        />
      )}
    </div>
  )
}
