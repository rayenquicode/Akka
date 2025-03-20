import React, { useState, useEffect } from "react";
import axios from "axios";
import { Pie, Line } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from "chart.js";
import Header from "./Header";
import "./dashboard.css";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

const API_URL = "http://localhost:9000";

const Dashboard = ({ token }) => {
    const [totalInvested, setTotalInvested] = useState(0);
    const [selectedSymbol, setSelectedSymbol] = useState(null);
    const [priceHistory, setPriceHistory] = useState([]);
    const [portfolio, setPortfolio] = useState([]);
    const [marketData, setMarketData] = useState([]);
    const [symbol, setSymbol] = useState("");
    const [quantity, setQuantity] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [username, setUsername] = useState("");
    const [quantityToRemove, setQuantityToRemove] = useState({});

    useEffect(() => {
        if (!token) {
            setError("Utilisateur non connecté");
            return;
        }

        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        if (!decodedToken.username) {
            console.error("❌ [ERREUR] Impossible de récupérer le username du token !");
            return;
        }

        console.log("🟢 [DEBUG] Utilisateur connecté :", decodedToken.username);
        setUsername(decodedToken.username);
        fetchPortfolio(decodedToken.username);
        fetchTotalInvested(decodedToken.username);  // ⬅️ Vérifie ici s'il est bien défini
    }, [token]);



    const fetchPriceHistory = async (symbol) => {
        try {
            const response = await axios.get(`${API_URL}/price-fluctuation/${symbol}`);
            console.log("✅ Données historiques reçues :", response.data);
            setPriceHistory(response.data);
        } catch (error) {
            console.error("❌ Erreur lors de la récupération de l'historique des prix :", error);
            setError("Erreur lors de la récupération de l'historique des prix.");
        }
    };



    const handleSelectSymbol = (symbol) => {
        setSelectedSymbol(symbol);
        fetchPriceHistory(symbol);
    };
    const fetchTotalInvested = async (username) => {
        if (!username) {
            console.error("❌ [ERREUR] Tentative d'appel à fetchTotalInvested avec un username invalide :", username);
            return; // Évite d'appeler l'API avec undefined
        }

        console.log("🟢 [DEBUG] Appel API total-invested avec :", username);  // 🔥 Vérification

        try {
            const response = await axios.get(`${API_URL}/portfolio/${username}/total-invested`);
            console.log("🟢 [DEBUG] Total investi récupéré :", response.data.totalInvested); // 🔥 Debug
            setTotalInvested(response.data.totalInvested);
        } catch (error) {
            console.error("❌ Erreur lors du chargement du total investi :", error);
        }
    };


    const login = async (username, password) => {
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) throw new Error("Échec de la connexion");

            const data = await response.json();
            localStorage.setItem("token", data.token);
            return true;
        } catch (error) {
            console.error("❌ Erreur de connexion :", error);
            return false;
        }
    };


    const fetchPortfolio = async (username) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_URL}/portfolio/${username}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setPortfolio(response.data);
            fetchMarketData(response.data); // ✅ Mise à jour du marché après mise à jour du portefeuille
        } catch (error) {
            setError("Erreur lors du chargement du portefeuille.");
        }
    };









    const fetchMarketData = async (portfolioData) => {
        if (!portfolioData || portfolioData.length === 0) return;

        try {
            const symbols = portfolioData.map(asset => asset.symbol).join(",");
            if (!symbols.trim()) return;

            const response = await axios.get(`${API_URL}/market-data?symbols=${symbols}`);
            setMarketData(response.data);
            console.log("✅ Données du marché mises à jour :", response.data);
        } catch (error) {
            console.error("❌ Erreur lors du chargement des données de marché :", error);
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
            await axios.post(`${API_URL}/portfolio/${username}/add`, { symbol, quantity: parseInt(quantity) });
            await fetchPortfolio(username);
            await fetchTotalInvested(username); // 🔥 Met à jour immédiatement après ajout

            setMessage(`Action ${symbol} ajoutée avec succès !`);
            setSymbol("");
            setQuantity("");
        } catch (error) {
            setError("Erreur lors de l'ajout de l'action.");
        }
    };






    const handleRemoveAsset = async (symbol) => {
        const quantity = parseInt(quantityToRemove[symbol]) || 1;
        if (quantity <= 0) {
            setError("Veuillez entrer une quantité valide.");
            return;
        }

        try {
            await axios.post(`${API_URL}/portfolio/${username}/remove`, { symbol, quantity });

            await fetchPortfolio(username); // ✅ Mise à jour du portefeuille
            await fetchTotalInvested(username); // 🔥 Mise à jour immédiate du total investi

            setMessage(`Action ${symbol} retirée avec succès.`);
            console.log("🔍 Vérification après suppression :", portfolio);
        } catch (error) {
            console.error("❌ Erreur lors de la suppression de l'action :", error);
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
                backgroundColor: ["#009FFD", "#5AC8FA", "#F4C724", "#2ECC71", "#E67E22"],
            },
        ],
    };

// ✅ Définit les options du Pie Chart séparément
    const pieChartOptions = {
        plugins: {
            legend: {
                labels: {
                    color: "white", // 🔥 Mettre le texte des légendes en blanc
                    font: {
                        size: 14,
                        weight: "bold"
                    }
                }
            }
        }
    };


    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                labels: {
                    color: "white", // 🔥 Rendre la légende plus visible
                    font: {
                        size: 14,
                        weight: "bold"
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: "white", // 🔥 Couleur blanche pour les valeurs de l'axe X
                    font: {
                        size: 12,
                        weight: "bold"
                    }
                },
                grid: {
                    color: "rgba(255, 255, 255, 0.2)" // 🔥 Grille plus discrète
                }
            },
            y: {
                ticks: {
                    color: "white", // 🔥 Couleur blanche pour les valeurs de l'axe Y
                    font: {
                        size: 14,
                        weight: "bold"
                    }
                },
                grid: {
                    color: "rgba(255, 255, 255, 0.2)" // 🔥 Atténuer la grille
                }
            }
        }
    };


    const marketChartData = priceHistory.length > 0 ? {
        labels: priceHistory.map(entry => new Date(entry.timestamp).toLocaleDateString()), // ✅ Affichage correct des dates
        datasets: [
            {
                label: `Fluctuation du prix`, // ✅ Correction du label
                data: priceHistory.map(entry => entry.price),
                borderColor: "#00BCD4",
                fill: false,
                tension: 0.4,
            },
        ],
    } : null;



    return (
        <>
            <Header />
            <div className="dashboard">
                {error && <p className="error">{error}</p>}
                {message && <p className="message">{message}</p>}

                <div className="charts-container">
                    <div className="chart">
                        <h3>Répartition des Actifs</h3>
                        <h3>Total  {totalInvested.toFixed(2)} € </h3>
                        <Pie data={portfolioData} options={pieChartOptions} />

                    </div>
                    <div className="form-box">
                        <h3> Ajouter un Actif</h3>
                        <form onSubmit={handleAddAsset}>
                            <input type="text" placeholder="Symbole (ex: AAPL)" value={symbol} onChange={(e) => setSymbol(e.target.value)} required />
                            <input type="number" placeholder="Quantité" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                            <button type="submit" className="add-btn">Ajouter</button>

                        </form>
                    </div>
                    <div className="chart">
                        <h3>{selectedSymbol ? `Évolution du prix de ${selectedSymbol}` : "Sélectionnez une action"}</h3>
                        {marketChartData && marketChartData.datasets[0].data.length > 0 ? (
                            <Line data={marketChartData} options={chartOptions} />
                        ) : (
                            <p>Aucune donnée historique disponible.</p>
                        )}

                    </div>


                </div>

                <table>
                    <thead>
                    <tr>
                        <th>Symbole</th>
                        <th>Quantité</th>
                        <th>Valeur Totale (€)</th>
                        <th>Action</th>
                        <th>Gestion</th>
                    </tr>
                    </thead>

                    <tbody>
                    {portfolio.length > 0 ? (
                        portfolio.map((asset, index) => (
                            <tr key={index}>
                                <td>{asset.symbol}</td>
                                <td>{asset.quantity}</td>
                                <td>{asset.totalPrice ? asset.totalPrice.toFixed(2) + "€" : "0€"}</td>
                                <td>
                                    <button className="view-btn" onClick={() => fetchPriceHistory(asset.symbol)}>Voir Évolution</button>


                                </td>
                                <td>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Quantité"
                                        value={quantityToRemove[asset.symbol] || ""}
                                        onChange={(e) => setQuantityToRemove({ ...quantityToRemove, [asset.symbol]: parseInt(e.target.value) || "" })}
                                    />


                                    <button className="remove-btn" onClick={() => handleRemoveAsset(asset.symbol)}>Retirer</button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4">Aucune action détenue.</td>
                        </tr>
                    )}
                    </tbody>
                </table>


            </div>
        </>
    );
};

export default Dashboard;
