import React from "react";

const PortfolioTable = ({ historique }) => {
  return (
    <div style={{ width: "80%", margin: "auto", marginTop: "20px" }}>
      <h2>📋 Historique des Actifs</h2>
      <table border="1" style={{ width: "100%", textAlign: "center", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#ddd" }}>
            <th>Date</th>
            <th>Valeur (€)</th>
          </tr>
        </thead>
        <tbody>
          {historique.map((h, index) => (
            <tr key={index}>
              <td>{h.date}</td>
              <td>{h.valeur.toFixed(2)} €</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PortfolioTable;
