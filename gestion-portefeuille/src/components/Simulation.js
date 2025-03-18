import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import axios from "axios";
import regression from "regression";
import Header from "./Header";
import "./simulation.css";

const API_URL = "http://localhost:9000";

const Simulation = () => {
    const [symbol, setSymbol] = useState("");
    const [priceHistory, setPriceHistory] = useState([]);
    const [predictions, setPredictions] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Fonction pour récupérer l'historique des prix et faire la prédiction
    const fetchPriceHistory = async () => {
        if (!symbol) {
            setError("Veuillez entrer un symbole d'action.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await axios.get(`${API_URL}/price-history/${symbol}`);
            if (response.data.length === 0) {
                setError("Aucune donnée trouvée pour ce symbole.");
                setLoading(false);
                return;
            }

            setPriceHistory(response.data);

            // Appliquer une régression linéaire pour prédire les tendances futures
            const regressionData = response.data.map((entry, index) => [index, entry.price]);
            const result = regression.linear(regressionData);

            const futurePredictions = response.data.map((entry, index) => ({
                timestamp: entry.timestamp,
                price: result.equation[0] * index + result.equation[1]
            }));

            setPredictions(futurePredictions);
        } catch (err) {
            setError("Erreur lors de la récupération des données.");
        }

        setLoading(false);
    };

    // Préparer les données pour le graphique
    const chartData = {
        labels: priceHistory.map(entry => new Date(entry.timestamp).toLocaleDateString()),
        datasets: [
            {
                label: "Prix Historique",
                data: priceHistory.map(entry => entry.price),
                borderColor: "#36A2EB",
                backgroundColor: "rgba(54, 162, 235, 0.2)",
                tension: 0.4,
            },
            {
                label: "Prévisions",
                data: predictions.map(entry => entry.price),
                borderColor: "#FF6384",
                backgroundColor: "rgba(255, 99, 132, 0.2)",
                borderDash: [5, 5],
                tension: 0.4,
            },
        ],
    };

    return (
        <>
            <Header />
            <div className="simulation-container">
                <h2>📊 Simulation et Prévisions</h2>

                {error && <p className="error">{error}</p>}

                <input
                    type="text"
                    placeholder="Symbole (ex: AAPL)"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                />

                <button className="simulate-btn" onClick={fetchPriceHistory} disabled={loading}>
                    {loading ? "Simulation en cours..." : "Simuler"}
                </button>

                <div className="chart-container">
                    <Line data={chartData} />
                </div>
            </div>
        </>
    );
};

export default Simulation;
