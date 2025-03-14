import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard'; // ✅ Vérifie cet import
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
                <Route path="/dashboard" element={<Dashboard token={localStorage.getItem('token')} />} />

            </Routes>
        </div>
    );
};

export default App;
