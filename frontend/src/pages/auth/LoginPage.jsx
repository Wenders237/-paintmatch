/**
 * LoginPage — Page de connexion.
 * Gère la soumission, stocke les tokens, redirige vers la page d'origine.
 */

import { useForm } from 'react-hook-form'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

import authService from '@/services/authService'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const { t } = useTranslation(['auth', 'errors'])
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await authService.login(data.email, data.password)
      const { access, refresh, user } = res.data

      // Nettoyage APRÈS succès (pas avant — évite de perdre la session si erreur réseau)
      useAuthStore.getState().logout()
      setAuth(user, access, refresh)
      toast.success(t('auth:login_success'))
      navigate(from, { replace: true })
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        setError('password', { message: t('errors:invalid_credentials') })
      } else if (status === 403) {
        toast.error(t('errors:account_inactive'))
      } else if (!err.response) {
        toast.error(t('errors:network_error'))
      } else {
        toast.error(t('errors:server_error'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-heading font-bold text-secondary-900 mb-1">
        {t('auth:login')}
      </h2>
      <p className="text-sm text-secondary-500 mb-6">
        {t('auth:welcome_back')}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

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

        {/* Mot de passe */}
        <div>
          <label className="label" htmlFor="password">{t('auth:password')}</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
              placeholder="••••••••"
              {...register('password', {
                required: t('errors:required'),
              })}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Afficher/masquer le mot de passe"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="error-msg">{errors.password.message}</p>}
        </div>

        {/* Bouton de soumission */}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full mt-2"
        >
          {loading ? (
            <span className="spinner w-4 h-4" />
          ) : (
            t('auth:login')
          )}
        </button>
      </form>

      <p className="text-center text-sm text-secondary-500 mt-5">
        {t('auth:no_account')}{' '}
        <Link to="/auth/register" className="font-medium text-primary-600 hover:text-primary-700">
          {t('auth:register')}
        </Link>
      </p>
    </div>
  )
}
