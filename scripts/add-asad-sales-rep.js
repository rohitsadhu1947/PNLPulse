const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function addAsadSalesRep() {
  try {
    console.log('🔄 Adding Asad Akbar sales rep...\n');

    // Create user
    const hashedPassword = await bcrypt.hash('asad123', 10);
    const user = await prisma.users.create({
      data: {
        name: 'Asad Akbar',
        email: 'asad@ensuredit.com',
        password: hashedPassword,
      },
    });

    console.log('✅ Created user:', user.name, user.email);

    // Get sales rep role
    const salesRepRole = await prisma.roles.findUnique({
      where: { name: 'sales_rep' }
    });

    if (!salesRepRole) {
      throw new Error('Sales rep role not found');
    }

    // Assign sales rep role
    await prisma.user_roles.create({
      data: {
        user_id: user.id,
        role_id: salesRepRole.id,
      },
    });

    console.log('✅ Assigned sales rep role');

    // Create sales representative record
    const salesRep = await prisma.sales_representatives.create({
      data: {
        name: user.name,
        email: user.email,
        phone: '9667013780',
        hire_date: new Date('2022-01-01'),
        target_amount: 35000000,
      }
    });

    console.log('✅ Created sales representative record:', salesRep);
    console.log('\n🎯 Asad Akbar sales rep added successfully!');
    console.log('📧 Email: asad@ensuredit.com');
    console.log('🔑 Password: asad123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addAsadSalesRep(); 
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function addAsadSalesRep() {
  try {
    console.log('🔄 Adding Asad Akbar sales rep...\n');

    // Create user
    const hashedPassword = await bcrypt.hash('asad123', 10);
    const user = await prisma.users.create({
      data: {
        name: 'Asad Akbar',
        email: 'asad@ensuredit.com',
        password: hashedPassword,
      },
    });

    console.log('✅ Created user:', user.name, user.email);

    // Get sales rep role
    const salesRepRole = await prisma.roles.findUnique({
      where: { name: 'sales_rep' }
    });

    if (!salesRepRole) {
      throw new Error('Sales rep role not found');
    }

    // Assign sales rep role
    await prisma.user_roles.create({
      data: {
        user_id: user.id,
        role_id: salesRepRole.id,
      },
    });

    console.log('✅ Assigned sales rep role');

    // Create sales representative record
    const salesRep = await prisma.sales_representatives.create({
      data: {
        name: user.name,
        email: user.email,
        phone: '9667013780',
        hire_date: new Date('2022-01-01'),
        target_amount: 35000000,
      }
    });

    console.log('✅ Created sales representative record:', salesRep);
    console.log('\n🎯 Asad Akbar sales rep added successfully!');
    console.log('📧 Email: asad@ensuredit.com');
    console.log('🔑 Password: asad123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addAsadSalesRep(); 