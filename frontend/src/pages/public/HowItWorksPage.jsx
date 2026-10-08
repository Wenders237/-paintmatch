/**
 * HowItWorksPage — Comment fonctionne PaintMatch.
 */

import { Link } from 'react-router-dom'
import { Search, FileText, CreditCard, Star, ShieldCheck, Paintbrush, Clock, CheckCircle } from 'lucide-react'
import SEOHead from '@/components/common/SEOHead'

const CLIENT_STEPS = [
  { icon: Search,      step: '01', title: 'Recherchez un peintre',    desc: 'Utilisez notre moteur de recherche intelligent pour trouver des peintres qualifiés dans votre ville.' },
  { icon: FileText,    step: '02', title: 'Demandez un devis gratuit', desc: 'Décrivez vos travaux et envoyez une demande de devis au peintre de votre choix.' },
  { icon: CheckCircle, step: '03', title: 'Acceptez le devis',        desc: 'Comparez et acceptez le devis qui vous convient. Une réservation est créée automatiquement.' },
  { icon: CreditCard,  step: '04', title: 'Payez en toute sécurité',  desc: 'Réglez l\'acompte via MTN Mobile Money ou Orange Money pour confirmer vos travaux.' },
  { icon: Clock,       step: '05', title: 'Suivez vos travaux',       desc: 'Recevez des mises à jour avec photos à chaque étape importante des travaux.' },
  { icon: Star,        step: '06', title: 'Évaluez la prestation',    desc: 'Une fois les travaux terminés, partagez votre expérience pour aider la communauté.' },
]

const PAINTER_STEPS = [
  { icon: Paintbrush,  step: '01', title: 'Créez votre profil pro',   desc: 'Renseignez vos compétences, qualifications, réalisations et disponibilités.' },
  { icon: ShieldCheck, step: '02', title: 'Faites valider votre profil', desc: 'Notre équipe vérifie vos informations professionnelles avant activation.' },
  { icon: FileText,    step: '03', title: 'Recevez des demandes',     desc: 'Les clients vous envoient des demandes de devis directement.' },
  { icon: CreditCard,  step: '04', title: 'Rédigez vos devis',       desc: 'Utilisez notre assistant IA pour rédiger des devis professionnels rapidement.' },
  { icon: CheckCircle, step: '05', title: 'Réalisez les travaux',     desc: 'Mettez à jour l\'avancement avec des photos pour garder le client informé.' },
  { icon: Star,        step: '06', title: 'Développez votre réputation', desc: 'Collectez des avis positifs et améliorez votre visibilité sur la plateforme.' },
]

export default function HowItWorksPage() {
  return (
    <>
      <SEOHead
        title="Comment ça marche — PaintMatch"
        description="Découvrez comment PaintMatch fonctionne pour les clients et les peintres. Recherchez, demandez un devis, réservez et payez en toute sécurité au Cameroun."
        url="/how-it-works"
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16 px-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold mb-3">
          Comment fonctionne PaintMatch ?
        </h1>
        <p className="text-primary-200 max-w-xl mx-auto">
          Simple, rapide et sécurisé — pour les clients comme pour les peintres.
        </p>
      </section>

      {/* Pour les clients */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="badge badge-info mb-3">Pour les clients</span>
            <h2 className="text-2xl font-heading font-bold text-secondary-900">
              Trouvez votre peintre en 6 étapes
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CLIENT_STEPS.map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="card hover:shadow-card-hover transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <Icon size={20} className="text-primary-600" />
                  </div>
                  <span className="text-2xl font-heading font-bold text-secondary-100">{step}</span>
                </div>
                <h3 className="font-semibold text-secondary-900 mb-1">{title}</h3>
                <p className="text-sm text-secondary-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/auth/register" className="btn btn-primary btn-lg no-underline">
              Créer mon compte client
            </Link>
          </div>
        </div>
      </section>

      {/* Pour les peintres */}
      <section className="py-16 px-4 bg-secondary-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="badge badge-warning mb-3">Pour les peintres</span>
            <h2 className="text-2xl font-heading font-bold text-secondary-900">
              Développez votre activité en 6 étapes
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PAINTER_STEPS.map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="card hover:shadow-card-hover transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Icon size={20} className="text-amber-600" />
                  </div>
                  <span className="text-2xl font-heading font-bold text-secondary-100">{step}</span>
                </div>
                <h3 className="font-semibold text-secondary-900 mb-1">{title}</h3>
                <p className="text-sm text-secondary-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/auth/register" className="btn btn-primary btn-lg no-underline">
              Rejoindre PaintMatch
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ rapide */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-heading font-bold text-center text-secondary-900 mb-8">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {[
              { q: 'Est-ce gratuit pour les clients ?', r: 'Oui, l\'inscription et la demande de devis sont entièrement gratuites pour les clients.' },
              { q: 'Comment les peintres sont-ils vérifiés ?', r: 'Chaque peintre soumet ses documents professionnels (RCCM, diplômes). Notre équipe les vérifie avant activation du profil.' },
              { q: 'Quels moyens de paiement sont acceptés ?', r: 'MTN Mobile Money et Orange Money. D\'autres moyens seront ajoutés prochainement.' },
              { q: 'Que se passe-t-il si je ne suis pas satisfait ?', r: 'Vous pouvez laisser une évaluation et contacter le support. Le peintre peut également répondre à votre avis.' },
            ].map(({ q, r }, i) => (
              <div key={i} className="card">
                <h3 className="font-semibold text-secondary-900 mb-2">{q}</h3>
                <p className="text-sm text-secondary-500">{r}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
