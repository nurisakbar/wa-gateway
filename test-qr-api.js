#!/usr/bin/env node

const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:3001/api/v1';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';
const TEST_USERNAME = 'testuser';
const TEST_FULL_NAME = 'Test User';
const TEST_PHONE = '081234567890';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bright}${colors.blue}=== STEP ${step}: ${message} ===${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testQRCodeAPI() {
  let authToken = null;
  let deviceId = null;

  try {
    logStep(1, 'Testing Backend Connection');
    
    // Test backend connection
    try {
      const response = await axios.get(`${API_BASE}/devices`);
      logError('Backend should require authentication');
      return;
    } catch (error) {
      if (error.response?.status === 401) {
        logSuccess('Backend is running and requires authentication');
      } else {
        logError(`Backend connection failed: ${error.message}`);
        return;
      }
    }

    logStep(2, 'User Registration (if needed)');
    
    // Try to register user first
    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        full_name: TEST_FULL_NAME,
        phone: TEST_PHONE
      });

      if (registerResponse.data.success) {
        logSuccess('User registered successfully');
      } else {
        logWarning(`Registration failed: ${registerResponse.data.message}`);
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
        logInfo('User already exists, proceeding to login');
      } else {
        logWarning(`Registration error: ${error.response?.data?.message || error.message}`);
      }
    }

    logStep(3, 'User Authentication');
    
    // Login to get token
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });

      if (loginResponse.data.success) {
        authToken = loginResponse.data.data.token;
        logSuccess(`Login successful. Token: ${authToken.substring(0, 20)}...`);
      } else {
        logError(`Login failed: ${loginResponse.data.message}`);
        return;
      }
    } catch (error) {
      logError(`Login error: ${error.response?.data?.message || error.message}`);
      return;
    }

    logStep(4, 'Get User Devices');
    
    // Get user devices
    try {
      const devicesResponse = await axios.get(`${API_BASE}/devices`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (devicesResponse.data.success) {
        const devices = devicesResponse.data.data;
        logSuccess(`Found ${devices.length} devices`);
        
        if (devices.length === 0) {
          logWarning('No devices found. Creating a test device...');
          
          // Create a test device
          const createDeviceResponse = await axios.post(`${API_BASE}/devices`, {
            name: 'Test Device',
            description: 'Test device for QR code testing',
            phone_number: TEST_PHONE
          }, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });

          if (createDeviceResponse.data.success) {
            deviceId = createDeviceResponse.data.data.id;
            logSuccess(`Test device created: ${deviceId}`);
          } else {
            logError(`Failed to create test device: ${createDeviceResponse.data.message}`);
            return;
          }
        } else {
          // Use the first device for testing
          deviceId = devices[0].id;
          logInfo(`Using existing device: ${deviceId}`);
          logInfo(`Device name: ${devices[0].name}`);
          logInfo(`Device status: ${devices[0].status}`);
        }
      } else {
        logError(`Failed to get devices: ${devicesResponse.data.message}`);
        return;
      }
    } catch (error) {
      logError(`Get devices error: ${error.response?.data?.message || error.message}`);
      return;
    }

    logStep(5, 'Check Device Status Before Connect');
    
    // Check device status before connecting
    try {
      const statusResponse = await axios.get(`${API_BASE}/devices/${deviceId}/status`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (statusResponse.data.success) {
        const status = statusResponse.data.data;
        logInfo(`Device status: ${status.device.status}`);
        logInfo(`Connection status: ${status.connection_status.status}`);
      } else {
        logWarning(`Failed to get device status: ${statusResponse.data.message}`);
      }
    } catch (error) {
      logWarning(`Get device status error: ${error.response?.data?.message || error.message}`);
    }

    logStep(6, 'Test QR Code Before Connect (Should Fail)');
    
    // Try to get QR code before connecting (should fail)
    try {
      const qrResponse = await axios.get(`${API_BASE}/devices/${deviceId}/qr`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      logError('QR code should not be available before connecting');
      logInfo(`Response: ${JSON.stringify(qrResponse.data, null, 2)}`);
    } catch (error) {
      if (error.response?.status === 400) {
        logSuccess('QR code correctly not available before connecting');
        logInfo(`Error message: ${error.response.data.message}`);
        logInfo(`Error data: ${JSON.stringify(error.response.data.data, null, 2)}`);
      } else {
        logError(`Unexpected error: ${error.response?.data?.message || error.message}`);
      }
    }

    logStep(7, 'Connect Device');
    
    // Connect the device
    try {
      logInfo('Initiating device connection...');
      const connectResponse = await axios.post(`${API_BASE}/devices/${deviceId}/connect`, {}, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (connectResponse.data.success) {
        logSuccess('Device connection initiated successfully');
        logInfo(`Session ID: ${connectResponse.data.data.session_id}`);
        logInfo(`Status: ${connectResponse.data.data.status}`);
      } else {
        logError(`Connect failed: ${connectResponse.data.message}`);
        return;
      }
    } catch (error) {
      logError(`Connect error: ${error.response?.data?.message || error.message}`);
      return;
    }

    logStep(8, 'Wait for QR Code Generation');
    
    // Wait a bit for QR code generation
    logInfo('Waiting 5 seconds for QR code generation...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    logStep(9, 'Check Device Status After Connect');
    
    // Check device status after connecting
    try {
      const statusResponse = await axios.get(`${API_BASE}/devices/${deviceId}/status`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (statusResponse.data.success) {
        const status = statusResponse.data.data;
        logInfo(`Device status: ${status.device.status}`);
        logInfo(`Connection status: ${status.connection_status.status}`);
      } else {
        logWarning(`Failed to get device status: ${statusResponse.data.message}`);
      }
    } catch (error) {
      logWarning(`Get device status error: ${error.response?.data?.message || error.message}`);
    }

    logStep(10, 'Test QR Code After Connect');
    
    // Try to get QR code after connecting
    try {
      logInfo('Attempting to get QR code...');
      const qrResponse = await axios.get(`${API_BASE}/devices/${deviceId}/qr`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (qrResponse.data.success) {
        logSuccess('QR code retrieved successfully!');
        logInfo(`QR code length: ${qrResponse.data.data.qr_code?.length || 0} characters`);
        logInfo(`Status: ${qrResponse.data.data.status}`);
        
        if (qrResponse.data.data.qr_code) {
          logSuccess('QR code is available and ready to scan');
        } else {
          logWarning('QR code field is empty');
        }
      } else {
        logWarning(`QR code not ready: ${qrResponse.data.message}`);
        logInfo(`Response data: ${JSON.stringify(qrResponse.data.data, null, 2)}`);
      }
    } catch (error) {
      if (error.response?.status === 202) {
        logInfo('QR code is being generated (202 status)');
        logInfo(`Retry after: ${error.response.data.data.retry_after} seconds`);
        logInfo(`Message: ${error.response.data.message}`);
      } else if (error.response?.status === 400) {
        logWarning(`QR code not available: ${error.response.data.message}`);
        logInfo(`Response data: ${JSON.stringify(error.response.data.data, null, 2)}`);
      } else {
        logError(`QR code error: ${error.response?.data?.message || error.message}`);
      }
    }

    logStep(11, 'Poll for QR Code (Multiple Attempts)');
    
    // Poll for QR code multiple times
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      logInfo(`Polling attempt ${attempt}/${maxAttempts}...`);
      
      try {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        
        const qrResponse = await axios.get(`${API_BASE}/devices/${deviceId}/qr`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (qrResponse.data.success && qrResponse.data.data.qr_code) {
          logSuccess(`QR code available on attempt ${attempt}!`);
          logInfo(`QR code length: ${qrResponse.data.data.qr_code.length} characters`);
          logInfo(`Status: ${qrResponse.data.data.status}`);
          break;
        } else {
          logInfo(`Attempt ${attempt}: QR code not ready yet`);
        }
      } catch (error) {
        if (error.response?.status === 202) {
          logInfo(`Attempt ${attempt}: QR code still generating (202)`);
        } else if (error.response?.status === 400) {
          logWarning(`Attempt ${attempt}: ${error.response.data.message}`);
        } else {
          logError(`Attempt ${attempt} error: ${error.response?.data?.message || error.message}`);
        }
      }
    }

    logStep(12, 'Final Status Check');
    
    // Final status check
    try {
      const statusResponse = await axios.get(`${API_BASE}/devices/${deviceId}/status`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (statusResponse.data.success) {
        const status = statusResponse.data.data;
        logInfo(`Final device status: ${status.device.status}`);
        logInfo(`Final connection status: ${status.connection_status.status}`);
      }
    } catch (error) {
      logWarning(`Final status check error: ${error.response?.data?.message || error.message}`);
    }

    log('\n🎉 QR Code API Testing Completed!', 'green');

  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }
}

// Run the test
testQRCodeAPI(); 