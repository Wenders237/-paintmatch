/**
 * Navbar — Barre de navigation publique redesignée.
 */

import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, Paintbrush, ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import clsx from 'clsx'

export default function Navbar() {
  const { t }       = useTranslation()
  const { isAuthenticated, user } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled]     = useState(false)
  const location = useLocation()
  const isHome   = location.pathname === '/'

  // Effet de scroll pour la navbar transparente sur la home
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { to: '/painters',     label: 'Peintres' },
    { to: '/how-it-works', label: 'Comment ça marche' },
  ]

  const isTransparent = isHome && !scrolled && !mobileOpen

  return (
    <header className={clsx(
      'sticky top-0 z-40 transition-all duration-300',
      isTransparent
        ? 'bg-transparent'
        : 'bg-white shadow-sm border-b border-secondary-100'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className={clsx(
              'w-8 h-8 rounded-xl flex items-center justify-center',
              isTransparent ? 'bg-primary-500' : 'bg-primary-500'
            )}>
              <Paintbrush size={18} className="text-white" />
            </div>
            <span className={clsx(
              'font-heading font-bold text-xl',
              isTransparent ? 'text-white' : 'text-secondary-900'
            )}>
              PaintMatch
            </span>
          </Link>

          {/* Navigation desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  clsx(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-colors no-underline',
                    isActive
                      ? isTransparent ? 'text-white bg-white/10' : 'text-primary-600 bg-primary-50'
                      : isTransparent ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Actions droite */}
          <div className="hidden md:flex items-center gap-2">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className={clsx(
                  'btn btn-sm no-underline gap-2',
                  isTransparent
                    ? 'bg-white text-primary-700 hover:bg-primary-50'
                    : 'btn-primary'
                )}
              >
                Mon espace
              </Link>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className={clsx(
                    'btn btn-sm no-underline',
                    isTransparent
                      ? 'text-white border border-white/30 hover:bg-white/10'
                      : 'btn-secondary'
                  )}
                >
                  Se connecter
                </Link>
                <Link to="/auth/register" className="btn btn-primary btn-sm no-underline">
                  S'inscrire
                </Link>
              </>
            )}
          </div>

          {/* Bouton menu mobile */}
          <button
            className={clsx(
              'md:hidden p-2 rounded-xl transition-colors',
              isTransparent ? 'text-white hover:bg-white/10' : 'text-secondary-600 hover:bg-secondary-100'
            )}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-secondary-100 px-4 pb-5 space-y-1 shadow-lg">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'block px-4 py-2.5 rounded-xl text-sm font-medium no-underline transition-colors',
                  isActive ? 'text-primary-600 bg-primary-50' : 'text-secondary-700 hover:bg-secondary-50'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div className="pt-3 border-t border-secondary-100 flex flex-col gap-2">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary w-full no-underline" onClick={() => setMobileOpen(false)}>
                Mon espace
              </Link>
            ) : (
              <>
                <Link to="/auth/login" className="btn btn-secondary w-full no-underline" onClick={() => setMobileOpen(false)}>
                  Se connecter
                </Link>
                <Link to="/auth/register" className="btn btn-primary w-full no-underline" onClick={() => setMobileOpen(false)}>
                  S'inscrire gratuitement
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
