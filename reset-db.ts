import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetDb() {
  console.log('Clearing database...');
  
  // Disable foreign key checks for MySQL
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

  const tables = [
    'payment_verifications',
    'order_items',
    'orders',
    'cart_items',
    'menu_items',
    'dapurs',
    'users',
    'app_settings',
    'menus',
    'categories'
  ];

  for (const table of tables) {
    console.log(`Truncating ${table}...`);
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\`;`);
    } catch (e) {
      console.log(`Warning: Failed to truncate ${table}`, e);
    }
  }

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
  
  console.log('Database cleared.');

  console.log('Seeding admin account...');
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.users.create({
    data: {
      name: 'Administrator',
      email: 'admin@nuasama.com',
      password_hash: passwordHash,
      role: 'admin',
    }
  });

  console.log(`Admin created successfully!`);
  console.log(`Email: ${admin.email}`);
  console.log(`Password: admin123`);
}

resetDb()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
