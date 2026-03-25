const User = require('../models/User');
const Student = require('../models/Student');
const Assignment = require('../models/Assignment');
const Presentation = require('../models/Presentation');
const LabTask = require('../models/LabTask');
const Project = require('../models/Project');
const Marks = require('../models/Marks');

// ===== ADMIN MANAGEMENT =====
const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password').sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const createAdmin = async (req, res) => {
  try {
    const { name, email, password, department, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, password are required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const admin = await User.create({
      name, email, password, role: 'admin',
      department: department || '',
      phone: phone || '',
      createdBy: req.user._id,
    });
    res.status(201).json({
      _id: admin._id, name: admin.name, email: admin.email,
      department: admin.department, isActive: admin.isActive,
      message: 'Admin created successfully',
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateAdmin = async (req, res) => {
  try {
    const { name, email, department, phone, isActive } = req.body;
    const admin = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'admin' },
      { name, email, department, phone, isActive },
      { new: true }
    ).select('-password');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.json(admin);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const resetAdminPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const admin = await User.findOne({ _id: req.params.id, role: 'admin' });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    admin.password = newPassword;
    await admin.save();
    res.json({ message: 'Password reset successfully' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteAdmin = async (req, res) => {
  try {
    const admin = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'admin' },
      { isActive: false },
      { new: true }
    );
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.json({ message: 'Admin deactivated successfully' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ===== SYSTEM OVERVIEW =====
const getSystemStats = async (req, res) => {
  try {
    const [admins, students, assignments, presentations, labTasks, projects, marks] = await Promise.all([
      User.countDocuments({ role: 'admin', isActive: true }),
      Student.countDocuments({ isActive: true }),
      Assignment.countDocuments(),
      Presentation.countDocuments(),
      LabTask.countDocuments(),
      Project.countDocuments(),
      Marks.countDocuments(),
    ]);

    const recentAdmins = await User.find({ role: 'admin' }).select('-password').sort({ createdAt: -1 }).limit(5);
    const recentStudents = await Student.find({ isActive: true }).sort({ createdAt: -1 }).limit(5);

    // Department breakdown
    const deptBreakdown = await Student.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      counts: { admins, students, assignments, presentations, labTasks, projects, marks },
      recentAdmins,
      recentStudents,
      deptBreakdown,
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getAdmins, createAdmin, updateAdmin, resetAdminPassword, deleteAdmin, getSystemStats };
