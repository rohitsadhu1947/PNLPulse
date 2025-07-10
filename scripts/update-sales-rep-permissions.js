const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Updating sales_rep role permissions...");

  try {
    // Get the sales_rep role
    const salesRepRole = await prisma.roles.findUnique({
      where: { name: 'sales_rep' }
    });

    if (!salesRepRole) {
      console.log("sales_rep role not found");
      return;
    }

    console.log("Current sales_rep permissions:", salesRepRole.permissions);

    // Update to new permission format
    const newPermissions = [
      'clients:view',
      'clients:create', 
      'clients:edit',
      'products:view',
      'sales:view',
      'sales:create',
      'sales:edit',
      'dashboard:view',
      'sales_reps:view',  // Allow sales reps to view their own profile
      'reports:view'
    ];

    await prisma.roles.update({
      where: { id: salesRepRole.id },
      data: { permissions: newPermissions }
    });

    console.log("Updated sales_rep permissions to:", newPermissions);
    console.log("✅ Sales rep role permissions updated successfully!");

  } catch (error) {
    console.error("Error updating sales rep permissions:", error);
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