/**
 * PaintMatch — Configuration i18next
 * Langues supportées : Français (fr) et Anglais (en)
 * La langue est détectée depuis le navigateur, avec fallback sur le français.
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Traductions FR
import commonFR   from './locales/fr/common.json'
import authFR     from './locales/fr/auth.json'
import errorsFR   from './locales/fr/errors.json'
import servicesFR from './locales/fr/services.json'
import adminFR    from './locales/fr/admin.json'

// Traductions EN
import commonEN   from './locales/en/common.json'
import authEN     from './locales/en/auth.json'
import errorsEN   from './locales/en/errors.json'
import servicesEN from './locales/en/services.json'
import adminEN    from './locales/en/admin.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: {
        common:   commonFR,
        auth:     authFR,
        errors:   errorsFR,
        services: servicesFR,
        admin:    adminFR,
      },
      en: {
        common:   commonEN,
        auth:     authEN,
        errors:   errorsEN,
        services: servicesEN,
        admin:    adminEN,
      },
    },
    lng: 'fr',             // langue par défaut
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,  // React échappe déjà les valeurs
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18n
