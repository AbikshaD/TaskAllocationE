const Student = require('../models/Student');
const User = require('../models/User');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');

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

// Create student
const createStudent = async (req, res) => {
  try {
    const { name, email, department, year, batch, skills } = req.body;
    
    console.log('📝 Creating student:', { name, email, department, year, batch });
    
    // Validation
    if (!name || !email || !department || !batch) {
      return res.status(400).json({ message: 'Missing required fields: name, email, department, batch' });
    }
    
    // Check existing email
    const existingEmail = await Student.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: 'Email already exists' });

    // Create student
    const student = await Student.create({ name, email, department, year: year || 'First Year', batch, skills: skills || [] });
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
    const student = await Student.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    await User.findOneAndUpdate({ studentId: student.studentId }, { isActive: false });
    res.json({ message: 'Student deactivated successfully' });
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

    for (const data of studentsData) {
      try {
        const student = await Student.create({
          name: data.name || data.Name,
          email: data.email || data.Email,
          department: data.department || data.Department,
          year: data.year || data.Year,
          batch: data.batch || data.Batch,
          skills: (data.skills || data.Skills || '').split(',').map(s => s.trim()).filter(Boolean),
        });

        const defaultPassword = `${student.studentId}@123`;
        const user = await User.create({
          name: student.name,
          email: student.email,
          password: defaultPassword,
          role: 'student',
          studentId: student.studentId,
        });
        student.userId = user._id;
        await student.save();

        results.success.push({ name: student.name, studentId: student.studentId, defaultPassword });
      } catch (err) {
        results.failed.push({ data, error: err.message });
      }
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
      { name: 'Priya Sharma', email: 'priya.sharma@college.edu', department: 'Computer Science', year: 'Second Year', batch: '2023-2027', skills: 'Python,Java,JavaScript' },
      { name: 'Aarav Singh', email: 'aarav.singh@college.edu', department: 'Computer Science', year: 'Second Year', batch: '2023-2027', skills: 'React,Node.js,MongoDB' },
      { name: 'Zara Khan', email: 'zara.khan@college.edu', department: 'Information Technology', year: 'First Year', batch: '2022-2026', skills: 'Python,Machine Learning,Data Science' },
      { name: 'Rohan Patel', email: 'rohan.patel@college.edu', department: 'Computer Science', year: 'First Year', batch: '2023-2027', skills: 'C++,Java,Python' },
      { name: 'Neha Gupta', email: 'neha.gupta@college.edu', department: 'Information Technology', year: 'Second Year', batch: '2022-2026', skills: 'Java,Spring Boot,SQL' },
    ];

    // Create CSV header
    const headers = ['name', 'email', 'department', 'year', 'batch', 'skills'];
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => 
        `"${row.name}","${row.email}","${row.department}","${row.year}","${row.batch}","${row.skills}"`
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

module.exports = { getStudents, getStudent, createStudent, updateStudent, deleteStudent, bulkUpload, updateSkills, downloadSampleCSV };
