const Assignment = require('../models/Assignment');
const Presentation = require('../models/Presentation');
const LabTask = require('../models/LabTask');
const Project = require('../models/Project');
const Student = require('../models/Student');
const XLSX = require('xlsx');
const fs = require('fs');

/**
 * ALLOCATION LOGIC:
 *
 * Assignments / Presentations / Projects:
 *   - Filter students by department + semester (+ batch if provided)
 *   - For each topic, pick `studentsPerTopic` students (default = Math.ceil(totalStudents / topics))
 *   - No student gets the same topic twice
 *   - Shuffle before allocation for fairness
 *
 * Lab Tasks:
 *   - Filter students by department (+ semester/batch if provided)
 *   - Every student in that department gets EVERY lab task
 */

// ── helpers ──────────────────────────────────────────────────────────────────

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

/**
 * Distribute topics to students so that each topic gets exactly `perTopic` students.
 * Students are assigned in round-robin order across topics.
 * Returns: [{ topic, student }]
 */
function distributeTopics(topics, students, perTopic) {
  const shuffled = shuffle(students);
  const allocations = [];

  // Build a "seat pool": each topic repeated perTopic times
  const seats = [];
  for (const topic of topics) {
    for (let i = 0; i < perTopic; i++) seats.push(topic);
  }

  // Assign students round-robin to seats
  for (let i = 0; i < seats.length; i++) {
    allocations.push({ topic: seats[i], student: shuffled[i % shuffled.length] });
  }
  return allocations;
}

// ── parse uploaded Excel/CSV topics file ──────────────────────────────────────
function parseTopicsFile(filePath) {
  const ext = filePath.split('.').pop().toLowerCase();
  let rows = [];
  if (ext === 'xlsx' || ext === 'xls') {
    const wb = XLSX.readFile(filePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(ws);
  } else if (ext === 'csv') {
    const wb = XLSX.readFile(filePath, { raw: false });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(ws);
  }
  return rows.map(r => ({
    title: r.title || r.Title || r.TITLE || '',
    description: r.description || r.Description || r.DESCRIPTION || '',
  })).filter(r => r.title);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASSIGNMENTS
// ═══════════════════════════════════════════════════════════════════════════════

const getAssignments = async (req, res) => {
  try {
    const { department, semester, batch, status } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = Number(semester);
    if (batch) filter.batch = batch;
    if (status) filter.status = status;
    const assignments = await Assignment.find(filter)
      .populate('allocatedTo', 'name studentId rollNumber department')
      .sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const createAndAllocateAssignments = async (req, res) => {
  try {
    // topics can come from body OR uploaded file
    let topics = [];
    if (req.file) {
      topics = parseTopicsFile(req.file.path);
      fs.unlinkSync(req.file.path);
    } else {
      topics = req.body.topics || [];
      if (typeof topics === 'string') topics = JSON.parse(topics);
    }
    if (!topics.length) return res.status(400).json({ message: 'No topics provided' });

    const { subject, dueDate, batch, semester, department, studentsPerTopic, maxMarks } = req.body;
    if (!department) return res.status(400).json({ message: 'Department is required' });

    const filter = { department, isActive: true };
    if (semester) filter.semester = Number(semester);
    if (batch) filter.batch = batch;

    const students = await Student.find(filter);
    if (!students.length) return res.status(400).json({ message: `No students found in ${department}` });

    // default: divide students evenly across topics
    const perTopic = studentsPerTopic
      ? Number(studentsPerTopic)
      : Math.ceil(students.length / topics.length);

    const pairs = distributeTopics(topics, students, perTopic);

    const created = await Assignment.insertMany(pairs.map(({ topic, student }) => ({
      title: topic.title,
      description: topic.description || '',
      subject, dueDate, batch, department,
      semester: semester ? Number(semester) : undefined,
      allocatedTo: student._id,
      maxMarks: maxMarks ? Number(maxMarks) : 100,
      createdBy: req.user._id,
    })));

    res.status(201).json({
      message: `${created.length} assignments allocated across ${topics.length} topics (${perTopic} students/topic)`,
      count: created.length,
      topics: topics.length,
      students: students.length,
      perTopic,
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const submitAssignment = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const assignment = await Assignment.findOne({ _id: req.params.id, allocatedTo: student._id });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found or not allocated to you' });

    assignment.submittedFile = req.file ? req.file.filename : null;
    assignment.submissionText = req.body.submissionText || '';
    assignment.submittedAt = new Date();
    assignment.status = 'submitted';
    await assignment.save();
    res.json({ message: 'Assignment submitted', assignment });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const approveAssignment = async (req, res) => {
  try {
    const { status, adminFeedback, obtainedMarks } = req.body;
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id, { status, adminFeedback, obtainedMarks }, { new: true }
    ).populate('allocatedTo', 'name studentId');
    res.json(assignment);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getMyAssignments = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const assignments = await Assignment.find({ allocatedTo: student._id });
    res.json(assignments);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteAssignment = async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRESENTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

const getPresentations = async (req, res) => {
  try {
    const { department, semester, batch, status } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = Number(semester);
    if (batch) filter.batch = batch;
    if (status) filter.status = status;
    const presentations = await Presentation.find(filter)
      .populate('allocatedTo', 'name studentId rollNumber department')
      .sort({ createdAt: -1 });
    res.json(presentations);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const createAndAllocatePresentations = async (req, res) => {
  try {
    let topics = [];
    if (req.file) {
      topics = parseTopicsFile(req.file.path);
      fs.unlinkSync(req.file.path);
    } else {
      topics = req.body.topics || [];
      if (typeof topics === 'string') topics = JSON.parse(topics);
    }
    if (!topics.length) return res.status(400).json({ message: 'No topics provided' });

    const { subject, dueDate, batch, semester, department, studentsPerTopic, maxMarks } = req.body;
    if (!department) return res.status(400).json({ message: 'Department is required' });

    const filter = { department, isActive: true };
    if (semester) filter.semester = Number(semester);
    if (batch) filter.batch = batch;

    const students = await Student.find(filter);
    if (!students.length) return res.status(400).json({ message: `No students found in ${department}` });

    const perTopic = studentsPerTopic
      ? Number(studentsPerTopic)
      : Math.ceil(students.length / topics.length);

    const pairs = distributeTopics(topics, students, perTopic);

    const created = await Presentation.insertMany(pairs.map(({ topic, student }) => ({
      title: topic.title,
      description: topic.description || '',
      subject, dueDate, batch, department,
      semester: semester ? Number(semester) : undefined,
      allocatedTo: student._id,
      maxMarks: maxMarks ? Number(maxMarks) : 100,
      createdBy: req.user._id,
    })));

    res.status(201).json({
      message: `${created.length} presentations allocated across ${topics.length} topics (${perTopic} students/topic)`,
      count: created.length, topics: topics.length, students: students.length, perTopic,
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const submitPresentation = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const pres = await Presentation.findOne({ _id: req.params.id, allocatedTo: student._id });
    if (!pres) return res.status(404).json({ message: 'Presentation not found' });
    if (!req.file) return res.status(400).json({ message: 'PPT file is required' });
    pres.submittedFile = req.file.filename;
    pres.submittedAt = new Date();
    pres.status = 'submitted';
    await pres.save();
    res.json({ message: 'Presentation submitted', pres });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const approvePresentation = async (req, res) => {
  try {
    const { status, adminFeedback, obtainedMarks } = req.body;
    const pres = await Presentation.findByIdAndUpdate(
      req.params.id, { status, adminFeedback, obtainedMarks }, { new: true }
    ).populate('allocatedTo', 'name studentId');
    res.json(pres);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getMyPresentations = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const presentations = await Presentation.find({ allocatedTo: student._id });
    res.json(presentations);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// LAB TASKS — allocated to entire department
// ═══════════════════════════════════════════════════════════════════════════════

const getLabTasks = async (req, res) => {
  try {
    const { department, semester, batch } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = Number(semester);
    if (batch) filter.batch = batch;
    const tasks = await LabTask.find(filter)
      .populate('allocatedTo', 'name studentId rollNumber department')
      .sort({ labNumber: 1, createdAt: -1 });
    res.json(tasks);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const createAndAllocateLabTasks = async (req, res) => {
  try {
    // tasks list from body or file
    let taskList = [];
    if (req.file) {
      taskList = parseTopicsFile(req.file.path);
      fs.unlinkSync(req.file.path);
    } else {
      taskList = req.body.tasks || [];
      if (typeof taskList === 'string') taskList = JSON.parse(taskList);
    }
    if (!taskList.length) return res.status(400).json({ message: 'No lab tasks provided' });

    const { subject, dueDate, batch, semester, department, maxMarks } = req.body;
    if (!department) return res.status(400).json({ message: 'Department is required' });

    // Lab tasks → ALL students in the department (optionally filtered by semester/batch)
    const filter = { department, isActive: true };
    if (semester) filter.semester = Number(semester);
    if (batch) filter.batch = batch;

    const students = await Student.find(filter);
    if (!students.length) return res.status(400).json({ message: `No students found in ${department}` });

    const docs = [];
    taskList.forEach((taskData, idx) => {
      students.forEach(student => {
        docs.push({
          title: taskData.title,
          description: taskData.description || '',
          labNumber: taskData.labNumber || (idx + 1),
          subject, dueDate, batch, department,
          semester: semester ? Number(semester) : undefined,
          allocatedTo: student._id,
          maxMarks: maxMarks ? Number(maxMarks) : 100,
          createdBy: req.user._id,
        });
      });
    });

    const created = await LabTask.insertMany(docs);
    res.status(201).json({
      message: `${taskList.length} lab tasks allocated to all ${students.length} students in ${department}`,
      count: created.length,
      tasks: taskList.length,
      students: students.length,
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const submitLabTask = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const task = await LabTask.findOne({ _id: req.params.id, allocatedTo: student._id });
    if (!task) return res.status(404).json({ message: 'Lab task not found' });
    task.submittedFile = req.file ? req.file.filename : null;
    task.submissionText = req.body.submissionText || '';
    task.submittedAt = new Date();
    task.status = 'submitted';
    await task.save();
    res.json({ message: 'Lab task submitted', task });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const approveLabTask = async (req, res) => {
  try {
    const { status, adminFeedback, obtainedMarks } = req.body;
    const task = await LabTask.findByIdAndUpdate(
      req.params.id,
      { status, adminFeedback, obtainedMarks, approvedAt: status === 'approved' ? new Date() : null },
      { new: true }
    ).populate('allocatedTo', 'name studentId');
    res.json(task);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getMyLabTasks = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const tasks = await LabTask.find({ allocatedTo: student._id }).sort({ labNumber: 1 });
    res.json(tasks);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════════════════════════════════════════════

const getProjects = async (req, res) => {
  try {
    const { department, semester, batch, status } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = Number(semester);
    if (batch) filter.batch = batch;
    if (status) filter.status = status;
    const projects = await Project.find(filter)
      .populate('allocatedTo', 'name studentId rollNumber department')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const createAndAllocateProjects = async (req, res) => {
  try {
    let topics = [];
    if (req.file) {
      topics = parseTopicsFile(req.file.path);
      fs.unlinkSync(req.file.path);
    } else {
      topics = req.body.topics || [];
      if (typeof topics === 'string') topics = JSON.parse(topics);
    }
    if (!topics.length) return res.status(400).json({ message: 'No project topics provided' });

    const { subject, dueDate, batch, semester, department, studentsPerTopic, maxMarks } = req.body;
    if (!department) return res.status(400).json({ message: 'Department is required' });

    const filter = { department, isActive: true };
    if (semester) filter.semester = Number(semester);
    if (batch) filter.batch = batch;

    const students = await Student.find(filter);
    if (!students.length) return res.status(400).json({ message: `No students found in ${department}` });

    const perTopic = studentsPerTopic
      ? Number(studentsPerTopic)
      : Math.ceil(students.length / topics.length);

    const pairs = distributeTopics(topics, students, perTopic);

    const created = await Project.insertMany(pairs.map(({ topic, student }) => ({
      title: topic.title,
      description: topic.description || '',
      subject: subject || '',
      dueDate, batch, department,
      semester: semester ? Number(semester) : undefined,
      allocatedTo: student._id,
      maxMarks: maxMarks ? Number(maxMarks) : 100,
      status: 'allocated',
      createdBy: req.user._id,
    })));

    res.status(201).json({
      message: `${created.length} projects allocated across ${topics.length} topics (${perTopic} students/topic)`,
      count: created.length, topics: topics.length, students: students.length, perTopic,
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const approveProject = async (req, res) => {
  try {
    const { status, adminFeedback, obtainedMarks } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { status, adminFeedback, obtainedMarks, approvedAt: status === 'approved' ? new Date() : null },
      { new: true }
    ).populate('allocatedTo', 'name studentId');
    res.json(project);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getMyProjects = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const projects = await Project.find({ allocatedTo: student._id });
    res.json(projects);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// Download sample Excel template for bulk topic upload
const downloadTopicsTemplate = (req, res) => {
  const wb = XLSX.utils.book_new();
  const data = [
    { title: 'Topic 1 Title', description: 'Brief description of this topic' },
    { title: 'Topic 2 Title', description: 'Brief description of this topic' },
    { title: 'Topic 3 Title', description: 'Optional - can be left blank' },
  ];
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [{ wch: 40 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Topics');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="topics-template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
};

module.exports = {
  getAssignments, createAndAllocateAssignments, submitAssignment, approveAssignment, getMyAssignments, deleteAssignment,
  getPresentations, createAndAllocatePresentations, submitPresentation, approvePresentation, getMyPresentations,
  getLabTasks, createAndAllocateLabTasks, submitLabTask, approveLabTask, getMyLabTasks,
  getProjects, createAndAllocateProjects, approveProject, getMyProjects,
  downloadTopicsTemplate,
};
