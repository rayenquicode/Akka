import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Simulation from './components/Simulation'; // ✅ Ajout de l'import pour Simulation
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';

const App = () => {
    const [token, setToken] = useState(localStorage.getItem('token'));

    return (
        <div>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login setToken={setToken} />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={token ? <Dashboard token={token} /> : <Navigate to="/login" />} />
                <Route path="/simulation" element={token ? <Simulation token={token} /> : <Navigate to="/login" />} /> {/* ✅ Ajout de la route pour Simulation */}
            </Routes>
        </div>
    );
};

export default App;
