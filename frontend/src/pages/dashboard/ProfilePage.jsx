/**
 * ProfilePage — Page de profil de l'utilisateur connecté.
 */

import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { KeyRound } from 'lucide-react'

import authService from '@/services/authService'
import { useAuthStore } from '@/store/authStore'

export default function ProfilePage() {
  const { t } = useTranslation(['auth', 'errors', 'common'])
  const { setUser } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: userData, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => authService.getMe().then((r) => r.data),
  })

  const { register, handleSubmit, formState: { errors } } = useForm({
    values: userData,
  })

  const mutation = useMutation({
    mutationFn: (data) => authService.updateMe(data),
    onSuccess: (res) => {
      setUser(res.data)
      queryClient.invalidateQueries(['me'])
      toast.success(t('auth:profile_updated'))
    },
    onError: () => toast.error(t('errors:server_error')),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <span className="spinner w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-secondary-900">
          {t('nav.profile', { ns: 'common' })}
        </h1>
        <Link to="/profile/password" className="btn btn-secondary btn-sm gap-2 no-underline">
          <KeyRound size={15} />
          {t('auth:change_password')}
        </Link>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('auth:first_name')}</label>
              <input className={`input ${errors.first_name ? 'input-error' : ''}`}
                {...register('first_name', { required: t('errors:required') })} />
              {errors.first_name && <p className="error-msg">{errors.first_name.message}</p>}
            </div>
            <div>
              <label className="label">{t('auth:last_name')}</label>
              <input className={`input ${errors.last_name ? 'input-error' : ''}`}
                {...register('last_name', { required: t('errors:required') })} />
              {errors.last_name && <p className="error-msg">{errors.last_name.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">{t('auth:phone')}</label>
            <input type="tel" className="input" placeholder="+237 6XX XXX XXX"
              {...register('phone')} />
          </div>

          <div>
            <label className="label">{t('auth:city')}</label>
            <input className="input" {...register('city')} />
          </div>

          <div>
            <label className="label">{t('auth:address')}</label>
            <textarea rows={3} className="input resize-none" {...register('address')} />
          </div>

          <div className="pt-2">
            <button type="submit" disabled={mutation.isPending} className="btn btn-primary">
              {mutation.isPending ? <span className="spinner w-4 h-4" /> : t('common:save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
