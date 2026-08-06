import { NextResponse } from 'next/server';
import { getSession } from '../../../../server/auth/session';
import { withErrorLogging } from '../../../../server/http';

/**
 * ¿Hay sesión activa? El panel ya no puede leer la cookie (es httpOnly), así
 * que pregunta aquí al montar para decidir entre panel y pantalla de login.
 */
export const GET = withErrorLogging(async () => {
  const session = await getSession();
  return NextResponse.json({ user: session });
});
