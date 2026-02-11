//----------------------------------------CONNEXION A LA BDD----------------------------------------------------//
const express = require('express');
const app = express();
const mysql = require('mysql2');
const path = require('path');
const connection = mysql.createConnection({
  host: '172.29.18.127',
  user: 'matchUp',
  password: 'matchUp',
  database: 'MatchUp'
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
app.post('/register', (req, res) => {
    const { login, password } = req.body; 

    if (!login || !password) {
        return res.status(400).json({ success: false, message: 'Champs vides' });
    }

    connection.query(
        'INSERT INTO users (login, password) VALUES (?,?)',
        [login, password],
        (err, results) => {
            if (err) {
                console.error('Erreur SQL :', err);
                res.status(500).json({ success: false, message: 'Erreur serveur ou login déjà pris' });
                return;
            }
            // IMPORTANT : on ajoute success: true pour le JS
            res.json({ success: true, message: 'Inscription réussie !', id: results.insertId });
        }
    )
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

app.post('/connexion', (req, res) => {
  console.log(req.body);
  //on récupère le login et le password
  const { login, password } = req.body;
  connection.query('SELECT * FROM users WHERE login = ? AND password = ?', [login, password], (err, results) => {
    if (err) {
      console.error('Erreur lors de la vérification des identifiants :', err);
      res.status(500).json({ message: 'Erreur serveur' });
      return;
    }
    if (results.length === 0) {
      res.status(401).json({ message: 'Identifiants invalides' });
      return;
    }
    // Identifiants valides 
    //renvoi les informations du user
    res.json({ message: 'Connexion réussie !', user: results[0] });
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
  const query = 'INSERT INTO matchs (id_j1, id_j2, categorie, status, score_j1, score_j2) VALUES (?, ?, ?, "en attente", 0, 0)';

  connection.query(query, [player1_id, player2_id, categorie], (err, results) => {
    if (err) {
      console.error('ERREUR SQL :', err.sqlMessage || err);
      return res.status(500).json({ message: 'Erreur BDD : ' + err.sqlMessage });
    }
    res.status(200).json({ message: 'Match créé !', id: results.insertId });
  });
});

app.post('/finishMatch', (req, res) => {
  const {id_j1, id_j2,gagnant,id_match} = req.body;
  connection.query(
    'UPDATE matchs SET  gagnant = ?, status = "termine" WHERE id_j1 = ? AND id_j2 = ? AND id = ?',
    [gagnant, id_j1, id_j2, id_match],
    (err, results) => {
      if (err) {
        console.error('Erreur lors de la mise à jour du match dans la base de données :', err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;
      }
      res.json({ message: 'Match terminé avec succès !' });
    }
  )
});
app.post('/changeScoreJ1', (req, res) => {
  const {id_j1, score_j1 ,id_match} = req.body;
  connection.query(
    'UPDATE matchs SET score_j1 = ? WHERE id = ?',
    [score_j1, id_match],
    (err, results) => {
      if (err) {
        console.error('Erreur lors de la mise à jour du score du joueur 1 :', err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;
      }
      res.json({ message: 'Score du joueur 1 mis à jour avec succès !' });
    }
  )
});

app.post('/changeScoreJ2', (req, res) => {
  const {id_j2, score_j2 ,id_match} = req.body;
  connection.query(
    'UPDATE matchs SET score_j2 = ? WHERE id = ?',
    [score_j2, id_match],
    (err, results) => {
      if (err) {
        console.error('Erreur lors de la mise à jour du score du joueur 2 :', err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;
      }
      res.json({ message: 'Score du joueur 2 mis à jour avec succès !' });
    }
  )
});

app.post('/refuseMatch', (req, res) => {
  const { id_j1, id_j2, id_match } = req.body;
  connection.query(
    'UPDATE matchs SET status = "refuse" WHERE id_j1 = ? AND id_j2 = ? AND id = ?',
    [id_j1, id_j2, id_match],
    (err, results) => {
      if (err) {
        console.error('Erreur lors de la mise à jour du match dans la base de données :', err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;
      }

    })
});

app.post('/acceptMatch', (req, res) => {
  const { id_j1, id_j2, id_match } = req.body;
  connection.query(
    'UPDATE matchs SET status = "en cours" WHERE id_j1 = ? AND id_j2 = ? AND id = ?',
    [id_j1, id_j2, id_match],
    (err, results) => {
      if (err) {
        console.error('Erreur lors de la mise à jour du match dans la base de données :', err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;
      }

    })
});

app.get('/invitation', (req, res) => {
  connection.query(
    'SELECT * FROM matchs ,users WHERE matchs.id_j1 = users.id OR matchs.id_j2 = users.id',
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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/matchs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'matchs.html'));
});

app.listen(3000, () => {
  let monIp = require("ip").address();
  console.log(`Server running on http://${monIp}:3000`);
});