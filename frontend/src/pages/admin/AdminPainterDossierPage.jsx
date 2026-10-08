/**
 * AdminPainterDossierPage — Dossier complet d'un peintre.
 * L'admin examine toutes les informations et prend sa décision.
 */

import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ChevronLeft, CheckCircle, XCircle, AlertCircle,
  Clock, FileText, Award, GraduationCap, Image,
  MapPin, Phone, Mail, Calendar, ExternalLink
} from 'lucide-react'
import clsx from 'clsx'
import adminService from '@/services/adminService'

// ---------------------------------------------------------------------------
// Boutons d'action
// ---------------------------------------------------------------------------
const ACTIONS = [
  {
    key: 'VALIDE',
    label: 'Valider le profil',
    icon: CheckCircle,
    cls: 'bg-green-500 hover:bg-green-600 text-white',
    needsNote: false,
  },
  {
    key: 'COMPLEMENT',
    label: 'Demander un complément',
    icon: AlertCircle,
    cls: 'bg-blue-500 hover:bg-blue-600 text-white',
    needsNote: true,
  },
  {
    key: 'REFUSE',
    label: 'Refuser',
    icon: XCircle,
    cls: 'bg-red-500 hover:bg-red-600 text-white',
    needsNote: true,
  },
  {
    key: 'SUSPENDU',
    label: 'Suspendre',
    icon: Clock,
    cls: 'bg-secondary-600 hover:bg-secondary-700 text-white',
    needsNote: false,
  },
]

const STATUS_LABELS = {
  EN_ATTENTE:  { label: 'En attente',   cls: 'badge-warning' },
  VALIDE:      { label: 'Validé',       cls: 'badge-success' },
  REFUSE:      { label: 'Refusé',       cls: 'badge-error' },
  SUSPENDU:    { label: 'Suspendu',     cls: 'badge-error' },
  COMPLEMENT:  { label: 'Complément demandé', cls: 'badge-info' },
}

const LEVEL_LABELS = {
  DEBUTANT: 'Débutant',
  CONFIRME: 'Confirmé',
  EXPERT:   'Expert',
}

// ---------------------------------------------------------------------------
// Section avec titre
// ---------------------------------------------------------------------------
function Section({ icon: Icon, title, children, empty, emptyMsg }) {
  return (
    <div className="card mb-4">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-secondary-100">
        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
          <Icon size={16} className="text-primary-600" />
        </div>
        <h3 className="font-semibold text-secondary-900">{title}</h3>
      </div>
      {empty ? (
        <p className="text-sm text-secondary-400 text-center py-4">{emptyMsg}</p>
      ) : children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page principale
// ---------------------------------------------------------------------------
export default function AdminPainterDossierPage() {
  const { id }       = useParams()
  const { t }        = useTranslation(['admin', 'errors'])
  const navigate     = useNavigate()
  const qc           = useQueryClient()

  const [selectedAction, setSelectedAction] = useState(null)
  const [note, setNote]                     = useState('')
  const [confirmOpen, setConfirmOpen]       = useState(false)

  const { data: dossier, isLoading, isError } = useQuery({
    queryKey: ['admin-painter-dossier', id],
    queryFn:  () => adminService.getPainterDossier(id).then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: () => adminService.validatePainter(id, selectedAction.key, note),
    onSuccess: () => {
      qc.invalidateQueries(['admin-painters'])
      qc.invalidateQueries(['admin-painter-dossier', id])
      toast.success(t('admin:action_success'))
      setConfirmOpen(false)
      setSelectedAction(null)
      setNote('')
      navigate('/admin/painters')
    },
    onError: (err) => {
      const msg = err.response?.data?.note?.[0] || err.response?.data?.detail || t('admin:action_error')
      toast.error(msg)
    },
  })

  if (isLoading) {
    return <div className="flex justify-center py-16"><span className="spinner w-10 h-10" /></div>
  }

  if (isError || !dossier) {
    return (
      <div className="text-center py-16">
        <p className="text-secondary-500 mb-4">Dossier introuvable.</p>
        <Link to="/admin/painters" className="btn btn-secondary no-underline">Retour</Link>
      </div>
    )
  }

  const { user, skills = [], qualifications = [], documents = [], portfolio_count = 0 } = dossier
  const statusCfg = STATUS_LABELS[dossier.validation_status] || { label: dossier.validation_status, cls: 'badge-neutral' }

  const handleAction = (action) => {
    setSelectedAction(action)
    setNote('')
    setConfirmOpen(true)
  }

  return (
    <div className="max-w-4xl mx-auto">

      {/* Navigation retour */}
      <Link
        to="/admin/painters"
        className="inline-flex items-center gap-1 text-sm text-secondary-500 hover:text-secondary-800 mb-5 no-underline"
      >
        <ChevronLeft size={16} /> Retour à la liste
      </Link>

      {/* En-tête dossier */}
      <div className="card mb-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold flex-shrink-0">
            {user?.first_name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-heading font-bold text-secondary-900">
                {user?.first_name} {user?.last_name}
              </h1>
              <span className={`badge ${statusCfg.cls}`}>{statusCfg.label}</span>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-secondary-500">
              {user?.email    && <span className="flex items-center gap-1"><Mail size={13} />{user.email}</span>}
              {user?.phone    && <span className="flex items-center gap-1"><Phone size={13} />{user.phone}</span>}
              {user?.city     && <span className="flex items-center gap-1"><MapPin size={13} />{user.city}</span>}
              {user?.date_joined && (
                <span className="flex items-center gap-1">
                  <Calendar size={13} />Inscrit le {new Date(user.date_joined).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
            {dossier.validation_note && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">
                  <strong>Note précédente :</strong> {dossier.validation_note}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-0">

          {/* Infos professionnelles */}
          <Section icon={Award} title="Profil professionnel">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-secondary-400">Expérience</p>
                <p className="font-medium text-secondary-900">
                  {dossier.years_experience
                    ? `${dossier.years_experience} an${dossier.years_experience > 1 ? 's' : ''}`
                    : 'Non renseignée'}
                </p>
              </div>
              <div>
                <p className="text-secondary-400">N° Professionnel</p>
                <p className="font-medium text-secondary-900">
                  {dossier.professional_id || 'Non renseigné'}
                </p>
              </div>
            </div>
            {dossier.bio && (
              <div className="mt-3 pt-3 border-t border-secondary-100">
                <p className="text-secondary-400 text-xs mb-1">Présentation</p>
                <p className="text-sm text-secondary-700 leading-relaxed">{dossier.bio}</p>
              </div>
            )}
          </Section>

          {/* Compétences */}
          <Section
            icon={Award}
            title={`Compétences (${skills.length})`}
            empty={skills.length === 0}
            emptyMsg={t('no_skills')}
          >
            <div className="flex flex-wrap gap-2">
              {skills.map((s, i) => (
                <span key={i} className="flex items-center gap-1.5 bg-secondary-50 border border-secondary-200 rounded-xl px-3 py-1.5 text-sm">
                  {s.skill_name}
                  <span className={clsx(
                    'badge',
                    s.level === 'EXPERT' ? 'badge-success' :
                    s.level === 'CONFIRME' ? 'badge-info' : 'badge-neutral'
                  )}>
                    {LEVEL_LABELS[s.level] || s.level}
                  </span>
                </span>
              ))}
            </div>
          </Section>

          {/* Qualifications */}
          <Section
            icon={GraduationCap}
            title={`Qualifications (${qualifications.length})`}
            empty={qualifications.length === 0}
            emptyMsg={t('no_qualifications')}
          >
            <div className="space-y-2">
              {qualifications.map((q, i) => (
                <div key={i} className="flex items-start gap-3 p-2 bg-secondary-50 rounded-lg">
                  <GraduationCap size={16} className="text-secondary-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-secondary-900">{q.title}</p>
                    {q.issuing_body && <p className="text-xs text-secondary-400">{q.issuing_body}</p>}
                    {q.date_obtained && (
                      <p className="text-xs text-secondary-400">
                        {new Date(q.date_obtained).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Documents */}
          <Section
            icon={FileText}
            title={`Documents (${documents.length})`}
            empty={documents.length === 0}
            emptyMsg={t('no_documents')}
          >
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 bg-secondary-50 rounded-xl">
                  <FileText size={18} className="text-secondary-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900 truncate">{doc.title}</p>
                    <p className="text-xs text-secondary-400">{doc.type}</p>
                  </div>
                  {doc.is_verified && (
                    <span className="badge badge-success flex-shrink-0">Vérifié</span>
                  )}
                  {doc.file && (
                    <a
                      href={doc.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 flex-shrink-0 no-underline"
                    >
                      <ExternalLink size={13} /> Voir
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Colonne droite — actions */}
        <div className="space-y-4">

          {/* Stats rapides */}
          <div className="card">
            <h3 className="font-semibold text-secondary-900 mb-3 text-sm">Résumé du dossier</h3>
            <div className="space-y-2">
              {[
                { label: 'Compétences',    value: skills.length },
                { label: 'Qualifications', value: qualifications.length },
                { label: 'Documents',      value: documents.length },
                { label: 'Réalisations',   value: portfolio_count },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-secondary-500">{item.label}</span>
                  <span className={clsx(
                    'font-bold',
                    item.value === 0 ? 'text-error' : 'text-secondary-900'
                  )}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions de validation */}
          <div className="card">
            <h3 className="font-semibold text-secondary-900 mb-3 text-sm">Décision</h3>
            <div className="space-y-2">
              {ACTIONS.map(action => (
                <button
                  key={action.key}
                  onClick={() => handleAction(action)}
                  disabled={dossier.validation_status === action.key}
                  className={clsx(
                    'flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                    action.cls,
                    dossier.validation_status === action.key && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  <action.icon size={16} />
                  {action.label}
                  {dossier.validation_status === action.key && (
                    <span className="ml-auto text-xs opacity-70">Actuel</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmation */}
      {confirmOpen && selectedAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-lg font-heading font-bold text-secondary-900 mb-2">
              {selectedAction.label}
            </h2>
            <p className="text-sm text-secondary-500 mb-4">
              Vous êtes sur le point de modifier le statut de{' '}
              <strong>{dossier?.user?.first_name} {dossier?.user?.last_name}</strong>.
            </p>

            {/* Note */}
            <div className="mb-4">
              <label className="label">
                {t('admin:action_note')}
                {selectedAction.needsNote && (
                  <span className="text-error ml-1">*</span>
                )}
              </label>
              <textarea
                rows={3}
                className="input resize-none"
                placeholder={
                  selectedAction.needsNote
                    ? 'Motif obligatoire...'
                    : 'Message optionnel pour le peintre...'
                }
                value={note}
                onChange={e => setNote(e.target.value)}
              />
              {selectedAction.needsNote && (
                <p className="text-xs text-secondary-400 mt-1">
                  {t('admin:note_required')}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setConfirmOpen(false); setSelectedAction(null) }}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={
                  mutation.isPending ||
                  (selectedAction.needsNote && !note.trim())
                }
                className={clsx('btn flex-1', selectedAction.cls)}
              >
                {mutation.isPending
                  ? <span className="spinner w-4 h-4" />
                  : 'Confirmer'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
