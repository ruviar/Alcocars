import { NextResponse } from 'next/server';
import { getVehicleById } from '../../../../server/modules/vehicles/vehicles.service';
import { jsonError, withErrorLogging } from '../../../../server/http';

export const GET = withErrorLogging(
  async (_request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const vehicle = await getVehicleById(id);
    if (!vehicle) return jsonError('VEHICLE_NOT_FOUND', 404);
    return NextResponse.json(vehicle);
  },
);
