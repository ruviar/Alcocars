import { NextResponse } from 'next/server';
import { loginBodySchema } from '../../../../server/modules/admin/auth/auth.schema';
import { authenticateAdmin } from '../../../../server/modules/admin/auth/auth.service';
import { startSession } from '../../../../server/auth/session';
import { jsonError, parseJsonBody, withErrorLogging } from '../../../../server/http';

// POST /api/admin/login → cookie httpOnly de sesión (el token ya no viaja al JS)
export const POST = withErrorLogging(async (request) => {
  const parsed = await parseJsonBody(request, loginBodySchema);
  if ('response' in parsed) return parsed.response;

  const user = await authenticateAdmin(parsed.data.email, parsed.data.password);
  if (!user) return jsonError('INVALID_CREDENTIALS', 401);

  await startSession(user);
  return NextResponse.json({ user });
});
