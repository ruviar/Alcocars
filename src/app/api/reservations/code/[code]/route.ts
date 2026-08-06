import { NextResponse } from 'next/server';
import { getReservationByCode } from '../../../../../server/modules/reservations/reservations.service';
import { jsonError, withErrorLogging } from '../../../../../server/http';

/**
 * Consulta pública por código de confirmación. No existe consulta por id: el
 * código ALC-XXXXXXXX es aleatorio y hace de credencial; un id enumerable
 * expondría datos del cliente.
 */
export const GET = withErrorLogging(
  async (_request, { params }: { params: Promise<{ code: string }> }) => {
    const { code } = await params;
    const reservation = await getReservationByCode(decodeURIComponent(code).trim().toUpperCase());
    if (!reservation) return jsonError('RESERVATION_NOT_FOUND', 404);
    return NextResponse.json(reservation);
  },
);
