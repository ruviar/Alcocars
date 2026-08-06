import type { Metadata, Viewport } from 'next';
import { Bebas_Neue, Inter, Space_Mono } from 'next/font/google';
import { company, offices } from '../data/offices';
import '../styles/globals.css';

// Fuentes autoalojadas por Next: sin @import bloqueante de Google Fonts y sin
// parpadeo. Cada una expone la variable CSS que ya usan los design tokens.
const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const SITE_URL = 'https://alcocars.es';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Alcocars · Alquiler y renting de vehículos en Zaragoza, Tudela y Soria',
    template: '%s · Alcocars',
  },
  description:
    'Alquiler de coches, furgonetas, 4x4 y autocaravanas en Zaragoza, Tudela y Ágreda (Soria) desde 61 €/día. Seguro a todo riesgo y asistencia 24 h incluidos.',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'Alcocars',
    title: 'Alcocars · Alquiler y renting de vehículos en Zaragoza, Tudela y Soria',
    description:
      'Alquiler de coches, furgonetas, 4x4 y autocaravanas en Zaragoza, Tudela y Ágreda (Soria) desde 61 €/día. Seguro a todo riesgo y asistencia 24 h incluidos.',
  },
  twitter: { card: 'summary' },
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#012369',
};

/** Datos estructurados de negocio local para los buscadores. */
const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AutoRental',
  name: company.name,
  legalName: company.legalName,
  url: SITE_URL,
  telephone: `+34${company.phone.replace(/\s+/g, '')}`,
  email: company.email,
  areaServed: company.regions,
  location: offices.map((office) => ({
    '@type': 'Place',
    name: `${company.name} ${office.city}`,
    telephone: `+34${office.phone.replace(/\s+/g, '')}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: office.address,
      addressLocality: office.city,
      addressCountry: 'ES',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: office.coords[0],
      longitude: office.coords[1],
    },
  })),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${bebasNeue.variable} ${inter.variable} ${spaceMono.variable}`}>
      <body>
        {children}
        <script
          type="application/ld+json"
          // Contenido estático generado desde nuestros propios datos.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
      </body>
    </html>
  );
}
