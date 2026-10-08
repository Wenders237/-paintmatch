/**
 * DocumentsSection — Upload et gestion des documents professionnels.
 */

import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Upload, Trash2, FileText, CheckCircle, Clock } from 'lucide-react'
import servicesService from '@/services/servicesService'

const DOC_TYPES = ['RCCM', 'DIPLOME', 'CERTIF', 'ASSURANCE', 'AUTRE']

export default function DocumentsSection() {
  const { t } = useTranslation(['services', 'errors'])
  const qc = useQueryClient()
  const fileRef = useRef(null)
  const [adding, setAdding]   = useState(false)
  const [docType, setDocType] = useState('AUTRE')
  const [docTitle, setDocTitle] = useState('')
  const [file, setFile]       = useState(null)
  const [fileError, setFileError] = useState('')

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['my-documents'],
    queryFn:  () => servicesService.getMyDocuments().then(r => r.data.results ?? r.data),
  })

  const uploadMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('doc_type', docType)
      fd.append('title', docTitle)
      fd.append('file', file)
      return servicesService.uploadDocument(fd)
    },
    onSuccess: () => {
      qc.invalidateQueries(['my-documents'])
      toast.success(t('services:doc_uploaded'))
      setAdding(false)
      setFile(null)
      setDocTitle('')
      setDocType('AUTRE')
    },
    onError: (err) => {
      const msg = err.response?.data?.file?.[0] || err.response?.data?.detail
      toast.error(msg || 'Erreur lors de l\'upload.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => servicesService.deleteDocument(id),
    onSuccess: () => {
      qc.invalidateQueries(['my-documents'])
      toast.success(t('services:doc_deleted'))
    },
  })

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    const maxSize = 5 * 1024 * 1024
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png']
    const ext = '.' + f.name.split('.').pop().toLowerCase()
    if (f.size > maxSize) {
      setFileError(t('errors:upload_size'))
      setFile(null)
      return
    }
    if (!allowed.includes(ext)) {
      setFileError(t('errors:upload_type'))
      setFile(null)
      return
    }
    setFileError('')
    setFile(f)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-secondary-900">{t('services:my_documents')}</h2>
        <button onClick={() => setAdding(!adding)} className="btn btn-primary btn-sm">
          <Upload size={15} />{t('services:upload_document')}
        </button>
      </div>

      {/* Formulaire d'upload */}
      {adding && (
        <div className="card border border-primary-100 bg-primary-50 mb-5 space-y-3">
          <div>
            <label className="label">{t('services:doc_type')}</label>
            <select className="input" value={docType} onChange={e => setDocType(e.target.value)}>
              {DOC_TYPES.map(dt => (
                <option key={dt} value={dt}>{t(`services:doc_${dt}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t('services:doc_title')}</label>
            <input
              className="input"
              value={docTitle}
              onChange={e => setDocTitle(e.target.value)}
              placeholder="Ex : RCCM N°12345"
            />
          </div>
          <div>
            <label className="label">{t('services:doc_file')}</label>
            <div
              className="border-2 border-dashed border-secondary-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={24} className="mx-auto text-secondary-300 mb-2" />
              {file ? (
                <p className="text-sm text-primary-600 font-medium">{file.name}</p>
              ) : (
                <p className="text-sm text-secondary-400">Cliquez pour sélectionner un fichier</p>
              )}
              <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png" />
            </div>
            {fileError && <p className="error-msg">{fileError}</p>}
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => { setAdding(false); setFile(null) }} className="btn btn-secondary btn-sm">Annuler</button>
            <button
              type="button"
              disabled={!file || !docTitle || uploadMutation.isPending}
              onClick={() => uploadMutation.mutate()}
              className="btn btn-primary btn-sm"
            >
              {uploadMutation.isPending ? <span className="spinner w-4 h-4" /> : 'Envoyer'}
            </button>
          </div>
        </div>
      )}

      {/* Liste des documents */}
      {isLoading ? (
        <div className="flex justify-center py-8"><span className="spinner w-6 h-6" /></div>
      ) : documents.length === 0 ? (
        <p className="text-sm text-secondary-400 text-center py-8">{t('services:no_documents')}</p>
      ) : (
        <div className="space-y-3">
          {documents.map(doc => (
            <div key={doc.id} className="card flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-secondary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-secondary-900 truncate">{doc.title}</p>
                <p className="text-xs text-secondary-400">{doc.doc_type_display}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {doc.is_verified ? (
                  <span className="badge badge-success flex items-center gap-1">
                    <CheckCircle size={12} />{t('services:doc_verified')}
                  </span>
                ) : (
                  <span className="badge badge-warning flex items-center gap-1">
                    <Clock size={12} />{t('services:doc_pending')}
                  </span>
                )}
                <a
                  href={doc.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-600 hover:underline"
                >
                  Voir
                </a>
                <button
                  onClick={() => deleteMutation.mutate(doc.id)}
                  disabled={deleteMutation.isPending}
                  className="p-1 text-secondary-300 hover:text-error transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
