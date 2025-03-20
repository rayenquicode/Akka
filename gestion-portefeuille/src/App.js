import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Simulation from './components/Simulation';
import Chatbot from './components/Chatbot';
import Header from './components/Header';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const location = useLocation();

    useEffect(() => {
        setToken(localStorage.getItem('token'));
    }, [location]);

    return (
        <>

            {token && location.pathname !== "/login" && location.pathname !== "/register" && <Header />}

            <div>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="/login" element={<Login setToken={setToken} />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={token ? <Dashboard token={token} /> : <Navigate to="/login" />} />
                    <Route path="/simulation" element={token ? <Simulation token={token} /> : <Navigate to="/login" />} />
                    <Route path="/chatbot" element={token ? <Chatbot token={token} /> : <Navigate to="/login" />} />
                </Routes>
            </div>
        </>
    );
};

export default App;
