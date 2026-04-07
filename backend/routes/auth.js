const express = require('express');
const router = express.Router();
const { hostLogin, adminLogin, studentLogin, setupHost, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.use("/api/auth", authRoutes);

router.post('/host/login', hostLogin);
router.post('/admin/login', adminLogin);
router.post('/student/login', studentLogin);
router.post('/setup', setupHost);   // One-time setup
router.get('/setup', setupHost);    // GET for convenience
router.get('/me', protect, getMe);

module.exports = router;
