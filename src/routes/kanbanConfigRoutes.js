const express = require('express');
const { kanbanConfigController } = require('../controllers/kanbanConfigController');

const router = express.Router();

router.get('/kanban/config', kanbanConfigController.getSettings);
router.post('/kanban/config', kanbanConfigController.saveSettings);
router.post('/kanban/costs', kanbanConfigController.saveCosts);
router.get('/kanban/costs/all', kanbanConfigController.getAllCosts);
router.delete('/kanban/costs/delete/:ticket_id', kanbanConfigController.cancelCosts);
router.post('/kanban/costs/reopen', kanbanConfigController.reopenCosts);
router.post('/kanban/database/reset-all', kanbanConfigController.resetWholeDatabase);
router.post('/kanban/costs/update', kanbanConfigController.modifCosts);

module.exports = router;