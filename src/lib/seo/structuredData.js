/**
 * Structured data (JSON-LD) for better SEO
 * Helps search engines understand your content
 */

export function getWebsiteStructuredData() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ChatApp',
    description: 'Real-time messaging and video chat platform for connecting with friends and family',
    url: baseUrl,
    applicationCategory: 'CommunicationApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Real-time messaging',
      'Video calls',
      'Group chats',
      'Media sharing',
      'End-to-end encryption',
      'Cross-platform support'
    ],
    screenshot: `${baseUrl}/screenshot-1.jpg`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
      bestRating: '5',
      worstRating: '1'
    }
  };
}

export function getOrganizationStructuredData() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ChatApp',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    sameAs: [
      'https://twitter.com/chatapp',
      'https://facebook.com/chatapp',
      'https://linkedin.com/company/chatapp'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@chatapp.com'
    }
  };
}

export function getBreadcrumbStructuredData(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function getFAQStructuredData(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}
