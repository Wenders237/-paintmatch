/**
 * PaintersPage — Page publique de recherche des peintres.
 *
 * Fonctionnalités :
 * - Barre de recherche par ville
 * - Filtres : catégorie de prestation, tri
 * - Résultats avec score de recommandation
 * - Pagination
 * - Accessible à tous (visiteurs, clients, peintres)
 */

import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Search, SlidersHorizontal, X, ChevronLeft,
  ChevronRight, Paintbrush, Lightbulb
} from 'lucide-react'
import clsx from 'clsx'
import SEOHead from '@/components/common/SEOHead'
import servicesService from '@/services/servicesService'
import PainterCard from '@/components/painter/PainterCard'

// ---------------------------------------------------------------------------
// Options de tri
// ---------------------------------------------------------------------------
const SORT_OPTIONS = [
  { value: 'recommended', label: '⭐ Recommandés' },
  { value: 'rating',      label: '★ Mieux notés' },
  { value: 'experience',  label: '🏆 Plus expérimentés' },
]

// ---------------------------------------------------------------------------
// Villes du Cameroun (principales)
// ---------------------------------------------------------------------------
const CAMEROON_CITIES = [
  'Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua',
  'Maroua', 'Ngaoundéré', 'Bertoua', 'Ebolowa', 'Edéa',
  'Nkongsamba', 'Kumba', 'Limbe', 'Buea', 'Kribi',
]

// ---------------------------------------------------------------------------
// Composant filtres latéraux
// ---------------------------------------------------------------------------
function FilterPanel({ filters, setFilters, categories, onClose }) {
  const { t } = useTranslation('services')

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-secondary-900">Filtres</h3>
        {onClose && (
          <button onClick={onClose} className="p-1 text-secondary-400 hover:text-secondary-600 lg:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Ville */}
      <div>
        <label className="label">Ville</label>
        <select
          className="input"
          value={filters.city}
          onChange={e => setFilters(f => ({ ...f, city: e.target.value, page: 1 }))}
        >
          <option value="">Toutes les villes</option>
          {CAMEROON_CITIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Catégorie */}
      <div>
        <label className="label">{t('portfolio_category')}</label>
        <select
          className="input"
          value={filters.category}
          onChange={e => setFilters(f => ({ ...f, category: e.target.value, page: 1 }))}
        >
          <option value="">Toutes les catégories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Tri */}
      <div>
        <label className="label">Trier par</label>
        <div className="space-y-2">
          {SORT_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name="sort"
                value={opt.value}
                checked={filters.sort === opt.value}
                onChange={() => setFilters(f => ({ ...f, sort: opt.value, page: 1 }))}
                className="text-primary-500"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Réinitialiser */}
      <button
        onClick={() => setFilters({ city: '', category: '', sort: 'recommended', page: 1 })}
        className="btn btn-secondary btn-sm w-full"
      >
        Réinitialiser les filtres
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page principale
// ---------------------------------------------------------------------------
export default function PaintersPage() {
  const { t }             = useTranslation(['services', 'common'])
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters]   = useState(false)

  const [filters, setFilters] = useState({
    city:     searchParams.get('city')     || '',
    category: searchParams.get('category') || '',
    sort:     searchParams.get('sort')     || 'recommended',
    page:     parseInt(searchParams.get('page') || '1'),
  })

  const [searchInput, setSearchInput] = useState(filters.city)

  // Synchroniser les filtres dans l'URL
  useEffect(() => {
    const params = {}
    if (filters.city)     params.city     = filters.city
    if (filters.category) params.category = filters.category
    if (filters.sort !== 'recommended') params.sort = filters.sort
    if (filters.page > 1) params.page     = filters.page
    setSearchParams(params)
  }, [filters])

  // Catégories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => servicesService.getCategories().then(r => r.data.results ?? r.data),
  })

  // Recherche peintres
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['painters-search', filters],
    queryFn:  () => servicesService.searchPainters({
      city:      filters.city     || undefined,
      category:  filters.category || undefined,
      sort:      filters.sort,
      page:      filters.page,
      page_size: 12,
    }).then(r => r.data),
    keepPreviousData: true,
  })

  const painters  = data?.results  || []
  const total     = data?.count    || 0
  const totalPages = data?.pages   || 1
  const hasFilters = filters.city || filters.category

  const handleSearch = (e) => {
    e.preventDefault()
    setFilters(f => ({ ...f, city: searchInput, page: 1 }))
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <SEOHead
        title="Nos peintres qualifiés au Cameroun"
        description="Trouvez des peintres en bâtiment vérifiés partout au Cameroun. Consultez les profils, les avis et demandez un devis gratuit."
        url="/painters"
      />

      {/* Hero de recherche */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold mb-3">
            Trouvez votre peintre qualifié
          </h1>
          <p className="text-primary-200 mb-8">
            Des peintres vérifiés, partout au Cameroun
          </p>

          {/* Barre de recherche principale */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
              <input
                type="text"
                className="input pl-10 rounded-xl"
                placeholder="Entrez votre ville (ex: Douala, Yaoundé...)"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-lg bg-white text-primary-700 hover:bg-primary-50 font-semibold flex-shrink-0">
              Rechercher
            </button>
          </form>

          {/* Villes populaires */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {['Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua'].map(city => (
              <button
                key={city}
                onClick={() => {
                  setSearchInput(city)
                  setFilters(f => ({ ...f, city, page: 1 }))
                }}
                className={clsx(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                  filters.city === city
                    ? 'bg-white text-primary-700 border-white'
                    : 'border-primary-400 text-primary-200 hover:bg-primary-700'
                )}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">

          {/* Filtres — desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterPanel
              filters={filters}
              setFilters={setFilters}
              categories={categories}
            />
          </aside>

          {/* Résultats */}
          <div className="flex-1 min-w-0">

            {/* Barre de résultats */}
            <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
              <div>
                {isLoading ? (
                  <p className="text-secondary-500 text-sm">Recherche en cours...</p>
                ) : (
                  <p className="text-secondary-700 font-medium">
                    <span className="text-primary-600 font-bold">{total}</span>
                    {' '}peintre{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
                    {filters.city && <span className="text-secondary-500"> à {filters.city}</span>}
                  </p>
                )}
              </div>

              {/* Bouton filtres mobile */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-secondary btn-sm gap-2 lg:hidden"
              >
                <SlidersHorizontal size={15} />
                Filtres
                {hasFilters && (
                  <span className="w-4 h-4 bg-primary-500 text-white rounded-full text-xs flex items-center justify-center">
                    !
                  </span>
                )}
              </button>
            </div>

            {/* Filtres mobile */}
            {showFilters && (
              <div className="mb-5 lg:hidden">
                <FilterPanel
                  filters={filters}
                  setFilters={setFilters}
                  categories={categories}
                  onClose={() => setShowFilters(false)}
                />
              </div>
            )}

            {/* Bandeau recommandation IA */}
            {filters.sort === 'recommended' && painters.length > 0 && (
              <div className="flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-xl px-4 py-2.5 mb-5">
                <Lightbulb size={16} className="text-primary-500 flex-shrink-0" />
                <p className="text-sm text-primary-700">
                  Les peintres sont classés par notre système de recommandation intelligent
                  basé sur vos critères de recherche.
                </p>
              </div>
            )}

            {/* Grille de résultats */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card h-80 animate-pulse">
                    <div className="h-40 bg-secondary-100 rounded-xl mb-4" />
                    <div className="h-4 bg-secondary-100 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-secondary-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : painters.length === 0 ? (
              <div className="card text-center py-16">
                <div className="w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Paintbrush size={28} className="text-secondary-300" />
                </div>
                <h2 className="font-semibold text-secondary-800 mb-2">Aucun peintre trouvé</h2>
                <p className="text-secondary-500 text-sm mb-5">
                  {hasFilters
                    ? 'Essayez avec des critères différents ou une autre ville.'
                    : 'Aucun peintre validé n\'est disponible pour le moment.'}
                </p>
                {hasFilters && (
                  <button
                    onClick={() => setFilters({ city: '', category: '', sort: 'recommended', page: 1 })}
                    className="btn btn-primary"
                  >
                    Voir tous les peintres
                  </button>
                )}
              </div>
            ) : (
              <div className={clsx(
                'grid gap-5',
                'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
                isFetching && 'opacity-70 pointer-events-none'
              )}>
                {painters.map((painter, index) => (
                  <PainterCard
                    key={painter.id}
                    painter={painter}
                    rank={(filters.page - 1) * 12 + index + 1}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                  disabled={filters.page <= 1}
                  className="btn btn-secondary btn-sm"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => Math.abs(p - filters.page) <= 2 || p === 1 || p === totalPages)
                  .map((p, i, arr) => (
                    <span key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && (
                        <span className="text-secondary-400 px-1">…</span>
                      )}
                      <button
                        onClick={() => setFilters(f => ({ ...f, page: p }))}
                        className={clsx(
                          'w-9 h-9 rounded-xl text-sm font-medium transition-colors',
                          filters.page === p
                            ? 'bg-primary-500 text-white'
                            : 'bg-white text-secondary-600 hover:bg-secondary-100 border border-secondary-200'
                        )}
                      >
                        {p}
                      </button>
                    </span>
                  ))
                }

                <button
                  onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                  disabled={filters.page >= totalPages}
                  className="btn btn-secondary btn-sm"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
