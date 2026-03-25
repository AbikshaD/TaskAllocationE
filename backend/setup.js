require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function setup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const existingHost = await User.findOne({ role: 'host' });
    if (existingHost) {
      console.log('ℹ️  Host already exists:', existingHost.email);
    } else {
      await User.create({ name: 'System Host', email: 'host@college.edu', password: 'Host@123', role: 'host' });
      console.log('✅ Host created: host@college.edu / Host@123');
    }

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
      await User.create({ name: 'Default Admin', email: 'admin@college.edu', password: 'Admin@123', role: 'admin', department: 'Computer Science' });
      console.log('✅ Default admin created: admin@college.edu / Admin@123');
    } else {
      console.log('ℹ️  Admin already exists');
    }

    console.log('\n🎉 Setup complete! Start the server with: npm run dev');
    process.exit(0);
  } catch (err) {
    console.error('❌ Setup error:', err.message);
    process.exit(1);
  }
}
setup();
