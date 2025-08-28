const http = require('http');

const makeRequest = (options, data) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsedBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsedBody });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

const testAdminLogin = async () => {
  try {
    console.log('Testing admin login...');
    
    // Test admin login
    const loginOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/admin/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const loginResult = await makeRequest(loginOptions, {
      email: 'admin@ajimport.com',
      password: 'admin123'
    });
    
    if (loginResult.status === 200) {
      console.log('✅ Admin login successful');
      console.log('Token:', loginResult.data.token.substring(0, 50) + '...');
      
      // Test payment fetching with admin token
      console.log('\nTesting payment fetching...');
      const paymentsOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/payments',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginResult.data.token}`
        }
      };

      const paymentsResult = await makeRequest(paymentsOptions);
      
      if (paymentsResult.status === 200) {
        console.log('✅ Payment fetching successful');
        console.log('Number of payments:', paymentsResult.data.length);
      } else {
        console.log('❌ Payment fetching failed:', paymentsResult.data.message);
      }
      
    } else {
      console.log('❌ Admin login failed:', loginResult.data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testAdminLogin();
