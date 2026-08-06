import { NextResponse } from 'next/server';
import { contactBodySchema } from '../../../server/modules/contact/contact.schema';
import { processContactForm } from '../../../server/modules/contact/contact.service';
import { jsonError, parseJsonBody, withErrorLogging } from '../../../server/http';

export const POST = withErrorLogging(async (request) => {
  const parsed = await parseJsonBody(request, contactBodySchema);
  if ('response' in parsed) return parsed.response;

  const result = await processContactForm(parsed.data);

  if (result.status === 'FAILED') {
    console.error('[API] no se pudo enviar el aviso de contacto:', result.error);
    return jsonError('EMAIL_DELIVERY_FAILED', 502);
  }

  return NextResponse.json({ ok: true, delivered: result.status === 'SENT' });
});
