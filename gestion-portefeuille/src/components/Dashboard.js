import React, { useState, useEffect } from "react";
import axios from "axios";
import { Pie, Line } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from "chart.js";
import Header from "./Header";
import "./dashboard.css";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

const API_URL = "http://localhost:9000";

const Dashboard = ({ token }) => {
    const [portfolio, setPortfolio] = useState([]);
    const [marketData, setMarketData] = useState([]);
    const [symbol, setSymbol] = useState("");
    const [quantity, setQuantity] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [username, setUsername] = useState("");

    useEffect(() => {
        if (!token) {
            setError("Utilisateur non connecté");
            return;
        }
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setUsername(decodedToken.username);
        fetchPortfolio(decodedToken.username);
        fetchMarketData();
    }, [token]);

    const fetchPortfolio = async (user) => {
        try {
            const response = await axios.get(`${API_URL}/portfolio/${user}`);
            setPortfolio(response.data);
        } catch (error) {
            setError("Erreur lors du chargement du portefeuille.");
        }
    };

    const fetchMarketData = async () => {
        try {
            const response = await axios.get(`${API_URL}/market-data`);
            setMarketData(response.data);
        } catch (error) {
            setError("Erreur lors du chargement des données de marché.");
        }
    };

    const handleAddAsset = async (e) => {
        e.preventDefault();
        if (!symbol || !quantity) {
            setError("Veuillez remplir tous les champs.");
            return;
        }
        try {
            await axios.post(`${API_URL}/portfolio/add`, { userId: username, symbol, quantity: parseInt(quantity) });
            setMessage("Action ajoutée avec succès !");
            setSymbol("");
            setQuantity("");
            fetchPortfolio(username);
        } catch (error) {
            setError("Erreur lors de l'ajout de l'action.");
        }
    };

    const handleRemoveAsset = async (symbol) => {
        try {
            await axios.post(`${API_URL}/portfolio/remove`, { userId: username, symbol, quantity: 1 });
            setMessage("Action retirée avec succès !");
            fetchPortfolio(username);
        } catch (error) {
            setError("Erreur lors de la suppression de l'action.");
        }
    };

    const portfolioSymbols = portfolio.map(asset => asset.symbol);
    const filteredMarketData = marketData.filter(data => portfolioSymbols.includes(data.symbol));

    const portfolioData = {
        labels: portfolio.map(asset => asset.symbol),
        datasets: [
            {
                data: portfolio.map(asset => asset.quantity),
                backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4CAF50", "#FF9800"],
            },
        ],
    };

    const marketChartData = {
        labels: filteredMarketData.map(data => data.symbol),
        datasets: [
            {
                label: "Prix des actions",
                data: filteredMarketData.map(data => data.price),
                borderColor: "#36A2EB",
                fill: false,
                tension: 0.4,
            },
        ],
    };

    return (
        <>
            <Header />
            <div className="dashboard">
                <h2>📊 Mon Portefeuille</h2>
                {error && <p className="error">{error}</p>}
                {message && <p className="message">{message}</p>}

                <div className="charts-container">
                    <div className="chart">
                        <h3>Répartition des Actifs</h3>
                        <Pie data={portfolioData} />
                    </div>
                    <div className="chart">
                        <h3>Mouvements du Marché</h3>
                        {filteredMarketData.length > 0 ? (
                            <Line data={marketChartData} />
                        ) : (
                            <p>Aucune donnée disponible pour ces actions.</p>
                        )}
                    </div>
                </div>

                <table>
                    <thead>
                    <tr>
                        <th>Symbole</th>
                        <th>Quantité</th>
                        <th>Action</th>
                    </tr>
                    </thead>
                    <tbody>
                    {portfolio.length > 0 ? (
                        portfolio.map((asset, index) => (
                            <tr key={index}>
                                <td>{asset.symbol}</td>
                                <td>{asset.quantity}</td>
                                <td>
                                    <button className="remove-btn" onClick={() => handleRemoveAsset(asset.symbol)}>Retirer</button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3">Aucune action détenue.</td>
                        </tr>
                    )}
                    </tbody>
                </table>

                <div className="form-box">
                    <h3>➕ Ajouter un Actif</h3>
                    <form onSubmit={handleAddAsset}>
                        <input type="text" placeholder="Symbole (ex: AAPL)" value={symbol} onChange={(e) => setSymbol(e.target.value)} required />
                        <input type="number" placeholder="Quantité" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                        <button type="submit">Ajouter</button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Dashboard;
