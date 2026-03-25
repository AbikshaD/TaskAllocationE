const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  requiredSkills: [{ type: String }], // Skills required for this project
  dueDate: { type: Date, required: true },
  allocatedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  studentChosenSkills: [{ type: String }], // Skills student selected
  status: { 
    type: String, 
    enum: ['available', 'allocated', 'in-progress', 'completed', 'approved'], 
    default: 'available' 
  },
  adminFeedback: { type: String },
  maxMarks: { type: Number, default: 100 },
  obtainedMarks: { type: Number },
  approvedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  department: { type: String },
  batch: { type: String },
  semester: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
