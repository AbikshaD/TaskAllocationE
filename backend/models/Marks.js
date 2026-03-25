const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: String, required: true },
  subjectCode: { type: String },
  year: { type: String, required: true },
  internalMarks: { type: Number, default: 0, min: 0, max: 50 },
  externalMarks: { type: Number, default: 0, min: 0, max: 100 },
  totalMarks: { type: Number },
  grade: { type: String },
  examType: { type: String, enum: ['internal', 'external', 'practical', 'assignment'], default: 'internal' },
  academicYear: { type: String, required: true },
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

marksSchema.pre('save', function(next) {
  this.totalMarks = this.internalMarks + this.externalMarks;
  const percentage = (this.totalMarks / 150) * 100;
  if (percentage >= 90) this.grade = 'O';
  else if (percentage >= 80) this.grade = 'A+';
  else if (percentage >= 70) this.grade = 'A';
  else if (percentage >= 60) this.grade = 'B+';
  else if (percentage >= 50) this.grade = 'B';
  else if (percentage >= 40) this.grade = 'C';
  else this.grade = 'F';
  next();
});

module.exports = mongoose.model('Marks', marksSchema);
