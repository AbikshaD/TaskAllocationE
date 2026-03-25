const mongoose = require('mongoose');

const presentationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  subject: { type: String, required: true },
  dueDate: { type: Date, required: true },
  allocatedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  submittedFile: { type: String }, // PPT file path
  submittedAt: { type: Date },
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

module.exports = mongoose.model('Presentation', presentationSchema);
