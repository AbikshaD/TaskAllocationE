const express = require('express');
const router = express.Router();
const { getAllMarks, getMyMarks, createMarks, updateMarks, deleteMarks, getStudentMarksSummary } = require('../controllers/marksController');
const { protect, adminOnly, studentOnly } = require('../middleware/auth');

router.use(protect);

router.get('/my', studentOnly, getMyMarks);
router.get('/', adminOnly, getAllMarks);
router.post('/', adminOnly, createMarks);
router.get('/summary/:studentId', getStudentMarksSummary);
router.put('/:id', adminOnly, updateMarks);
router.delete('/:id', adminOnly, deleteMarks);

module.exports = router;
