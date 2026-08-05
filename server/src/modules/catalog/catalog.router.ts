import type { FastifyInstance } from 'fastify';
import { EXTRAS, RENTAL_RULES, SUPER_CATEGORIES, TARIFFS } from '../../config/catalog';
import { COMPANY, OFFICES } from '../../config/company';

/**
 * Catálogo público: tarifas, extras, reglas de alquiler y datos de las
 * oficinas. Existe para que cualquier consumidor (la web, un futuro panel o el
 * comparador de un tercero) lea los mismos importes que se cobran, en vez de
 * mantener su propia copia.
 */
export async function catalogRouter(app: FastifyInstance) {
  app.get('/catalog', async (_request, reply) => {
    reply.header('Cache-Control', 'public, max-age=300');

    return reply.send({
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
    });
  });
}
