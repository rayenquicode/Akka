Guide de lancement du projet
Prérequis
Avant de lancer le projet, assurez-vous que :

Les identifiants de connexion (username et password), ainsi que l'URL avec localhost, doivent être correctement configurés dans main.scala pour correspondre à ceux de votre base de données.
Votre base de données est bien configurée avec les bonnes tables (voir script SQL ci-dessous).

Configuration de la base de données
Votre base de données doit contenir trois tables. Voici le script SQL à exécuter :

CREATE DATABASE portefeuille;
USE portefeuille;

DROP TABLE IF EXISTS portfolios;
CREATE TABLE IF NOT EXISTS portfolios (
  user_id VARCHAR(255) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  quantity INT NOT NULL,
  total_price DOUBLE DEFAULT 0,
  last_price DOUBLE DEFAULT NULL,
  PRIMARY KEY (user_id, symbol)
);

DROP TABLE IF EXISTS price_history;
CREATE TABLE IF NOT EXISTS price_history (
  symbol VARCHAR(10) NOT NULL,
  price DOUBLE NOT NULL,
  timestamp DATETIME DEFAULT NULL
);

DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY username (username)
);


Lancement du projet
1 - Démarrer le frontend
Ouvrez un terminal.
Placez-vous dans le dossier gestion-portefeuille.
Exécutez la commande suivante :
npm start

2 - Démarrer le backend
Ouvrez un deuxième terminal.
Placez-vous dans le dossier gestion-portefeuille-backend.
Exécutez les commandes suivantes dans cet ordre :
sbt clean compile
sbt
run
Votre projet est maintenant lancé et prêt à être utilisé ! 
