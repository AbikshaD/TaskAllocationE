const express = require('express');
const router = express.Router();
const { protect, hostOnly } = require('../middleware/auth');
const { getAdmins, createAdmin, updateAdmin, resetAdminPassword, deleteAdmin, addAdminMapping, removeAdminMapping, getSystemStats } = require('../controllers/hostController');

router.use(protect, hostOnly);

router.get('/stats', getSystemStats);
router.get('/admins', getAdmins);
router.post('/admins', createAdmin);
router.put('/admins/:id', updateAdmin);
router.patch('/admins/:id/reset-password', resetAdminPassword);
router.delete('/admins/:id', deleteAdmin);

router.post('/admins/:id/mappings', addAdminMapping);
router.delete('/admins/:id/mappings/:mappingId', removeAdminMapping);

module.exports = router;
