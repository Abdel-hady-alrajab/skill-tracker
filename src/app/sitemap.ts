import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://skill-tracker.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      // Homepage — highest priority, changes rarely
      url: siteUrl,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      // Login page — changes rarely
      url: `${siteUrl}/login`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.6,
    },
    // NOTE: /dashboard is intentionally excluded — it is a private,
    // authenticated route and must never be indexed by search engines.
  ]
}
