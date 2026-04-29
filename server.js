//----------------------------------------CONNEXION A LA BDD----------------------------------------------------//
require('dotenv').config();
const express = require('express');
const app = express();
const mysql = require('mysql2');
const path = require('path');
const bcrypt = require('bcrypt');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
connection.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err);
    return;
  }
  console.log('Connecté à la base de données MySQL.');
});

app.use(express.static('public'));
app.use(express.json());
//-----------------------------------------------------ROUTES----------------------------------------------------//
//CONNEXION ET USER
app.post('/register', async (req, res) => {
  const { loginValue, passwordValue } = req.body;

  if (!loginValue || !passwordValue) {
    return res.status(400).json({ success: false, message: 'Champs vides' });
  }

  try {
    const hash = await bcrypt.hash(passwordValue, 12);

    connection.query(
      'INSERT INTO users (login, password) VALUES (?, ?)',
      [loginValue, hash],
      (err, results) => {
        if (err) {
          // ← Doublon détecté
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Ce login est déjà pris' });
          }
          return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
        res.json({ success: true, message: 'Inscription réussie !', id: results.insertId });
      }
    );
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur lors du hachage' });
  }
});
app.get('/users', (req, res) => {
  connection.query('SELECT * FROM users', (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des utilisateurs :', err);
      res.status(500).json({ message: 'Erreur serveur' });
      return;
    }
    res.json(results);
  });
});

// ✅ CORRECTION
app.post('/connexion', (req, res) => {
  const { login, password } = req.body;
  connection.query('SELECT * FROM users WHERE login = ?', [login], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Erreur serveur' });
    if (results.length === 0) return res.status(401).json({ message: 'Identifiants invalides' });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password); 

    if (!match) return res.status(401).json({ message: 'Identifiants invalides' });

    res.json({ message: 'Connexion réussie !', user });
  });
});


//MATCH ET INVITATION
app.post('/createMatch', (req, res) => {
  const player1_id = parseInt(req.body.player1_id);
  const player2_id = parseInt(req.body.player2_id);
  const categorie = req.body.categorie;

  if (isNaN(player1_id) || isNaN(player2_id)) {
    return res.status(400).json({ message: 'IDs de joueurs invalides' });
  }
  const query = 'INSERT INTO matchs (id_j1, id_j2, categorie) VALUES (?, ?, ?)';

  connection.query(query, [player1_id, player2_id, categorie], (err, results) => {
    if (err) {
      console.error('ERREUR SQL :', err.sqlMessage || err);
      return res.status(500).json({ message: 'Erreur BDD : ' + err.sqlMessage });
    }
    res.status(200).json({ message: 'Match créé !', id: results.insertId });
  });
});

app.post('/finishMatch', (req, res) => {
  const { id_match, gagnant } = req.body;
  
  connection.query(
    'UPDATE matchs SET gagnant = CASE WHEN id_j1 = ? THEN "joueur_1" ELSE "joueur_2" END, statut = "termine" WHERE id = ? and score_j1 IS NOT NULL AND score_j2 IS NOT NULL',
    [gagnant, id_match],
    (err, results) => {
      if (err) {
        console.error('ERREUR SQL:', err.sqlMessage);
        return res.status(500).json({ success: false, message: 'Erreur: ' + err.sqlMessage });
      }
      res.json({ success: true, message: 'Match terminé!' });
    }
  );
});

app.post('/changeScoreJ1', (req, res) => {
  const { id_j1, score_j1, id_match } = req.body;
  
  console.log("Requête changeScoreJ1:", { id_j1, score_j1, id_match });
  
  connection.query(
    'UPDATE matchs SET score_j1 = ? WHERE id = ?',
    [score_j1, id_match],
    (err, results) => {
      if (err) {
        console.error('❌ ERREUR SQL changeScoreJ1:', err.sqlMessage || err.message);
        return res.status(500).json({ message: 'Erreur BDD J1 : ' + (err.sqlMessage || err.message) });
      }
      console.log("✅ Score J1 mis à jour - Rows affected:", results.affectedRows);
      res.json({ message: 'Score J1 mis à jour !', affectedRows: results.affectedRows });
    }
  );
});

app.post('/changeScoreJ2', (req, res) => {
  const { id_j2, score_j2, id_match } = req.body;
  
  console.log("Requête changeScoreJ2:", { id_j2, score_j2, id_match });
  
  connection.query(
    'UPDATE matchs SET score_j2 = ? WHERE id = ?',
    [score_j2, id_match],
    (err, results) => {
      if (err) {
        console.error('❌ ERREUR SQL changeScoreJ2:', err.sqlMessage || err.message);
        return res.status(500).json({ message: 'Erreur BDD J2 : ' + (err.sqlMessage || err.message) });
      }
      console.log("✅ Score J2 mis à jour - Rows affected:", results.affectedRows);
      res.json({ message: 'Score J2 mis à jour !', affectedRows: results.affectedRows });
    }
  );
});

app.post('/refuseMatch', (req, res) => {
  const { id_j1, id_j2, id_match } = req.body;
  connection.query(
    'UPDATE matchs SET statut = "refuse" WHERE id_j1 = ? AND id_j2 = ? AND id = ?',
    [id_j1, id_j2, id_match],
    (err, results) => {
      if (err) {
        console.error('Erreur lors de la mise à jour du match dans la base de données :', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur' });
      }
      res.json({ success: true, message: 'Match refusé !' });
    })
});

app.post('/acceptMatch', (req, res) => {
  const { id_j1, id_j2, id_match } = req.body;
  connection.query(
    'UPDATE matchs SET statut = "en_cours" WHERE id_j1 = ? AND id_j2 = ? AND id = ?',
    [id_j1, id_j2, id_match],
    (err, results) => {
      if (err) {
        console.error('Erreur lors de la mise à jour du match dans la base de données :', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur' });
      }
      res.json({ success: true, message: 'Match accepté !' });
    })
});

app.get('/invitation', (req, res) => {
  connection.query(
    'select matchs.score_j1, matchs.score_j2,matchs.date_creation , matchs.id_j1,matchs.id_j2,matchs.id,matchs.categorie,matchs.statut, users1.login as Login1 , users2.login as login2  from users as users1 , users as users2, matchs WHERE   matchs.id_j1 = users1.id AND matchs.id_j2 = users2.id;',
    (err, results) => {
      if (err) {
        console.error('Erreur lors de la récupération de l\'invitation :', err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;
      }
      res.json(results);
    }
  );
});
app.get('/getscore', (req, res) => {
  connection.query(
    'SELECT id, score_j1, score_j2 FROM matchs',
    (err, results) => {
      if (err) {
        console.error('Erreur lors de la récupération des scores :', err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;
      }
      res.json(results);
    }
  );
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/matchs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'matchs.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});