/**
 * SkillsSection — Gestion des compétences du peintre connecté.
 * Permet d'ajouter et supprimer des compétences avec leur niveau.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Trash2, ChevronDown } from 'lucide-react'
import servicesService from '@/services/servicesService'
import clsx from 'clsx'

const LEVELS = ['DEBUTANT', 'CONFIRME', 'EXPERT']

const levelColor = {
  DEBUTANT: 'badge-neutral',
  CONFIRME: 'badge-info',
  EXPERT:   'badge-success',
}

export default function SkillsSection() {
  const { t } = useTranslation('services')
  const qc = useQueryClient()
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSkill, setSelectedSkill]       = useState('')
  const [selectedLevel, setSelectedLevel]       = useState('CONFIRME')
  const [adding, setAdding]                     = useState(false)

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => servicesService.getCategories().then(r => r.data.results ?? r.data),
  })

  const { data: skills = [] } = useQuery({
    queryKey: ['skills', selectedCategory],
    queryFn:  () => servicesService.getSkills(selectedCategory).then(r => r.data.results ?? r.data),
    enabled: !!selectedCategory,
  })

  const { data: mySkills = [], isLoading } = useQuery({
    queryKey: ['my-skills'],
    queryFn:  () => servicesService.getMySkills().then(r => r.data.results ?? r.data),
  })

  const addMutation = useMutation({
    mutationFn: () => servicesService.addSkill({ skill: selectedSkill, level: selectedLevel }),
    onSuccess: () => {
      qc.invalidateQueries(['my-skills'])
      toast.success(t('skill_added'))
      setAdding(false)
      setSelectedSkill('')
    },
    onError: (err) => {
      const msg = err.response?.data?.skill?.[0] || err.response?.data?.detail
      toast.error(msg || t('skill_added') )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => servicesService.deleteSkill(id),
    onSuccess: () => {
      qc.invalidateQueries(['my-skills'])
      toast.success(t('skill_deleted'))
    },
  })

  // Regrouper mes compétences par catégorie
  const grouped = mySkills.reduce((acc, ps) => {
    const cat = ps.category_name || 'Autre'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(ps)
    return acc
  }, {})

  return (
    <div>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-secondary-900">{t('my_skills')}</h2>
        <button
          onClick={() => setAdding(!adding)}
          className="btn btn-primary btn-sm"
        >
          <Plus size={15} />
          {t('add_skill')}
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {adding && (
        <div className="card border border-primary-100 bg-primary-50 mb-5 space-y-3">
          {/* Catégorie */}
          <div>
            <label className="label">{t('categories')}</label>
            <select
              className="input"
              value={selectedCategory}
              onChange={e => { setSelectedCategory(e.target.value); setSelectedSkill('') }}
            >
              <option value="">— Sélectionner une catégorie —</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Compétence */}
          {selectedCategory && (
            <div>
              <label className="label">{t('skills')}</label>
              <select
                className="input"
                value={selectedSkill}
                onChange={e => setSelectedSkill(e.target.value)}
              >
                <option value="">— Sélectionner une compétence —</option>
                {skills.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Niveau */}
          <div>
            <label className="label">{t('skill_level')}</label>
            <div className="flex gap-2">
              {LEVELS.map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  className={clsx(
                    'flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all',
                    selectedLevel === lvl
                      ? 'border-primary-500 bg-primary-500 text-white'
                      : 'border-secondary-200 text-secondary-600 hover:border-primary-300'
                  )}
                >
                  {t(`level_${lvl}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="btn btn-secondary btn-sm"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={!selectedSkill || addMutation.isPending}
              onClick={() => addMutation.mutate()}
              className="btn btn-primary btn-sm"
            >
              {addMutation.isPending ? <span className="spinner w-4 h-4" /> : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {/* Liste des compétences */}
      {isLoading ? (
        <div className="flex justify-center py-8"><span className="spinner w-6 h-6" /></div>
      ) : mySkills.length === 0 ? (
        <p className="text-sm text-secondary-400 text-center py-8">{t('no_skills')}</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, skills]) => (
            <div key={category}>
              <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wide mb-2">
                {category}
              </p>
              <div className="flex flex-wrap gap-2">
                {skills.map(ps => (
                  <div
                    key={ps.id}
                    className="flex items-center gap-2 bg-white border border-secondary-200 rounded-xl px-3 py-2"
                  >
                    <span className="text-sm text-secondary-800">{ps.skill_name}</span>
                    <span className={`badge ${levelColor[ps.level]}`}>
                      {t(`level_${ps.level}`)}
                    </span>
                    <button
                      onClick={() => deleteMutation.mutate(ps.id)}
                      disabled={deleteMutation.isPending}
                      className="text-secondary-300 hover:text-error transition-colors ml-1"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
