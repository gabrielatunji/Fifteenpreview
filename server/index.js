const express = require('express');
const cors = require('cors');
const db = require('./db');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Create or update a market record
app.post('/api/markets', (req, res) => {
  const { id, address, team1, team2, image, matchStartTime, fromBlock, marketTerms, leagueName } = req.body;
  if (!id || !team1 || !team2) {
    return res.status(400).json({ error: 'id, team1 and team2 are required' });
  }
  const now = Date.now();
  const stmt = db.prepare(`INSERT OR REPLACE INTO markets (id,address,team1,team2,image,matchStartTime,fromBlock,createdAt,marketTerms,leagueName) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  stmt.run(id, address || null, team1, team2, image || null, matchStartTime || null, fromBlock || null, now, marketTerms || null, leagueName || null, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
  stmt.finalize();
});

// Get market by id
app.get('/api/markets/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM markets WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json(row);
  });
});

// Query by match details (team1, team2, matchStartTime)
app.get('/api/markets', (req, res) => {
  const { team1, team2, matchStartTime } = req.query;
  if (team1 && team2 && matchStartTime) {
    db.get(`SELECT * FROM markets WHERE team1 = ? AND team2 = ? AND matchStartTime = ?`, [team1, team2, Number(matchStartTime)], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'not found' });
      res.json(row);
    });
    return;
  }
  db.all(`SELECT * FROM markets ORDER BY createdAt DESC LIMIT 100`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
