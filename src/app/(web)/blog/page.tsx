import type { Metadata } from 'next';
import BlogPage from '../../../views/BlogPage';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Consejos de conducción, guías de alquiler y novedades de la flota de Alcocars. Ideas y rutas para moverte por Zaragoza, Navarra, Soria y La Rioja.',
};

export default function Page() {
  return <BlogPage />;
}
