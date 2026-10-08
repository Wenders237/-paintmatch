/**
 * QuoteRequestPage — Formulaire de demande de devis (client).
 * Accessible via /client/quotes/new?painter=<id>
 */

import { useForm } from 'react-hook-form'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { ChevronLeft, FileText } from 'lucide-react'
import servicesService from '@/services/servicesService'
import transactionService from '@/services/transactionService'

export default function QuoteRequestPage() {
  const { t }            = useTranslation(['errors', 'common'])
  const navigate         = useNavigate()
  const [searchParams]   = useSearchParams()
  const painterId        = searchParams.get('painter')

  const { register, handleSubmit, formState: { errors } } = useForm()

  // Catégories de prestations
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => servicesService.getCategories().then(r => r.data.results ?? r.data),
  })

  const mutation = useMutation({
    mutationFn: (data) => transactionService.createQuoteRequest({
      ...data,
      painter: painterId,
    }),
    onSuccess: () => {
      toast.success('Demande de devis envoyée avec succès !')
      navigate('/client/quotes')
    },
    onError: (err) => {
      const msg = err.response?.data?.painter?.[0]
             || err.response?.data?.detail
             || t('errors:server_error')
      toast.error(msg)
    },
  })

  if (!painterId) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <p className="text-secondary-500 mb-4">Aucun peintre sélectionné.</p>
        <Link to="/painters" className="btn btn-primary no-underline">
          Trouver un peintre
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link to={`/painters/${painterId}`}
        className="inline-flex items-center gap-1 text-sm text-secondary-500 hover:text-secondary-800 mb-5 no-underline">
        <ChevronLeft size={16} /> Retour au profil
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
          <FileText size={20} className="text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-secondary-900">
            Demander un devis
          </h1>
          <p className="text-sm text-secondary-500">Décrivez vos travaux en détail</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">

          {/* Titre */}
          <div>
            <label className="label">Titre des travaux *</label>
            <input
              className={`input ${errors.title ? 'input-error' : ''}`}
              placeholder="Ex : Peinture de l'appartement au 2ème étage"
              {...register('title', { required: t('errors:required') })}
            />
            {errors.title && <p className="error-msg">{errors.title.message}</p>}
          </div>

          {/* Catégorie */}
          <div>
            <label className="label">Type de prestation</label>
            <select className="input" {...register('category')}>
              <option value="">— Sélectionner une catégorie —</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description détaillée *</label>
            <textarea
              rows={4}
              className={`input resize-none ${errors.description ? 'input-error' : ''}`}
              placeholder="Décrivez les travaux souhaités, l'état actuel, vos préférences de couleurs, etc."
              {...register('description', { required: t('errors:required') })}
            />
            {errors.description && <p className="error-msg">{errors.description.message}</p>}
          </div>

          {/* Lieu */}
          <div>
            <label className="label">Lieu des travaux *</label>
            <input
              className={`input ${errors.location ? 'input-error' : ''}`}
              placeholder="Ex : Douala, Akwa — Rue de la Paix"
              {...register('location', { required: t('errors:required') })}
            />
            {errors.location && <p className="error-msg">{errors.location.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Surface */}
            <div>
              <label className="label">Surface estimée (m²)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                className="input"
                placeholder="Ex : 45"
                {...register('surface_m2', { min: 0 })}
              />
            </div>

            {/* Date souhaitée */}
            <div>
              <label className="label">Date souhaitée</label>
              <input
                type="date"
                className="input"
                {...register('desired_start_date')}
              />
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="label">Budget maximum (FCFA) — optionnel</label>
            <input
              type="number"
              min="0"
              className="input"
              placeholder="Ex : 500000"
              {...register('budget_max', { min: 0 })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn btn-primary flex-1"
            >
              {mutation.isPending
                ? <span className="spinner w-4 h-4" />
                : 'Envoyer la demande de devis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
