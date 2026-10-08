/**
 * RegisterPage — Page d'inscription.
 * L'utilisateur choisit son rôle (CLIENT ou PEINTRE), puis remplit le formulaire.
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Users, Paintbrush } from 'lucide-react'

import authService from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import clsx from 'clsx'

export default function RegisterPage() {
  const { t } = useTranslation(['auth', 'errors'])
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setError,
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    if (!selectedRole) {
      toast.error(t('errors:required'))
      return
    }
    setLoading(true)
    try {
      const res = await authService.register({ ...data, role: selectedRole })
      const { tokens, user } = res.data
      setAuth(user, tokens.access, tokens.refresh)

      toast.success(t('auth:account_created'))

      // Les peintres ont un message d'attente de validation
      if (selectedRole === 'PEINTRE') {
        toast(t('auth:painter_pending'), { icon: 'ℹ️', duration: 6000 })
      }

      navigate('/dashboard')
    } catch (err) {
      const errors_data = err.response?.data
      if (errors_data?.email) {
        setError('email', { message: t('errors:email_taken') })
      } else if (errors_data?.password) {
        setError('password', { message: errors_data.password[0] })
      } else if (errors_data?.password_confirm) {
        setError('password_confirm', { message: errors_data.password_confirm[0] })
      } else if (errors_data?.non_field_errors) {
        toast.error(errors_data.non_field_errors[0])
      } else if (!err.response) {
        toast.error(t('errors:network_error'))
      } else {
        // Afficher le détail de l'erreur en développement
        const detail = errors_data?.detail || JSON.stringify(errors_data)
        toast.error(detail || t('errors:server_error'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-heading font-bold text-secondary-900 mb-1">
        {t('auth:create_account')}
      </h2>
      <p className="text-sm text-secondary-500 mb-6">
        {t('auth:choose_role')}
      </p>

      {/* Sélection du rôle */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { role: 'CLIENT',  icon: Users,      label: t('auth:i_am_client'),  desc: t('auth:client_desc') },
          { role: 'PEINTRE', icon: Paintbrush,  label: t('auth:i_am_painter'), desc: t('auth:painter_desc') },
        ].map(({ role, icon: Icon, label, desc }) => (
          <button
            key={role}
            type="button"
            onClick={() => setSelectedRole(role)}
            className={clsx(
              'flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all',
              selectedRole === role
                ? 'border-primary-500 bg-primary-50'
                : 'border-secondary-200 hover:border-secondary-300 bg-white'
            )}
          >
            <Icon
              size={24}
              className={selectedRole === role ? 'text-primary-600' : 'text-secondary-400'}
            />
            <span className={clsx(
              'text-sm font-semibold',
              selectedRole === role ? 'text-primary-700' : 'text-secondary-700'
            )}>
              {label}
            </span>
            <span className="text-xs text-secondary-500 leading-snug">{desc}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

        {/* Prénom + Nom */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="first_name">{t('auth:first_name')}</label>
            <input
              id="first_name"
              type="text"
              autoComplete="given-name"
              className={`input ${errors.first_name ? 'input-error' : ''}`}
              {...register('first_name', { required: t('errors:required') })}
            />
            {errors.first_name && <p className="error-msg">{errors.first_name.message}</p>}
          </div>
          <div>
            <label className="label" htmlFor="last_name">{t('auth:last_name')}</label>
            <input
              id="last_name"
              type="text"
              autoComplete="family-name"
              className={`input ${errors.last_name ? 'input-error' : ''}`}
              {...register('last_name', { required: t('errors:required') })}
            />
            {errors.last_name && <p className="error-msg">{errors.last_name.message}</p>}
          </div>
        </div>

        {/* E-mail */}
        <div>
          <label className="label" htmlFor="email">{t('auth:email')}</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={`input ${errors.email ? 'input-error' : ''}`}
            placeholder="vous@exemple.cm"
            {...register('email', {
              required: t('errors:required'),
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: t('errors:invalid_email'),
              },
            })}
          />
          {errors.email && <p className="error-msg">{errors.email.message}</p>}
        </div>

        {/* Téléphone */}
        <div>
          <label className="label" htmlFor="phone">
            {t('auth:phone')} <span className="text-secondary-400 font-normal">({t('common:optional')})</span>
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            className="input"
            placeholder="+237 6XX XXX XXX"
            {...register('phone')}
          />
        </div>

        {/* Ville */}
        <div>
          <label className="label" htmlFor="city">{t('auth:city')}</label>
          <input
            id="city"
            type="text"
            className={`input ${errors.city ? 'input-error' : ''}`}
            placeholder="Douala, Yaoundé..."
            {...register('city', { required: t('errors:required') })}
          />
          {errors.city && <p className="error-msg">{errors.city.message}</p>}
        </div>

        {/* Mot de passe */}
        <div>
          <label className="label" htmlFor="password">{t('auth:password')}</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
              placeholder="••••••••"
              {...register('password', {
                required: t('errors:required'),
                minLength: { value: 8, message: t('errors:password_min') },
              })}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="error-msg">{errors.password.message}</p>}
        </div>

        {/* Confirmation mot de passe */}
        <div>
          <label className="label" htmlFor="password_confirm">{t('auth:password_confirm')}</label>
          <input
            id="password_confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className={`input ${errors.password_confirm ? 'input-error' : ''}`}
            placeholder="••••••••"
            {...register('password_confirm', {
              required: t('errors:required'),
              validate: (v) => v === password || t('errors:password_mismatch'),
            })}
          />
          {errors.password_confirm && <p className="error-msg">{errors.password_confirm.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full mt-2"
        >
          {loading ? <span className="spinner w-4 h-4" /> : t('auth:create_account')}
        </button>
      </form>

      <p className="text-center text-sm text-secondary-500 mt-5">
        {t('auth:already_have_account')}{' '}
        <Link to="/auth/login" className="font-medium text-primary-600 hover:text-primary-700">
          {t('auth:login')}
        </Link>
      </p>
    </div>
  )
}
