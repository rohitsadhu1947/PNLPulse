const fetch = require('node-fetch');

async function testLoginAndSalesReps() {
  try {
    console.log('🧪 Testing login and sales reps access...\n');

    // Step 1: Get CSRF token
    console.log('1️⃣ Getting CSRF token...');
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfResponse.json();
    console.log('CSRF token:', csrfData.csrfToken);

    // Step 2: Login
    console.log('\n2️⃣ Logging in...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `email=admin@example.com&password=admin123&callbackUrl=http%3A%2F%2Flocalhost%3A3000%2F&csrfToken=${csrfData.csrfToken}`,
      credentials: 'include'
    });

    console.log('Login status:', loginResponse.status);

    if (loginResponse.ok) {
      // Step 3: Get session
      console.log('\n3️⃣ Getting session...');
      const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
        credentials: 'include'
      });
      
      if (sessionResponse.ok) {
        const session = await sessionResponse.json();
        console.log('Session user:', session.user?.email);
        console.log('Session roles:', session.user?.roles);
        console.log('Session permissions:', session.user?.permissions);
        
        // Step 4: Test sales reps API
        console.log('\n4️⃣ Testing sales reps API...');
        const salesRepsResponse = await fetch('http://localhost:3000/api/sales-reps', {
          credentials: 'include'
        });
        
        console.log('Sales Reps API status:', salesRepsResponse.status);
        const salesRepsData = await salesRepsResponse.json();
        
        if (salesRepsResponse.ok) {
          console.log('\n✅ SUCCESS! Sales reps API is working correctly');
          console.log(`📊 Found ${salesRepsData.salesReps?.length || 0} sales reps`);
          if (salesRepsData.salesReps?.length > 0) {
            console.log('Sales reps:', salesRepsData.salesReps.map(sr => sr.name));
          }
        } else {
          console.log('\n❌ FAILED! Sales reps API returned error');
          console.log('Error:', salesRepsData);
        }
      } else {
        console.log('\n❌ Failed to get session');
      }
    } else {
      console.log('\n❌ Login failed');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testLoginAndSalesReps(); 

async function testLoginAndSalesReps() {
  try {
    console.log('🧪 Testing login and sales reps access...\n');

    // Step 1: Get CSRF token
    console.log('1️⃣ Getting CSRF token...');
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfResponse.json();
    console.log('CSRF token:', csrfData.csrfToken);

    // Step 2: Login
    console.log('\n2️⃣ Logging in...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `email=admin@example.com&password=admin123&callbackUrl=http%3A%2F%2Flocalhost%3A3000%2F&csrfToken=${csrfData.csrfToken}`,
      credentials: 'include'
    });

    console.log('Login status:', loginResponse.status);

    if (loginResponse.ok) {
      // Step 3: Get session
      console.log('\n3️⃣ Getting session...');
      const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
        credentials: 'include'
      });
      
      if (sessionResponse.ok) {
        const session = await sessionResponse.json();
        console.log('Session user:', session.user?.email);
        console.log('Session roles:', session.user?.roles);
        console.log('Session permissions:', session.user?.permissions);
        
        // Step 4: Test sales reps API
        console.log('\n4️⃣ Testing sales reps API...');
        const salesRepsResponse = await fetch('http://localhost:3000/api/sales-reps', {
          credentials: 'include'
        });
        
        console.log('Sales Reps API status:', salesRepsResponse.status);
        const salesRepsData = await salesRepsResponse.json();
        
        if (salesRepsResponse.ok) {
          console.log('\n✅ SUCCESS! Sales reps API is working correctly');
          console.log(`📊 Found ${salesRepsData.salesReps?.length || 0} sales reps`);
          if (salesRepsData.salesReps?.length > 0) {
            console.log('Sales reps:', salesRepsData.salesReps.map(sr => sr.name));
          }
        } else {
          console.log('\n❌ FAILED! Sales reps API returned error');
          console.log('Error:', salesRepsData);
        }
      } else {
        console.log('\n❌ Failed to get session');
      }
    } else {
      console.log('\n❌ Login failed');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testLoginAndSalesReps(); 