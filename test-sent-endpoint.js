// Test the /messages/sent endpoint directly
const axios = require('axios');

async function testSentEndpoint() {
  try {
    console.log('Testing /api/v1/messages/sent endpoint...');
    
    // First, let's try to login to get a token
    const loginResponse = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'test@example.com',
      password: 'hashedpassword'
    });
    
    if (!loginResponse.data.success) {
      console.log('Login failed:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, token obtained');
    
    // Now test the sent messages endpoint
    const sentResponse = await axios.get('http://localhost:3001/api/v1/messages/sent', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        page: 1,
        limit: 20
      }
    });
    
    console.log('✅ Sent messages response:', {
      success: sentResponse.data.success,
      dataCount: sentResponse.data.data?.length || 0,
      pagination: sentResponse.data.pagination
    });
    
    if (sentResponse.data.data && sentResponse.data.data.length > 0) {
      console.log('Sample message:', {
        id: sentResponse.data.data[0].id,
        content: sentResponse.data.data[0].content,
        direction: sentResponse.data.data[0].direction,
        status: sentResponse.data.data[0].status
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 400) {
      console.log('This is a 400 Bad Request error - likely routing issue');
    }
  }
}

testSentEndpoint();
