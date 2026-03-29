const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
