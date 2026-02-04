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

  connection.query(
    'INSERT INTO users (login, password) VALUES (?,?)',
    [req.body.loginValue, req.body.passwordValue],
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
app.get('/stats', (req, res) => {
  connection.query('SELECT nb_victoire , nb_defaite FROM users', (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des statistiques :', err);
      res.status(500).json({ message: 'Erreur serveur' });
      return;
    }
    res.json(results);
  }
  )
});

app.post('/connexion', (req, res) => {
  console.log(req.body);
  //on récupère le login et le password
  const { login, password } = req.body;
  connection.query('SELECT * FROM User WHERE login = ? AND password = ?', [login, password], (err, results) => {
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





app.listen(3000, () => {
  let monIp = require("ip").address();
  console.log(`Server running on http://${monIp}:3000`);
});