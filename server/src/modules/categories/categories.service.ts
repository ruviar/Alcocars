import { prisma } from '../../db/prisma';

export async function listCategories() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ group: 'asc' }, { order: 'asc' }],
  });

  // Serialize Decimals to numbers for JSON response
  return categories.map((cat) => ({
    ...cat,
    price1Day: Number(cat.price1Day),
    price2Day: Number(cat.price2Day),
    price3Day: Number(cat.price3Day),
    price4Day: Number(cat.price4Day),
    price5Day: Number(cat.price5Day),
    price6Day: Number(cat.price6Day),
    price7Day: Number(cat.price7Day),
    extraKmRate: Number(cat.extraKmRate),
    deposit: Number(cat.deposit),
    franchise: Number(cat.franchise),
  }));
}
