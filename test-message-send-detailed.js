#!/usr/bin/env node

/**
 * Script untuk test message send dengan detail debugging
 */

const axios = require('axios');

async function testMessageSendDetailed() {
  console.log('📝 Testing Message Send with Detailed Debugging...\n');

  try {
    // Login first
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'wahyusafrizal174@gmail.com',
      password: 'WahyuJR17_'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    console.log(`   User: ${loginResponse.data.data.user.full_name}`);
    
    // Get devices
    console.log('\n📱 Getting devices...');
    const devicesResponse = await axios.get('http://localhost:3001/api/v1/devices', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Devices retrieved');
    console.log(`   Devices count: ${devicesResponse.data.data?.length || 0}`);
    
    if (devicesResponse.data.data && devicesResponse.data.data.length > 0) {
      const device = devicesResponse.data.data[0];
      console.log(`\n📱 Using device: ${device.name} (${device.phone_number})`);
      console.log(`   Status: ${device.status}`);
      console.log(`   ID: ${device.id}`);
      
      // Test message send
      console.log('\n📝 Testing message send...');
      try {
        const messageResponse = await axios.post('http://localhost:3001/api/v1/messages/send', {
          device_id: device.id,
          to_number: '6289699935552',
          content: 'Test message from detailed debugging',
          type: 'text'
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Message sent successfully!');
        console.log(`   Status: ${messageResponse.status}`);
        console.log(`   Response: ${JSON.stringify(messageResponse.data, null, 2)}`);
        
      } catch (error) {
        console.log('❌ Message send failed');
        console.log(`   Status: ${error.response?.status}`);
        console.log(`   Response: ${JSON.stringify(error.response?.data, null, 2)}`);
        
        // Additional debugging
        console.log('\n🔍 Additional Debugging:');
        console.log(`   Device ID used: ${device.id}`);
        console.log(`   Device status: ${device.status}`);
        console.log(`   Device phone: ${device.phone_number}`);
        console.log(`   To number: 6289699935552`);
        console.log(`   Message type: text`);
        
        // Check if it's a WhatsApp service issue
        if (error.response?.data?.error === 'Device is not connected') {
          console.log('\n💡 Possible Solutions:');
          console.log('1. Device might be connected in database but not in WhatsApp service');
          console.log('2. WhatsApp service might need to be restarted');
          console.log('3. Device connection might have expired');
          console.log('4. Try reconnecting the device');
        }
      }
      
    } else {
      console.log('\n❌ No devices found!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔍 Backend is not running. Please start it first.');
    }
  }
}

// Run the test
testMessageSendDetailed();
