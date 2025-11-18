#!/usr/bin/env node

const readline = require('readline');
const bcrypt = require('bcrypt');
const { connectDatabase } = require('../src/config/database');
const User = require('../src/models/User');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createSuperAdmin() {
  try {
    await connectDatabase();

    console.log('\n=== Create Super Admin Account ===\n');

    const email = await question('Email: ');
    const username = await question('Username: ');
    const password = await question('Password: ');
    const firstName = await question('First Name: ');
    const lastName = await question('Last Name: ');

    // Check if user exists
    const existingEmail = User.findByEmail(email);
    if (existingEmail) {
      console.error('\n✗ Error: Email already exists');
      process.exit(1);
    }

    const existingUsername = User.findByUsername(username);
    if (existingUsername) {
      console.error('\n✗ Error: Username already taken');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create super admin
    const user = User.create({
      email,
      username,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'SUPER_ADMIN',
      emailVerified: 1
    });

    console.log('\n✓ Super Admin created successfully!');
    console.log('\nAccount Details:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Role: ${user.role}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error creating super admin:', error.message);
    process.exit(1);
  }
}

createSuperAdmin();
