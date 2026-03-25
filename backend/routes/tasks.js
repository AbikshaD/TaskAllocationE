const express = require('express');
const router = express.Router();
const { protect, adminOnly, studentOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getAssignments, createAndAllocateAssignments, submitAssignment, approveAssignment, getMyAssignments, deleteAssignment,
  getPresentations, createAndAllocatePresentations, submitPresentation, approvePresentation, getMyPresentations,
  getLabTasks, createAndAllocateLabTasks, submitLabTask, approveLabTask, getMyLabTasks,
  getProjects, createAndAllocateProjects, approveProject, getMyProjects,
  downloadTopicsTemplate,
} = require('../controllers/taskController');

router.use(protect);

// === ASSIGNMENTS ===
router.get('/assignments', adminOnly, getAssignments);
router.post('/assignments/allocate', adminOnly, upload.single('topicsFile'), createAndAllocateAssignments);
router.put('/assignments/:id/approve', adminOnly, approveAssignment);
router.delete('/assignments/:id', adminOnly, deleteAssignment);
router.get('/assignments/my', studentOnly, getMyAssignments);
router.post('/assignments/:id/submit', studentOnly, upload.single('file'), submitAssignment);

// === PRESENTATIONS ===
router.get('/presentations', adminOnly, getPresentations);
router.post('/presentations/allocate', adminOnly, upload.single('topicsFile'), createAndAllocatePresentations);
router.put('/presentations/:id/approve', adminOnly, approvePresentation);
router.get('/presentations/my', studentOnly, getMyPresentations);
router.post('/presentations/:id/submit', studentOnly, upload.single('file'), submitPresentation);

// === LAB TASKS ===
router.get('/lab-tasks', adminOnly, getLabTasks);
router.post('/lab-tasks/allocate', adminOnly, upload.single('topicsFile'), createAndAllocateLabTasks);
router.put('/lab-tasks/:id/approve', adminOnly, approveLabTask);
router.get('/lab-tasks/my', studentOnly, getMyLabTasks);
router.post('/lab-tasks/:id/submit', studentOnly, upload.single('file'), submitLabTask);

// === PROJECTS ===
router.get('/projects', adminOnly, getProjects);
router.post('/projects/allocate', adminOnly, upload.single('topicsFile'), createAndAllocateProjects);
router.put('/projects/:id/approve', adminOnly, approveProject);
router.get('/projects/my', studentOnly, getMyProjects);

// Template download
router.get('/template/topics', protect, downloadTopicsTemplate);

module.exports = router;
