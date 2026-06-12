const express = require('express');
const { kanbanConfigController } = require('../controllers/kanbanConfigController');

const router = express.Router();

router.get('/kanban/config', kanbanConfigController.getSettings);
router.post('/kanban/config', kanbanConfigController.saveSettings);
router.post('/kanban/costs', kanbanConfigController.saveCosts);

// On ne garde que la route qui donne l'historique complet des coûts au Front
router.get('/kanban/costs/all', kanbanConfigController.getAllCosts);
router.delete('/kanban/costs/delete/:ticket_id', kanbanConfigController.cancelCosts);
module.exports = router;