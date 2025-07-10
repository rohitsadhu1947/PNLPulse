const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // Find users whose password is not hashed (does not start with $2b$10$)
  const users = await prisma.users.findMany({
    where: {
      NOT: {
        password: {
          startsWith: "$2b$10$"
        }
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      password: true
    }
  });

  if (users.length === 0) {
    console.log("All user passwords are already hashed.");
    return;
  }

  console.log(`Found ${users.length} users with plain text passwords:`);
  users.forEach(user => console.log(`- ${user.name} (${user.email})`));

  for (const user of users) {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    console.log(`✓ Updated password for: ${user.name} (${user.email})`);
  }

  console.log("\n✅ All plain text passwords have been hashed and updated.");
}

main()
  .catch(e => {
    console.error("Script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 