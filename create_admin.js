#!/usr/bin/env node
/**
 * Create admin credentials for CCB Portal.
 *
 * Usage:
 *   1. Set ADMIN_SETUP_KEY on Render (Environment) - use a secret string you choose.
 *   2. Run: ADMIN_SETUP_KEY=your-secret node create_admin.js
 *      Or: node create_admin.js
 *      (Uses ADMIN_SETUP_KEY from env; if unset, only works when no admin exists)
 *
 * Custom username/password:
 *   USERNAME=myadmin PASSWORD=mypass ADMIN_SETUP_KEY=secret node create_admin.js
 *
 * Backend URL (default: production):
 *   API_URL=https://ccbportal.onrender.com node create_admin.js
 *   API_URL=http://localhost:5000 node create_admin.js  (for local)
 */

const API_URL = process.env.API_URL || 'https://ccbportal.onrender.com';
const USERNAME = process.env.USERNAME || 'ccbadmin09';
const PASSWORD = process.env.PASSWORD || 'ccbadmin123';
const SETUP_KEY = process.env.ADMIN_SETUP_KEY || '';

const createAdmin = async () => {
  console.log(`Creating admin at ${API_URL}/api/admin/setup/`);
  console.log(`Username: ${USERNAME}`);
  try {
    const body = { username: USERNAME, password: PASSWORD };
    if (SETUP_KEY) body.setupKey = SETUP_KEY;

    const response = await fetch(`${API_URL.replace(/\/$/, '')}/api/admin/setup/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Admin created successfully!');
      console.log(`   Log in at https://citycollegeofbayawan.vercel.app/admin with:`);
      console.log(`   Username: ${USERNAME}`);
      console.log(`   Password: ${PASSWORD}`);
    } else {
      console.log('❌ Error:', result.message || result);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.log('   Tip: If backend is on Render, it may be spinning up (wait ~60s and retry).');
  }
};

createAdmin();
