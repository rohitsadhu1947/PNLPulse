const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAdminPermissions() {
  try {
    console.log('🔧 Fixing admin role permissions...\n');

    // All permissions that should be available
    const allPermissions = [
      // Client permissions
      'clients:view', 'clients:create', 'clients:edit', 'clients:delete',
      // Product permissions
      'products:view', 'products:create', 'products:edit', 'products:delete',
      // Sales permissions
      'sales:view', 'sales:create', 'sales:edit', 'sales:delete',
      // User management permissions
      'users:view', 'users:create', 'users:edit', 'users:delete',
      // Role management permissions
      'roles:view', 'roles:create', 'roles:edit', 'roles:delete', 'roles:assign',
      // Dashboard permissions
      'dashboard:view', 'dashboard:admin',
      // Reports permissions
      'reports:view', 'reports:create', 'reports:edit', 'reports:delete',
      // Sales Rep management permissions
      'sales_reps:view', 'sales_reps:create', 'sales_reps:edit', 'sales_reps:delete'
    ];

    // Update admin role with all permissions
    const updatedAdminRole = await prisma.roles.update({
      where: { name: 'admin' },
      data: {
        permissions: allPermissions
      }
    });

    console.log('✅ Admin role updated with all permissions');
    console.log('📋 Permissions count:', updatedAdminRole.permissions.length);
    console.log('🔍 Sample permissions:', updatedAdminRole.permissions.slice(0, 5));

    // Also update other roles to have appropriate permissions
    console.log('\n🔧 Updating other roles...');

    // Sales Manager role
    const salesManagerPermissions = [
      'clients:view', 'clients:create', 'clients:edit',
      'products:view',
      'sales:view', 'sales:create', 'sales:edit',
      'dashboard:view',
      'reports:view', 'reports:create',
      'sales_reps:view', 'sales_reps:create', 'sales_reps:edit', 'sales_reps:delete'
    ];

    await prisma.roles.updateMany({
      where: { name: 'sales_manager' },
      data: { permissions: salesManagerPermissions }
    });

    // Sales Rep role
    const salesRepPermissions = [
      'clients:view', 'clients:create',
      'products:view',
      'sales:view', 'sales:create',
      'dashboard:view',
      'sales_reps:view'
    ];

    await prisma.roles.updateMany({
      where: { name: 'sales_rep' },
      data: { permissions: salesRepPermissions }
    });

    // Viewer role
    const viewerPermissions = [
      'clients:view',
      'products:view',
      'sales:view',
      'dashboard:view',
      'reports:view'
    ];

    await prisma.roles.updateMany({
      where: { name: 'viewer' },
      data: { permissions: viewerPermissions }
    });

    console.log('✅ All roles updated with appropriate permissions');
    console.log('\n🎯 Admin user should now have access to sales reps');
    console.log('📧 Login with: admin@example.com / admin123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPermissions(); 

const prisma = new PrismaClient();

async function fixAdminPermissions() {
  try {
    console.log('🔧 Fixing admin role permissions...\n');

    // All permissions that should be available
    const allPermissions = [
      // Client permissions
      'clients:view', 'clients:create', 'clients:edit', 'clients:delete',
      // Product permissions
      'products:view', 'products:create', 'products:edit', 'products:delete',
      // Sales permissions
      'sales:view', 'sales:create', 'sales:edit', 'sales:delete',
      // User management permissions
      'users:view', 'users:create', 'users:edit', 'users:delete',
      // Role management permissions
      'roles:view', 'roles:create', 'roles:edit', 'roles:delete', 'roles:assign',
      // Dashboard permissions
      'dashboard:view', 'dashboard:admin',
      // Reports permissions
      'reports:view', 'reports:create', 'reports:edit', 'reports:delete',
      // Sales Rep management permissions
      'sales_reps:view', 'sales_reps:create', 'sales_reps:edit', 'sales_reps:delete'
    ];

    // Update admin role with all permissions
    const updatedAdminRole = await prisma.roles.update({
      where: { name: 'admin' },
      data: {
        permissions: allPermissions
      }
    });

    console.log('✅ Admin role updated with all permissions');
    console.log('📋 Permissions count:', updatedAdminRole.permissions.length);
    console.log('🔍 Sample permissions:', updatedAdminRole.permissions.slice(0, 5));

    // Also update other roles to have appropriate permissions
    console.log('\n🔧 Updating other roles...');

    // Sales Manager role
    const salesManagerPermissions = [
      'clients:view', 'clients:create', 'clients:edit',
      'products:view',
      'sales:view', 'sales:create', 'sales:edit',
      'dashboard:view',
      'reports:view', 'reports:create',
      'sales_reps:view', 'sales_reps:create', 'sales_reps:edit', 'sales_reps:delete'
    ];

    await prisma.roles.updateMany({
      where: { name: 'sales_manager' },
      data: { permissions: salesManagerPermissions }
    });

    // Sales Rep role
    const salesRepPermissions = [
      'clients:view', 'clients:create',
      'products:view',
      'sales:view', 'sales:create',
      'dashboard:view',
      'sales_reps:view'
    ];

    await prisma.roles.updateMany({
      where: { name: 'sales_rep' },
      data: { permissions: salesRepPermissions }
    });

    // Viewer role
    const viewerPermissions = [
      'clients:view',
      'products:view',
      'sales:view',
      'dashboard:view',
      'reports:view'
    ];

    await prisma.roles.updateMany({
      where: { name: 'viewer' },
      data: { permissions: viewerPermissions }
    });

    console.log('✅ All roles updated with appropriate permissions');
    console.log('\n🎯 Admin user should now have access to sales reps');
    console.log('📧 Login with: admin@example.com / admin123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPermissions(); 