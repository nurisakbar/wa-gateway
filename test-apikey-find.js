const { ApiKey } = require('./backend/src/models');
const crypto = require('crypto');

async function testFindByKey() {
  try {
    console.log('🔍 Testing ApiKey.findByKey...');
    
    // Test key yang kita buat sebelumnya
    const testKey = 'wg_a7cf5b5bb82c9f0f8035fdd31e4e9228da68dde10178b8bbef4d06fb6b62e01d';
    
    console.log('Test key:', testKey.substring(0, 8) + '...');
    
    // Generate hash
    const keyHash = crypto.createHash('sha256').update(testKey).digest('hex');
    console.log('Generated hash:', keyHash.substring(0, 16) + '...');
    
    // Try to find by hash directly
    const keyByHash = await ApiKey.findOne({
      where: { key_hash: keyHash, is_active: true }
    });
    
    if (keyByHash) {
      console.log('✅ Found by hash directly');
      console.log('Key prefix:', keyByHash.key_prefix);
      console.log('User ID:', keyByHash.user_id);
    } else {
      console.log('❌ Not found by hash directly');
    }
    
    // Try findByKey method
    const keyByMethod = await ApiKey.findByKey(testKey);
    
    if (keyByMethod) {
      console.log('✅ Found by findByKey method');
      console.log('Key prefix:', keyByMethod.key_prefix);
      console.log('User ID:', keyByMethod.user_id);
    } else {
      console.log('❌ Not found by findByKey method');
    }
    
    // List all API keys
    const allKeys = await ApiKey.findAll({
      where: { is_active: true }
    });
    
    console.log(`📋 Total active API keys: ${allKeys.length}`);
    allKeys.forEach((key, index) => {
      console.log(`${index + 1}. ${key.key_prefix}... (${key.name})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testFindByKey(); 