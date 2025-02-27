import React from "react";
import "./css/Home.css";

const Home = ({ user, onLogout }) => {
  return (
    <div className="home-container">
      {/* HEADER AMÉLIORÉ */}
      <header className="home-header">
        <div className="header-left">
          <h1 className="logo">Gestion de Portefeuille</h1>
        </div>
        <nav className="header-nav">
          <a href="#">Accueil</a>
          <a href="#">Portefeuilles</a>
          <a href="#">Transactions</a>
          <a href="#">Marchés</a>
          <a href="#">Paramètres</a>
        </nav>
        <div className="header-right">
          <span className="user-name">{user}</span>
          <button onClick={onLogout} className="logout-button">Déconnexion</button>
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <main className="dashboard">
        <section className="dashboard-left">
          <div className="widget large gradient">
            <h2>Répartition des Actifs</h2>
            <div className="chart-placeholder">📊 Graphique Secteurs</div>
          </div>
          <div className="widget large gradient">
            <h2>Performance du Portefeuille</h2>
            <div className="chart-placeholder">📈 Graphique Performance</div>
          </div>
        </section>

        <section className="dashboard-right">
          <div className="widget highlight">
            <h2>Mouvements du Marché</h2>
            <ul className="market-movements">
              <li>Apple <span className="up">+2.5%</span></li>
              <li>Bitcoin <span className="down">-3.2%</span></li>
              <li>EUR/USD <span className="up">+0.8%</span></li>
            </ul>
          </div>
          <div className="widget highlight">
            <h2>Notifications & Alertes</h2>
            <ul className="notifications">
              <li>📉 Tesla chute de 5%</li>
              <li>🟢 Record historique pour l’or</li>
              <li>⚠️ RSI dépasse 70</li>
            </ul>
          </div>
          <div className="widget">
            <h2>Gestion du Portefeuille</h2>
            <button className="action-button blue">Ajouter un Actif</button>
            <button className="action-button green">Modifier un Actif</button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
