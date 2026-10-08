/**
 * AvailabilitySection — Gestion des disponibilités du peintre connecté.
 */

import { useState } from 'react'
import { useForm }  from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Trash2, Pencil, CalendarDays } from 'lucide-react'
import clsx from 'clsx'
import servicesService from '@/services/servicesService'

function AvailabilityForm({ initial, onSave, onCancel, loading }) {
  const { t }  = useTranslation(['services', 'errors'])
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: initial || { is_available: true },
  })
  const isAvailable = watch('is_available', initial?.is_available ?? true)

  return (
    <form onSubmit={handleSubmit(onSave)}
      className="card border border-primary-100 bg-primary-50 space-y-3 mb-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t('services:date_start')}</label>
          <input type="date" className={`input ${errors.date_start ? 'input-error' : ''}`}
            {...register('date_start', { required: t('errors:required') })} />
          {errors.date_start && <p className="error-msg">{errors.date_start.message}</p>}
        </div>
        <div>
          <label className="label">{t('services:date_end')}</label>
          <input type="date" className={`input ${errors.date_end ? 'input-error' : ''}`}
            {...register('date_end', { required: t('errors:required') })} />
          {errors.date_end && <p className="error-msg">{errors.date_end.message}</p>}
        </div>
      </div>

      {/* Toggle disponible / indisponible */}
      <div>
        <label className="label">Statut</label>
        <div className="flex gap-3">
          {[true, false].map(val => (
            <label key={String(val)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all',
                (isAvailable === val || (isAvailable === undefined && val === true))
                  ? val
                    ? 'border-success bg-green-50 text-green-700'
                    : 'border-error bg-red-50 text-red-700'
                  : 'border-secondary-200 text-secondary-500'
              )}>
              <input type="radio" className="hidden"
                {...register('is_available')}
                value={String(val)}
                defaultChecked={initial ? String(initial.is_available) === String(val) : val === true}
              />
              <div className={`w-2.5 h-2.5 rounded-full ${val ? 'bg-success' : 'bg-error'}`} />
              {val ? t('services:available') : t('services:unavailable')}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label">{t('services:availability_note')}</label>
        <input className="input" placeholder="Ex : Disponible uniquement le matin"
          {...register('note')} />
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

export default function AvailabilitySection() {
  const { t } = useTranslation('services')
  const qc    = useQueryClient()
  const [adding, setAdding]   = useState(false)
  const [editing, setEditing] = useState(null)

  const { data: availabilities = [], isLoading } = useQuery({
    queryKey: ['my-availabilities'],
    queryFn:  () => servicesService.getMyAvailabilities().then(r => r.data.results ?? r.data),
  })

  const normalize = (data) => ({
    ...data,
    is_available: data.is_available === 'true' || data.is_available === true,
  })

  const addMutation = useMutation({
    mutationFn: (data) => servicesService.addAvailability(normalize(data)),
    onSuccess: () => { qc.invalidateQueries(['my-availabilities']); toast.success(t('availability_saved')); setAdding(false) },
    onError: (err) => {
      const msg = err.response?.data?.date_end?.[0] || err.response?.data?.non_field_errors?.[0] || 'Erreur.'
      toast.error(msg)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => servicesService.updateAvailability(id, normalize(data)),
    onSuccess: () => { qc.invalidateQueries(['my-availabilities']); toast.success(t('availability_saved')); setEditing(null) },
    onError: (err) => {
      const msg = err.response?.data?.date_end?.[0] || 'Erreur.'
      toast.error(msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => servicesService.deleteAvailability(id),
    onSuccess: () => { qc.invalidateQueries(['my-availabilities']); toast.success(t('availability_deleted')) },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-secondary-900">{t('my_availabilities')}</h2>
        <button onClick={() => { setAdding(true); setEditing(null) }} className="btn btn-primary btn-sm">
          <Plus size={15} />{t('add_availability')}
        </button>
      </div>

      {adding && (
        <AvailabilityForm
          onSave={(data) => addMutation.mutate(data)}
          onCancel={() => setAdding(false)}
          loading={addMutation.isPending}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><span className="spinner w-6 h-6" /></div>
      ) : availabilities.length === 0 ? (
        <div className="text-center py-10">
          <CalendarDays size={32} className="mx-auto text-secondary-200 mb-3" />
          <p className="text-sm text-secondary-400">{t('no_availabilities')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {availabilities.map(a => (
            <div key={a.id}>
              {editing === a.id ? (
                <AvailabilityForm
                  initial={a}
                  onSave={(data) => updateMutation.mutate({ id: a.id, data })}
                  onCancel={() => setEditing(null)}
                  loading={updateMutation.isPending}
                />
              ) : (
                <div className="card flex items-center gap-4">
                  <div className={clsx(
                    'w-3 h-3 rounded-full flex-shrink-0',
                    a.is_available ? 'bg-success' : 'bg-error'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900">
                      {new Date(a.date_start).toLocaleDateString('fr-FR')}
                      {' → '}
                      {new Date(a.date_end).toLocaleDateString('fr-FR')}
                    </p>
                    {a.note && <p className="text-xs text-secondary-400">{a.note}</p>}
                  </div>
                  <span className={`badge flex-shrink-0 ${a.is_available ? 'badge-success' : 'badge-error'}`}>
                    {a.is_available ? t('available') : t('unavailable')}
                  </span>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setEditing(a.id)}
                      className="p-2 text-secondary-400 hover:text-primary-600 transition-colors">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => deleteMutation.mutate(a.id)}
                      className="p-2 text-secondary-400 hover:text-error transition-colors">
                      <Trash2 size={15} />
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
