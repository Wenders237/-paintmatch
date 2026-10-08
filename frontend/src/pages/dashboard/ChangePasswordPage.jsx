import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import authService from '@/services/authService'

export default function ChangePasswordPage() {
  const { t } = useTranslation(['auth', 'errors', 'common'])
  const navigate = useNavigate()
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors }, setError } = useForm()
  const newPwd = watch('new_password')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await authService.changePassword(data)
      toast.success(t('auth:password_changed'))
      navigate('/profile')
    } catch (err) {
      const d = err.response?.data
      if (d?.old_password) {
        setError('old_password', { message: t('errors:invalid_credentials') })
      } else {
        toast.error(t('errors:server_error'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-heading font-bold text-secondary-900 mb-6">
        {t('auth:change_password')}
      </h1>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

          <div>
            <label className="label">{t('auth:old_password')}</label>
            <input
              type={show ? 'text' : 'password'}
              className={`input ${errors.old_password ? 'input-error' : ''}`}
              {...register('old_password', { required: t('errors:required') })}
            />
            {errors.old_password && <p className="error-msg">{errors.old_password.message}</p>}
          </div>

          <div>
            <label className="label">{t('auth:new_password')}</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                className={`input pr-10 ${errors.new_password ? 'input-error' : ''}`}
                {...register('new_password', {
                  required: t('errors:required'),
                  minLength: { value: 8, message: t('errors:password_min') },
                })}
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400" onClick={() => setShow(!show)}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.new_password && <p className="error-msg">{errors.new_password.message}</p>}
          </div>

          <div>
            <label className="label">{t('auth:password_confirm')}</label>
            <input
              type={show ? 'text' : 'password'}
              className={`input ${errors.new_password_confirm ? 'input-error' : ''}`}
              {...register('new_password_confirm', {
                required: t('errors:required'),
                validate: (v) => v === newPwd || t('errors:password_mismatch'),
              })}
            />
            {errors.new_password_confirm && <p className="error-msg">{errors.new_password_confirm.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
              {t('common:cancel')}
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? <span className="spinner w-4 h-4" /> : t('common:save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
