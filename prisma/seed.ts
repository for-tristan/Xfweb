import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = 'x-foundry-salt';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

async function main() {
  // Create admin user
  const adminPassword = await hashPassword('admin123');
  await prisma.user.upsert({
    where: { email: 'admin@xfoundry.com' },
    update: {},
    create: {
      email: 'admin@xfoundry.com',
      name: 'Admin',
      password: adminPassword,
      role: 'admin',
    },
  });
  console.log('Admin user created/verified: admin@xfoundry.com');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
