import React, { useState } from "react";
import "./css/Login.css"; // Mise à jour du chemin CSS

const Login = ({ onLogin }) => {
  const [pseudo, setPseudo] = useState("");
  const [password, setPassword] = useState("");

  // 🔐 Liste des utilisateurs fictifs
  const users = [
    { pseudo: "user1", password: "1234" },

  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const validUser = users.find(user => user.pseudo === pseudo && user.password === password);

    if (validUser) {
      localStorage.setItem("user", pseudo);
      onLogin(pseudo);
    } else {
      alert("Pseudo ou mot de passe incorrect !");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Gestion de Portefeuille</h2>
        <p className="login-subtitle">Connectez-vous pour suivre vos investissements</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <input 
            type="text" 
            placeholder="Pseudo" 
            value={pseudo} 
            onChange={(e) => setPseudo(e.target.value)} 
            required 
            className="login-input"
          />
          <input 
            type="password" 
            placeholder=" Mot de passe" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="login-input"
          />
          <button type="submit" className="login-button"> Connexion</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
