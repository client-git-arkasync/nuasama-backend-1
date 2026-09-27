import prisma from './src/lib/prisma';

async function main() {
  const result = await prisma.users.updateMany({
    where: { email: 'admin.test.express@nuasama.id' },
    data: { role: 'admin' },
  });
  console.log('Updated:', result.count, 'user(s) to admin role');
  await prisma.$disconnect();
}

main().catch(console.error);
