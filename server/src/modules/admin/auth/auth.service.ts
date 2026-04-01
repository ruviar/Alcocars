import bcrypt from 'bcrypt';
import { prisma } from '../../../db/prisma';

/**
 * Validates admin credentials.
 * Returns sanitized user data (no passwordHash) on success, null on failure.
 */
export async function authenticateAdmin(email: string, password: string) {
  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, email: user.email, name: user.name };
}
