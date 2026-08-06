import { NextResponse } from 'next/server';
import { updateStatusBodySchema } from '../../../../../../server/modules/admin/reservations/admin-reservations.schema';
import {
  AdminReservationError,
  updateReservationStatus,
} from '../../../../../../server/modules/admin/reservations/admin-reservations.service';
import { ADMIN_RESERVATION_HTTP_STATUS } from '../../../../../../server/modules/admin/reservations/errors';
import {
  businessError,
  parseJsonBody,
  requireAdmin,
  withErrorLogging,
} from '../../../../../../server/http';

export const PATCH = withErrorLogging(
  async (request, { params }: { params: Promise<{ id: string }> }) => {
    const auth = await requireAdmin();
    if ('response' in auth) return auth.response;

    const parsed = await parseJsonBody(request, updateStatusBodySchema);
    if ('response' in parsed) return parsed.response;

    const { id } = await params;
    try {
      return NextResponse.json(await updateReservationStatus(id, parsed.data.status));
    } catch (err) {
      if (err instanceof AdminReservationError) {
        return businessError(err.message, ADMIN_RESERVATION_HTTP_STATUS);
      }
      throw err;
    }
  },
);
