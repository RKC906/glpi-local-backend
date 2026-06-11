const express = require('express');
const cors = require('cors');
const kanbanRoutes = require('./src/routes/kanbanConfigRoutes');
// 1. On importe la fonction d'initialisation de la base de données
const { initDb } = require('./src/services/kanbanConfigService');

const app = express();
const PORT = 3005;

// Configuration des Middlewares globaux
app.use(cors());
app.use(express.json());

// Routes applicatives
app.use('/api', kanbanRoutes); 
// Note : J'ai changé le préfixe à '/api'. 
// Ainsi, tes endpoints seront bien : http://localhost:3005/api/kanban/config

// 2. Fonction asynchrone pour initialiser SQLite AVANT de lancer Express
const startServer = async () => {
  try {
    console.log('Initialisation de la base de données SQLite...');
    await initDb();
    console.log('Base de données SQLite prête.');

    // Démarrage du serveur uniquement si la BDD est opérationnelle
    app.listen(PORT, () => {
      console.log(`Le serveur Express tourne sur http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Impossible de démarrer le serveur suite à une erreur SQLite :', error);
    process.exit(1); // Arrête le script en cas d'échec critique
  }
};

startServer();