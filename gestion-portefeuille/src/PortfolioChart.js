import React from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { Line } from "react-chartjs-2";

// 🔹 Enregistrer les échelles nécessaires pour éviter les erreurs
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const PortfolioChart = ({ historique }) => {
  const data = {
    labels: historique.map((h) => h.date),
    datasets: [
      {
        label: "Évolution du Portefeuille (€)",
        data: historique.map((h) => h.valeur),
        borderColor: "blue",
        borderWidth: 2,
        fill: false,
      },
    ],
  };

  return (
    <div style={{ width: "80%", margin: "auto" }}>
      <h2>📊 Évolution du Portefeuille</h2>
      <Line data={data} />
    </div>
  );
};

export default PortfolioChart;
