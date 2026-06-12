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
    CREATE TABLE IF NOT EXISTS kanban_settings (
      cle TEXT PRIMARY KEY,
      valeur TEXT
    );

    /* Structure de la table des coûts */
    CREATE TABLE IF NOT EXISTS tickets_costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER,
      amount REAL,
      label TEXT,
      date TEXT
    );
  `);

  // Couleurs par défaut
  const colorCheck = await db.get('SELECT COUNT(*) as count FROM kanban_color');
  if (colorCheck.count === 0) {
    await db.run("INSERT INTO kanban_color (id_status, color) VALUES (1, '#f0f9ff'), (2, '#fffaf0'), (5, '#f0fdf4')");
  }
};

const kanbanConfigService = {
  async getConfig() {
    const db = await getDb();
    const colors = await db.all('SELECT id_status, color FROM kanban_color');
    const translations = await db.all('SELECT id_status, langue, translation FROM kanban_translation');
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
      for (const col of configs.colors) {
        await db.run(
          `INSERT INTO kanban_color (id_status, color) VALUES (?, ?)
           ON CONFLICT(id_status) DO UPDATE SET color = EXCLUDED.color`,
          [col.id_status, col.color]
        );
      }
      
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
  },

  async saveCout(ticketId, amount, label, date) {
    const db = await getDb();
    try {
      const result = await db.run(
        `INSERT INTO tickets_costs (ticket_id, amount, label, date) VALUES (?, ?, ?, ?)`,
        [ticketId, amount, label, date || new Date().toISOString().slice(0, 10)]
      );
      return { success: true, id: result.lastID };
    } catch (error) {
      console.error("Erreur SQLite lors de l'insertion du coût:", error);
      throw error;
    }
  },

  async getAllCosts() {
    const db = await getDb();
    try {
      return await db.all('SELECT ticket_id, amount, label, date FROM tickets_costs');
    } catch (error) {
      console.error("Erreur lors de la récupération des coûts SQLite:", error);
      throw error;
    }
  },

async cancelLastCosts(id) {
  const db = await getDb();
  try {
    return await db.run(
      'DELETE FROM tickets_costs WHERE id = (SELECT MAX(id) FROM tickets_costs WHERE ticket_id = ?)', 
      [id]
    );
  } catch (error) {
    console.error("Erreur lors de la suppression du dernier coût SQLite:", error);
    throw error;
  }
}
};

module.exports = { kanbanConfigService, initDb };