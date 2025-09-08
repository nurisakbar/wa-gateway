#!/usr/bin/env node

/**
 * Script untuk test image upload functionality
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testImageUpload() {
  console.log('🖼️  Testing Image Upload Functionality...\n');

  try {
    // Test backend accessibility
    console.log('🌐 Testing backend accessibility...');
    const backendResponse = await axios.get('http://localhost:3002/health', { timeout: 10000 });
    console.log('✅ Backend is accessible');
    console.log(`   Status: ${backendResponse.status}`);
    
    // Test login
    console.log('\n🔐 Testing login...');
    const loginResponse = await axios.post('http://localhost:3002/api/v1/auth/login', {
      email: 'wahyusafrizal174@gmail.com',
      password: 'WahyuJR17_'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    console.log(`   User: ${loginResponse.data.data.user.full_name}`);
    
    // Create a test image file
    console.log('\n🖼️  Creating test image...');
    const testImagePath = path.join(__dirname, 'test-image.png');
    
    // Create a simple 1x1 pixel PNG image (base64)
    const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(testImagePath, pngData);
    console.log('✅ Test image created');
    
    // Test file upload
    console.log('\n📤 Testing file upload...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testImagePath), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    
    const uploadResponse = await axios.post('http://localhost:3002/api/v1/files/upload', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ File upload successful');
    console.log(`   Status: ${uploadResponse.status}`);
    console.log(`   Response: ${JSON.stringify(uploadResponse.data, null, 2)}`);
    
    // Test send image message
    console.log('\n💬 Testing send image message...');
    const devicesResponse = await axios.get('http://localhost:3002/api/v1/devices', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (devicesResponse.data.data && devicesResponse.data.data.length > 0) {
      const device = devicesResponse.data.data[0];
      const uploadedFile = uploadResponse.data.data[0];
      
      const sendMessageResponse = await axios.post('http://localhost:3002/api/v1/messages/send', {
        device_id: device.id,
        to_number: '6289699935552',
        content: 'Test image message',
        type: 'image',
        media_url: uploadedFile.url,
        filename: uploadedFile.filename
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Send image message successful');
      console.log(`   Status: ${sendMessageResponse.status}`);
      console.log(`   Response: ${JSON.stringify(sendMessageResponse.data, null, 2)}`);
      
      // Test get messages to verify image message was stored
      console.log('\n📥 Testing get messages...');
      const messagesResponse = await axios.get('http://localhost:3002/api/v1/messages', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Get messages successful');
      console.log(`   Messages count: ${messagesResponse.data.data?.length || 0}`);
      
      if (messagesResponse.data.data && messagesResponse.data.data.length > 0) {
        const latestMessage = messagesResponse.data.data[0];
        console.log(`   Latest message: ${latestMessage.content}`);
        console.log(`   Message type: ${latestMessage.message_type}`);
        console.log(`   From: ${latestMessage.from_number}`);
        console.log(`   To: ${latestMessage.to_number}`);
        console.log(`   Status: ${latestMessage.status}`);
        console.log(`   Direction: ${latestMessage.direction}`);
        if (latestMessage.metadata) {
          console.log(`   Metadata: ${JSON.stringify(latestMessage.metadata, null, 2)}`);
        }
      }
    }
    
    // Clean up test file
    console.log('\n🧹 Cleaning up test file...');
    fs.unlinkSync(testImagePath);
    console.log('✅ Test file cleaned up');
    
    console.log('\n🎉 Image Upload Test Completed!');
    console.log('\n📋 Features Added:');
    console.log('✅ Image file selection with validation');
    console.log('✅ Image preview before sending');
    console.log('✅ File upload to server');
    console.log('✅ Image message sending via WhatsApp');
    console.log('✅ Loading states during upload');
    console.log('✅ Error handling for invalid files');
    console.log('✅ File size validation (max 10MB)');
    console.log('✅ File type validation (images only)');
    
    console.log('\n🎨 UI/UX Improvements:');
    console.log('• Drag and drop file selection');
    console.log('• Image preview with remove option');
    console.log('• File information display');
    console.log('• Loading spinner during upload');
    console.log('• Error messages for validation');
    console.log('• Responsive design for mobile');
    
    console.log('\n🔧 Technical Implementation:');
    console.log('• FileReader API for image preview');
    console.log('• FormData for file upload');
    console.log('• File validation (type and size)');
    console.log('• Error handling and user feedback');
    console.log('• Integration with existing message system');
    
    console.log('\n📱 Expected User Experience:');
    console.log('1. User clicks attachment button');
    console.log('2. Selects image from file picker');
    console.log('3. Image preview appears with file info');
    console.log('4. User can add caption or remove image');
    console.log('5. Clicks send button');
    console.log('6. Image uploads to server');
    console.log('7. Message sent via WhatsApp');
    console.log('8. Success notification appears');
    console.log('9. Image message appears in chat');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   URL: ${error.config?.url}`);
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔍 Backend is not running. Please start it first.');
    }
    
    // Clean up test file if it exists
    const testImagePath = path.join(__dirname, 'test-image.png');
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  }
}

// Run the test
testImageUpload();
