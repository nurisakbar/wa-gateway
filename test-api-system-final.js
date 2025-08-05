const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';
let authToken = '';
let apiKey = '';

// Test user login (using existing user)
async function testAuth() {
  console.log('🔐 Testing Authentication...');
  
  try {
    // Login with existing user
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'apitest4@example.com',
      password: 'Password123'
    });
    
    authToken = loginResponse.data.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.message);
    return false;
  }
}

// Test API key creation
async function testApiKeyCreation() {
  console.log('\n🔑 Testing API Key Creation...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api-keys`, {
      name: 'Final Test API Key',
      permissions: {
        read: true,
        write: true,
        admin: false
      },
      rate_limit: 1000
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    apiKey = response.data.data.key;
    console.log('✅ API key created:', response.data.data.key_prefix + '...');
    console.log('📋 Full key (save this):', apiKey);
    return true;
  } catch (error) {
    console.log('❌ API key creation error:', error.response?.data?.message);
    return false;
  }
}

// Test API key authentication
async function testApiKeyAuth() {
  console.log('\n🔐 Testing API Key Authentication...');
  
  try {
    const response = await axios.get(`${BASE_URL}/whatsapp/balance`, {
      headers: {
        'X-API-Key': apiKey
      }
    });
    
    console.log('✅ API key authentication successful');
    console.log('📊 Balance data:', response.data.data);
    return true;
  } catch (error) {
    console.log('❌ API key authentication error:', error.response?.data?.message);
    return false;
  }
}

// Test WhatsApp API endpoints
async function testWhatsAppAPI() {
  console.log('\n📱 Testing WhatsApp API Endpoints...');
  
  const headers = {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json'
  };

  try {
    // Test get devices
    const devicesResponse = await axios.get(`${BASE_URL}/whatsapp/devices`, { headers });
    console.log('✅ Get devices:', devicesResponse.data.data.length, 'devices found');
    
    // Test get messages
    const messagesResponse = await axios.get(`${BASE_URL}/whatsapp/messages`, { headers });
    console.log('✅ Get messages:', messagesResponse.data.data.pagination.total, 'messages found');
    
    // Test get balance
    const balanceResponse = await axios.get(`${BASE_URL}/whatsapp/balance`, { headers });
    console.log('✅ Get balance:', balanceResponse.data.data);
    
    return true;
  } catch (error) {
    console.log('❌ WhatsApp API error:', error.response?.data?.message);
    return false;
  }
}

// Test API key management
async function testApiKeyManagement() {
  console.log('\n⚙️ Testing API Key Management...');
  
  try {
    // Get all API keys
    const keysResponse = await axios.get(`${BASE_URL}/api-keys`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Get API keys:', keysResponse.data.data.length, 'keys found');
    
    if (keysResponse.data.data.length > 0) {
      const keyId = keysResponse.data.data[0].id;
      
      // Test update API key
      const updateResponse = await axios.put(`${BASE_URL}/api-keys/${keyId}`, {
        rate_limit: 2000
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log('✅ Update API key:', updateResponse.data.message);
      
      // Test get API key stats
      const statsResponse = await axios.get(`${BASE_URL}/api-keys/${keyId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log('✅ Get API key stats:', statsResponse.data.data);
    }
    
    return true;
  } catch (error) {
    console.log('❌ API key management error:', error.response?.data?.message);
    return false;
  }
}

// Test rate limiting
async function testRateLimiting() {
  console.log('\n⏱️ Testing Rate Limiting...');
  
  const headers = {
    'X-API-Key': apiKey
  };
  
  let successCount = 0;
  let rateLimitHit = false;
  
  // Make multiple requests to test rate limiting
  for (let i = 0; i < 5; i++) {
    try {
      await axios.get(`${BASE_URL}/whatsapp/balance`, { headers });
      successCount++;
      console.log(`✅ Request ${i + 1} successful`);
    } catch (error) {
      if (error.response?.status === 429) {
        rateLimitHit = true;
        console.log(`⏱️ Rate limit hit on request ${i + 1}`);
        break;
      } else {
        console.log(`❌ Request ${i + 1} failed:`, error.response?.data?.message);
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`📊 Rate limiting test: ${successCount} successful requests`);
  if (rateLimitHit) {
    console.log('✅ Rate limiting is working');
  }
  
  return successCount > 0;
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Final API System Tests...\n');
  
  const results = {
    auth: await testAuth(),
    apiKeyCreation: await testApiKeyCreation(),
    apiKeyAuth: await testApiKeyAuth(),
    whatsappAPI: await testWhatsAppAPI(),
    apiKeyManagement: await testApiKeyManagement(),
    rateLimiting: await testRateLimiting()
  };
  
  console.log('\n📋 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! API system is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please check the implementation.');
  }
  
  if (apiKey) {
    console.log(`\n💡 Save this API key for future testing: ${apiKey}`);
  }
}

// Run tests
runTests().catch(console.error); 