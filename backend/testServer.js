const http = require('http');

// Test if the server is running
const testServer = () => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/categories',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Server response status: ${res.statusCode}`);
    console.log(`Server is running and accessible`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const categories = JSON.parse(data);
        console.log(`Found ${categories.length} categories`);
      } catch (error) {
        console.log('Response data:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Server connection error:', error.message);
    console.log('Make sure the backend server is running on port 5000');
  });

  req.end();
};

testServer();
