/**
 * Dynamic sitemap generation
 * Helps search engines discover and index pages
 */
export default function sitemap() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/signin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
