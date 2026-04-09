import type { FastifyInstance } from 'fastify';
import { checkoutBodySchema } from './reservations.schema';
import { processCheckout, getReservationById } from './reservations.service';

export async function reservationsRouter(app: FastifyInstance) {
  // POST /api/reservations/checkout
  app.post('/reservations/checkout', async (request, reply) => {
    const parsed = checkoutBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { startDate, endDate, extras, ...rest } = parsed.data;

    try {
      const result = await processCheckout({
        ...rest,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        extras,
      });
      return reply.status(201).send(result);
    } catch (err: any) {
      if (err.message === 'INVALID_DATE_RANGE') {
        return reply.status(422).send({ error: 'INVALID_DATE_RANGE' });
      }
      if (err.message === 'INVALID_BABY_SEAT_QUANTITY') {
        return reply.status(422).send({ error: 'INVALID_BABY_SEAT_QUANTITY' });
      }
      if (err.message === 'VEHICLE_NOT_AVAILABLE') {
        return reply.status(409).send({ error: 'VEHICLE_NOT_AVAILABLE' });
      }
      if (err.message === 'VEHICLE_NOT_FOUND') {
        return reply.status(404).send({ error: 'VEHICLE_NOT_FOUND' });
      }
      if (err.message === 'OFFICE_NOT_FOUND') {
        return reply.status(404).send({ error: 'OFFICE_NOT_FOUND' });
      }
      throw err; // unexpected — let Fastify handle as 500
    }
  });

  // GET /api/reservations/:id
  app.get<{ Params: { id: string } }>('/reservations/:id', async (request, reply) => {
    const reservation = await getReservationById(request.params.id);
    if (!reservation) {
      return reply.status(404).send({ error: 'RESERVATION_NOT_FOUND' });
    }
    return reply.send(reservation);
  });
}
