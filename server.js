//----------------------------------------CONNEXION A LA BDD----------------------------------------------------//
const express = require('express');
const app = express();
const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: '192.168.1.27',
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
    [req.body.inputValue, req.body.inputValue2],
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


//MATCH ET INVITATION
app.get('/Vote', (req, res) => {
  connection.query('SELECT * FROM Vote', (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des votes :', err);
      res.status(500).json({ message: 'Erreur serveur' });
      return;
    }
    res.json(results);
  });
});
app.post('/Vote', (req, res) => {

  connection.query(
    'INSERT INTO Vote (id_user) VALUES (?)',
    [req.body.inputValue],
    (err, results) => {
      if (err) {
        console.error('Erreur lors de l\'insertion dans la base de données :', err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;
      }
      console.log('Insertion réussie, ID vote :', results.insertId);
      res.json({ message: 'Vote enregistré !', id_user: results.insertId });
    }
  )
});



app.get('/VoteCount', (req, res) => {
  connection.query('SELECT User.login, COUNT(Vote.id_user) AS voteCount FROM User, Vote WHERE User.id = Vote.id_user GROUP BY User.id ORDER BY voteCount DESC;',
    (err, results) => {
      if (err) {
        console.error('Erreur lors de la récupération du nombre de votes :', err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;
      }
      res.json(results);
    })
})





app.listen(3000, () => {
  let monIp = require("ip").address();
  console.log(`Server running on http://${monIp}:3000`);
});