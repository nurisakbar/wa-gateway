// Test MySQL connection and create sample data
require('dotenv').config({ path: './.env' });

const { Message, Device, User } = require('./src/models');
const { sequelize } = require('./src/config/database');

async function testMySQLConnection() {
  try {
    console.log('Testing MySQL connection...');
    console.log('Database config:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      dialect: process.env.DB_DIALECT
    });
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ MySQL connection established successfully.');
    
    // Sync database (create tables if they don't exist)
    console.log('Syncing database...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully.');
    
    // Check existing data
    const userCount = await User.count();
    const deviceCount = await Device.count();
    const messageCount = await Message.count();
    
    console.log(`\nCurrent data:`);
    console.log(`Users: ${userCount}`);
    console.log(`Devices: ${deviceCount}`);
    console.log(`Messages: ${messageCount}`);
    
    // Create sample data if no messages exist
    if (messageCount === 0) {
      console.log('\nCreating sample data...');
      
      // Get or create a user
      let user = await User.findOne();
      if (!user) {
        user = await User.create({
          email: 'test@example.com',
          password: 'hashedpassword',
          name: 'Test User',
          is_verified: true,
          role: 'user'
        });
        console.log('✅ Sample user created:', user.id);
      }
      
      // Get or create a device
      let device = await Device.findOne();
      if (!device) {
        device = await Device.create({
          user_id: user.id,
          name: 'Test Device',
          phone_number: '+1234567890',
          status: 'connected'
        });
        console.log('✅ Sample device created:', device.id);
      }
      
      // Create sample sent messages
      const sentMessages = [
        {
          user_id: user.id,
          device_id: device.id,
          to_number: '+1234567891',
          content: 'Hello, this is a test message!',
          message_type: 'text',
          direction: 'outgoing',
          status: 'sent',
          sent_at: new Date()
        },
        {
          user_id: user.id,
          device_id: device.id,
          to_number: '+1234567892',
          content: 'Another test message with different status',
          message_type: 'text',
          direction: 'outgoing',
          status: 'delivered',
          sent_at: new Date(Date.now() - 3600000) // 1 hour ago
        },
        {
          user_id: user.id,
          device_id: device.id,
          to_number: '+1234567893',
          content: 'This message was read by the recipient',
          message_type: 'text',
          direction: 'outgoing',
          status: 'read',
          sent_at: new Date(Date.now() - 7200000) // 2 hours ago
        },
        {
          user_id: user.id,
          device_id: device.id,
          to_number: '+1234567894',
          content: 'This message failed to send',
          message_type: 'text',
          direction: 'outgoing',
          status: 'failed',
          sent_at: new Date(Date.now() - 10800000) // 3 hours ago
        }
      ];
      
      // Create sample incoming messages
      const incomingMessages = [
        {
          user_id: user.id,
          device_id: device.id,
          from_number: '+1234567891',
          content: 'Reply to your test message',
          message_type: 'text',
          direction: 'incoming',
          status: 'received'
        },
        {
          user_id: user.id,
          device_id: device.id,
          from_number: '+1234567892',
          content: 'Another incoming message',
          message_type: 'text',
          direction: 'incoming',
          status: 'received'
        }
      ];
      
      // Insert sent messages
      for (const msg of sentMessages) {
        await Message.create(msg);
        console.log(`✅ Created sent message: ${msg.status}`);
      }
      
      // Insert incoming messages
      for (const msg of incomingMessages) {
        await Message.create(msg);
        console.log(`✅ Created incoming message`);
      }
      
      console.log('✅ Sample data created successfully!');
    }
    
    // Verify the data
    const totalMessages = await Message.count();
    const outgoingCount = await Message.count({ where: { direction: 'outgoing' } });
    const incomingCount = await Message.count({ where: { direction: 'incoming' } });
    
    console.log(`\nFinal verification:`);
    console.log(`Total messages: ${totalMessages}`);
    console.log(`Outgoing messages: ${outgoingCount}`);
    console.log(`Incoming messages: ${incomingCount}`);
    
    // Show status distribution
    const statusCounts = {};
    const allMessages = await Message.findAll();
    allMessages.forEach(msg => {
      statusCounts[msg.status] = (statusCounts[msg.status] || 0) + 1;
    });
    
    console.log('\nStatus distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`${status}: ${count}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.original) {
      console.error('Original error:', error.original.message);
    }
  } finally {
    await sequelize.close();
  }
}

testMySQLConnection();
