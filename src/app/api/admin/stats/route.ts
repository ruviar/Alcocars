import { NextResponse } from 'next/server';
import { getAdminStats } from '../../../../server/modules/admin/stats/admin-stats.service';
import { requireAdmin, withErrorLogging } from '../../../../server/http';

export const GET = withErrorLogging(async () => {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  return NextResponse.json(await getAdminStats());
});
