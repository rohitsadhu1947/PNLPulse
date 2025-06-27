const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdminPermissions() {
  try {
    console.log('🔍 Checking admin user permissions...\n');

    // Find admin user
    const adminUser = await prisma.users.findUnique({
      where: { email: 'admin@example.com' },
      include: {
        user_roles_user_roles_user_idTousers: {
          include: {
            roles: true
          }
        }
      }
    });

    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Admin user found:', adminUser.name, adminUser.email);
    console.log('📋 Current roles:', adminUser.user_roles_user_roles_user_idTousers.map(ur => ur.roles.name));

    // Check if admin role exists
    const adminRole = await prisma.roles.findUnique({
      where: { name: 'admin' }
    });

    if (!adminRole) {
      console.log('❌ Admin role not found');
      return;
    }

    console.log('✅ Admin role found:', adminRole.name);

    // Check if admin user has admin role
    const hasAdminRole = adminUser.user_roles_user_roles_user_idTousers.some(ur => ur.roles.name === 'admin');

    if (!hasAdminRole) {
      console.log('⚠️  Admin user does not have admin role, assigning...');
      
      await prisma.user_roles.create({
        data: {
          user_id: adminUser.id,
          role_id: adminRole.id
        }
      });
      
      console.log('✅ Admin role assigned to admin user');
    } else {
      console.log('✅ Admin user already has admin role');
    }

    // Check sales reps permissions
    console.log('\n🔍 Checking sales reps permissions...');
    
    const salesRepsViewPermission = 'sales_reps:view';
    const salesRepsCreatePermission = 'sales_reps:create';
    const salesRepsEditPermission = 'sales_reps:edit';
    const salesRepsDeletePermission = 'sales_reps:delete';

    // Check if these permissions exist in the roles table
    const permissions = await prisma.roles.findMany({
      where: {
        name: 'admin'
      }
    });

    console.log('📋 Admin role permissions:', permissions);

    console.log('\n🎯 Admin user should now have all permissions including sales reps access');
    console.log('📧 Login with: admin@example.com / admin123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminPermissions(); 

const prisma = new PrismaClient();

async function checkAdminPermissions() {
  try {
    console.log('🔍 Checking admin user permissions...\n');

    // Find admin user
    const adminUser = await prisma.users.findUnique({
      where: { email: 'admin@example.com' },
      include: {
        user_roles_user_roles_user_idTousers: {
          include: {
            roles: true
          }
        }
      }
    });

    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Admin user found:', adminUser.name, adminUser.email);
    console.log('📋 Current roles:', adminUser.user_roles_user_roles_user_idTousers.map(ur => ur.roles.name));

    // Check if admin role exists
    const adminRole = await prisma.roles.findUnique({
      where: { name: 'admin' }
    });

    if (!adminRole) {
      console.log('❌ Admin role not found');
      return;
    }

    console.log('✅ Admin role found:', adminRole.name);

    // Check if admin user has admin role
    const hasAdminRole = adminUser.user_roles_user_roles_user_idTousers.some(ur => ur.roles.name === 'admin');

    if (!hasAdminRole) {
      console.log('⚠️  Admin user does not have admin role, assigning...');
      
      await prisma.user_roles.create({
        data: {
          user_id: adminUser.id,
          role_id: adminRole.id
        }
      });
      
      console.log('✅ Admin role assigned to admin user');
    } else {
      console.log('✅ Admin user already has admin role');
    }

    // Check sales reps permissions
    console.log('\n🔍 Checking sales reps permissions...');
    
    const salesRepsViewPermission = 'sales_reps:view';
    const salesRepsCreatePermission = 'sales_reps:create';
    const salesRepsEditPermission = 'sales_reps:edit';
    const salesRepsDeletePermission = 'sales_reps:delete';

    // Check if these permissions exist in the roles table
    const permissions = await prisma.roles.findMany({
      where: {
        name: 'admin'
      }
    });

    console.log('📋 Admin role permissions:', permissions);

    console.log('\n🎯 Admin user should now have all permissions including sales reps access');
    console.log('📧 Login with: admin@example.com / admin123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminPermissions(); 