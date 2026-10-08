/**
 * PainterBioForm — Onglet Présentation du profil peintre.
 * Permet de modifier la bio, les années d'expérience et le numéro professionnel.
 */

import { useEffect } from 'react'
import { useForm }   from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import authService      from '@/services/authService'
import { useAuthStore } from '@/store/authStore'

export default function PainterBioForm({ profile }) {
  const { t }    = useTranslation(['auth', 'errors', 'common'])
  const { user, setUser } = useAuthStore()
  const qc = useQueryClient()

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  // Pré-remplir quand le profil est chargé
  useEffect(() => {
    if (profile) reset(profile)
  }, [profile, reset])

  // Mutation profil peintre (bio, expérience, n° pro)
  const painterMutation = useMutation({
    mutationFn: (data) => authService.updatePainterProfile(data),
    onSuccess: () => {
      qc.invalidateQueries(['painter-profile-me'])
      toast.success(t('auth:profile_updated'))
    },
    onError: () => toast.error(t('errors:server_error')),
  })

  // Mutation infos personnelles (prénom, nom, téléphone, ville, adresse)
  const userMutation = useMutation({
    mutationFn: (data) => authService.updateMe(data),
    onSuccess: (res) => {
      setUser(res.data)
      qc.invalidateQueries(['me'])
    },
    onError: () => toast.error(t('errors:server_error')),
  })

  const onSubmit = async (data) => {
    const { bio, years_experience, professional_id, ...userFields } = data
    await Promise.all([
      painterMutation.mutateAsync({ bio, years_experience, professional_id }),
      userMutation.mutateAsync(userFields),
    ])
  }

  const isSaving = painterMutation.isPending || userMutation.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* Informations personnelles */}
      <div className="card">
        <h3 className="font-semibold text-secondary-900 mb-4">Informations personnelles</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('auth:first_name')}</label>
              <input className="input" defaultValue={user?.first_name} {...register('first_name')} />
            </div>
            <div>
              <label className="label">{t('auth:last_name')}</label>
              <input className="input" defaultValue={user?.last_name} {...register('last_name')} />
            </div>
          </div>
          <div>
            <label className="label">{t('auth:phone')}</label>
            <input type="tel" className="input" placeholder="+237 6XX XXX XXX"
              defaultValue={user?.phone} {...register('phone')} />
          </div>
          <div>
            <label className="label">{t('auth:city')}</label>
            <input className="input" defaultValue={user?.city} {...register('city')} />
          </div>
          <div>
            <label className="label">{t('auth:address')}</label>
            <textarea rows={2} className="input resize-none"
              defaultValue={user?.address} {...register('address')} />
          </div>
        </div>
      </div>

      {/* Profil professionnel */}
      <div className="card">
        <h3 className="font-semibold text-secondary-900 mb-4">Profil professionnel</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Présentation / Bio</label>
            <textarea
              rows={4}
              className="input resize-none"
              placeholder="Décrivez votre expérience, vos spécialités, votre zone d'intervention..."
              {...register('bio')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Années d'expérience</label>
              <input
                type="number"
                min="0"
                max="60"
                className="input"
                {...register('years_experience', { min: 0 })}
              />
            </div>
            <div>
              <label className="label">
                Numéro professionnel
                <span className="text-secondary-400 font-normal ml-1">(RCCM ou équivalent)</span>
              </label>
              <input className="input" placeholder="Ex : RC/DLA/2020/B/12345"
                {...register('professional_id')} />
            </div>
          </div>
        </div>
      </div>

      <div>
        <button type="submit" disabled={isSaving} className="btn btn-primary">
          {isSaving ? <span className="spinner w-4 h-4" /> : t('common:save')}
        </button>
      </div>
    </form>
  )
}
