const { User } = require('./backend/src/models');

async function activateUser() {
  try {
    // Find user by email
    const user = await User.findOne({
      where: { email: 'apitest@example.com' }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    // Activate user
    await user.update({
      is_active: true,
      email_verified_at: new Date()
    });

    console.log('✅ User activated successfully');
    console.log('User ID:', user.id);
    console.log('Email:', user.email);
    console.log('Status:', user.is_active ? 'Active' : 'Inactive');

  } catch (error) {
    console.error('❌ Error activating user:', error.message);
  }
}

activateUser(); 