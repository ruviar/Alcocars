import { NextResponse } from 'next/server';
import { checkoutBodySchema } from '../../../../server/modules/reservations/reservations.schema';
import {
  ReservationError,
  createBookingRequest,
} from '../../../../server/modules/reservations/reservations.service';
import { RESERVATION_HTTP_STATUS } from '../../../../server/modules/reservations/errors';
import { businessError, parseJsonBody, withErrorLogging } from '../../../../server/http';

// POST /api/reservations/checkout — registra la solicitud y avisa por email
export const POST = withErrorLogging(async (request) => {
  const parsed = await parseJsonBody(request, checkoutBodySchema);
  if ('response' in parsed) return parsed.response;

  try {
    const result = await createBookingRequest(parsed.data);

    // La solicitud queda guardada aunque el aviso por email falle: se informa
    // para que el frontend pueda pedirle al cliente que llame por teléfono.
    const emailDelivered = result.email.admin.status === 'SENT';
    if (!emailDelivered) {
      console.error(
        `[API] reserva ${result.confirmationCode} guardada pero el aviso por email no se entregó`,
        result.email,
      );
    }

    return NextResponse.json(
      {
        reservationId: result.reservationId,
        confirmationCode: result.confirmationCode,
        needsAvailabilityCheck: result.needsAvailabilityCheck,
        pickupAt: result.pickupAt.toISOString(),
        returnAt: result.returnAt.toISOString(),
        quote: result.quote,
        notification: {
          delivered: emailDelivered,
          admin: result.email.admin.status,
          customer: result.email.customer.status,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof ReservationError) {
      return businessError(err.message, RESERVATION_HTTP_STATUS);
    }
    throw err;
  }
});
