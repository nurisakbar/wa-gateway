#!/usr/bin/env node

/**
 * Script untuk check status device dan memberikan solusi
 */

const axios = require('axios');

async function checkDeviceStatus() {
  console.log('📱 Checking Device Status...\n');

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
      devicesResponse.data.data.forEach((device, index) => {
        console.log(`\n📱 Device ${index + 1}:`);
        console.log(`   Name: ${device.name}`);
        console.log(`   Phone: ${device.phone_number}`);
        console.log(`   Status: ${device.status}`);
        console.log(`   Created: ${device.created_at}`);
        
        if (device.status === 'connected') {
          console.log('   ✅ Device is CONNECTED - Ready to send messages!');
        } else if (device.status === 'disconnected') {
          console.log('   ❌ Device is DISCONNECTED - Need to connect');
        } else if (device.status === 'connecting') {
          console.log('   🔄 Device is CONNECTING - Please wait...');
        } else if (device.status === 'error') {
          console.log('   ❌ Device has ERROR - Need to reconnect');
        } else {
          console.log(`   ❓ Device status: ${device.status} - Unknown status`);
        }
      });
      
      // Check if any device is connected
      const connectedDevices = devicesResponse.data.data.filter(d => d.status === 'connected');
      const disconnectedDevices = devicesResponse.data.data.filter(d => d.status !== 'connected');
      
      console.log('\n📊 Summary:');
      console.log(`   Connected devices: ${connectedDevices.length}`);
      console.log(`   Disconnected devices: ${disconnectedDevices.length}`);
      
      if (connectedDevices.length > 0) {
        console.log('\n✅ You can send messages!');
        console.log('   Use one of the connected devices to send messages.');
      } else {
        console.log('\n❌ No devices connected. You need to connect a device first.');
        console.log('\n🔧 How to connect a device:');
        console.log('1. Go to http://localhost:3000/devices');
        console.log('2. Click "Connect Device" or "Add Device"');
        console.log('3. Scan the QR code with your WhatsApp');
        console.log('4. Wait for the device to show "connected" status');
        console.log('5. Then you can send messages');
        
        if (disconnectedDevices.length > 0) {
          console.log('\n📱 Available devices to connect:');
          disconnectedDevices.forEach((device, index) => {
            console.log(`   ${index + 1}. ${device.name} (${device.phone_number}) - Status: ${device.status}`);
          });
        }
      }
      
    } else {
      console.log('\n❌ No devices found!');
      console.log('\n🔧 How to add a device:');
      console.log('1. Go to http://localhost:3000/devices');
      console.log('2. Click "Add Device" or "Connect Device"');
      console.log('3. Enter device name and phone number');
      console.log('4. Scan the QR code with your WhatsApp');
      console.log('5. Wait for connection');
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('• If device is connected: You can send messages');
    console.log('• If device is disconnected: Connect device first');
    console.log('• If no devices: Add a new device first');

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

// Run the check
checkDeviceStatus();
