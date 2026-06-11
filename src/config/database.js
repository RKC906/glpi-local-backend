const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

// Ajuste le chemin si nécessaire (ici remonte de 2 dossiers pour mettre le .db à la racine)
const DB_FILE_PATH = path.resolve(__dirname, '../../local_data.db');

let db;

const ready = initSqlJs()
  .then((SQL) => {
    if (fs.existsSync(DB_FILE_PATH)) {
      const fileBuffer = fs.readFileSync(DB_FILE_PATH);
      db = new SQL.Database(new Uint8Array(fileBuffer));
    } else {
      db = new SQL.Database();
    }

    // Activation Foreign Key
    db.run("PRAGMA foreign_keys = ON");

    // Table Ordinateurs
    db.run(`CREATE TABLE IF NOT EXISTS local_computers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      glpi_id INTEGER,
      name TEXT,
      notes TEXT
    )`);

    // Table Périphériques (Correction de l'orthographe : periphericals -> peripherals)
    db.run(`CREATE TABLE IF NOT EXISTS local_peripherals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      glpi_id INTEGER,
      name TEXT
    )`);

    db.run(`
    CREATE TABLE IF NOT EXISTS title_language (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title_fr TEXT,
        title_mg TEXT
    )
    `);

    db.run(`
    CREATE TABLE IF NOT EXISTS kanban_title (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title_fr TEXT,
        title_mg TEXT
    )
    `);

    db.run(`
    CREATE TABLE IF NOT EXISTS kanban_settings (
        status_id INTEGER PRIMARY KEY,
        title_id INTEGER,
        color TEXT,
        bg TEXT,
        text_color TEXT,
        badge_bg TEXT,
        FOREIGN KEY (title_id) REFERENCES kanban_title(id)
      )
    `);

    persist();
    console.log('Connecté avec succès à la base SQLite locale.');
  })
  .catch((err) => {
    console.error('Erreur lors de la création de la base SQLite :', err.message);
    throw err;
  });

const persist = () => {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_FILE_PATH, Buffer.from(data));
};

const fetchRows = (stmt) => {
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  return rows;
};

const fetchLastInsertId = () => {
  const result = db.exec('SELECT last_insert_rowid() AS id');
  if (!result[0] || !result[0].values || !result[0].values[0]) {
    return null;
  }
  return result[0].values[0][0];
};

const run = (sql, params, callback) => {
  ready
    .then(() => {
      const statement = db.prepare(sql);
      statement.bind(params || []);
      statement.step();
      const changes = db.getRowsModified();
      statement.free();

      // 💡 Optimisation : On cherche le lastID uniquement si c'est une création (INSERT)
      const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
      const lastID = isInsert ? fetchLastInsertId() : null;

      persist(); // On sauvegarde sur le disque dur

      if (callback) {
        callback.call({ lastID, changes }, null);
      }
    })
    .catch((err) => {
      if (callback) callback(err);
    });
};

const all = (sql, params, callback) => {
  ready
    .then(() => {
      const statement = db.prepare(sql);
      statement.bind(params || []);
      const rows = fetchRows(statement);
      statement.free();
      callback(null, rows);
    })
    .catch((err) => callback(err));
};

module.exports = {
  run,
  all
};