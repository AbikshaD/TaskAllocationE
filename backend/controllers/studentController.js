const Student = require('../models/Student');
const User = require('../models/User');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const mongoose = require('mongoose');

// Get all students
const getStudents = async (req, res) => {
  try {
    const { department, year, batch, search } = req.query;
    const filter = { isActive: true };
    if (department) filter.department = department;
    if (year) filter.year = year;
    if (batch) filter.batch = batch;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const students = await Student.find(filter).sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single student
const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createStudent = async (req, res) => {
  try {
    const { name, email, department, year, batch, rollNumber, studentId } = req.body;
    const finalId = rollNumber || studentId;
    
    console.log('📝 Creating student:', { name, email, department, year, batch, finalId });
    
    // Validation
    if (!name || !email || !department || !batch || !finalId) {
      return res.status(400).json({ message: 'Missing required fields: name, email, department, batch, rollNumber' });
    }
    
    // Check existing email
    const existing = await Student.findOne({ $or: [{ email }, { studentId: finalId }] });
    if (existing) return res.status(400).json({ message: 'Email or Roll Number already exists' });

    // Create student
    const student = await Student.create({ studentId: finalId, name, email, department, year: year || 'First Year', batch });
    console.log('✅ Student created:', student._id);

    // Create user account for student
    const defaultPassword = `${student.studentId}@123`;
    const user = await User.create({
      name,
      email,
      password: defaultPassword,
      role: 'student',
      studentId: student.studentId,
    });
    console.log('✅ User account created:', user._id);

    student.userId = user._id;
    await student.save();
    console.log('✅ Student saved with userId');

    res.status(201).json({
      student,
      credentials: { studentId: student.studentId, defaultPassword },
      message: 'Student created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating student:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    // Update user name/email if changed
    if (req.body.name || req.body.email) {
      await User.findOneAndUpdate(
        { studentId: student.studentId },
        { ...(req.body.name && { name: req.body.name }), ...(req.body.email && { email: req.body.email }) }
      );
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    await User.findOneAndDelete({ studentId: student.studentId });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete all students
const deleteAllStudents = async (req, res) => {
  try {
    await Student.deleteMany({});
    await User.deleteMany({ role: 'student' });
    res.json({ message: 'All students deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk upload students from Excel/CSV
const bulkUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    const ext = req.file.originalname.split('.').pop().toLowerCase();
    let studentsData = [];

    if (ext === 'xlsx' || ext === 'xls') {
      const workbook = XLSX.readFile(req.file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      studentsData = XLSX.utils.sheet_to_json(sheet);
    } else if (ext === 'csv') {
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (row) => studentsData.push(row))
          .on('end', resolve)
          .on('error', reject);
      });
    }

    const results = { success: [], failed: [] };

    // Gather existing emails and ids to validate entirely in memory (massive speed boost)
    const existingStudents = await Student.find({}, 'email studentId').lean();
    const existingEmails = new Set(existingStudents.map(s => s.email));
    const existingIds = new Set(existingStudents.map(s => s.studentId));

    const studentsToInsert = [];
    const usersToInsert = [];

    const batchEmails = new Set();
    const batchIds = new Set();

    for (const data of studentsData) {
      const finalId = data.rollNumber || data.RollNumber || data.studentId;
      const parsedEmail = data.email || data.Email;

      if (!data.name || !parsedEmail || !data.department || !finalId) {
        results.failed.push({ data, error: 'Missing required fields: rollNumber, name, email, department' });
        continue;
      }

      if (existingEmails.has(parsedEmail) || batchEmails.has(parsedEmail)) {
        results.failed.push({ data, error: `Email ${parsedEmail} already exists` });
        continue;
      }
      if (existingIds.has(finalId) || batchIds.has(finalId)) {
        results.failed.push({ data, error: `Roll Number ${finalId} already exists` });
        continue;
      }

      batchEmails.add(parsedEmail);
      batchIds.add(finalId);

      const studentObjId = new mongoose.Types.ObjectId();
      const userObjId = new mongoose.Types.ObjectId();
      const defaultPassword = `${finalId}@123`;
      const parsedName = data.name || data.Name;

      studentsToInsert.push({
        _id: studentObjId,
        studentId: finalId,
        name: parsedName,
        email: parsedEmail,
        department: data.department || data.Department,
        year: data.year || data.Year,
        batch: data.batch || data.Batch,
        userId: userObjId
      });

      usersToInsert.push({
        _id: userObjId,
        name: parsedName,
        email: parsedEmail,
        password: defaultPassword,
        role: 'student',
        studentId: finalId,
      });

      results.success.push({ name: parsedName, studentId: finalId, defaultPassword });
    }

    if (studentsToInsert.length > 0) {
      await Student.insertMany(studentsToInsert);
      await User.insertMany(usersToInsert);
    }

    fs.unlinkSync(req.file.path);
    res.json({ message: `Bulk upload complete. ${results.success.length} success, ${results.failed.length} failed.`, results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update student skills
const updateSkills = async (req, res) => {
  try {
    const { skills } = req.body;
    const student = await Student.findByIdAndUpdate(req.params.id, { skills }, { new: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download sample CSV for bulk upload
const downloadSampleCSV = (req, res) => {
  try {
    const sampleData = [
      { rollNumber: 'CS1001', name: 'Priya Sharma', email: 'priya.sharma@college.edu', department: 'Computer Science', year: 'Second Year', batch: '2023-2027' },
      { rollNumber: 'CS1002', name: 'Aarav Singh', email: 'aarav.singh@college.edu', department: 'Computer Science', year: 'Second Year', batch: '2023-2027' },
      { rollNumber: 'IT1001', name: 'Zara Khan', email: 'zara.khan@college.edu', department: 'Information Technology', year: 'First Year', batch: '2022-2026' },
      { rollNumber: 'CS1003', name: 'Rohan Patel', email: 'rohan.patel@college.edu', department: 'Computer Science', year: 'First Year', batch: '2023-2027' },
      { rollNumber: 'IT1002', name: 'Neha Gupta', email: 'neha.gupta@college.edu', department: 'Information Technology', year: 'Second Year', batch: '2022-2026' },
    ];

    // Create CSV header
    const headers = ['rollNumber', 'name', 'email', 'department', 'year', 'batch'];
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => 
        `"${row.rollNumber}","${row.name}","${row.email}","${row.department}","${row.year}","${row.batch}"`
      )
    ].join('\n');

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="sample-students.csv"');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStudents, getStudent, createStudent, updateStudent, deleteStudent, deleteAllStudents, bulkUpload, updateSkills, downloadSampleCSV };
