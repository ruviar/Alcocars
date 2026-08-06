import { NextResponse } from 'next/server';
import {
  AdminReservationError,
  listAssignableVehicles,
} from '../../../../../../server/modules/admin/reservations/admin-reservations.service';
import { ADMIN_RESERVATION_HTTP_STATUS } from '../../../../../../server/modules/admin/reservations/errors';
import { businessError, requireAdmin, withErrorLogging } from '../../../../../../server/http';

export const GET = withErrorLogging(
  async (_request, { params }: { params: Promise<{ id: string }> }) => {
    const auth = await requireAdmin();
    if ('response' in auth) return auth.response;

    const { id } = await params;
    try {
      return NextResponse.json(await listAssignableVehicles(id));
    } catch (err) {
      if (err instanceof AdminReservationError) {
        return businessError(err.message, ADMIN_RESERVATION_HTTP_STATUS);
      }
      throw err;
    }
  },
);
