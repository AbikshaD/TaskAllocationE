const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, sparse: true, unique: true }, // Not required - will be auto-generated
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  batch: { type: String, required: true },
  rollNumber: { type: String, required: true },
  skills: [{ type: String }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Auto-generate studentId BEFORE validation
studentSchema.pre('validate', function(next) {
  if (!this.studentId) {
    // Generate a temporary ID - will be updated after count
    this.studentId = `STU_TEMP_${Date.now()}`;
  }
  next();
});

// Generate proper studentId after count
studentSchema.pre('save', async function(next) {
  try {
    if (this.studentId.startsWith('STU_TEMP_')) {
      // Generate final studentId based on count
      const count = await mongoose.model('Student').countDocuments();
      this.studentId = `STU${String(count + 1).padStart(4, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Student', studentSchema);
