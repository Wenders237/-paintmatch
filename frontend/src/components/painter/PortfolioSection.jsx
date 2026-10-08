/**
 * PortfolioSection — Gestion des réalisations du peintre avec photos.
 */

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Image, Star, X, Upload } from 'lucide-react'
import servicesService from '@/services/servicesService'

function PortfolioForm({ initial, categories, onSave, onCancel, loading }) {
  const { t } = useTranslation(['services', 'errors'])
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initial || {},
  })
  return (
    <form onSubmit={handleSubmit(onSave)} className="card border border-primary-100 bg-primary-50 space-y-3 mb-4">
      <div>
        <label className="label">{t('services:portfolio_title')}</label>
        <input className={`input ${errors.title ? 'input-error' : ''}`}
          placeholder="Ex : Appartement T3 - Douala Akwa"
          {...register('title', { required: t('errors:required') })} />
        {errors.title && <p className="error-msg">{errors.title.message}</p>}
      </div>
      <div>
        <label className="label">{t('services:portfolio_category')}</label>
        <select className="input" {...register('category')}>
          <option value="">— Catégorie —</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t('services:portfolio_location')}</label>
          <input className="input" placeholder="Douala, Yaoundé..." {...register('location')} />
        </div>
        <div>
          <label className="label">{t('services:portfolio_date')}</label>
          <input type="date" className="input" {...register('date_completed')} />
        </div>
      </div>
      <div>
        <label className="label">{t('services:portfolio_description')}</label>
        <textarea rows={3} className="input resize-none"
          placeholder="Décrivez les travaux réalisés..."
          {...register('description')} />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn btn-secondary btn-sm">Annuler</button>
        <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
          {loading ? <span className="spinner w-4 h-4" /> : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}

function ImageUploadZone({ portfolioId, onDone }) {
  const { t } = useTranslation('services')
  const qc    = useQueryClient()
  const ref   = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [isCover, setIsCover]     = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('image', file)
    fd.append('is_cover', isCover)
    try {
      await servicesService.uploadPortfolioImage(portfolioId, fd)
      qc.invalidateQueries(['my-portfolio'])
      toast.success(t('image_uploaded'))
      onDone()
    } catch (err) {
      const msg = err.response?.data?.image?.[0] || 'Erreur upload.'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm text-secondary-600 cursor-pointer">
        <input type="checkbox" checked={isCover} onChange={e => setIsCover(e.target.checked)} className="rounded" />
        {t('cover_photo')}
      </label>
      <div
        className="border-2 border-dashed border-secondary-300 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 transition-colors"
        onClick={() => ref.current?.click()}
      >
        {uploading ? (
          <span className="spinner w-5 h-5 mx-auto" />
        ) : (
          <>
            <Upload size={20} className="mx-auto text-secondary-300 mb-1" />
            <p className="text-xs text-secondary-400">Cliquer pour ajouter une photo</p>
          </>
        )}
        <input ref={ref} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFile} />
      </div>
    </div>
  )
}

export default function PortfolioSection() {
  const { t }  = useTranslation('services')
  const qc     = useQueryClient()
  const [adding, setAdding]               = useState(false)
  const [editing, setEditing]             = useState(null)
  const [expandedImages, setExpanded]     = useState(null)

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => servicesService.getCategories().then(r => r.data.results ?? r.data),
  })

  const { data: portfolio = [], isLoading } = useQuery({
    queryKey: ['my-portfolio'],
    queryFn:  () => servicesService.getMyPortfolio().then(r => r.data.results ?? r.data),
  })

  const addMutation = useMutation({
    mutationFn: (data) => servicesService.addPortfolioItem(data),
    onSuccess: () => { qc.invalidateQueries(['my-portfolio']); toast.success(t('portfolio_saved')); setAdding(false) },
    onError: () => toast.error('Erreur lors de l\'enregistrement.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => servicesService.updatePortfolioItem(id, data),
    onSuccess: () => { qc.invalidateQueries(['my-portfolio']); toast.success(t('portfolio_saved')); setEditing(null) },
    onError: () => toast.error('Erreur lors de l\'enregistrement.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => servicesService.deletePortfolioItem(id),
    onSuccess: () => { qc.invalidateQueries(['my-portfolio']); toast.success(t('portfolio_deleted')) },
  })

  const deleteImageMutation = useMutation({
    mutationFn: (id) => servicesService.deletePortfolioImage(id),
    onSuccess: () => { qc.invalidateQueries(['my-portfolio']); toast.success(t('image_deleted')) },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-secondary-900">{t('my_portfolio')}</h2>
        <button onClick={() => { setAdding(true); setEditing(null) }} className="btn btn-primary btn-sm">
          <Plus size={15} />{t('add_portfolio')}
        </button>
      </div>

      {adding && (
        <PortfolioForm
          categories={categories}
          onSave={(data) => addMutation.mutate(data)}
          onCancel={() => setAdding(false)}
          loading={addMutation.isPending}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><span className="spinner w-6 h-6" /></div>
      ) : portfolio.length === 0 ? (
        <p className="text-sm text-secondary-400 text-center py-8">{t('no_portfolio')}</p>
      ) : (
        <div className="space-y-4">
          {portfolio.map(item => (
            <div key={item.id} className="card">
              {editing === item.id ? (
                <PortfolioForm
                  initial={item}
                  categories={categories}
                  onSave={(data) => updateMutation.mutate({ id: item.id, data })}
                  onCancel={() => setEditing(null)}
                  loading={updateMutation.isPending}
                />
              ) : (
                <>
                  {/* En-tête */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-secondary-900">{item.title}</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {item.category_name && (
                          <span className="badge badge-info">{item.category_name}</span>
                        )}
                        {item.location && (
                          <span className="text-xs text-secondary-400">{item.location}</span>
                        )}
                        {item.date_completed && (
                          <span className="text-xs text-secondary-400">
                            {new Date(item.date_completed).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-secondary-600 mt-2">{item.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setEditing(item.id)} className="p-2 text-secondary-400 hover:text-primary-600 transition-colors">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => deleteMutation.mutate(item.id)} className="p-2 text-secondary-400 hover:text-error transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Photos existantes */}
                  {item.images?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.images.map(img => (
                        <div key={img.id} className="relative group">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary-100">
                            <img
                              src={img.image}
                              alt={img.caption || item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {img.is_cover && (
                            <div className="absolute top-1 left-1 bg-primary-500 rounded-full p-0.5">
                              <Star size={10} className="text-white" />
                            </div>
                          )}
                          <button
                            onClick={() => deleteImageMutation.mutate(img.id)}
                            className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} className="text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ajout de photos */}
                  {expandedImages === item.id ? (
                    <div>
                      <ImageUploadZone
                        portfolioId={item.id}
                        onDone={() => setExpanded(null)}
                      />
                      <button onClick={() => setExpanded(null)} className="text-xs text-secondary-400 mt-2 hover:text-secondary-600">
                        Fermer
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setExpanded(item.id)}
                      className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 mt-1"
                    >
                      <Image size={13} />{t('add_photos')}
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
