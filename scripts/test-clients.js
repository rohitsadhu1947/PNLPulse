const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testClients() {
  try {
    console.log('Testing clients functionality...');

    // Create a test client with correct constraint values
    const testClient = await prisma.clients.create({
      data: {
        name: 'Test Company Inc.',
        client_type: 'Strategic', // Must be one of: Strategic, Growth, Volume, Partner, Other
        industry: 'Technology',
        website: 'https://testcompany.com',
        company_size: '1000+', // Must be one of: 1-10, 11-50, 51-200, 201-1000, 1000+
        hq_location: 'San Francisco, CA',
        sales_stage: 'Lead', // Must be one of: Lead, Qualified, Demo, Proposal Sent, Negotiation, Closed
        deal_value: 50000.00,
        probability_to_close: 75 // Must be between 0-100
      }
    });

    console.log('Test client created:', testClient);

    // Fetch all clients
    const allClients = await prisma.clients.findMany({
      include: {
        sales_representatives: {
          select: {
            name: true
          }
        }
      }
    });

    console.log('\nAll clients in database:');
    allClients.forEach(client => {
      console.log(`- ${client.name} (${client.industry}) - Stage: ${client.sales_stage}`);
    });

    // Clean up - delete the test client
    await prisma.clients.delete({
      where: { id: testClient.id }
    });

    console.log('\nTest client cleaned up successfully!');
  } catch (error) {
    console.error('Error testing clients:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testClients(); 