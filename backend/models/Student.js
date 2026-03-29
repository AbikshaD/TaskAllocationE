const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, sparse: true, unique: true }, // Not required - will be auto-generated
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  batch: { type: String, required: true },

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
      let prefix = 'STU';
      const dept = this.department || '';
      if (dept.includes('Computer')) prefix = 'CS';
      else if (dept.includes('Information')) prefix = 'IT';
      else if (dept.includes('Electronic')) prefix = 'EC';
      else if (dept.includes('Electrical')) prefix = 'EE';
      else if (dept.includes('Mechanical')) prefix = 'ME';
      else if (dept.includes('Civil')) prefix = 'CE';

      let yearPrefix = '1';
      if (this.year === 'Second Year') yearPrefix = '2';
      else if (this.year === 'Third Year') yearPrefix = '3';
      else if (this.year === 'Final Year') yearPrefix = '4';

      // Generate final studentId based on count per department and year
      const count = await mongoose.model('Student').countDocuments({ department: this.department, year: this.year });
      this.studentId = `${prefix}${yearPrefix}${String(count + 1).padStart(3, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Student', studentSchema);
