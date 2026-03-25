const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ===== HOST LOGIN =====
const hostLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: 'host' });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid host credentials' });
    }
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id) });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ===== ADMIN LOGIN =====
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: 'admin' });
    if (!user || !user.isActive || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials or account deactivated' });
    }
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, department: user.department, token: generateToken(user._id) });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ===== STUDENT LOGIN =====
const studentLogin = async (req, res) => {
  try {
    const { studentId, password } = req.body;
    const user = await User.findOne({ studentId, role: 'student' });
    if (!user || !user.isActive) return res.status(401).json({ message: 'Invalid student ID or account deactivated' });
    if (!(await user.comparePassword(password))) return res.status(401).json({ message: 'Invalid student ID or password' });

    const student = await Student.findOne({ studentId });
    res.json({ _id: user._id, name: user.name, studentId: user.studentId, role: user.role, studentData: student, token: generateToken(user._id) });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ===== SETUP HOST (one-time) =====
const setupHost = async (req, res) => {
  try {
    const existing = await User.findOne({ role: 'host' });
    if (existing) return res.status(400).json({ message: 'Host already exists. Use host login.' });
    const { name, email, password } = req.body;
    const host = await User.create({ name: name || 'System Host', email: email || 'host@college.edu', password: password || 'Host@123', role: 'host' });
    res.status(201).json({ message: 'Host created successfully', email: host.email, note: 'Keep credentials safe. This can only be done once.' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ===== GET ME =====
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let studentData = null;
    if (user.role === 'student') studentData = await Student.findOne({ studentId: user.studentId });
    res.json({ ...user.toObject(), studentData });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { hostLogin, adminLogin, studentLogin, setupHost, getMe };
