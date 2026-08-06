import { NextResponse } from 'next/server';
import { categoryAvailabilityQuerySchema } from '../../../../server/modules/reservations/reservations.schema';
import {
  ReservationError,
  getAvailableTariffOffers,
} from '../../../../server/modules/reservations/reservations.service';
import { RESERVATION_HTTP_STATUS } from '../../../../server/modules/reservations/errors';
import { businessError, parseQuery, withErrorLogging } from '../../../../server/http';

// GET /api/reservations/offers?officeSlug=zaragoza&startDate=…&endDate=…
export const GET = withErrorLogging(async (request) => {
  const parsed = parseQuery(request, categoryAvailabilityQuerySchema);
  if ('response' in parsed) return parsed.response;

  try {
    return NextResponse.json(await getAvailableTariffOffers(parsed.data));
  } catch (err) {
    if (err instanceof ReservationError) {
      return businessError(err.message, RESERVATION_HTTP_STATUS);
    }
    throw err;
  }
});
