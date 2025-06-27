const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserRoles() {
  try {
    console.log('Checking and fixing user roles...');

    // Check if admin role exists
    let adminRole = await prisma.roles.findUnique({
      where: { name: 'admin' }
    });

    if (!adminRole) {
      console.log('Creating admin role...');
      adminRole = await prisma.roles.create({
        data: {
          name: 'admin',
          description: 'Administrator with full access',
          permissions: ['*']
        }
      });
      console.log('Admin role created with ID:', adminRole.id);
    } else {
      console.log('Admin role already exists with ID:', adminRole.id);
    }

    // Check if sales_manager role exists
    let salesManagerRole = await prisma.roles.findUnique({
      where: { name: 'sales_manager' }
    });

    if (!salesManagerRole) {
      console.log('Creating sales_manager role...');
      salesManagerRole = await prisma.roles.create({
        data: {
          name: 'sales_manager',
          description: 'Sales Manager with client management access',
          permissions: ['clients:read', 'clients:write', 'clients:delete']
        }
      });
      console.log('Sales Manager role created with ID:', salesManagerRole.id);
    } else {
      console.log('Sales Manager role already exists with ID:', salesManagerRole.id);
    }

    // Check if sales_rep role exists
    let salesRepRole = await prisma.roles.findUnique({
      where: { name: 'sales_rep' }
    });

    if (!salesRepRole) {
      console.log('Creating sales_rep role...');
      salesRepRole = await prisma.roles.create({
        data: {
          name: 'sales_rep',
          description: 'Sales Representative with client read/write access',
          permissions: ['clients:read', 'clients:write']
        }
      });
      console.log('Sales Rep role created with ID:', salesRepRole.id);
    } else {
      console.log('Sales Rep role already exists with ID:', salesRepRole.id);
    }

    // Get the first user (assuming it's the test user)
    const user = await prisma.users.findFirst();
    
    if (!user) {
      console.log('No users found in the database');
      return;
    }

    console.log('Found user:', user.email, 'with ID:', user.id);

    // Check if user has admin role
    const userAdminRole = await prisma.user_roles.findUnique({
      where: {
        user_id_role_id: {
          user_id: user.id,
          role_id: adminRole.id
        }
      }
    });

    if (!userAdminRole) {
      console.log('Assigning admin role to user...');
      await prisma.user_roles.create({
        data: {
          user_id: user.id,
          role_id: adminRole.id,
          assigned_by: user.id
        }
      });
      console.log('Admin role assigned successfully');
    } else {
      console.log('User already has admin role');
    }

    // List all roles
    const allRoles = await prisma.roles.findMany();
    console.log('\nAll roles in database:');
    allRoles.forEach(role => {
      console.log(`- ${role.name}: ${role.description}`);
    });

    // List user's roles
    const userRoles = await prisma.user_roles.findMany({
      where: { user_id: user.id },
      include: { roles: true }
    });

    console.log('\nUser roles:');
    userRoles.forEach(userRole => {
      console.log(`- ${userRole.roles.name}: ${userRole.roles.description}`);
    });

    console.log('\nUser roles fixed successfully!');
  } catch (error) {
    console.error('Error fixing user roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRoles(); 