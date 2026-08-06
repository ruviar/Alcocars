/**
 * Cambia la contraseña de un usuario del panel de administración.
 *
 * Uso (desde server/):
 *   npm run admin:password -- 'NuevaContraseñaSegura'
 *   npm run admin:password -- 'NuevaContraseñaSegura' otro-admin@alcocars.es
 *
 * Necesita server/.env con DATABASE_URL apuntando a la base de datos real.
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const MIN_LENGTH = 10;

async function main(): Promise<void> {
  const [password, email = 'admin@alcocars.es'] = process.argv.slice(2);

  if (!password) {
    console.error('Uso: npm run admin:password -- <nueva-contraseña> [email]');
    process.exit(1);
  }

  if (password.length < MIN_LENGTH) {
    console.error(`❌ La contraseña debe tener al menos ${MIN_LENGTH} caracteres.`);
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.adminUser.update({
      where: { email },
      data: { passwordHash },
      select: { email: true, name: true },
    });
    console.log(`✅ Contraseña actualizada para ${user.name} <${user.email}>.`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('No record was found')) {
      console.error(`❌ No existe ningún administrador con el email ${email}.`);
    } else {
      console.error('❌ No se pudo actualizar la contraseña:', error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
