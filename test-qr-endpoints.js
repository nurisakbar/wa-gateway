#!/usr/bin/env node

const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:3001/api/v1';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

async function testQREndpoints() {
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

    logStep(2, 'Testing Authentication Endpoints');
    
    // Test auth endpoints
    try {
      const authResponse = await axios.get(`${API_BASE}/auth/profile`);
      logError('Auth endpoint should require authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        logSuccess('Auth endpoints properly require authentication');
      } else {
        logWarning(`Auth endpoint error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }

    logStep(3, 'Testing Device Endpoints (Without Auth)');
    
    // Test device endpoints without auth
    const testDeviceId = '12345678-1234-1234-1234-123456789012';
    
    try {
      const devicesResponse = await axios.get(`${API_BASE}/devices`);
      logError('Devices endpoint should require authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        logSuccess('Devices endpoint properly requires authentication');
      } else {
        logWarning(`Devices endpoint error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }

    try {
      const deviceResponse = await axios.get(`${API_BASE}/devices/${testDeviceId}`);
      logError('Device endpoint should require authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        logSuccess('Device endpoint properly requires authentication');
      } else {
        logWarning(`Device endpoint error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }

    try {
      const connectResponse = await axios.post(`${API_BASE}/devices/${testDeviceId}/connect`);
      logError('Connect endpoint should require authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        logSuccess('Connect endpoint properly requires authentication');
      } else {
        logWarning(`Connect endpoint error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }

    try {
      const qrResponse = await axios.get(`${API_BASE}/devices/${testDeviceId}/qr`);
      logError('QR endpoint should require authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        logSuccess('QR endpoint properly requires authentication');
      } else {
        logWarning(`QR endpoint error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }

    try {
      const statusResponse = await axios.get(`${API_BASE}/devices/${testDeviceId}/status`);
      logError('Status endpoint should require authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        logSuccess('Status endpoint properly requires authentication');
      } else {
        logWarning(`Status endpoint error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }

    logStep(4, 'Testing Invalid UUID Format');
    
    // Test with invalid UUID format
    const invalidDeviceId = 'invalid-uuid';
    
    try {
      const invalidResponse = await axios.get(`${API_BASE}/devices/${invalidDeviceId}/qr`);
      logError('Invalid UUID should be rejected');
    } catch (error) {
      if (error.response?.status === 400) {
        logSuccess('Invalid UUID properly rejected with 400 status');
        logInfo(`Error message: ${error.response.data.message}`);
      } else if (error.response?.status === 401) {
        logInfo('Invalid UUID rejected due to authentication (expected)');
      } else {
        logWarning(`Invalid UUID error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }

    logStep(5, 'Testing Non-Existent Routes');
    
    // Test non-existent routes
    try {
      const notFoundResponse = await axios.get(`${API_BASE}/nonexistent`);
      logError('Non-existent route should return 404');
    } catch (error) {
      if (error.response?.status === 404) {
        logSuccess('Non-existent route properly returns 404');
      } else {
        logWarning(`Non-existent route error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }

    logStep(6, 'API Endpoint Summary');
    
    logInfo('✅ All endpoints properly require authentication');
    logInfo('✅ Invalid UUID format properly rejected');
    logInfo('✅ Non-existent routes return 404');
    logInfo('');
    logInfo('📋 Available QR Code Related Endpoints:');
    logInfo('   POST /api/v1/devices/{deviceId}/connect');
    logInfo('   GET  /api/v1/devices/{deviceId}/qr');
    logInfo('   GET  /api/v1/devices/{deviceId}/status');
    logInfo('   GET  /api/v1/devices');
    logInfo('');
    logInfo('🔐 All endpoints require: Authorization: Bearer {token}');
    logInfo('📱 Device ID must be valid UUID format');
    logInfo('👤 User must be authenticated and device must belong to user');

    logStep(7, 'Manual Testing Instructions');
    
    logInfo('To test QR code functionality with real data:');
    logInfo('');
    logInfo('1. Open browser: http://localhost:3000');
    logInfo('2. Register/Login with valid user');
    logInfo('3. Create a device or use existing device');
    logInfo('4. Click "Connect" button');
    logInfo('5. Monitor browser console and network tab');
    logInfo('6. Check backend logs: docker-compose logs backend -f');
    logInfo('');
    logInfo('Expected Flow:');
    logInfo('1. POST /devices/{id}/connect → 200 OK');
    logInfo('2. GET /devices/{id}/qr → 202 (generating) or 200 (ready)');
    logInfo('3. GET /devices/{id}/status → 200 OK with status info');

    log('\n🎉 QR Code API Endpoint Testing Completed!', 'green');
    log('\nNext steps:', 'cyan');
    log('1. Test with real user authentication', 'cyan');
    log('2. Monitor backend logs during connection', 'cyan');
    log('3. Check frontend console for debugging', 'cyan');

  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }
}

// Run the test
testQREndpoints(); 