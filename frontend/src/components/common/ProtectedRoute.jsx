/**
 * ProtectedRoute — Garde les routes privées.
 *
 * Props :
 *  - allowedRoles : tableau de rôles autorisés (ex. ['CLIENT', 'PEINTRE'])
 *                   Si omis, tout utilisateur connecté peut accéder.
 */

import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user, accessToken } = useAuthStore()
  const logout = useAuthStore(s => s.logout)
  const location = useLocation()

  // Nettoyage via useEffect pour éviter les side effects dans le render
  useEffect(() => {
    if (isAuthenticated && !accessToken) {
      logout()
    }
  }, [isAuthenticated, accessToken, logout])

  // Token absent mais store dit connecté → en cours de nettoyage, rediriger
  if (isAuthenticated && !accessToken) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  // Non connecté → redirection vers login en conservant la page cible
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  // Rôle non autorisé → redirection vers le dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
