import { NextResponse } from 'next/server';
import { endSession } from '../../../../server/auth/session';
import { withErrorLogging } from '../../../../server/http';

export const POST = withErrorLogging(async () => {
  await endSession();
  return NextResponse.json({ ok: true });
});
