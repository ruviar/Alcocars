import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel de administración',
  description: 'Área privada de gestión de Alcocars.',
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
