const fetch = require('node-fetch');

async function testSalesRepsAPI() {
  try {
    console.log('🧪 Testing Sales Reps API...\n');

    // First, let's test without authentication
    console.log('1️⃣ Testing without authentication...');
    const unauthenticatedResponse = await fetch('http://localhost:3000/api/sales-reps');
    console.log('Status:', unauthenticatedResponse.status);
    const unauthenticatedData = await unauthenticatedResponse.json();
    console.log('Response:', unauthenticatedData);
    console.log('');

    // Now let's test with authentication by logging in first
    console.log('2️⃣ Testing with authentication...');
    
    // Login to get session
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'email=admin@example.com&password=admin123&callbackUrl=http%3A%2F%2Flocalhost%3A3000%2F&csrfToken=test',
      credentials: 'include'
    });

    console.log('Login status:', loginResponse.status);
    
    if (loginResponse.ok) {
      // Get session
      const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
        credentials: 'include'
      });
      
      if (sessionResponse.ok) {
        const session = await sessionResponse.json();
        console.log('Session:', session);
        
        // Now test sales reps API with session
        const salesRepsResponse = await fetch('http://localhost:3000/api/sales-reps', {
          credentials: 'include'
        });
        
        console.log('Sales Reps API status:', salesRepsResponse.status);
        const salesRepsData = await salesRepsResponse.json();
        console.log('Sales Reps API response:', salesRepsData);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSalesRepsAPI(); 

async function testSalesRepsAPI() {
  try {
    console.log('🧪 Testing Sales Reps API...\n');

    // First, let's test without authentication
    console.log('1️⃣ Testing without authentication...');
    const unauthenticatedResponse = await fetch('http://localhost:3000/api/sales-reps');
    console.log('Status:', unauthenticatedResponse.status);
    const unauthenticatedData = await unauthenticatedResponse.json();
    console.log('Response:', unauthenticatedData);
    console.log('');

    // Now let's test with authentication by logging in first
    console.log('2️⃣ Testing with authentication...');
    
    // Login to get session
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'email=admin@example.com&password=admin123&callbackUrl=http%3A%2F%2Flocalhost%3A3000%2F&csrfToken=test',
      credentials: 'include'
    });

    console.log('Login status:', loginResponse.status);
    
    if (loginResponse.ok) {
      // Get session
      const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
        credentials: 'include'
      });
      
      if (sessionResponse.ok) {
        const session = await sessionResponse.json();
        console.log('Session:', session);
        
        // Now test sales reps API with session
        const salesRepsResponse = await fetch('http://localhost:3000/api/sales-reps', {
          credentials: 'include'
        });
        
        console.log('Sales Reps API status:', salesRepsResponse.status);
        const salesRepsData = await salesRepsResponse.json();
        console.log('Sales Reps API response:', salesRepsData);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSalesRepsAPI(); 