import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcrypt';
import { prisma } from '../db/prisma';
import { authenticateAdmin } from '../modules/admin/auth/auth.service';

const mockAdminUser = {
  id: 'admin-cuid-1',
  email: 'admin@alocars.es',
  passwordHash: '$2b$10$hashedpassword',
  name: 'Administrador',
  createdAt: new Date(),
};

describe('authenticateAdmin', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('returns null when user does not exist', async () => {
    vi.spyOn(prisma.adminUser, 'findUnique').mockResolvedValue(null);

    const result = await authenticateAdmin('nobody@alocars.es', 'pass123');

    expect(result).toBeNull();
  });

  it('returns null when password is incorrect', async () => {
    vi.spyOn(prisma.adminUser, 'findUnique').mockResolvedValue(mockAdminUser);
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

    const result = await authenticateAdmin('admin@alocars.es', 'wrongpass');

    expect(result).toBeNull();
  });

  it('returns user data without passwordHash when credentials are valid', async () => {
    vi.spyOn(prisma.adminUser, 'findUnique').mockResolvedValue(mockAdminUser);
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

    const result = await authenticateAdmin('admin@alocars.es', 'admin123');

    expect(result).toEqual({
      id: mockAdminUser.id,
      email: mockAdminUser.email,
      name: mockAdminUser.name,
    });
    expect(result).not.toHaveProperty('passwordHash');
  });
});
