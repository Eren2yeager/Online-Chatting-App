/**
 * Dynamic robots.txt generation
 * Tells search engines which pages to crawl
 */
export default function robots() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/chats/',
          '/profile/',
          '/notifications/',
          '/invite/',
          '/friends/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
