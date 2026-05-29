import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://skill-tracker.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard', // Private user route
        '/api/',       // Backend API handlers
        '/auth/',      // Authentication callback pathways
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}