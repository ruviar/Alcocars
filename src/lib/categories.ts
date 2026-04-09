export type CategoryGroup = 'COCHE' | 'FURGONETA_TRANSPORTE' | 'FURGONETA_CARGA' | 'TODOTERRENO';

export const CATEGORY_GROUP_LABELS: Record<CategoryGroup, string> = {
  COCHE: 'Coches',
  FURGONETA_TRANSPORTE: 'Furgonetas de transporte',
  FURGONETA_CARGA: 'Furgonetas de carga',
  TODOTERRENO: 'Todoterrenos',
};

export interface Category {
  id: string;
  slug: string;
  name: string;
  group: CategoryGroup;
  description: string | null;
  order: number;
  price1Day: number;
  price2Day: number;
  price3Day: number;
  price4Day: number;
  price5Day: number;
  price6Day: number;
  price7Day: number;
  extraKmRate: number;
  deposit: number;
  franchise: number;
  powerMin: number | null;
  powerMax: number | null;
  seatsMin: number | null;
  seatsMax: number | null;
  transmissions: string[];
  fuels: string[];
  imageUrl: string | null;
  highlight: string | null;
  isActive: boolean;
}

export function groupCategories(categories: Category[]): Record<CategoryGroup, Category[]> {
  return categories.reduce(
    (acc, cat) => {
      if (!acc[cat.group]) acc[cat.group] = [];
      acc[cat.group].push(cat);
      return acc;
    },
    {} as Record<CategoryGroup, Category[]>,
  );
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  'COCHE',
  'FURGONETA_TRANSPORTE',
  'FURGONETA_CARGA',
  'TODOTERRENO',
];
