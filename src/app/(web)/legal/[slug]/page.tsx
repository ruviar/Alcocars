import type { Metadata } from 'next';
import { legalDocuments } from '../../../../data/legalContent';
import LegalPage from '../../../../views/LegalPage';

export function generateStaticParams() {
  return Object.keys(legalDocuments).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const legalDoc = legalDocuments[slug];
  if (!legalDoc) return { title: 'Documento legal' };

  return { title: legalDoc.title, description: legalDoc.intro };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <LegalPage legalDoc={legalDocuments[slug]} />;
}
