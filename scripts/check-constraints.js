const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkConstraints() {
  try {
    console.log('Checking database constraints...');

    // Query to get constraint information
    const constraints = await prisma.$queryRaw`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = 'clients'::regclass
    `;

    console.log('Client table constraints:');
    constraints.forEach(constraint => {
      console.log(`- ${constraint.constraint_name}: ${constraint.constraint_definition}`);
    });

    // Try to get the actual check constraint values
    const checkConstraints = await prisma.$queryRaw`
      SELECT 
        conname,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'clients'::regclass 
      AND contype = 'c'
    `;

    console.log('\nCheck constraints:');
    checkConstraints.forEach(constraint => {
      console.log(`- ${constraint.conname}: ${constraint.definition}`);
    });

  } catch (error) {
    console.error('Error checking constraints:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConstraints(); 