import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { categoryAvailabilityQuerySchema, checkoutBodySchema } from './reservations.schema';
import {
  ReservationError,
  createBookingRequest,
  getAvailableTariffOffers,
  getReservationByCode,
  getReservationById,
} from './reservations.service';

/** Códigos de negocio → HTTP. Cualquier otro error sube a Fastify como 500. */
const STATUS_BY_ERROR: Record<string, number> = {
  INVALID_DATE_RANGE: 422,
  MIN_RENTAL_DURATION: 422,
  MAX_RENTAL_DAYS_EXCEEDED: 422,
  INVALID_EXTRA_QUANTITY: 422,
  EXTRA_NOT_FOUND: 422,
  TARIFF_NOT_FOUND: 404,
  OFFICE_NOT_FOUND: 404,
  RETURN_OFFICE_NOT_FOUND: 404,
};

export async function reservationsRouter(app: FastifyInstance) {
  // GET /api/reservations/offers?officeSlug=zaragoza&startDate=…&endDate=…
  const offersHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = categoryAvailabilityQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(422).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      return reply.send(await getAvailableTariffOffers(parsed.data));
    } catch (err) {
      if (err instanceof ReservationError) {
        return reply.status(STATUS_BY_ERROR[err.message] ?? 422).send({ error: err.message });
      }
      throw err;
    }
  };

  app.get('/reservations/offers', offersHandler);
  // Alias del nombre anterior para no romper integraciones existentes.
  app.get('/reservations/categories', offersHandler);

  // POST /api/reservations/checkout — registra la solicitud y avisa por email
  app.post('/reservations/checkout', async (request, reply) => {
    const parsed = checkoutBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const result = await createBookingRequest(parsed.data);

      // La solicitud queda guardada aunque el aviso por email falle: se informa
      // para que el frontend pueda pedirle al cliente que llame por teléfono.
      const emailDelivered = result.email.admin.status === 'SENT';
      if (!emailDelivered) {
        request.log.error(
          { reservationId: result.reservationId, email: result.email },
          'La solicitud se guardó pero el aviso por email no se entregó',
        );
      }

      return reply.status(201).send({
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
      });
    } catch (err) {
      if (err instanceof ReservationError) {
        return reply.status(STATUS_BY_ERROR[err.message] ?? 422).send({ error: err.message });
      }
      throw err;
    }
  });

  // GET /api/reservations/code/:code — consulta pública por código
  app.get<{ Params: { code: string } }>('/reservations/code/:code', async (request, reply) => {
    const reservation = await getReservationByCode(request.params.code.trim().toUpperCase());
    if (!reservation) return reply.status(404).send({ error: 'RESERVATION_NOT_FOUND' });
    return reply.send(reservation);
  });

  // GET /api/reservations/:id
  app.get<{ Params: { id: string } }>('/reservations/:id', async (request, reply) => {
    const reservation = await getReservationById(request.params.id);
    if (!reservation) return reply.status(404).send({ error: 'RESERVATION_NOT_FOUND' });
    return reply.send(reservation);
  });
}
