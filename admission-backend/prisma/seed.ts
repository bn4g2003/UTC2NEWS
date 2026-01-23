import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create default permissions
  console.log('Creating permissions...');
  const permissions = [
    // User Management (10 permissions)
    { name: 'users:create', description: 'Create new user accounts' },
    { name: 'users:read', description: 'View user information' },
    { name: 'users:update', description: 'Update user details' },
    { name: 'users:delete', description: 'Delete user accounts' },
    { name: 'users:update_status', description: 'Activate/deactivate users' },
    { name: 'users:update_password', description: 'Change user passwords' },
    { name: 'roles:create', description: 'Create new roles' },
    { name: 'roles:read', description: 'View roles' },
    { name: 'roles:assign', description: 'Assign roles to users' },
    { name: 'permissions:read', description: 'View permissions' },

    // Student Management (5 permissions)
    { name: 'students:create', description: 'Create student records' },
    { name: 'students:read', description: 'View student information' },
    { name: 'students:update', description: 'Update student details' },
    { name: 'students:delete', description: 'Delete student records' },
    { name: 'preferences:manage', description: 'Manage student major preferences' },

    // Program Management (12 permissions)
    { name: 'majors:create', description: 'Create new majors' },
    { name: 'majors:read', description: 'View major information' },
    { name: 'majors:update', description: 'Update major details' },
    { name: 'majors:delete', description: 'Delete majors' },
    { name: 'admission_sessions:create', description: 'Create admission sessions' },
    { name: 'admission_sessions:read', description: 'View admission sessions' },
    { name: 'admission_sessions:update', description: 'Update admission sessions' },
    { name: 'admission_sessions:delete', description: 'Delete admission sessions' },
    { name: 'quotas:create', description: 'Configure admission quotas' },
    { name: 'quotas:read', description: 'View quota information' },
    { name: 'quotas:update', description: 'Update quota configurations' },
    { name: 'quotas:delete', description: 'Delete quota configurations' },

    // Data Operations (4 permissions)
    { name: 'import:execute', description: 'Import student data from Excel' },
    { name: 'filter:execute', description: 'Run virtual filtering algorithm' },
    { name: 'results:read', description: 'View admission results' },
    { name: 'results:export', description: 'Export admission results' },

    // Communication (2 permissions)
    { name: 'emails:send', description: 'Send email notifications' },
    { name: 'emails:read', description: 'View email delivery status' },

    // Content Management (16 permissions)
    { name: 'posts:create', description: 'Create blog posts' },
    { name: 'posts:read', description: 'View posts' },
    { name: 'posts:update', description: 'Update posts' },
    { name: 'posts:delete', description: 'Delete posts' },
    { name: 'posts:publish', description: 'Publish posts' },
    { name: 'faqs:create', description: 'Create FAQ entries' },
    { name: 'faqs:read', description: 'View FAQs' },
    { name: 'faqs:update', description: 'Update FAQs' },
    { name: 'faqs:delete', description: 'Delete FAQs' },
    { name: 'categories:create', description: 'Create content categories' },
    { name: 'categories:read', description: 'View categories' },
    { name: 'categories:update', description: 'Update categories' },
    { name: 'categories:delete', description: 'Delete categories' },
    { name: 'media:upload', description: 'Upload media files' },
    { name: 'media:read', description: 'View media files' },
    { name: 'media:delete', description: 'Delete media files' },

    // System Configuration (2 permissions)
    { name: 'config:read', description: 'View system settings' },
    { name: 'config:update', description: 'Update system settings' },

    // RBAC Management (3 permissions)
    { name: 'roles:update', description: 'Update role details' },
    { name: 'roles:delete', description: 'Delete roles' },
    { name: 'permissions:assign', description: 'Assign permissions to roles' },
  ];

  const createdPermissions: Array<{ id: string; name: string }> = [];
  for (const permission of permissions) {
    const created = await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
    createdPermissions.push(created);
  }
  console.log(`Created ${createdPermissions.length} permissions`);

  // Create admin role with all permissions
  console.log('Creating admin role...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with full system access',
    },
  });

  // Assign all permissions to admin role
  console.log('Assigning permissions to admin role...');
  for (const permission of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log(`Assigned ${createdPermissions.length} permissions to admin role`);

  // Create initial admin user
  console.log('Creating admin user...');
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@admission.edu.vn',
      fullName: 'System Administrator',
      passwordHash: hashedPassword,
      isActive: true,
    },
  });
  console.log(`Created admin user: ${adminUser.username}`);

  // Assign admin role to admin user
  console.log('Assigning admin role to admin user...');
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });
  console.log('Admin role assigned to admin user');

  console.log('\n=== Database seeding completed successfully ===');
  console.log(`Admin username: admin`);
  console.log(`Admin password: ${adminPassword}`);
  console.log(`Admin email: ${adminUser.email}`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
