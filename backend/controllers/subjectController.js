const Subject = require('../models/Subject');

// Get all subjects
const getSubjects = async (req, res) => {
  try {
    const { department, year, search } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (year) filter.year = year;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }
    const subjects = await Subject.find(filter).sort({ title: 1 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a subject
const createSubject = async (req, res) => {
  try {
    const { name, code, department, year } = req.body;
    if (!name || !code || !department || !year) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }
    const existing = await Subject.findOne({ code });
    if (existing) {
      return res.status(400).json({ message: 'Subject with this code already exists' });
    }
    const subject = await Subject.create({ name, code, department, year });
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a subject
const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a subject
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSubjects, createSubject, updateSubject, deleteSubject };
