// Single source of truth for brand metadata + NAP.
export const SITE = {
  name: 'Hexfield',
  legalName: 'Hexfield Pty Ltd',
  url: 'https://hexfield.com.au',
  defaultLocale: 'en_AU',
  hreflang: 'en-AU',
  tagline: 'Smart Digital Systems. Built by one expert, for your entire business.',
  description:
    'Hexfield Pty Ltd — solo full-stack developer in Adelaide delivering forms digitalisation, web design, web development (MERN & Java), system design and SEO. Available worldwide.',
  abn: '55 698 151 638',
  acn: '698 151 638',
  phoneDisplay: '+61 484 938 408',
  phoneTel: '+61484938408',
  email: 'info@hexfield.com.au',
  address: {
    street: '6A Drew Grove',
    locality: 'St. Georges',
    region: 'SA',
    postalCode: '5064',
    country: 'AU',
  },
  hours: 'Mon–Fri 9am–6pm ACDT',
  social: {
    // Optional public profiles — leave as placeholders or remove if not used.
    linkedin: 'https://www.linkedin.com/company/hexfield',
    github:   'https://github.com/hexfield',
  },
  serviceArea: 'Adelaide + worldwide remote',
  themeColor: '#0F1014',
} as const;

export const NAV = [
  { label: 'Home',      href: '/' },
  { label: 'Services',  href: '/services/' },
  { label: 'Portfolio', href: '/portfolio/' },
  { label: 'About',     href: '/about/' },
  { label: 'Contact',   href: '/contact/' },
] as const;
