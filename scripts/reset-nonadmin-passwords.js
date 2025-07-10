const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // Change this to your admin's email
  const adminEmail = "admin@example.com"; // Update this to your admin's email
  
  // Set the new password for all non-admin users
  const newPassword = "NewPassword123!"; // Update this to your desired password
  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  console.log("Starting password reset for non-admin users...");
  console.log(`Admin email: ${adminEmail}`);
  console.log(`New password for non-admin users: ${newPassword}`);

  try {
    // Find all users except the admin
    const users = await prisma.users.findMany({
      where: {
        email: { not: adminEmail }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (users.length === 0) {
      console.log("No non-admin users found.");
      return;
    }

    console.log(`Found ${users.length} non-admin users:`);
    users.forEach(user => console.log(`- ${user.name} (${user.email})`));

    // Update passwords for all non-admin users
    for (const user of users) {
      await prisma.users.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      console.log(`✓ Updated password for: ${user.name} (${user.email})`);
    }

    console.log("\n✅ All non-admin user passwords have been updated successfully!");
    console.log(`\nNew password for all non-admin users: ${newPassword}`);
    console.log("Please share this password with your users.");

  } catch (error) {
    console.error("Error updating passwords:", error);
  }
}

main()
  .catch(e => {
    console.error("Script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 