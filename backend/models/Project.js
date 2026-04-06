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
  year: { type: String },
  reviewProgress: {
    startDate: { type: Date },
    totalDuration: { type: Number }, // in days
    phases: [
      {
        phaseNumber: { type: Number, enum: [1, 2, 3] },
        dueDate: { type: Date },
        status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
        feedback: { type: String },
        completedAt: { type: Date },
      }
    ],
    createdAt: { type: Date },
  },
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
