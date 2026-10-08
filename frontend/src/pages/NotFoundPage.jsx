import { Link } from 'react-router-dom'
import { Paintbrush, Home, Search } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-secondary-50 flex flex-col items-center justify-center text-center px-4">
      {/* Icône animée */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-3xl bg-primary-100 flex items-center justify-center mx-auto">
          <Paintbrush size={40} className="text-primary-400" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
          <span className="text-white text-lg font-bold">?</span>
        </div>
      </div>

      {/* Texte */}
      <p className="text-8xl font-heading font-extrabold text-secondary-100 mb-2 leading-none">
        404
      </p>
      <h1 className="text-2xl font-heading font-bold text-secondary-900 mb-3">
        Page introuvable
      </h1>
      <p className="text-secondary-500 mb-8 max-w-sm">
        La page que vous recherchez n'existe pas ou a été déplacée.
        Pas de panique, nos peintres savent réparer ça !
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/" className="btn btn-secondary gap-2 no-underline">
          <Home size={16} /> Accueil
        </Link>
        <Link to="/painters" className="btn btn-primary gap-2 no-underline">
          <Search size={16} /> Trouver un peintre
        </Link>
      </div>
    </div>
  )
}
