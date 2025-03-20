import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './auth.css';

const API_URL = 'http://localhost:9000';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/register`, { username, password });
            navigate('/login');
        } catch (err) {
            setError('Inscription échouée. Essayez un autre nom d’utilisateur.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>Créer un compte</h2>
                <p>Rejoignez <span>AKKA RRYZM</span> dès maintenant.</p>

                {error && <p className="error">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        placeholder="Nom d'utilisateur"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit">S'inscrire</button>
                </form>

                <p className="switch-auth">
                    Déjà un compte ? <Link to="/login">Connectez-vous</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
