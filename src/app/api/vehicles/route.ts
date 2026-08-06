import { NextResponse } from 'next/server';
import { vehicleQuerySchema } from '../../../server/modules/vehicles/vehicles.schema';
import { getAvailableVehicles } from '../../../server/modules/vehicles/vehicles.service';
import { parseQuery, withErrorLogging } from '../../../server/http';

// GET /api/vehicles?officeSlug=zaragoza&startDate=…&endDate=…&category=TURISMOS
export const GET = withErrorLogging(async (request) => {
  const parsed = parseQuery(request, vehicleQuerySchema);
  if ('response' in parsed) return parsed.response;

  const { officeSlug, startDate, endDate, category } = parsed.data;

  return NextResponse.json(
    await getAvailableVehicles({
      officeSlug,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      category,
    }),
  );
});
