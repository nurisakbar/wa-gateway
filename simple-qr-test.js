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

async function testQRCodeAPI() {
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

    logStep(2, 'Manual Testing Instructions');
    
    logInfo('Since user authentication requires manual setup, here are the manual testing steps:');
    logInfo('');
    logInfo('1. Open browser and go to: http://localhost:3000');
    logInfo('2. Register a new user or login with existing user');
    logInfo('3. Go to Device Management page');
    logInfo('4. Create a new device or use existing device');
    logInfo('5. Click "Connect" button on the device');
    logInfo('6. Monitor the process and check for QR code');
    logInfo('');
    logInfo('Expected API Flow:');
    logInfo('1. POST /api/v1/devices/{id}/connect - Initialize connection');
    logInfo('2. GET /api/v1/devices/{id}/qr - Get QR code (may need polling)');
    logInfo('3. GET /api/v1/devices/{id}/status - Check device status');
    logInfo('');
    logInfo('Expected Response Codes:');
    logInfo('- 200: QR code available');
    logInfo('- 202: QR code being generated (retry after delay)');
    logInfo('- 400: QR code not available (need to connect first)');
    logInfo('- 401: Authentication required');
    logInfo('- 404: Device not found');
    logInfo('');
    logInfo('Backend Logs:');
    logInfo('Run: docker-compose logs backend -f');
    logInfo('Look for:');
    logInfo('- "Connect device request"');
    logInfo('- "Device connection initiated"');
    logInfo('- "QR code generated"');
    logInfo('- "Getting QR code for device"');
    logInfo('');
    logInfo('Frontend Console:');
    logInfo('Open browser DevTools and check Console tab for:');
    logInfo('- "=== CONNECT DEVICE CALLED ==="');
    logInfo('- "=== STORE CONNECT DEVICE CALLED ==="');
    logInfo('- API request logs');
    logInfo('- QR code response logs');

    logStep(3, 'API Endpoints to Test');
    
    logInfo('Here are the key API endpoints to test:');
    logInfo('');
    logInfo('🔗 CONNECT DEVICE:');
    logInfo('POST /api/v1/devices/{deviceId}/connect');
    logInfo('Headers: Authorization: Bearer {token}');
    logInfo('Expected: 200 OK with session_id and status: "connecting"');
    logInfo('');
    logInfo('📱 GET QR CODE:');
    logInfo('GET /api/v1/devices/{deviceId}/qr');
    logInfo('Headers: Authorization: Bearer {token}');
    logInfo('Expected: 200 OK with qr_code data or 202 with retry_after');
    logInfo('');
    logInfo('📊 DEVICE STATUS:');
    logInfo('GET /api/v1/devices/{deviceId}/status');
    logInfo('Headers: Authorization: Bearer {token}');
    logInfo('Expected: 200 OK with device and connection status');
    logInfo('');
    logInfo('📋 LIST DEVICES:');
    logInfo('GET /api/v1/devices');
    logInfo('Headers: Authorization: Bearer {token}');
    logInfo('Expected: 200 OK with array of devices');

    logStep(4, 'Testing with curl (if you have a valid token)');
    
    logInfo('If you have a valid JWT token, you can test with curl:');
    logInfo('');
    logInfo('Replace {TOKEN} with your actual JWT token');
    logInfo('Replace {DEVICE_ID} with actual device ID');
    logInfo('');
    logInfo('Test commands:');
    logInfo('1. List devices:');
    logInfo('   curl -H "Authorization: Bearer {TOKEN}" http://localhost:3001/api/v1/devices');
    logInfo('');
    logInfo('2. Connect device:');
    logInfo('   curl -X POST -H "Authorization: Bearer {TOKEN}" http://localhost:3001/api/v1/devices/{DEVICE_ID}/connect');
    logInfo('');
    logInfo('3. Get QR code:');
    logInfo('   curl -H "Authorization: Bearer {TOKEN}" http://localhost:3001/api/v1/devices/{DEVICE_ID}/qr');
    logInfo('');
    logInfo('4. Get device status:');
    logInfo('   curl -H "Authorization: Bearer {TOKEN}" http://localhost:3001/api/v1/devices/{DEVICE_ID}/status');

    logStep(5, 'Common Issues and Solutions');
    
    logInfo('Common issues you might encounter:');
    logInfo('');
    logWarning('Issue: "QR code not available. Please try connecting the device first."');
    logInfo('Solution: Make sure to call POST /connect before GET /qr');
    logInfo('');
    logWarning('Issue: "Device is already connected"');
    logInfo('Solution: Device is already connected, no QR code needed');
    logInfo('');
    logWarning('Issue: "QR code is being generated" (202 status)');
    logInfo('Solution: Wait and retry after the suggested delay');
    logInfo('');
    logWarning('Issue: "Authentication token required"');
    logInfo('Solution: Include valid JWT token in Authorization header');
    logInfo('');
    logWarning('Issue: "Device not found"');
    logInfo('Solution: Check device ID and ensure it belongs to the authenticated user');

    log('\n🎉 QR Code API Testing Guide Completed!', 'green');
    log('\nNext steps:', 'cyan');
    log('1. Test manually through the frontend interface', 'cyan');
    log('2. Monitor backend logs for detailed information', 'cyan');
    log('3. Check frontend console for debugging info', 'cyan');
    log('4. Use curl commands if you have valid tokens', 'cyan');

  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }
}

// Run the test
testQRCodeAPI(); 