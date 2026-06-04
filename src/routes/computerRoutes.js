const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ==========================================
// 1. READ (Lire tous les ordinateurs locaux)
// GET http://localhost:3000/api/local-computers
// ==========================================
router.get('/', (req, res) => {
  db.all('SELECT * FROM local_computers', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// ==========================================
// 2. CREATE (Ajouter un ordinateur local)
// POST http://localhost:3000/api/local-computers
// ==========================================
router.post('/', (req, res) => {
  // On récupère les données envoyées par le formulaire Vue 3
  const { glpi_id, name, notes } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Le nom de l'ordinateur est obligatoire." });
  }

  const sql = 'INSERT INTO local_computers (glpi_id, name, notes) VALUES (?, ?, ?)';
  const params = [glpi_id || null, name, notes || ''];

  // db.run exécute la requête sans retourner de lignes (parfait pour INSERT, UPDATE, DELETE)
  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // "this.lastID" contient l'ID auto-incrémenté généré par SQLite
    res.status(201).json({
      message: "Ordinateur local créé avec succès !",
      id: this.lastID
    });
  });
});

// ==========================================
// 3. UPDATE (Modifier un ordinateur local)
// PUT http://localhost:3000/api/local-computers/:id
// ==========================================
router.put('/:id', (req, res) => {
  const { id } = req.params; // On récupère l'ID depuis l'URL
  const { glpi_id, name, notes } = req.body;

  const sql = 'UPDATE local_computers SET glpi_id = ?, name = ?, notes = ? WHERE id = ?';
  const params = [glpi_id || null, name, notes || '', id];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // "this.changes" contient le nombre de lignes modifiées
    if (this.changes === 0) {
      return res.status(404).json({ message: "Ordinateur introuvable dans la base locale." });
    }
    res.json({ message: "Ordinateur local mis à jour avec succès !" });
  });
});

// ==========================================
// 4. DELETE (Supprimer un ordinateur local)
// DELETE http://localhost:3000/api/local-computers/:id
// ==========================================
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'DELETE FROM local_computers WHERE id = ?';

  db.run(sql, id, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Ordinateur introuvable." });
    }
    res.json({ message: "Ordinateur local supprimé avec succès de SQLite !" });
  });
});

module.exports = router;