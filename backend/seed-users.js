#!/usr/bin/env node

/**
 * User Seeder Script
 * Creates admin user in the database
 */

require('dotenv').config();
const { sequelize } = require('./src/config/database');
const { seedUsers } = require('./src/seeders/users');

const runSeeder = async () => {
  try {
    console.log('🚀 Starting user seeder...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Run user seeder
    await seedUsers();
    
    console.log('🎉 User seeder completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ User seeder failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await sequelize.close();
  }
};

// Run the seeder
runSeeder();
