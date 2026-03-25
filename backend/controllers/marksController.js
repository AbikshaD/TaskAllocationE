const Marks = require('../models/Marks');
const Student = require('../models/Student');

// Get all marks (admin)
const getAllMarks = async (req, res) => {
  try {
    const { student, semester, subject, academicYear } = req.query;
    const filter = {};
    if (student) filter.student = student;
    if (semester) filter.semester = Number(semester);
    if (subject) filter.subject = { $regex: subject, $options: 'i' };
    if (academicYear) filter.academicYear = academicYear;
    
    const marks = await Marks.find(filter).populate('student', 'name studentId rollNumber department').sort({ createdAt: -1 });
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student's own marks
const getMyMarks = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    const marks = await Marks.find({ student: student._id }).sort({ semester: 1, subject: 1 });
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create marks entry
const createMarks = async (req, res) => {
  try {
    const { student, subject, subjectCode, semester, internalMarks, externalMarks, examType, academicYear } = req.body;
    
    const existing = await Marks.findOne({ student, subject, semester, academicYear, examType });
    if (existing) return res.status(400).json({ message: 'Marks already entered for this subject/semester/exam type' });
    
    const marks = await Marks.create({
      student, subject, subjectCode, semester, internalMarks: internalMarks || 0,
      externalMarks: externalMarks || 0, examType, academicYear, enteredBy: req.user._id
    });
    
    await marks.populate('student', 'name studentId');
    res.status(201).json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update marks
const updateMarks = async (req, res) => {
  try {
    const marks = await Marks.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('student', 'name studentId');
    if (!marks) return res.status(404).json({ message: 'Marks not found' });
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete marks
const deleteMarks = async (req, res) => {
  try {
    await Marks.findByIdAndDelete(req.params.id);
    res.json({ message: 'Marks deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get marks summary for a student
const getStudentMarksSummary = async (req, res) => {
  try {
    const marks = await Marks.find({ student: req.params.studentId });
    const summary = marks.reduce((acc, m) => {
      const key = `Sem ${m.semester}`;
      if (!acc[key]) acc[key] = { subjects: [], avgGrade: 0 };
      acc[key].subjects.push({ subject: m.subject, total: m.totalMarks, grade: m.grade });
      return acc;
    }, {});
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllMarks, getMyMarks, createMarks, updateMarks, deleteMarks, getStudentMarksSummary };
