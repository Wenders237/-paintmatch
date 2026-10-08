import { Paintbrush } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center">
          <Paintbrush size={28} className="text-primary-500" />
        </div>
        <div className="absolute inset-0 rounded-2xl border-2 border-primary-500 border-t-transparent animate-spin" />
      </div>
      <p className="font-heading font-bold text-secondary-900 text-lg">PaintMatch</p>
      <p className="text-secondary-400 text-sm mt-1">Chargement...</p>
    </div>
  )
}
