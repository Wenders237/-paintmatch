/**
 * DashboardPage — Redirige vers le bon dashboard selon le rôle.
 * CLIENT  → ClientDashboard
 * PEINTRE → PainterDashboard
 * ADMIN   → AdminDashboard
 */

import { useAuthStore } from '@/store/authStore'
import ClientDashboard  from './ClientDashboard'
import PainterDashboard from './PainterDashboard'
import AdminDashboard   from './AdminDashboard'

export default function DashboardPage() {
  const { user } = useAuthStore()

  if (user?.role === 'ADMIN')   return <AdminDashboard />
  if (user?.role === 'PEINTRE') return <PainterDashboard />
  return <ClientDashboard />
}
