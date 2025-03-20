import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './auth.css';

const API_URL = 'http://localhost:9000';

const Login = ({ setToken }) => { // ✅ Ajout de setToken pour mettre à jour l'état global
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate(); // ✅ Pour rediriger après connexion

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            localStorage.removeItem("token");
            sessionStorage.clear();

            const response = await axios.post(`${API_URL}/login`, { username, password });

            if (response.data.token) {
                localStorage.setItem("token", response.data.token);
                setToken(response.data.token); // ✅ Mettre à jour le token global
                navigate('/dashboard'); // ✅ Rediriger après connexion
            } else {
                setError("Identifiants incorrects, veuillez réessayer.");
            }
        } catch (error) {
            setError("Erreur de connexion. Vérifiez vos identifiants.");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>Connexion à <span>AKKA</span></h2>
                <p>Accédez à votre portefeuille.</p>

                {error && <p className="error">{error}</p>}

                <form onSubmit={handleLogin}>
                    <input
                        type="text"
                        placeholder="Nom d'utilisateur"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit">Se connecter</button>
                </form>

                <p className="switch-auth">
                    Pas encore de compte ? <a href="/register">Inscrivez-vous</a>
                </p>
            </div>
        </div>
    );
};

export default Login;
