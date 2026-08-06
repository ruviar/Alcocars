import { NextResponse } from 'next/server';
import { listReservationsQuerySchema } from '../../../../server/modules/admin/reservations/admin-reservations.schema';
import { listReservations } from '../../../../server/modules/admin/reservations/admin-reservations.service';
import { parseQuery, requireAdmin, withErrorLogging } from '../../../../server/http';

// GET /api/admin/reservations?status=&search=&needsCheck=&from=&to=&page=&pageSize=
export const GET = withErrorLogging(async (request) => {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  const parsed = parseQuery(request, listReservationsQuerySchema);
  if ('response' in parsed) return parsed.response;

  return NextResponse.json(await listReservations(parsed.data));
});
