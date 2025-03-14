import React from 'react';
import { useNavigate } from 'react-router-dom';
import './header.css';

const Header = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <header className="header">
            <h1 className="logo">AKKA</h1>
            <button className="logout-btn" onClick={handleLogout}>Déconnexion</button>
        </header>
    );
};

export default Header;
