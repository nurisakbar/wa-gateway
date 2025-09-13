#!/usr/bin/env node

/**
 * Test script to verify subscription flow
 * This script tests the subscription requirement functionality
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

async function testSubscriptionFlow() {
  console.log('🧪 Testing Subscription Flow...\n');

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
      
      // Step 2: Try to access protected route without subscription
      console.log('\n2️⃣ Testing access to devices without subscription...');
      try {
        await axios.get(`${API_BASE}/devices`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('❌ Should have been blocked - no subscription required');
      } catch (error) {
        if (error.response?.status === 403 && error.response?.data?.error === 'SUBSCRIPTION_REQUIRED') {
          console.log('✅ Correctly blocked - subscription required');
        } else {
          console.log('❌ Unexpected error:', error.response?.data || error.message);
        }
      }

      // Step 3: Try to access messages without subscription
      console.log('\n3️⃣ Testing access to messages without subscription...');
      try {
        await axios.get(`${API_BASE}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('❌ Should have been blocked - no subscription required');
      } catch (error) {
        if (error.response?.status === 403 && error.response?.data?.error === 'SUBSCRIPTION_REQUIRED') {
          console.log('✅ Correctly blocked - subscription required');
        } else {
          console.log('❌ Unexpected error:', error.response?.data || error.message);
        }
      }

      // Step 4: Check subscription status
      console.log('\n4️⃣ Checking subscription status...');
      try {
        const subResponse = await axios.get(`${API_BASE}/subscriptions/my-subscription`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!subResponse.data.success) {
          console.log('✅ No active subscription found (expected)');
        } else {
          console.log('❌ Unexpected subscription found');
        }
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('✅ No subscription found (expected)');
        } else {
          console.log('❌ Unexpected error:', error.response?.data || error.message);
        }
      }

      // Step 5: Get available plans
      console.log('\n5️⃣ Getting available subscription plans...');
      try {
        const plansResponse = await axios.get(`${API_BASE}/subscriptions/plans`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (plansResponse.data.success && plansResponse.data.data.plans.length > 0) {
          console.log('✅ Subscription plans available');
          console.log(`   Found ${plansResponse.data.data.plans.length} plans`);
        } else {
          console.log('❌ No subscription plans found');
        }
      } catch (error) {
        console.log('❌ Error fetching plans:', error.response?.data || error.message);
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

  console.log('\n🏁 Subscription flow test completed');
}

// Run the test
testSubscriptionFlow().catch(console.error);
