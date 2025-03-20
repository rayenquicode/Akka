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

    // Fonction pour récupérer l'historique des prix et faire les prévisions
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

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                labels: {
                    color: "white", // 🔥 Mettre les légendes en blanc
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
                    color: "white", // 🔥 Rendre les chiffres de l'axe X blancs
                    font: {
                        size: 12,
                        weight: "bold"
                    }
                },
                grid: {
                    color: "rgba(255, 255, 255, 0.2)" // 🔥 Rendre la grille plus discrète
                }
            },
            y: {
                ticks: {
                    color: "white", // 🔥 Rendre les chiffres de l'axe Y blancs
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
                label: "Prévisions (Régression Linéaire)",
                data: predictions.map(entry => entry.price),
                borderColor: "#2ECC71",
                backgroundColor: "rgba(54, 162, 235, 0.2)",
                borderDash: [5, 5],
                tension: 0.4,
            },
        ],
    };

    return (
        <>
            <Header />
            <div className="simulation-container">
                <h2 className="simulation-title">Simulation</h2>


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
