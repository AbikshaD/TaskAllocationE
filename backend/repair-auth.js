require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function repair() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const users = await User.find({});
    console.log(`🔍 Checking ${users.length} users...`);

    let updated = 0;
    for (const user of users) {
      let needsSave = false;

      // 1. Repair UID
      if (!user.uid) {
        if (user.role === 'student') {
          user.uid = user.studentId;
        } else if (user.role === 'host') {
          user.uid = 'host01'; // Default host ID
        } else if (user.role === 'admin') {
          // If they have an email host@ / admin@ use default IDs
          if (user.email.startsWith('host')) user.uid = 'host01';
          else if (user.email.startsWith('admin')) user.uid = 'admin01';
          else user.uid = user.email.split('@')[0]; // fallback to email prefix
        }
        needsSave = true;
      }

      // 2. Repair Hashing
      if (user.password && !user.password.startsWith('$2')) {
        console.log(`🔐 Hashing password for: ${user.uid || user.email}`);
        user.password = await bcrypt.hash(user.password, 12);
        needsSave = true;
      }

      if (needsSave) {
        await user.save();
        updated++;
      }
    }

    console.log(`✅ Repair complete. Updated ${updated} users.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Repair error:', err.message);
    process.exit(1);
  }
}

repair();
