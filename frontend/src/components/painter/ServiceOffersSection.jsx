/**
 * ServiceOffersSection — Gestion des offres de services du peintre.
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import servicesService from '@/services/servicesService'

function OfferForm({ initial, categories, onSave, onCancel, loading }) {
  const { t } = useTranslation(['services', 'errors'])
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initial || { is_active: true },
  })
  return (
    <form onSubmit={handleSubmit(onSave)} className="card border border-primary-100 bg-primary-50 space-y-3 mb-4">
      <div>
        <label className="label">{t('services:offer_category')}</label>
        <select className={`input ${errors.category ? 'input-error' : ''}`}
          {...register('category', { required: t('errors:required') })}>
          <option value="">— Catégorie —</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {errors.category && <p className="error-msg">{errors.category.message}</p>}
      </div>
      <div>
        <label className="label">{t('services:offer_title')}</label>
        <input className={`input ${errors.title ? 'input-error' : ''}`}
          placeholder="Ex : Peinture intérieure complète"
          {...register('title', { required: t('errors:required') })} />
        {errors.title && <p className="error-msg">{errors.title.message}</p>}
      </div>
      <div>
        <label className="label">{t('services:offer_description')}</label>
        <textarea rows={2} className="input resize-none"
          placeholder="Décrivez ce qui est inclus dans cette offre..."
          {...register('description')} />
      </div>
      <div>
        <label className="label">{t('services:price_range')}</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input type="number" className="input" placeholder={t('services:price_min')}
              min="0" {...register('price_range_min', { min: 0 })} />
          </div>
          <div>
            <input type="number" className="input" placeholder={t('services:price_max')}
              min="0" {...register('price_range_max', { min: 0 })} />
          </div>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-secondary-700 cursor-pointer">
        <input type="checkbox" {...register('is_active')} className="rounded" />
        {t('services:offer_active')}
      </label>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn btn-secondary btn-sm">Annuler</button>
        <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
          {loading ? <span className="spinner w-4 h-4" /> : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}

export default function ServiceOffersSection() {
  const { t } = useTranslation('services')
  const qc    = useQueryClient()
  const [adding, setAdding]   = useState(false)
  const [editing, setEditing] = useState(null)

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => servicesService.getCategories().then(r => r.data.results ?? r.data),
  })

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['my-offers'],
    queryFn:  () => servicesService.getMyOffers().then(r => r.data.results ?? r.data),
  })

  const addMutation = useMutation({
    mutationFn: (data) => servicesService.addOffer(data),
    onSuccess: () => { qc.invalidateQueries(['my-offers']); toast.success(t('offer_saved')); setAdding(false) },
    onError: (err) => toast.error(err.response?.data?.price_range_max?.[0] || 'Erreur.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => servicesService.updateOffer(id, data),
    onSuccess: () => { qc.invalidateQueries(['my-offers']); toast.success(t('offer_saved')); setEditing(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => servicesService.deleteOffer(id),
    onSuccess: () => { qc.invalidateQueries(['my-offers']); toast.success(t('offer_deleted')) },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-secondary-900">{t('my_offers')}</h2>
        <button onClick={() => { setAdding(true); setEditing(null) }} className="btn btn-primary btn-sm">
          <Plus size={15} />{t('add_offer')}
        </button>
      </div>

      {adding && (
        <OfferForm
          categories={categories}
          onSave={(data) => addMutation.mutate(data)}
          onCancel={() => setAdding(false)}
          loading={addMutation.isPending}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><span className="spinner w-6 h-6" /></div>
      ) : offers.length === 0 ? (
        <p className="text-sm text-secondary-400 text-center py-8">{t('no_offers')}</p>
      ) : (
        <div className="space-y-3">
          {offers.map(offer => (
            <div key={offer.id}>
              {editing === offer.id ? (
                <OfferForm
                  initial={{ ...offer, category: offer.category }}
                  categories={categories}
                  onSave={(data) => updateMutation.mutate({ id: offer.id, data })}
                  onCancel={() => setEditing(null)}
                  loading={updateMutation.isPending}
                />
              ) : (
                <div className="card flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <Tag size={18} className="text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-secondary-900">{offer.title}</p>
                      {!offer.is_active && <span className="badge badge-neutral">Inactive</span>}
                    </div>
                    <p className="text-xs text-secondary-400 mt-0.5">{offer.category_name}</p>
                    {offer.description && (
                      <p className="text-sm text-secondary-600 mt-1">{offer.description}</p>
                    )}
                    {(offer.price_range_min || offer.price_range_max) && (
                      <p className="text-sm font-medium text-primary-600 mt-1">
                        {offer.price_range_min && `${Number(offer.price_range_min).toLocaleString('fr-FR')} FCFA`}
                        {offer.price_range_min && offer.price_range_max && ' – '}
                        {offer.price_range_max && `${Number(offer.price_range_max).toLocaleString('fr-FR')} FCFA`}
                        <span className="text-secondary-400 font-normal"> /m²</span>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setEditing(offer.id)} className="p-2 text-secondary-400 hover:text-primary-600 transition-colors">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => deleteMutation.mutate(offer.id)} className="p-2 text-secondary-400 hover:text-error transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
