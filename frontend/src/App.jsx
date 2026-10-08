import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'

import PublicLayout    from '@/layouts/PublicLayout'
import AuthLayout      from '@/layouts/AuthLayout'
import DashboardLayout from '@/layouts/DashboardLayout'
import ProtectedRoute  from '@/components/common/ProtectedRoute'
import LoadingScreen   from '@/components/common/LoadingScreen'

// --- Pages publiques ---
const HomePage       = lazy(() => import('@/pages/public/HomePage'))
const PaintersPage   = lazy(() => import('@/pages/public/PaintersPage'))
const PainterDetail  = lazy(() => import('@/pages/public/PainterDetailPage'))
const HowItWorksPage = lazy(() => import('@/pages/public/HowItWorksPage'))

// --- Auth ---
const LoginPage    = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))

// --- Dashboard ---
const DashboardPage      = lazy(() => import('@/pages/dashboard/DashboardPage'))
const ProfilePage        = lazy(() => import('@/pages/dashboard/ProfilePage'))
const ChangePasswordPage = lazy(() => import('@/pages/dashboard/ChangePasswordPage'))

// --- Espace PEINTRE ---
const PainterProfilePage = lazy(() => import('@/pages/painter/PainterProfilePage'))
const PainterQuotesPage  = lazy(() => import('@/pages/painter/PainterQuotesPage'))
const PainterWorksPage   = lazy(() => import('@/pages/painter/PainterWorksPage'))
const PainterReviewsPage = lazy(() => import('@/pages/painter/PainterReviewsPage'))

// --- Espace CLIENT ---
const QuoteRequestPage   = lazy(() => import('@/pages/client/QuoteRequestPage'))
const ClientQuotesPage   = lazy(() => import('@/pages/client/ClientQuotesPage'))
const ClientBookingsPage = lazy(() => import('@/pages/client/ClientBookingsPage'))
const PaymentPage        = lazy(() => import('@/pages/client/PaymentPage'))
const ClientReviewsPage  = lazy(() => import('@/pages/client/ClientReviewsPage'))

// --- Messagerie ---
const MessagingPage       = lazy(() => import('@/pages/MessagingPage'))
const NotificationsPage   = lazy(() => import('@/pages/NotificationsPage'))

// --- Espace ADMIN ---
const AdminPaintersPage       = lazy(() => import('@/pages/admin/AdminPaintersPage'))
const AdminPainterDossierPage = lazy(() => import('@/pages/admin/AdminPainterDossierPage'))
const AdminUsersPage          = lazy(() => import('@/pages/admin/AdminUsersPage'))

// --- Pages à venir ---
const ComingSoonPage = lazy(() => import('@/pages/ComingSoonPage'))

// --- 404 ---
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>

        {/* Pages publiques */}
        <Route element={<PublicLayout />}>
          <Route index              element={<HomePage />} />
          <Route path="painters"    element={<PaintersPage />} />
          <Route path="painters/:id" element={<PainterDetail />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
        </Route>

        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path="auth/login"    element={<LoginPage />} />
          <Route path="auth/register" element={<RegisterPage />} />
        </Route>

        {/* Connecté — tous rôles */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="dashboard"        element={<DashboardPage />} />
            <Route path="profile"          element={<ProfilePage />} />
            <Route path="profile/password" element={<ChangePasswordPage />} />
            <Route path="messages"         element={<MessagingPage />} />
            <Route path="notifications"    element={<NotificationsPage />} />
          </Route>
        </Route>

        {/* Espace CLIENT */}
        <Route element={<ProtectedRoute allowedRoles={['CLIENT']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="client/quotes"         element={<ClientQuotesPage />} />
            <Route path="client/quotes/new"     element={<QuoteRequestPage />} />
            <Route path="client/bookings"       element={<ClientBookingsPage />} />
            <Route path="client/bookings/:id/pay" element={<PaymentPage />} />
            <Route path="client/reviews"        element={<ClientReviewsPage />} />
          </Route>
        </Route>

        {/* Espace PEINTRE */}
        <Route element={<ProtectedRoute allowedRoles={['PEINTRE']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="painter/profile" element={<PainterProfilePage />} />
            <Route path="painter/quotes"  element={<PainterQuotesPage />} />
            <Route path="painter/works"   element={<PainterWorksPage />} />
            <Route path="painter/reviews" element={<PainterReviewsPage />} />
          </Route>
        </Route>

        {/* Espace ADMIN */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="admin/painters"     element={<AdminPaintersPage />} />
            <Route path="admin/painters/:id" element={<AdminPainterDossierPage />} />
            <Route path="admin/users"        element={<AdminUsersPage />} />
            <Route path="admin/stats"        element={<ComingSoonPage title="Statistiques" phase="3" />} />
            <Route path="admin/settings"     element={<ComingSoonPage title="Paramètres" phase="3" />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </Suspense>
  )
}
