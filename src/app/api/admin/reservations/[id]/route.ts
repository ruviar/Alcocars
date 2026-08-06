import { NextResponse } from 'next/server';
import { updateReservationBodySchema } from '../../../../../server/modules/admin/reservations/admin-reservations.schema';
import {
  AdminReservationError,
  getReservationDetail,
  updateReservation,
} from '../../../../../server/modules/admin/reservations/admin-reservations.service';
import { ADMIN_RESERVATION_HTTP_STATUS } from '../../../../../server/modules/admin/reservations/errors';
import {
  businessError,
  jsonError,
  parseJsonBody,
  requireAdmin,
  withErrorLogging,
} from '../../../../../server/http';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrorLogging(async (_request, { params }: Ctx) => {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  const { id } = await params;
  const reservation = await getReservationDetail(id);
  if (!reservation) return jsonError('RESERVATION_NOT_FOUND', 404);
  return NextResponse.json(reservation);
});

// PATCH /api/admin/reservations/:id  { vehicleId?, notes? }
export const PATCH = withErrorLogging(async (request, { params }: Ctx) => {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  const parsed = await parseJsonBody(request, updateReservationBodySchema);
  if ('response' in parsed) return parsed.response;

  const { id } = await params;
  try {
    return NextResponse.json(await updateReservation(id, parsed.data));
  } catch (err) {
    if (err instanceof AdminReservationError) {
      return businessError(err.message, ADMIN_RESERVATION_HTTP_STATUS);
    }
    throw err;
  }
});
