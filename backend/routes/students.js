const express = require('express');
const router = express.Router();
const { getStudents, getStudent, createStudent, updateStudent, deleteStudent, bulkUpload, updateSkills, downloadSampleCSV } = require('../controllers/studentController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/', adminOnly, getStudents);
router.get('/sample/template', adminOnly, downloadSampleCSV);
router.post('/', adminOnly, createStudent);
router.post('/bulk-upload', adminOnly, upload.single('file'), bulkUpload);
router.get('/:id', getStudent);
router.put('/:id', adminOnly, updateStudent);
router.put('/:id/skills', adminOnly, updateSkills);
router.delete('/:id', adminOnly, deleteStudent);

module.exports = router;
