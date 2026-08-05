import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { EXTRAS, TARIFFS } from '../config/catalog';

/**
 * El frontend mantiene una copia editorial del catálogo en
 * `src/data/tariffs.ts` para poder pintar precios sin depender de la API.
 *
 * Este test existe porque el bug más caro de este proyecto fue tener tres
 * tablas de precios distintas conviviendo en silencio: la del front, la del
 * back y la de la base de datos. Si alguien toca una y no la otra, aquí salta.
 */

const ENTRY = new RegExp(
  [
    /\{\s*/,
    /id:\s*'(?<id>[^']+)',\s*/,
    /name:\s*'(?<name>[^']+)',\s*/,
    /superCategory:\s*'(?<superCategory>[^']+)',\s*/,
    /(?:consultOnly:\s*true,\s*)?/,
    /rates:\s*\[(?<rates>[^\]]*)\],\s*/,
    /kmExtra:\s*(?<kmExtra>[\d.]+),\s*/,
    /deposit:\s*(?<deposit>\d+),\s*/,
    /franchise:\s*(?<franchise>\d+),\s*/,
    /kmPerDay:\s*(?<kmPerDay>\d+),?\s*/,
    /\}/,
  ]
    .map((part) => part.source)
    .join(''),
  'g',
);

interface ParsedTariff {
  id: string;
  name: string;
  superCategory: string;
  rates: number[];
  kmExtra: number;
  deposit: number;
  franchise: number;
  kmPerDay: number;
}

function parseFrontendTariffs(): ParsedTariff[] {
  const source = readFileSync(join(process.cwd(), '..', 'src', 'data', 'tariffs.ts'), 'utf8');

  return [...source.matchAll(ENTRY)].map((match) => {
    const groups = match.groups as Record<string, string>;
    const rates = groups.rates
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map(Number);

    return {
      id: groups.id,
      name: groups.name,
      superCategory: groups.superCategory,
      rates,
      kmExtra: Number(groups.kmExtra),
      deposit: Number(groups.deposit),
      franchise: Number(groups.franchise),
      kmPerDay: Number(groups.kmPerDay),
    };
  });
}

describe('paridad del catálogo frontend ↔ backend', () => {
  const parsed = parseFrontendTariffs();

  it('el parser encuentra todas las gamas (si esto falla, revisa el formato del archivo)', () => {
    expect(parsed.length).toBe(TARIFFS.length);
  });

  it('cada gama del backend existe en el frontend con los mismos importes', () => {
    for (const tariff of TARIFFS) {
      const twin = parsed.find((entry) => entry.id === tariff.id);
      expect(twin, `falta la gama '${tariff.id}' en src/data/tariffs.ts`).toBeDefined();

      expect(twin!.name, `nombre distinto en '${tariff.id}'`).toBe(tariff.name);
      expect(twin!.superCategory, `categoría distinta en '${tariff.id}'`).toBe(tariff.superCategory);
      expect(twin!.rates, `tarifas distintas en '${tariff.id}'`).toEqual(tariff.rates);
      expect(twin!.kmExtra, `€/km distinto en '${tariff.id}'`).toBe(tariff.kmExtra);
      expect(twin!.deposit, `fianza distinta en '${tariff.id}'`).toBe(tariff.deposit);
      expect(twin!.franchise, `franquicia distinta en '${tariff.id}'`).toBe(tariff.franchise);
      expect(twin!.kmPerDay, `km/día distintos en '${tariff.id}'`).toBe(tariff.kmPerDay);
    }
  });

  it('el frontend no publica gamas que el backend no sepa cotizar', () => {
    const backendIds = new Set(TARIFFS.map((tariff) => tariff.id));
    for (const entry of parsed) {
      expect(backendIds.has(entry.id), `'${entry.id}' está en el front pero no en el catálogo del server`).toBe(
        true,
      );
    }
  });
});

describe('paridad de los extras frontend ↔ backend', () => {
  const source = readFileSync(join(process.cwd(), '..', 'src', 'data', 'extras.ts'), 'utf8');

  it('cada extra del backend aparece en el frontend con el mismo id, precio y unidad', () => {
    for (const extra of EXTRAS) {
      const block = source.match(new RegExp(`id:\\s*'${extra.id}',[\\s\\S]{0,600}?\\n  \\},`));
      expect(block, `falta el extra '${extra.id}' en src/data/extras.ts`).not.toBeNull();

      const text = block![0];
      expect(text, `precio distinto en '${extra.id}'`).toContain(`price: ${extra.price},`);
      expect(text, `unidad distinta en '${extra.id}'`).toContain(`unit: '${extra.unit}',`);
      expect(text, `cantidad máxima distinta en '${extra.id}'`).toContain(
        `maxQuantity: ${extra.maxQuantity},`,
      );

      if (extra.maxPerRental !== undefined) {
        expect(text, `tope distinto en '${extra.id}'`).toContain(`maxPerRental: ${extra.maxPerRental},`);
      }
    }
  });

  it('el frontend no ofrece extras que el backend rechazaría', () => {
    const frontendIds = [...source.matchAll(/^\s{4}id:\s*'([^']+)',$/gm)].map((match) => match[1]);
    const backendIds = new Set(EXTRAS.map((extra) => extra.id));

    expect(frontendIds.length).toBe(EXTRAS.length);
    for (const id of frontendIds) {
      expect(backendIds.has(id), `'${id}' está en el front pero no en el catálogo del server`).toBe(true);
    }
  });
});
