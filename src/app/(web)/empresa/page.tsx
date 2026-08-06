import type { Metadata } from 'next';
import CompanyPage from '../../../views/CompanyPage';

export const metadata: Metadata = {
  title: 'La empresa',
  description:
    'Alcocars, empresa del grupo Alcotrans, S.L.: alquiler y renting de vehículos multimarca con cobertura en Zaragoza, Ágreda (Soria), la Ribera Navarra y La Rioja.',
};

export default function Page() {
  return <CompanyPage />;
}
