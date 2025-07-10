const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const emailsToDelete = [
    "amit@ensuredit.com",
    "rohit@ensuredit.com"
  ];

  for (const email of emailsToDelete) {
    const user = await prisma.users.findUnique({ where: { email } });
    if (user) {
      await prisma.users.delete({ where: { email } });
      console.log(`Deleted user: ${email}`);
    } else {
      console.log(`User not found: ${email}`);
    }
  }

  console.log("\n✅ Specified users have been deleted (if they existed).");
}

main()
  .catch(e => {
    console.error("Script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 