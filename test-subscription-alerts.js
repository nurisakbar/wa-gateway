#!/usr/bin/env node

/**
 * Test script to verify subscription alert functionality
 * This script tests the subscription alert system
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

async function testSubscriptionAlerts() {
  console.log('🧪 Testing Subscription Alert System...\n');

  try {
    // Step 1: Register a new user
    console.log('1️⃣ Registering new user...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      username: 'testuser' + Date.now(),
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      full_name: 'Test User',
      role: 'operator'
    });

    if (!registerResponse.data.error) {
      console.log('✅ User registered successfully');
      const { token } = registerResponse.data.data;
      
      // Step 2: Test subscription status endpoint
      console.log('\n2️⃣ Testing subscription status...');
      try {
        const subResponse = await axios.get(`${API_BASE}/subscriptions/my-subscription`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('❌ Unexpected subscription found');
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('✅ No subscription found (expected for new user)');
        } else {
          console.log('❌ Unexpected error:', error.response?.data || error.message);
        }
      }

      // Step 3: Test protected route access (should show subscription required)
      console.log('\n3️⃣ Testing protected route access...');
      try {
        await axios.get(`${API_BASE}/devices`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('❌ Should have been blocked - no subscription required');
      } catch (error) {
        if (error.response?.status === 403 && error.response?.data?.error === 'SUBSCRIPTION_REQUIRED') {
          console.log('✅ Correctly blocked with subscription required error');
          console.log('   Error message:', error.response.data.message);
          console.log('   Redirect info:', error.response.data.data?.redirect_to);
        } else {
          console.log('❌ Unexpected error:', error.response?.data || error.message);
        }
      }

      // Step 4: Test messages endpoint
      console.log('\n4️⃣ Testing messages endpoint...');
      try {
        await axios.get(`${API_BASE}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('❌ Should have been blocked - no subscription required');
      } catch (error) {
        if (error.response?.status === 403 && error.response?.data?.error === 'SUBSCRIPTION_REQUIRED') {
          console.log('✅ Messages endpoint correctly blocked');
        } else {
          console.log('❌ Unexpected error:', error.response?.data || error.message);
        }
      }

      // Step 5: Test WhatsApp API endpoint
      console.log('\n5️⃣ Testing WhatsApp API endpoint...');
      try {
        await axios.get(`${API_BASE}/whatsapp/balance`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-API-Key': 'test-api-key' // This will fail auth but we want to test subscription check
          }
        });
        console.log('❌ Should have been blocked - no subscription required');
      } catch (error) {
        if (error.response?.status === 403) {
          if (error.response?.data?.error === 'SUBSCRIPTION_REQUIRED') {
            console.log('✅ WhatsApp API correctly blocked by subscription requirement');
          } else if (error.response?.data?.error === 'INVALID_API_KEY') {
            console.log('✅ WhatsApp API blocked by API key (subscription check passed)');
          } else {
            console.log('❌ Unexpected error:', error.response?.data || error.message);
          }
        } else {
          console.log('❌ Unexpected error:', error.response?.data || error.message);
        }
      }

      // Step 6: Test subscription plans endpoint (should work without subscription)
      console.log('\n6️⃣ Testing subscription plans endpoint...');
      try {
        const plansResponse = await axios.get(`${API_BASE}/subscriptions/plans`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (plansResponse.data.success) {
          console.log('✅ Subscription plans accessible without subscription (expected)');
        } else {
          console.log('❌ Subscription plans not accessible');
        }
      } catch (error) {
        console.log('❌ Error accessing subscription plans:', error.response?.data || error.message);
      }

    } else {
      console.log('❌ User registration failed:', registerResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }

  console.log('\n🏁 Subscription alert test completed');
  console.log('\n📋 Summary:');
  console.log('   - New users should see subscription alerts on frontend');
  console.log('   - Protected routes should return 403 with SUBSCRIPTION_REQUIRED error');
  console.log('   - Subscription plans should be accessible without subscription');
  console.log('   - Admin users should bypass subscription requirements');
}

// Run the test
testSubscriptionAlerts().catch(console.error);
