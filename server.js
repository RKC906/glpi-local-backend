const express = require('express');
const cors = require('cors');
const computerRoutes = require('./src/routes/computerRoutes');

const app = express();
const PORT = 3005;

// Configuration des Middlewares globaux
app.use(cors());
app.use(express.json());

// 🔌 Branchement de nos routes modulaires
// Toutes les routes écrites dans computerRoutes commenceront par /api/local-computers
app.use('/api/local-computers', computerRoutes);

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Le serveur Express tourne sur http://localhost:${PORT}`);
});