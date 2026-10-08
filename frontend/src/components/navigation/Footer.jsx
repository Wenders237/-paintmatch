import { Link } from 'react-router-dom'
import { Paintbrush, MapPin, Phone, Mail, Facebook, Twitter, Instagram } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-secondary-900 text-secondary-300">
      {/* Section principale */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Marque */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center">
                <Paintbrush size={18} className="text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-white">PaintMatch</span>
            </div>
            <p className="text-sm text-secondary-400 leading-relaxed mb-5">
              La plateforme de référence pour trouver des peintres en bâtiment qualifiés au Cameroun.
            </p>
            {/* Réseaux sociaux */}
            <div className="flex gap-3">
              {[
                { icon: Facebook,  href: '#', label: 'Facebook' },
                { icon: Twitter,   href: '#', label: 'Twitter' },
                { icon: Instagram, href: '#', label: 'Instagram' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-secondary-800 hover:bg-primary-500 flex items-center justify-center transition-colors"
                >
                  <Icon size={16} className="text-secondary-300" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Services</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { to: '/painters',     label: 'Trouver un peintre' },
                { to: '/how-it-works', label: 'Comment ça marche' },
                { to: '/auth/register', label: 'Devenir peintre' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-white transition-colors no-underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Légal</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { to: '/terms',   label: "Conditions d'utilisation" },
                { to: '/privacy', label: 'Politique de confidentialité' },
                { to: '/about',   label: 'À propos' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-white transition-colors no-underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <MapPin size={14} className="text-primary-400 flex-shrink-0" />
                <span>Douala, Cameroun</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-primary-400 flex-shrink-0" />
                <span>+237 6XX XXX XXX</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-primary-400 flex-shrink-0" />
                <span>contact@paintmatch.cm</span>
              </li>
            </ul>

            {/* Moyens de paiement */}
            <div className="mt-5">
              <p className="text-xs text-secondary-500 mb-2 uppercase tracking-wider">Paiements acceptés</p>
              <div className="flex gap-2">
                <span className="bg-secondary-800 text-secondary-300 text-xs px-2.5 py-1.5 rounded-lg font-medium">MTN MoMo</span>
                <span className="bg-secondary-800 text-secondary-300 text-xs px-2.5 py-1.5 rounded-lg font-medium">Orange Money</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bas de page */}
      <div className="border-t border-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-secondary-500">
          <p>© {year} PaintMatch — Tous droits réservés</p>
          <p className="flex items-center gap-1">
            Fait avec ❤️ au Cameroun
          </p>
        </div>
      </div>
    </footer>
  )
}
