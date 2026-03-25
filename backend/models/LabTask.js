const mongoose = require('mongoose');

const labTaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  subject: { type: String, required: true },
  labNumber: { type: Number },
  dueDate: { type: Date, required: true },
  allocatedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  status: { 
    type: String, 
    enum: ['allocated', 'completed', 'approved'], 
    default: 'allocated' 
  },
  adminFeedback: { type: String },
  maxMarks: { type: Number, default: 25 },
  obtainedMarks: { type: Number },
  approvedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  department: { type: String },
  batch: { type: String },
  year: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('LabTask', labTaskSchema);
