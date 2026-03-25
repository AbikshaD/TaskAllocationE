const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true }, // Topic created by admin
  description: { type: String },
  subject: { type: String, required: true },
  dueDate: { type: Date, required: true },
  allocatedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }, // Random allocation
  submittedFile: { type: String }, // File path
  submittedAt: { type: Date },
  submissionText: { type: String },
  status: { 
    type: String, 
    enum: ['allocated', 'submitted', 'approved', 'rejected'], 
    default: 'allocated' 
  },
  adminFeedback: { type: String },
  maxMarks: { type: Number, default: 100 },
  obtainedMarks: { type: Number },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  department: { type: String },
  batch: { type: String },
  semester: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
