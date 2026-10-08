/**
 * AuthLayout — Diaporama automatique de peintres + formulaire.
 */

import { useState, useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Paintbrush, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

const SLIDES = [
  {
    // Peintre professionnel avec rouleau sur mur blanc
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900&q=90&auto=format&fit=crop&crop=center',
    title: 'Des peintres qualifiés',
    subtitle: 'Vérifiés et certifiés par notre équipe',
  },
  {
    // Peintre qui peint une façade extérieure
    image: 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=900&q=90&auto=format&fit=crop&crop=center',
    title: 'Façades et extérieurs',
    subtitle: 'Ravalement, imperméabilisation, peinture',
  },
  {
    // Peintre au travail avec pinceau sur mur coloré
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=900&q=90&auto=format&fit=crop&crop=center',
    title: 'Peinture intérieure',
    subtitle: 'Murs, plafonds, boiseries — finitions parfaites',
  },
  {
    // Outils de peintre — rouleaux et pots
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=90&auto=format&fit=crop&crop=center',
    title: 'Matériaux de qualité',
    subtitle: 'Peintures premium pour des résultats durables',
  },
  {
    // Peintre sur échafaudage, travaux en hauteur
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&q=90&auto=format&fit=crop&crop=center',
    title: 'Partout au Cameroun',
    subtitle: 'Douala, Yaoundé, Bafoussam et plus encore',
  },
]

function Slideshow() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev === SLIDES.length - 1 ? 0 : prev + 1))
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const goPrev = () => setCurrent(prev => (prev === 0 ? SLIDES.length - 1 : prev - 1))
  const goNext = () => setCurrent(prev => (prev === SLIDES.length - 1 ? 0 : prev + 1))

  return (
    <div className="relative w-full h-full overflow-hidden">
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className={clsx(
            'absolute inset-0 transition-opacity duration-700',
            i === current ? 'opacity-100' : 'opacity-0'
          )}
        >
          <img
            src={s.image}
            alt={s.title}
            className="w-full h-full object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-b from-secondary-900/40 via-transparent to-secondary-900/85" />

      <div className="absolute inset-0 flex flex-col justify-between p-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg">
            <Paintbrush size={20} className="text-white" />
          </div>
          <span className="font-heading font-bold text-2xl text-white drop-shadow">PaintMatch</span>
        </div>

        {/* Texte + contrôles */}
        <div>
          <div key={current}>
            <h2 className="text-3xl font-heading font-bold text-white mb-2 drop-shadow-lg">
              {SLIDES[current].title}
            </h2>
            <p className="text-white/80 text-base mb-6">
              {SLIDES[current].subtitle}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={goPrev}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              aria-label="Précédent"
            >
              <ChevronLeft size={18} className="text-white" />
            </button>

            <div className="flex gap-2">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={clsx(
                    'rounded-full transition-all duration-300',
                    i === current
                      ? 'w-6 h-2.5 bg-primary-400'
                      : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/60'
                  )}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={goNext}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              aria-label="Suivant"
            >
              <ChevronRight size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthLayout() {
  const { isAuthenticated, accessToken } = useAuthStore()

  if (isAuthenticated && accessToken) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen flex">
      {/* Panneau gauche — diaporama */}
      <div className="hidden lg:block lg:w-[55%] relative">
        <Slideshow />
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex-1 flex flex-col justify-center bg-white overflow-y-auto">
        <div className="px-8 py-10 max-w-md mx-auto w-full">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center">
              <Paintbrush size={16} className="text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-secondary-900">PaintMatch</span>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  )
}
