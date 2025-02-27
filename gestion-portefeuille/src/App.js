import React, { useState } from "react";
import Login from "./Login"; // Page de connexion
import Home from "./Home"; // Page d'accueil

function App() {
  const [user, setUser] = useState(localStorage.getItem("user"));

  // Déconnexion de l'utilisateur
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <div className="App">
      {user ? (
        <Home user={user} onLogout={handleLogout} />
      ) : (
        <Login onLogin={setUser} />
      )}
    </div>
  );
}

export default App;
