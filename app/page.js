"use client";
import { useState } from "react";

export default function Dashboard() {
  const [data, setData] = useState({
    newPatients: "",
    calls: "",
    scheduled: "",
    kept: "",
    production: "",
    collections: "",
    adjustments: "",
    sameDayTreatment: "",
    reviews: "",
    referrals: "",
  });

  const handleChange = (field, value) => {
    setData({ ...data, [field]: value });
  };

  const production = Number(data.production) || 0;
  const collections = Number(data.collections) || 0;
  const adjustments = Number(data.adjustments) || 0;
  const goal = 12000;

  const netProduction = production - adjustments;
  const collectionRate = production ? (collections / production) * 100 : 0;
  const productionVsGoal = goal ? (production / goal) * 100 : 0;
  const showRate =
    data.scheduled && data.kept
      ? (data.kept / data.scheduled) * 100
      : 0;

  return (
    <main style={{ padding: 20 }}>
      <h1>SaaS Dental Owner Manager Reporting</h1>

      <div style={{ display: "grid", gap: 10, maxWidth: 400 }}>
        {Object.keys(data).map((field) => (
          <input
            key={field}
            placeholder={field}
            value={data[field]}
            onChange={(e) => handleChange(field, e.target.value)}
          />
        ))}
      </div>

      <h2>KPIs</h2>
      <p>Net Production: ${netProduction}</p>
      <p>Collection Rate: {collectionRate.toFixed(1)}%</p>
      <p>Production vs Goal: {productionVsGoal.toFixed(1)}%</p>
      <p>Show Rate: {showRate.toFixed(1)}%</p>
    </main>
  );
}
