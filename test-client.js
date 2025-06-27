const fetch = require('node-fetch');

async function testClientCreation() {
  try {
    console.log('Testing client creation...');
    
    const response = await fetch('http://localhost:3000/api/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Client',
        industry: 'Technology',
        website: 'https://example.com',
        company_size: '11-50',
        hq_location: 'San Francisco, CA'
      }),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testClientCreation(); 

async function testClientCreation() {
  try {
    console.log('Testing client creation...');
    
    const response = await fetch('http://localhost:3000/api/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Client',
        industry: 'Technology',
        website: 'https://example.com',
        company_size: '11-50',
        hq_location: 'San Francisco, CA'
      }),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testClientCreation(); 