import { NextResponse } from 'next/server';
import { EXTRAS, RENTAL_RULES, SUPER_CATEGORIES, TARIFFS } from '../../../server/config/catalog';
import { COMPANY, OFFICES } from '../../../server/config/company';

/**
 * Catálogo público: tarifas, extras, reglas de alquiler y datos de las
 * oficinas. Existe para que cualquier consumidor lea los mismos importes que se
 * cobran, en vez de mantener su propia copia. No toca la base de datos.
 */
export async function GET() {
  return NextResponse.json(
    {
      company: {
        name: COMPANY.name,
        legalName: COMPANY.legalName,
        email: COMPANY.email,
        phone: COMPANY.phone,
        whatsapp: COMPANY.whatsapp,
        regions: COMPANY.regions,
      },
      superCategories: SUPER_CATEGORIES,
      tariffs: TARIFFS,
      extras: EXTRAS,
      rules: RENTAL_RULES,
      offices: OFFICES.map((office) => ({
        slug: office.slug,
        city: office.city,
        region: office.region,
        address: office.address,
        phone: office.phone,
        email: office.email,
        hours: office.hours,
        coords: office.coords,
        description: office.description,
      })),
    },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  );
}
