import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language?.startsWith('fr') ? 'fr' : 'en'

  const toggle = () => {
    i18n.changeLanguage(current === 'fr' ? 'en' : 'fr')
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-secondary-200 text-secondary-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
      aria-label="Changer de langue"
      title={current === 'fr' ? 'Switch to English' : 'Passer en français'}
    >
      <span>{current === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
      <span>{current.toUpperCase()}</span>
    </button>
  )
}
