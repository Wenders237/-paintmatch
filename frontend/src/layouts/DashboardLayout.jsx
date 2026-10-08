/**
 * DashboardLayout — Layout de l'espace connecté.
 * Sidebar + Header + contenu principal.
 */

import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/navigation/Sidebar'
import DashboardHeader from '@/components/navigation/DashboardHeader'

export default function DashboardLayout() {
  return (
    <div className="min-h-screen flex bg-secondary-50">
      {/* Sidebar latérale */}
      <Sidebar />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
