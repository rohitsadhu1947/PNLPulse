const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetPassword() {
  const email = 'test@example.com';
  const newHash = '$2b$10$dnBs7vIw9wt6SxtnQpr43u.3eepc.G/JKPaEqVca/fnT6.c0BwfAS'; // hash for 'test1234'
  try {
    const user = await prisma.users.update({
      where: { email },
      data: { password: newHash }
    });
    console.log(`Password for ${email} has been reset.`);
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword(); 