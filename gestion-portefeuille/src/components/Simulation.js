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
    const [investmentScenario, setInvestmentScenario] = useState([]);
    const [feesImpact, setFeesImpact] = useState([]);

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

    const simulateInvestmentScenario = () => {
        const scenario = priceHistory.map((entry, index) => ({
            timestamp: entry.timestamp,
            price: entry.price * (index % 2 === 0 ? 1.05 : 0.95), // Variation de prix pour différenciation
            action: index % 2 === 0 ? "Achat" : "Vente",
            quantity: 10
        }));
        setInvestmentScenario(scenario);
    };

    const calculateFeesImpact = () => {
        const FEE_RATE = 0.02;
        const feesData = priceHistory.map((entry, index) => ({
            timestamp: entry.timestamp,
            price: entry.price * (1 - FEE_RATE * index / priceHistory.length)
        }));
        setFeesImpact(feesData);
    };

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
            {
                label: "Scénario d'Investissement",
                data: investmentScenario.map(entry => entry.price),
                borderColor: "#FF5733",
                backgroundColor: "rgba(255, 87, 51, 0.2)", // Changement de couleur pour démarquer
                borderDash: [3, 3],
                tension: 0.4,
            },
            {
                label: "Impact des Frais",
                data: feesImpact.map(entry => entry.price),
                borderColor: "#FFC300",
                backgroundColor: "rgba(255, 195, 0, 0.2)",
                borderDash: [4, 4],
                tension: 0.4,
            }
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

                <button className="simulate-btn" onClick={simulateInvestmentScenario}>
                    Simuler Achat/Vente
                </button>

                <button className="simulate-btn" onClick={calculateFeesImpact}>
                    Calculer Impact des Frais
                </button>

                <div className="chart-container">
                    <Line data={chartData} />
                </div>
            </div>
        </>
    );
};

export default Simulation;
