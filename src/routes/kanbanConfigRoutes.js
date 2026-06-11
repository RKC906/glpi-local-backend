const express = require('express');
const { kanbanConfigController } = require('../controllers/kanbanConfigController');

const router = express.Router();

router.get('/kanban/config', kanbanConfigController.getSettings);
router.post('/kanban/config', kanbanConfigController.saveSettings);

module.exports = router;