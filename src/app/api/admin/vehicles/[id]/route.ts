import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../../../server/db/prisma';
import { jsonError, parseJsonBody, requireAdmin, withErrorLogging } from '../../../../../server/http';

const toggleBodySchema = z.object({ isActive: z.boolean() });

export const PATCH = withErrorLogging(
  async (request, { params }: { params: Promise<{ id: string }> }) => {
    const auth = await requireAdmin();
    if ('response' in auth) return auth.response;

    const parsed = await parseJsonBody(request, toggleBodySchema);
    if ('response' in parsed) return parsed.response;

    const { id } = await params;
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) return jsonError('VEHICLE_NOT_FOUND', 404);

    return NextResponse.json(
      await prisma.vehicle.update({
        where: { id },
        data: { isActive: parsed.data.isActive },
        select: { id: true, isActive: true },
      }),
    );
  },
);
