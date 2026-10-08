/**
 * PainterQuotesPage — Gestion des devis (peintre).
 * Affiche les demandes reçues et permet de rédiger des devis avec assistance IA.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  FileText, Plus, Trash2, Send, Lightbulb,
  ChevronRight, Clock, CheckCircle
} from 'lucide-react'
import clsx from 'clsx'
import transactionService from '@/services/transactionService'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// ---------------------------------------------------------------------------
// Formulaire de rédaction de devis
// ---------------------------------------------------------------------------
function QuoteForm({ request, onClose }) {
  const qc = useQueryClient()
  const [items, setItems] = useState([
    { description: '', quantity: 1, unit: 'm²', unit_price: 0 }
  ])
  const [introText, setIntroText]   = useState('')
  const [notes, setNotes]           = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [aiLoading, setAiLoading]   = useState(false)
  const [aiDisclaimer, setAiDisclaimer] = useState('')

  const totalAmount = items.reduce(
    (sum, item) => sum + (Number(item.quantity) * Number(item.unit_price) || 0), 0
  )

  // Assistance IA
  const handleAIAssist = async () => {
    setAiLoading(true)
    try {
      const res = await transactionService.getAIAssist(request.id)
      const suggestion = res.data
      setIntroText(suggestion.intro_text || '')
      setNotes(suggestion.notes || '')
      setAiDisclaimer(suggestion.disclaimer || '')
      if (suggestion.items?.length > 0) {
        setItems(suggestion.items.map(i => ({
          description: i.description,
          quantity:    Number(i.quantity),
          unit:        i.unit,
          unit_price:  Number(i.unit_price),
        })))
      }
      toast.success('Suggestions IA appliquées ! Vérifiez et ajustez avant d\'envoyer.')
    } catch {
      toast.error('Erreur lors de la génération des suggestions.')
    } finally {
      setAiLoading(false)
    }
  }

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // Étape 1 : créer le devis
      const res = await transactionService.createQuote({ ...data, request_id: request.id })
      const quoteId = res.data.id
      // Étape 2 : envoyer immédiatement
      await transactionService.sendQuote(quoteId)
      return res
    },
    onSuccess: () => {
      qc.invalidateQueries(['painter-quote-requests'])
      toast.success('Devis envoyé au client !')
      onClose()
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Erreur lors de la création.')
    },
  })

  const addItem = () => setItems(prev => [
    ...prev, { description: '', quantity: 1, unit: 'm²', unit_price: 0 }
  ])

  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i))

  const updateItem = (i, field, value) => setItems(prev =>
    prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item)
  )

  const handleSave = (asDraft) => {
    saveMutation.mutate({
      intro_text:   introText,
      items:        items.map((item, i) => ({
        ...item,
        total_price: Number(item.quantity) * Number(item.unit_price),
        order: i,
      })),
      total_amount: totalAmount,
      valid_until:  validUntil || undefined,
      notes,
      ai_assisted:  !!aiDisclaimer,
    })
  }
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">

          {/* En-tête */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-xl font-heading font-bold text-secondary-900">
                Rédiger un devis
              </h2>
              <p className="text-sm text-secondary-500">{request.title} — {request.location}</p>
            </div>
            <button
              onClick={handleAIAssist}
              disabled={aiLoading}
              className="btn bg-primary-50 text-primary-600 hover:bg-primary-100 btn-sm gap-2"
            >
              {aiLoading
                ? <span className="spinner w-4 h-4" />
                : <Lightbulb size={15} />
              }
              Assistance IA
            </button>
          </div>

          {/* Disclaimer IA */}
          {aiDisclaimer && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700">
              {aiDisclaimer}
            </div>
          )}

          {/* Infos de la demande */}
          <div className="bg-secondary-50 rounded-xl p-3 mb-5 text-sm space-y-1">
            <p><strong>Client :</strong> {request.client_name}</p>
            <p><strong>Lieu :</strong> {request.location}</p>
            {request.surface_m2 && <p><strong>Surface :</strong> {request.surface_m2} m²</p>}
            {request.budget_max && (
              <p><strong>Budget max :</strong> {Number(request.budget_max).toLocaleString('fr-FR')} FCFA</p>
            )}
            <p className="text-secondary-500 leading-relaxed">{request.description}</p>
          </div>

          {/* Introduction */}
          <div className="mb-4">
            <label className="label">Texte d'introduction</label>
            <textarea rows={3} className="input resize-none"
              value={introText} onChange={e => setIntroText(e.target.value)}
              placeholder="Présentez votre offre..." />
          </div>

          {/* Lignes du devis */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Lignes du devis</label>
              <button onClick={addItem} className="btn btn-secondary btn-sm gap-1">
                <Plus size={13} /> Ajouter une ligne
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-5">
                    <input
                      className="input text-sm"
                      placeholder="Description"
                      value={item.description}
                      onChange={e => updateItem(i, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number" min="0" step="0.1"
                      className="input text-sm"
                      placeholder="Qté"
                      value={item.quantity}
                      onChange={e => updateItem(i, 'quantity', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      className="input text-sm"
                      value={item.unit}
                      onChange={e => updateItem(i, 'unit', e.target.value)}
                    >
                      {['m²', 'h', 'forfait', 'unité', 'ml'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number" min="0"
                      className="input text-sm"
                      placeholder="Prix/u"
                      value={item.unit_price}
                      onChange={e => updateItem(i, 'unit_price', e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {items.length > 1 && (
                      <button onClick={() => removeItem(i)}
                        className="p-2 text-secondary-400 hover:text-error">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-end mt-3 pt-3 border-t border-secondary-200">
              <div className="text-right">
                <p className="text-sm text-secondary-500">Total estimé</p>
                <p className="text-xl font-bold text-primary-600">
                  {totalAmount.toLocaleString('fr-FR')} FCFA
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Valable jusqu'au</label>
              <input type="date" className="input" value={validUntil}
                onChange={e => setValidUntil(e.target.value)} />
            </div>
          </div>

          <div className="mb-4">
            <label className="label">Notes et conditions</label>
            <textarea rows={3} className="input resize-none"
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Conditions de paiement, délais, matériaux inclus..." />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-secondary">Annuler</button>
            <button
              onClick={() => handleSave(false)}
              disabled={saveMutation.isPending || !items[0]?.description}
              className="btn btn-primary flex-1 gap-2"
            >
              {saveMutation.isPending
                ? <span className="spinner w-4 h-4" />
                : <><Send size={15} /> Envoyer le devis</>
              }
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
export default function PainterQuotesPage() {
  const [selectedRequest, setSelectedRequest] = useState(null)

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['painter-quote-requests'],
    queryFn:  () => transactionService.getPainterQuoteRequests().then(r => r.data.results ?? r.data),
  })

  const pending  = requests.filter(r => r.status === 'EN_ATTENTE')
  const answered = requests.filter(r => r.status === 'REPONDU')

  const Section = ({ title, items, icon: Icon, emptyMsg }) => (
    <div className="mb-8">
      <h2 className="font-semibold text-secondary-700 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
        <Icon size={15} /> {title}
        <span className="badge badge-neutral">{items.length}</span>
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-secondary-400 py-4">{emptyMsg}</p>
      ) : (
        <div className="space-y-3">
          {items.map(req => (
            <div key={req.id} className="card flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-secondary-900">{req.title}</p>
                <div className="flex flex-wrap gap-2 mt-1 text-xs text-secondary-500">
                  <span>{req.client_name}</span>
                  <span>•</span>
                  <span>{req.location}</span>
                  {req.surface_m2 && <><span>•</span><span>{req.surface_m2} m²</span></>}
                </div>
                {req.description && (
                  <p className="text-sm text-secondary-500 mt-1 line-clamp-2">{req.description}</p>
                )}
                <p className="text-xs text-secondary-400 mt-1">
                  {format(new Date(req.created_at), 'dd MMM yyyy', { locale: fr })}
                </p>
              </div>
              {req.status === 'EN_ATTENTE' ? (
                <button
                  onClick={() => setSelectedRequest(req)}
                  className="btn btn-primary btn-sm gap-1 flex-shrink-0"
                >
                  <FileText size={14} /> Rédiger le devis
                </button>
              ) : req.has_quote && req.quote_status === 'BROUILLON' ? (
                <button
                  onClick={() => setSelectedRequest(req)}
                  className="btn bg-amber-500 hover:bg-amber-600 text-white btn-sm gap-1 flex-shrink-0"
                >
                  <Send size={14} /> Finaliser et envoyer
                </button>
              ) : (
                <span className="badge badge-success flex items-center gap-1 flex-shrink-0">
                  <CheckCircle size={12} /> Devis envoyé
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-secondary-900">Mes devis</h1>
        <p className="text-secondary-500 text-sm mt-1">
          Gérez vos demandes de devis et rédigez vos offres.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><span className="spinner w-8 h-8" /></div>
      ) : (
        <>
          <Section
            title="En attente de réponse"
            items={pending}
            icon={Clock}
            emptyMsg="Aucune demande en attente."
          />
          <Section
            title="Devis envoyés"
            items={answered}
            icon={CheckCircle}
            emptyMsg="Aucun devis envoyé."
          />
        </>
      )}

      {selectedRequest && (
        <QuoteForm
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  )
}
