// Script to create admin credentials
const fetch = require('node-fetch');

const createAdmin = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/admin/setup/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'ccbadmin09',
        password: 'ccbadmin123',
        setupKey: process.env.ADMIN_SETUP_KEY || 'your-setup-key-here'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Admin created successfully:', result);
    } else {
      console.log('❌ Error creating admin:', result);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
};

createAdmin();
