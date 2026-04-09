import type { FastifyInstance } from 'fastify';
import { vehicleQuerySchema } from './vehicles.schema';
import { getAvailableVehicles, getVehicleById } from './vehicles.service';

export async function vehiclesRouter(app: FastifyInstance) {
  // GET /api/vehicles?officeSlug=zaragoza&startDate=2026-04-01&endDate=2026-04-05
  app.get('/vehicles', async (request, reply) => {
    const parsed = vehicleQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(422).send({
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { officeSlug, startDate, endDate } = parsed.data;
    const vehicles = await getAvailableVehicles({
      officeSlug,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    return reply.send(vehicles);
  });

  // GET /api/vehicles/:id
  app.get<{ Params: { id: string } }>('/vehicles/:id', async (request, reply) => {
    const vehicle = await getVehicleById(request.params.id);
    if (!vehicle) {
      return reply.status(404).send({ error: 'VEHICLE_NOT_FOUND' });
    }
    return reply.send(vehicle);
  });
}
