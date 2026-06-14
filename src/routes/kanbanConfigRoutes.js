const express = require('express');
const { kanbanConfigController } = require('../controllers/kanbanConfigController');

const router = express.Router();

router.get('/kanban/config', kanbanConfigController.getSettings);
router.post('/kanban/config', kanbanConfigController.saveSettings);
router.post('/kanban/costs', kanbanConfigController.saveCosts);
router.get('/kanban/costs/all', kanbanConfigController.getAllCosts);

// 🛠️ Routes d'interception de colonnes
router.delete('/kanban/costs/delete/:ticket_id', kanbanConfigController.cancelCosts);
router.post('/kanban/costs/reopen', kanbanConfigController.reopenTicket);

module.exports = router;
