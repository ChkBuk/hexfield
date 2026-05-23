import { SITE } from '~/config/site';

const ORG_ID = `${SITE.url}/#organization`;

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  '@id': ORG_ID,
  name: SITE.legalName,
  alternateName: SITE.name,
  url: SITE.url,
  logo: `${SITE.url}/images/logo.svg`,
  image: `${SITE.url}/images/og-default.png`,
  description: SITE.description,
  slogan: SITE.tagline,
  telephone: SITE.phoneDisplay,
  email: SITE.email,
  priceRange: '$$',
  address: {
    '@type': 'PostalAddress',
    streetAddress: SITE.address.street,
    addressLocality: SITE.address.locality,
    addressRegion: SITE.address.region,
    postalCode: SITE.address.postalCode,
    addressCountry: SITE.address.country,
  },
  areaServed: [
    { '@type': 'Country', name: 'Australia' },
    { '@type': 'City', name: 'Adelaide' },
    { '@type': 'Place', name: 'Worldwide (remote)' },
  ],
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
  ],
  sameAs: [SITE.social.linkedin, SITE.social.github],
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE.url}/#website`,
  url: SITE.url,
  name: SITE.name,
  inLanguage: SITE.hreflang,
  publisher: { '@id': ORG_ID },
};

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: new URL(item.path, SITE.url).toString(),
    })),
  };
}

export interface ServiceInput {
  name: string;
  description: string;
  serviceType: string;
  offers: string[];
}

export function serviceSchema(input: ServiceInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    serviceType: input.serviceType,
    provider: { '@id': ORG_ID },
    areaServed: ['Australia', 'Adelaide', 'Worldwide (remote)'],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: input.name,
      itemListElement: input.offers.map((name) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name },
      })),
    },
  };
}

export interface FaqItem {
  q: string;
  a: string;
}

export function faqSchema(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

export interface BlogPostingInput {
  title: string;
  description: string;
  path: string;
  publishedTime: string;
  modifiedTime?: string;
  author: string;
  image?: string;
}

export function blogPostingSchema(input: BlogPostingInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': new URL(input.path, SITE.url).toString() },
    headline: input.title,
    description: input.description,
    image: input.image ? new URL(input.image, SITE.url).toString() : `${SITE.url}/images/og-default.png`,
    datePublished: input.publishedTime,
    dateModified: input.modifiedTime ?? input.publishedTime,
    author: { '@type': 'Person', name: input.author },
    publisher: { '@id': ORG_ID },
  };
}
