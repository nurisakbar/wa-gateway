#!/usr/bin/env node

// Script untuk memverifikasi environment variables
console.log('🔍 Checking Environment Variables...\n');

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const config = {
  NUXT_PUBLIC_API_BASE: process.env.NUXT_PUBLIC_API_BASE,
  NUXT_PUBLIC_SOCKET_URL: process.env.NUXT_PUBLIC_SOCKET_URL,
  NUXT_PUBLIC_APP_NAME: process.env.NUXT_PUBLIC_APP_NAME,
  NUXT_PUBLIC_APP_VERSION: process.env.NUXT_PUBLIC_APP_VERSION,
  NUXT_PUBLIC_API_KEY: process.env.NUXT_PUBLIC_API_KEY,
  NUXT_PUBLIC_NODE_ENV: process.env.NUXT_PUBLIC_NODE_ENV
};

console.log('📋 Current Environment Configuration:');
console.log('=====================================');
Object.entries(config).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  console.log(`${status} ${key}: ${value || 'NOT SET'}`);
});

console.log('\n🔧 Expected Configuration:');
console.log('==========================');
console.log('✅ NUXT_PUBLIC_API_BASE: http://localhost:3002/api/v1');
console.log('✅ NUXT_PUBLIC_SOCKET_URL: http://localhost:3002');
console.log('✅ NUXT_PUBLIC_APP_NAME: WA Gateway');
console.log('✅ NUXT_PUBLIC_APP_VERSION: 1.0.0');
console.log('✅ NUXT_PUBLIC_API_KEY: wg_b4df277cf780df75227236e35b048975708affe0d1dcc1eaa5a443d356fec3b9');
console.log('✅ NUXT_PUBLIC_NODE_ENV: development');

// Check if API base is using correct port
const apiBase = config.NUXT_PUBLIC_API_BASE;
if (apiBase && apiBase.includes('3002')) {
  console.log('\n🎉 SUCCESS: API Base is configured to use port 3002!');
} else if (apiBase && apiBase.includes('3001')) {
  console.log('\n⚠️  WARNING: API Base is still using port 3001!');
  console.log('   Please restart the development server.');
} else {
  console.log('\n❌ ERROR: API Base is not configured correctly!');
}

// Check if Socket URL is using correct port
const socketUrl = config.NUXT_PUBLIC_SOCKET_URL;
if (socketUrl && socketUrl.includes('3002')) {
  console.log('🎉 SUCCESS: Socket URL is configured to use port 3002!');
} else if (socketUrl && socketUrl.includes('3001')) {
  console.log('⚠️  WARNING: Socket URL is still using port 3001!');
  console.log('   Please restart the development server.');
} else {
  console.log('❌ ERROR: Socket URL is not configured correctly!');
}

console.log('\n📝 Next Steps:');
console.log('===============');
console.log('1. If you see warnings, restart the development server:');
console.log('   npm run dev');
console.log('2. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)');
console.log('3. Check browser developer tools Network tab to verify API calls');
console.log('4. If still using port 3001, check if there are other .env files');
