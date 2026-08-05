import type { FastifyInstance } from 'fastify';
import {
  listReservationsQuerySchema,
  updateReservationBodySchema,
  updateStatusBodySchema,
} from './admin-reservations.schema';
import {
  AdminReservationError,
  getReservationDetail,
  listAssignableVehicles,
  listReservations,
  updateReservation,
  updateReservationStatus,
} from './admin-reservations.service';

const STATUS_BY_ERROR: Record<string, number> = {
  RESERVATION_NOT_FOUND: 404,
  VEHICLE_NOT_FOUND: 404,
  INVALID_STATUS_TRANSITION: 422,
  NO_VEHICLE_ASSIGNED: 422,
  VEHICLE_WRONG_OFFICE: 422,
  VEHICLE_WRONG_CATEGORY: 422,
  VEHICLE_ALREADY_BOOKED: 409,
};

export async function adminReservationsRouter(app: FastifyInstance) {
  // GET /api/admin/reservations?status=&search=&needsCheck=&from=&to=&page=&pageSize=
  app.get('/reservations', async (request, reply) => {
    const parsed = listReservationsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(422).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    return reply.send(await listReservations(parsed.data));
  });

  // GET /api/admin/reservations/:id
  app.get<{ Params: { id: string } }>('/reservations/:id', async (request, reply) => {
    const reservation = await getReservationDetail(request.params.id);
    if (!reservation) return reply.status(404).send({ error: 'RESERVATION_NOT_FOUND' });
    return reply.send(reservation);
  });

  // GET /api/admin/reservations/:id/assignable-vehicles
  app.get<{ Params: { id: string } }>(
    '/reservations/:id/assignable-vehicles',
    async (request, reply) => {
      try {
        return reply.send(await listAssignableVehicles(request.params.id));
      } catch (err) {
        if (err instanceof AdminReservationError) {
          return reply.status(STATUS_BY_ERROR[err.message] ?? 422).send({ error: err.message });
        }
        throw err;
      }
    },
  );

  // PATCH /api/admin/reservations/:id/status
  app.patch<{ Params: { id: string } }>('/reservations/:id/status', async (request, reply) => {
    const parsed = updateStatusBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      return reply.send(await updateReservationStatus(request.params.id, parsed.data.status));
    } catch (err) {
      if (err instanceof AdminReservationError) {
        return reply.status(STATUS_BY_ERROR[err.message] ?? 422).send({ error: err.message });
      }
      throw err;
    }
  });

  // PATCH /api/admin/reservations/:id  { vehicleId?, notes? }
  app.patch<{ Params: { id: string } }>('/reservations/:id', async (request, reply) => {
    const parsed = updateReservationBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      return reply.send(await updateReservation(request.params.id, parsed.data));
    } catch (err) {
      if (err instanceof AdminReservationError) {
        return reply.status(STATUS_BY_ERROR[err.message] ?? 422).send({ error: err.message });
      }
      throw err;
    }
  });
}
