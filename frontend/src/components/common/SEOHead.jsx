/**
 * SEOHead — Gestion des meta tags SEO par page.
 * Modifie dynamiquement le <title> et les meta descriptions.
 * Les pages privées ne sont jamais indexées.
 */

import { useEffect } from 'react'

const DEFAULT_TITLE       = 'PaintMatch — Trouvez votre peintre qualifié au Cameroun'
const DEFAULT_DESCRIPTION = 'PaintMatch met en relation les clients avec des peintres en bâtiment vérifiés et expérimentés partout au Cameroun. Obtenez des devis, réservez et suivez vos travaux en ligne.'
const DEFAULT_IMAGE       = '/og-image.jpg'
const SITE_URL            = 'https://paintmatch.cm'

export default function SEOHead({
  title,
  description,
  image,
  url,
  noindex = false,
  type = 'website',
  structuredData = null,
}) {
  const fullTitle       = title ? `${title} — PaintMatch` : DEFAULT_TITLE
  const metaDescription = description || DEFAULT_DESCRIPTION
  const metaImage       = image || DEFAULT_IMAGE
  const canonicalUrl    = url ? `${SITE_URL}${url}` : SITE_URL

  useEffect(() => {
    // Titre de la page
    document.title = fullTitle

    // Meta description
    setMeta('description', metaDescription)

    // Robots
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow')

    // Open Graph
    setMetaProperty('og:title',       fullTitle)
    setMetaProperty('og:description', metaDescription)
    setMetaProperty('og:image',       metaImage)
    setMetaProperty('og:url',         canonicalUrl)
    setMetaProperty('og:type',        type)
    setMetaProperty('og:site_name',   'PaintMatch')
    setMetaProperty('og:locale',      'fr_CM')

    // Twitter Card
    setMetaProperty('twitter:card',        'summary_large_image')
    setMetaProperty('twitter:title',       fullTitle)
    setMetaProperty('twitter:description', metaDescription)
    setMetaProperty('twitter:image',       metaImage)

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalUrl

    // Données structurées JSON-LD
    let script = document.getElementById('structured-data')
    if (structuredData) {
      if (!script) {
        script = document.createElement('script')
        script.id   = 'structured-data'
        script.type = 'application/ld+json'
        document.head.appendChild(script)
      }
      script.textContent = JSON.stringify(structuredData)
    } else if (script) {
      script.remove()
    }

    // Nettoyage au démontage
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [fullTitle, metaDescription, metaImage, canonicalUrl, noindex, structuredData])

  return null
}

function setMeta(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.name = name
    document.head.appendChild(el)
  }
  el.content = content
}

function setMetaProperty(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.content = content
}
