const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function getDb() {
  return open({
    filename: path.resolve(process.cwd(), 'database.sqlite'),
    driver: sqlite3.Database
  });
}

const initDb = async () => {
  const db = await getDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS kanban_color (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_status INTEGER UNIQUE,
      color TEXT
    );
    CREATE TABLE IF NOT EXISTS kanban_translation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_status INTEGER,
      langue TEXT,
      translation TEXT,
      UNIQUE(id_status, langue)
    );
    /* Nouvelle table pour stocker la langue sélectionnée par défaut */
    CREATE TABLE IF NOT EXISTS kanban_settings (
      cle TEXT PRIMARY KEY,
      valeur TEXT
    );
  `);

  // Couleurs par défaut
  const colorCheck = await db.get('SELECT COUNT(*) as count FROM kanban_color');
  if (colorCheck.count === 0) {
    await db.run("INSERT INTO kanban_color (id_status, color) VALUES (1, '#f0f9ff'), (2, '#fffaf0'), (5, '#f0fdf4')");
  }

  // Dictionnaire fixe
  const transCheck = await db.get("SELECT COUNT(*) as count FROM kanban_translation");
  if (transCheck.count === 0) {
    await db.run(`
      INSERT INTO kanban_translation (id_status, langue, translation) VALUES 
      (1, 'fr', 'Nouveau'), (2, 'fr', 'En Cours'), (5, 'fr', 'Résolu'),
      (1, 'mg', 'Vaovao'), (2, 'mg', 'Efa manao'), (5, 'mg', 'Vita')
    `);
  }

  // Langue active par défaut (français au premier démarrage)
  const langCheck = await db.get("SELECT COUNT(*) as count FROM kanban_settings WHERE cle = 'current_lang'");
  if (langCheck.count === 0) {
    await db.run("INSERT INTO kanban_settings (cle, valeur) VALUES ('current_lang', 'fr')");
  }
};

const kanbanConfigService = {
  async getConfig() {
    const db = await getDb();
    const colors = await db.all('SELECT id_status, color FROM kanban_color');
    const translations = await db.all('SELECT id_status, langue, translation FROM kanban_translation');
    // Récupérer la langue active configurée
    const currentLangRow = await db.get("SELECT valeur FROM kanban_settings WHERE cle = 'current_lang'");
    
    return { 
      colors, 
      translations, 
      currentLang: currentLangRow ? currentLangRow.valeur : 'fr' 
    };
  },

async saveConfig(configs) {
  const db = await getDb();
  await db.run('BEGIN TRANSACTION');
  try {
    // 1. Sauvegarde des couleurs
    for (const col of configs.colors) {
      await db.run(
        `INSERT INTO kanban_color (id_status, color) VALUES (?, ?)
         ON CONFLICT(id_status) DO UPDATE SET color = EXCLUDED.color`,
        [col.id_status, col.color]
      );
    }
    
    // 2. Sauvegarde de la langue (S'assurer que la clé unique fonctionne)
    if (configs.currentLang) {
      await db.run(
        `INSERT INTO kanban_settings (cle, valeur) VALUES ('current_lang', ?)
         ON CONFLICT(cle) DO UPDATE SET valeur = EXCLUDED.valeur`,
        [configs.currentLang]
      );
    }
    
    await db.run('COMMIT');
    return { success: true };
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}
};

module.exports = { initDb, kanbanConfigService };