import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Verifying seeded data...\n');

  // Check permissions
  const permissionCount = await prisma.permission.count();
  console.log(`✓ Permissions: ${permissionCount} found`);

  // Check roles
  const roleCount = await prisma.role.count();
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' },
    include: { permissions: true },
  });
  console.log(`✓ Roles: ${roleCount} found`);
  console.log(`  - Admin role has ${adminRole?.permissions.length || 0} permissions`);

  // Check users
  const userCount = await prisma.user.count();
  const adminUser = await prisma.user.findUnique({
    where: { username: 'admin' },
    include: { roles: true },
  });
  console.log(`✓ Users: ${userCount} found`);
  console.log(`  - Admin user: ${adminUser?.username} (${adminUser?.email})`);
  console.log(`  - Admin has ${adminUser?.roles.length || 0} role(s) assigned`);

  // Check majors
  const majorCount = await prisma.major.count();
  const majors = await prisma.major.findMany({
    select: { code: true, name: true },
  });
  console.log(`✓ Majors: ${majorCount} found`);
  majors.forEach((major) => {
    console.log(`  - ${major.code}: ${major.name}`);
  });

  // Check admission sessions
  const sessionCount = await prisma.admissionSession.count();
  const sessions = await prisma.admissionSession.findMany({
    select: { name: true, year: true, status: true },
  });
  console.log(`✓ Admission Sessions: ${sessionCount} found`);
  sessions.forEach((session) => {
    console.log(`  - ${session.name} (${session.year}) - ${session.status}`);
  });

  // Check quotas
  const quotaCount = await prisma.sessionQuota.count();
  console.log(`✓ Session Quotas: ${quotaCount} found`);

  console.log('\n=== Verification completed successfully ===');
}

main()
  .catch((e) => {
    console.error('Error during verification:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
