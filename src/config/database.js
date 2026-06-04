const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

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

    db.run(`CREATE TABLE IF NOT EXISTS local_computers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      glpi_id INTEGER,
      name TEXT,
      notes TEXT
    )`);

    persist();
    console.log('Connecté avec succès à la base SQLite locale.');
  })
  .catch((err) => {
    console.error('Erreur lors de la création de la base SQLite :', err.message);
    throw err;
  });

const persist = () => {
  if (!db) {
    return;
  }
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
      const lastID = fetchLastInsertId();
      persist();
      if (callback) {
        callback.call({ lastID, changes }, null);
      }
    })
    .catch((err) => {
      if (callback) {
        callback(err);
      }
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