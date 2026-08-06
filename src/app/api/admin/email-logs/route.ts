import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../../server/db/prisma';
import { parseQuery, requireAdmin, withErrorLogging } from '../../../../server/http';

const listQuerySchema = z.object({
  status: z.enum(['SENT', 'FAILED', 'SKIPPED']).optional(),
  kind: z.enum(['BOOKING_ADMIN', 'BOOKING_CUSTOMER', 'CONTACT_ADMIN']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const GET = withErrorLogging(async (request) => {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  const parsed = parseQuery(request, listQuerySchema);
  if ('response' in parsed) return parsed.response;

  const { status, kind, page, pageSize } = parsed.data;
  const where = { ...(status ? { status } : {}), ...(kind ? { kind } : {}) };

  const [total, rows] = await prisma.$transaction([
    prisma.emailLog.count({ where }),
    prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { reservation: { select: { id: true, confirmationCode: true } } },
    }),
  ]);

  return NextResponse.json({ total, page, pageSize, rows });
});
