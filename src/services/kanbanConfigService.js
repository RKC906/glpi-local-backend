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

  const colorCheck = await db.get('SELECT COUNT(*) as count FROM kanban_color');
  if (colorCheck.count === 0) {
    await db.run("INSERT INTO kanban_color (id_status, color) VALUES (1, '#f0f9ff'), (2, '#fffaf0'), (5, '#f0fdf4')");
  }

  const translationCheck = await db.get('SELECT COUNT(*) as count FROM kanban_translation');
  if (translationCheck.count === 0) {
    await db.run(`
      INSERT INTO kanban_translation (id_status, langue, translation) VALUES 
      (1, 'fr', 'Nouveau'),
      (2, 'fr', 'En Cours'),
      (5, 'fr', 'Résolu'),
      (1, 'mg', 'Vaovao'),
      (2, 'mg', 'Efa manao'),
      (5, 'mg', 'Vita')
    `);
  }

  // 3. Langue active par défaut (si elle n'est pas déjà définie)
  const langCheck = await db.get("SELECT COUNT(*) as count FROM kanban_settings WHERE cle = 'current_lang'");
  if (langCheck.count === 0) {
    await db.run("INSERT INTO kanban_settings (cle, valeur) VALUES ('current_lang', 'fr')");
    console.log("🌐 Langue par défaut initialisée sur : fr");
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
      if (configs.colors) {
        for (const col of configs.colors) {
          await db.run(
            `INSERT INTO kanban_color (id_status, color) VALUES (?, ?)
             ON CONFLICT(id_status) DO UPDATE SET color = EXCLUDED.color`,
            [col.id_status, col.color]
          );
        }
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
      return await db.all('SELECT * FROM tickets_costs');
    } catch (error) {
      console.error("Erreur lors de la récupération des coûts SQLite:", error);
      throw error;
    }
  },

  async UpdateCosts(id,amount) {
    const db = await getDb();
    try 
    {
      const result = await db.run(
        `UPDATE FROM tickets_costs amount = ? WHERE id = ?`,
        [amount, id]
      );
      return { success: true, id: result.lastID };
    } catch (error) {
      console.error("Erreur SQLite lors de l'insertion du coût:", error);
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
  },

async addReopeningCost(ticketId, percentage, mode) {
    const db = await getDb();
    try {
      const activeMode = String(mode || '1').trim();
      let baseAmount = 0;

if (activeMode === '1') {
        const row = await db.get(
          `SELECT amount FROM tickets_costs 
           WHERE ticket_id = ? AND (label NOT LIKE '%Réouverture%' OR label IS NULL) 
           ORDER BY id DESC LIMIT 1`,
          [ticketId]
        );
        baseAmount = row ? row.amount : 0;
      } 
      else if (activeMode === '2') {
        const row = await db.get(
          `SELECT amount FROM tickets_costs 
           WHERE ticket_id = ? AND (label NOT LIKE '%Réouverture%' OR label IS NULL) 
           ORDER BY id ASC LIMIT 1`,
          [ticketId]
        );
        baseAmount = row ? row.amount : 0;
      } 
      else if (activeMode === '3') {
        const row = await db.get(
          `SELECT AVG(amount) as moy FROM tickets_costs 
           WHERE ticket_id = ? AND (label NOT LIKE '%Réouverture%' OR label IS NULL)`,
          [ticketId]
        );
        baseAmount = row && row.moy !== null ? row.moy : 0;
      } 
      else if (activeMode === '4') {
        const row = await db.get(
          `SELECT SUM(amount) as total FROM tickets_costs 
           WHERE ticket_id = ? AND (label NOT LIKE '%Réouverture%' OR label IS NULL)`,
          [ticketId]
        );
        baseAmount = row && row.total !== null ? row.total : 0;
      }

      // Calcul final du surcoût basé uniquement sur les coûts réguliers
      const reopeningAmount = baseAmount * (parseFloat(percentage) / 100);
      const label = `Réouverture (Mode ${activeMode} - ${percentage}%)`;
      const date = new Date().toISOString().slice(0, 10);

      const result = await db.run(
        `INSERT INTO tickets_costs (ticket_id, amount, label, date) VALUES (?, ?, ?, ?)`,
        [ticketId, reopeningAmount, label, date]
      );
      return { success: true, id: result.lastID };
    } catch (error) {
      console.error("Erreur SQLite lors de l'ajout du coût de réouverture:", error);
      throw error;
    }
  },
  async resetFullDatabase() {
    const db = await getDb();
    try {
      await db.run('BEGIN TRANSACTION');
      
      // Suppression complète de toutes les tables applicatives
      await db.run('DROP TABLE IF EXISTS tickets_costs');
      await db.run('DROP TABLE IF EXISTS kanban_color');
      await db.run('DROP TABLE IF EXISTS kanban_translation');
      await db.run('DROP TABLE IF EXISTS kanban_settings');
      
      await db.run('COMMIT');

      // Relance l'initialisation pour recréer les tables vides
      // et réinjecter TOUTES les valeurs d'origine (couleurs, langues, translations)
      await initDb();
      
      console.log("💥 Base SQLite entièrement remise à zéro avec succès.");
      return { success: true };
    } catch (error) {
      await db.run('ROLLBACK');
      console.error("Erreur lors de la réinitialisation totale de SQLite :", error);
      throw error;
    }
  }
};

module.exports = { kanbanConfigService, initDb };