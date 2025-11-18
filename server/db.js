const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.sqlite');

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS markets (
      id TEXT PRIMARY KEY,
      address TEXT,
      team1 TEXT,
      team2 TEXT,
      image TEXT,
      matchStartTime INTEGER,
      fromBlock INTEGER,
      createdAt INTEGER,
      marketTerms TEXT,
      leagueName TEXT
    )`
  );
});

module.exports = db;
