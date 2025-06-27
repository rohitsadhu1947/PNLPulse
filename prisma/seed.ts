import { prisma } from '@/lib/db'
const bcrypt = require('bcryptjs')

async function main() {
  // Create roles
  const adminRole = await prisma.roles.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator',
      permissions: [],
    },
  })
  const salesRepRole = await prisma.roles.upsert({
    where: { name: 'sales_rep' },
    update: {},
    create: {
      name: 'sales_rep',
      description: 'Sales Representative',
      permissions: [],
    },
  })

  // Create admin user
  const adminEmail = 'admin@example.com'
  const adminPassword = 'admin123' // Change after first login!
  const hashedPassword = await bcrypt.hash(adminPassword, 10)
  const adminUser = await prisma.users.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Admin User',
      email: adminEmail,
      password: hashedPassword,
    },
  })

  // Assign admin role
  await prisma.user_roles.upsert({
    where: {
      user_id_role_id: {
        user_id: adminUser.id,
        role_id: adminRole.id,
      },
    },
    update: {},
    create: {
      user_id: adminUser.id,
      role_id: adminRole.id,
    },
  })

  // Create sample sales representatives (users and sales_representatives)
  const salesReps = [
    {
      name: 'John Smith',
      email: 'john.smith@company.com',
      password: 'password123',
      phone: '+1-555-0101',
      hire_date: new Date('2023-01-15'),
      target_amount: 50000
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      password: 'password123',
      phone: '+1-555-0102',
      hire_date: new Date('2023-03-20'),
      target_amount: 60000
    },
    {
      name: 'Mike Davis',
      email: 'mike.davis@company.com',
      password: 'password123',
      phone: '+1-555-0103',
      hire_date: new Date('2023-06-10'),
      target_amount: 45000
    }
  ]

  for (const rep of salesReps) {
    const hashedRepPassword = await bcrypt.hash(rep.password, 10)
    // Create user
    const user = await prisma.users.upsert({
      where: { email: rep.email },
      update: {},
      create: {
        name: rep.name,
        email: rep.email,
        password: hashedRepPassword,
      },
    })
    // Assign sales rep role
    await prisma.user_roles.upsert({
      where: {
        user_id_role_id: {
          user_id: user.id,
          role_id: salesRepRole.id,
        },
      },
      update: {},
      create: {
        user_id: user.id,
        role_id: salesRepRole.id,
      },
    })
    // Create sales_representatives record
    await prisma.sales_representatives.upsert({
      where: { email: rep.email },
      update: {},
      create: {
        name: rep.name,
        email: rep.email,
        phone: rep.phone,
        hire_date: rep.hire_date,
        target_amount: rep.target_amount,
      },
    })
  }

  // Create sample weekly reports
  const salesRep1 = await prisma.sales_representatives.findUnique({
    where: { email: 'john.smith@company.com' }
  });
  const salesRep2 = await prisma.sales_representatives.findUnique({
    where: { email: 'sarah.johnson@company.com' }
  });
  const salesRep3 = await prisma.sales_representatives.findUnique({
    where: { email: 'mike.davis@company.com' }
  });

  if (salesRep1) {
    await prisma.weekly_sales_reports.upsert({
      where: { id: 1 },
      update: {},
      create: {
        sales_rep_id: salesRep1.id,
        week_starting: new Date('2024-06-17'),
        new_clients_targeted: 5,
        new_clients_added: 3,
        value_of_new_clients: 150000,
        invoices_raised: 120000,
        cash_collected: 80000,
        key_wins: 'Closed major deal with TechCorp. Successfully onboarded 2 new clients.',
        blockers: 'Delayed payment from one client due to internal approval process.',
        action_items: 'Follow up with pending payments. Schedule demos with 3 new prospects.',
      },
    });
  }

  if (salesRep2) {
    await prisma.weekly_sales_reports.upsert({
      where: { id: 2 },
      update: {},
      create: {
        sales_rep_id: salesRep2.id,
        week_starting: new Date('2024-06-17'),
        new_clients_targeted: 4,
        new_clients_added: 2,
        value_of_new_clients: 80000,
        invoices_raised: 60000,
        cash_collected: 45000,
        key_wins: 'Successfully converted 2 leads from marketing campaign.',
        blockers: 'One prospect postponed decision due to budget constraints.',
        action_items: 'Re-engage postponed prospect with new pricing options.',
      },
    });
  }

  if (salesRep3) {
    await prisma.weekly_sales_reports.upsert({
      where: { id: 3 },
      update: {},
      create: {
        sales_rep_id: salesRep3.id,
        week_starting: new Date('2024-06-17'),
        new_clients_targeted: 6,
        new_clients_added: 4,
        value_of_new_clients: 200000,
        invoices_raised: 180000,
        cash_collected: 120000,
        key_wins: 'Exceeded weekly target by 33%. Closed enterprise deal.',
        blockers: 'None this week.',
        action_items: 'Focus on expanding existing client relationships.',
      },
    });
  }

  console.log('Seed complete!')
  console.log('Admin credentials:')
  console.log(`  Email:    ${adminEmail}`)
  console.log(`  Password: ${adminPassword}`)
  console.log('Sales Rep credentials:')
  salesReps.forEach(rep => {
    console.log(`  ${rep.name}: ${rep.email} / ${rep.password}`)
  })
  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 