const { User } = require('../models');

const users = [
  {
    username: 'superadmin',
    email: 'superadmin@gmail.com',
    password: 'password',
    full_name: 'Super Admin',
    role: 'admin',
    status: 'active',
    email_verified_at: new Date(),
    phone_verified_at: new Date()
  }
];

const seedUsers = async () => {
  try {
    console.log('🌱 Seeding users...');
    
    for (const userData of users) {
      const [user, created] = await User.findOrCreate({
        where: { email: userData.email },
        defaults: userData
      });
      
      if (created) {
        console.log(`✅ Created user: ${user.email} (${user.role})`);
      } else {
        console.log(`⚠️  User already exists: ${user.email}`);
      }
    }
    
    console.log('✅ Users seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

module.exports = { seedUsers };
