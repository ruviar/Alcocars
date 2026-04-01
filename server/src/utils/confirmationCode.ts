import { randomBytes } from 'crypto';

// Unambiguous alphanumeric chars — no I, O, 0, 1
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateConfirmationCode(): string {
  const bytes = randomBytes(8);
  const suffix = Array.from(bytes)
    .map((b) => CHARS[b % CHARS.length])
    .join('');
  return `ALC-${suffix}`;
}
