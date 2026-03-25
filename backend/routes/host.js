const express = require('express');
const router = express.Router();
const { protect, hostOnly } = require('../middleware/auth');
const { getAdmins, createAdmin, updateAdmin, resetAdminPassword, deleteAdmin, getSystemStats } = require('../controllers/hostController');

router.use(protect, hostOnly);

router.get('/stats', getSystemStats);
router.get('/admins', getAdmins);
router.post('/admins', createAdmin);
router.put('/admins/:id', updateAdmin);
router.patch('/admins/:id/reset-password', resetAdminPassword);
router.delete('/admins/:id', deleteAdmin);

module.exports = router;
