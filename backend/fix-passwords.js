require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function fix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const students = await User.find({ role: 'student' });
    let count = 0;
    
    for (const student of students) {
      const plainPassword = student.studentId + '@123';
      const hashedPassword = await bcrypt.hash(plainPassword, 12);
      
      // Update directly bypassing Mongoose pre-save hooks to avoid double hashing
      await User.collection.updateOne(
        { _id: student._id },
        { $set: { password: hashedPassword } }
      );
      count++;
    }
    
    console.log(`Successfully repaired passwords for ${count} students.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

fix();
