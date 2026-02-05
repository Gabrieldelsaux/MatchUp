//----------------------------------------CONNEXION A LA BDD----------------------------------------------------//
const express = require('express');
const app = express();
const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: '172.29.18.127',
  user: 'matchUp',
  password: 'matchUp',
  database: 'matchUp'
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
  const { loginValue, passwordValue } = req.body;
  connection.query(
    'INSERT INTO users (login, password) VALUES (?,?)',
    [loginValue, passwordValue],
    (err, results) => {
      if (err) {
        console.error('Erreur lors de l\'insertion dans la base de données :', err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;
      }
      console.log('Insertion réussie, ID utilisateur :', results.insertId);
      res.json({ message: 'Inscription réussie !', userId: results.insertId });
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
  const { player1_id, player2_id, categorie } = req.body;
  connection.query(
    'INSERT INTO matchs (id_j1, id_j2,categorie) VALUES (?,?,?)',
    [player1_id, player2_id, categorie],
    (err, results) => {
      if (err) {
        console.error('Erreur lors de l\'insertion du match dans la base de données :', err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;
      }
    }
  )
});

app.post('/finishMatch', (req, res) => {
  const {id_j1, id_j2, score_j1, score_j2,gagnant,id_match} = req.body;
  connection.query(
    'UPDATE matchs SET score_j1 = ?, score_j2 = ?, gagnant = ?, status = "termine" WHERE id_j1 = ? AND id_j2 = ? AND id = ?',
    [score_j1, score_j2, gagnant, id_j1, id_j2, id_match],
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


app.listen(3000, () => {
  let monIp = require("ip").address();
  console.log(`Server running on http://${monIp}:3000`);
});