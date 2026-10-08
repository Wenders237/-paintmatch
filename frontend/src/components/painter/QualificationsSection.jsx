/**
 * QualificationsSection — Gestion des qualifications du peintre.
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, GraduationCap } from 'lucide-react'
import servicesService from '@/services/servicesService'

function QualificationForm({ initial, onSave, onCancel, loading }) {
  const { t } = useTranslation(['services', 'errors'])
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initial || {},
  })

  return (
    <form onSubmit={handleSubmit(onSave)} className="card border border-primary-100 bg-primary-50 space-y-3 mb-4">
      <div>
        <label className="label">{t('services:qualification_title')}</label>
        <input className={`input ${errors.title ? 'input-error' : ''}`}
          {...register('title', { required: t('errors:required') })} />
        {errors.title && <p className="error-msg">{errors.title.message}</p>}
      </div>
      <div>
        <label className="label">{t('services:issuing_body')}</label>
        <input className="input" {...register('issuing_body')} />
      </div>
      <div>
        <label className="label">{t('services:date_obtained')}</label>
        <input type="date" className="input" {...register('date_obtained')} />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea rows={2} className="input resize-none" {...register('description')} />
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

export default function QualificationsSection() {
  const { t } = useTranslation('services')
  const qc = useQueryClient()
  const [adding, setAdding]     = useState(false)
  const [editing, setEditing]   = useState(null) // id en cours d'édition

  const { data: qualifications = [], isLoading } = useQuery({
    queryKey: ['my-qualifications'],
    queryFn:  () => servicesService.getMyQualifications().then(r => r.data.results ?? r.data),
  })

  const addMutation = useMutation({
    mutationFn: (data) => servicesService.addQualification(data),
    onSuccess: () => {
      qc.invalidateQueries(['my-qualifications'])
      toast.success(t('qualification_saved'))
      setAdding(false)
    },
    onError: () => toast.error('Erreur lors de l\'enregistrement.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => servicesService.updateQualification(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['my-qualifications'])
      toast.success(t('qualification_saved'))
      setEditing(null)
    },
    onError: () => toast.error('Erreur lors de l\'enregistrement.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => servicesService.deleteQualification(id),
    onSuccess: () => {
      qc.invalidateQueries(['my-qualifications'])
      toast.success(t('qualification_deleted'))
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-secondary-900">{t('my_qualifications')}</h2>
        <button onClick={() => { setAdding(true); setEditing(null) }} className="btn btn-primary btn-sm">
          <Plus size={15} />{t('add_qualification')}
        </button>
      </div>

      {adding && (
        <QualificationForm
          onSave={(data) => addMutation.mutate(data)}
          onCancel={() => setAdding(false)}
          loading={addMutation.isPending}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><span className="spinner w-6 h-6" /></div>
      ) : qualifications.length === 0 ? (
        <p className="text-sm text-secondary-400 text-center py-8">{t('no_qualifications')}</p>
      ) : (
        <div className="space-y-3">
          {qualifications.map(q => (
            <div key={q.id}>
              {editing === q.id ? (
                <QualificationForm
                  initial={q}
                  onSave={(data) => updateMutation.mutate({ id: q.id, data })}
                  onCancel={() => setEditing(null)}
                  loading={updateMutation.isPending}
                />
              ) : (
                <div className="card flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <GraduationCap size={20} className="text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-secondary-900">{q.title}</p>
                    {q.issuing_body && <p className="text-sm text-secondary-500">{q.issuing_body}</p>}
                    {q.date_obtained && (
                      <p className="text-xs text-secondary-400 mt-1">
                        Obtenu le {new Date(q.date_obtained).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    {q.description && <p className="text-sm text-secondary-600 mt-1">{q.description}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setEditing(q.id)} className="p-2 text-secondary-400 hover:text-primary-600 transition-colors">
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(q.id)}
                      disabled={deleteMutation.isPending}
                      className="p-2 text-secondary-400 hover:text-error transition-colors"
                    >
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
