/**
 * HomePage — Page d'accueil publique redesignée.
 */

import { Link } from 'react-router-dom'
import { Search, FileText, ShieldCheck, Star, ArrowRight, MapPin, CheckCircle } from 'lucide-react'
import SEOHead from '@/components/common/SEOHead'
import { IMAGES } from '@/assets/images'

const STEPS = [
  { icon: Search,      num: '01', title: 'Recherchez',        desc: 'Trouvez des peintres qualifiés dans votre ville grâce à notre moteur intelligent.',    color: 'bg-primary-50 text-primary-600' },
  { icon: FileText,    num: '02', title: 'Demandez un devis',  desc: 'Décrivez vos travaux et recevez un devis personnalisé directement dans votre espace.', color: 'bg-blue-50 text-blue-600' },
  { icon: ShieldCheck, num: '03', title: 'Réservez',           desc: 'Confirmez votre choix et payez en toute sécurité via Mobile Money.',                   color: 'bg-green-50 text-green-600' },
  { icon: Star,        num: '04', title: 'Évaluez',            desc: 'Partagez votre expérience et aidez la communauté à choisir les meilleurs peintres.',    color: 'bg-amber-50 text-amber-600' },
]

const STATS = [
  { value: '500+', label: 'Peintres vérifiés' },
  { value: '10+',  label: 'Villes couvertes' },
  { value: '4.8★', label: 'Note moyenne' },
  { value: '100%', label: 'Peintres certifiés' },
]

const REALIZATIONS = [
  { img: IMAGES.room_painted,    title: 'Peinture intérieure', city: 'Douala' },
  { img: IMAGES.exterior_facade, title: 'Peinture extérieure', city: 'Yaoundé' },
  { img: IMAGES.decorative_wall, title: 'Peinture décorative', city: 'Bafoussam' },
]

export default function HomePage() {
  return (
    <>
      <SEOHead
        title="Trouvez votre peintre qualifié au Cameroun"
        description="PaintMatch met en relation les clients avec des peintres en bâtiment vérifiés à Douala, Yaoundé et partout au Cameroun."
        url="/"
      />

      {/* ------------------------------------------------------------------ */}
      {/* HERO                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden">
        {/* Image de fond */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${IMAGES.hero})` }}
        />
        {/* Overlay dégradé */}
        <div className="absolute inset-0 bg-gradient-to-r from-secondary-900/90 via-secondary-900/70 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 bg-primary-500/20 text-primary-300 border border-primary-500/30 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
              Plateforme #1 au Cameroun
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-white leading-tight mb-6">
              Trouvez votre<br />
              <span className="text-primary-400">peintre qualifié</span><br />
              en quelques clics
            </h1>

            <p className="text-lg text-secondary-300 mb-8 leading-relaxed">
              Des peintres vérifiés, expérimentés et disponibles partout au Cameroun.
              Devis gratuit, paiement sécurisé, suivi en temps réel.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/painters" className="btn btn-primary btn-lg gap-2 no-underline">
                <Search size={18} />
                Trouver un peintre
              </Link>
              <Link to="/auth/register" className="btn btn-lg bg-white/10 border border-white/30 text-white hover:bg-white/20 no-underline">
                Proposer mes services
              </Link>
            </div>

            {/* Villes populaires */}
            <div className="flex flex-wrap gap-2 mt-6">
              <span className="text-secondary-400 text-sm flex items-center gap-1">
                <MapPin size={13} /> Populaire :
              </span>
              {['Douala', 'Yaoundé', 'Bafoussam', 'Bamenda'].map(city => (
                <Link
                  key={city}
                  to={`/painters?city=${city}`}
                  className="text-xs bg-white/10 border border-white/20 text-white hover:bg-white/20 px-3 py-1 rounded-full transition-colors no-underline"
                >
                  {city}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* STATISTIQUES                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-primary-500 py-10 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-heading font-extrabold">{value}</p>
              <p className="text-primary-200 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* COMMENT ÇA MARCHE                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-primary-500 font-semibold text-sm uppercase tracking-wider">Simple & rapide</span>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-secondary-900 mt-2">
              Comment ça marche ?
            </h2>
            <p className="text-secondary-500 mt-3 max-w-xl mx-auto">
              De la recherche à l'évaluation, PaintMatch vous accompagne à chaque étape.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(({ icon: Icon, num, title, desc, color }) => (
              <div key={num} className="relative group">
                {/* Ligne de connexion */}
                <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-secondary-100 z-0 -translate-y-1/2" />

                <div className="card relative z-10 hover:shadow-card-hover transition-all duration-200 hover:-translate-y-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon size={22} />
                    </div>
                    <span className="text-3xl font-heading font-bold text-secondary-100">{num}</span>
                  </div>
                  <h3 className="font-heading font-semibold text-secondary-900 mb-2">{title}</h3>
                  <p className="text-sm text-secondary-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/how-it-works" className="btn btn-secondary gap-2 no-underline">
              En savoir plus <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* RÉALISATIONS                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 px-4 bg-secondary-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-primary-500 font-semibold text-sm uppercase tracking-wider">Portfolio</span>
            <h2 className="text-3xl font-heading font-bold text-secondary-900 mt-2">
              Des travaux réalisés par nos peintres
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REALIZATIONS.map(({ img, title, city }) => (
              <div key={title} className="group relative overflow-hidden rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300">
                <img
                  src={img}
                  alt={title}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary-900/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-white font-semibold">{title}</p>
                  <p className="text-secondary-300 text-sm flex items-center gap-1">
                    <MapPin size={12} /> {city}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/painters" className="btn btn-primary btn-lg no-underline gap-2">
              Voir tous les peintres <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* POURQUOI PAINTMATCH                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="relative">
              <img
                src={IMAGES.painter_working}
                alt="Peintre professionnel au travail"
                className="w-full h-80 object-cover rounded-2xl shadow-card-hover"
                loading="lazy"
              />
              <div className="absolute -bottom-4 -right-4 bg-primary-500 text-white rounded-2xl p-4 shadow-lg">
                <p className="text-2xl font-bold">500+</p>
                <p className="text-primary-200 text-xs">Peintres vérifiés</p>
              </div>
            </div>

            {/* Texte */}
            <div>
              <span className="text-primary-500 font-semibold text-sm uppercase tracking-wider">Notre engagement</span>
              <h2 className="text-3xl font-heading font-bold text-secondary-900 mt-2 mb-5">
                Pourquoi choisir PaintMatch ?
              </h2>
              <div className="space-y-4">
                {[
                  { title: 'Peintres vérifiés',          desc: 'Chaque peintre est vérifié par notre équipe avant d\'apparaître sur la plateforme.' },
                  { title: 'Paiement sécurisé',          desc: 'MTN Mobile Money et Orange Money — vos paiements sont protégés.' },
                  { title: 'Suivi en temps réel',        desc: 'Recevez des photos et mises à jour à chaque étape de vos travaux.' },
                  { title: 'Satisfaction garantie',      desc: 'Vous ne payez le solde qu\'après avoir validé les travaux terminés.' },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle size={14} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-secondary-900">{title}</p>
                      <p className="text-sm text-secondary-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA PEINTRE                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${IMAGES.painter_roller})` }}
        />
        <div className="absolute inset-0 bg-secondary-900/80" />
        <div className="relative max-w-2xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-4">
            Vous êtes peintre professionnel ?
          </h2>
          <p className="text-secondary-300 text-lg mb-8">
            Rejoignez PaintMatch pour développer votre clientèle, gérer vos devis et recevoir des paiements en ligne.
          </p>
          <Link to="/auth/register" className="btn btn-primary btn-lg no-underline">
            Rejoindre la plateforme gratuitement
          </Link>
        </div>
      </section>
    </>
  )
}
