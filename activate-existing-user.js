const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function activateExistingUser() {
  try {
    // First, try to login with existing user
    console.log('🔐 Trying to login with existing user...');
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'apitest@example.com',
      password: 'Password123'
    });
    
    console.log('✅ Login successful!');
    console.log('Token:', loginResponse.data.data.token);
    return loginResponse.data.data.token;
    
  } catch (error) {
    if (error.response?.data?.message?.includes('not active')) {
      console.log('⚠️ User exists but not active. Trying to activate...');
      
      // Try to register again (should auto-activate in development)
      try {
        const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
          username: 'apitestuser2',
          email: 'apitest2@example.com',
          password: 'Password123',
          full_name: 'API Test User 2'
        });
        
        console.log('✅ New user registered and activated:', registerResponse.data.message);
        return registerResponse.data.data.token;
        
      } catch (regError) {
        console.log('❌ Registration failed:', regError.response?.data?.message);
        return null;
      }
    } else {
      console.log('❌ Login error:', error.response?.data?.message);
      return null;
    }
  }
}

// Test the function
activateExistingUser().then(token => {
  if (token) {
    console.log('\n🎉 Success! You can now use this token for API testing.');
    console.log('Token:', token);
  } else {
    console.log('\n❌ Failed to get valid token for testing.');
  }
}); 