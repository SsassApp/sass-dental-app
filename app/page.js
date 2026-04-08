"use client";
import { useState } from "react";
import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { addDoc, collection, getDocs } from "firebase/firestore";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
  
const [entries, setEntries] = useState([]);
  
  const handleChange = (field, value) => {
    setData({ ...data, [field]: value });
  };

  const login = async () => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      setUser(res.user);
    } catch {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      setUser(res.user);
    }
  };

  const saveData = async () => {
    await addDoc(collection(db, "entries"), {
      ...data,
      createdAt: new Date(),
      user: user.email,
    });
    alert("Saved!");
  };

  const loadData = async () => {
  const querySnapshot = await getDocs(collection(db, "entries"));
  const list = [];
  querySnapshot.forEach((doc) => {
    list.push(doc.data());
  });
  setEntries(list);
};
  
  if (!user) {
    return (
      <main style={{ padding: 20 }}>
        <h1>Login</h1>
        <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} />
        <button onClick={login}>Login / Sign Up</button>
      </main>
    );
  }

  const production = Number(data.production) || 0;
  const collections = Number(data.collections) || 0;
  const adjustments = Number(data.adjustments) || 0;
  const goal = 12000;

  const netProduction = production - adjustments;
  const collectionRate = production ? (collections / production) * 100 : 0;
  const productionVsGoal = goal ? (production / goal) * 100 : 0;

  return (
    <main style={{ padding: 20 }}>
      <h1>SaaS Dental Dashboard</h1>

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

      <button onClick={saveData}>Save Data</button>
      <button onClick={loadData}>Load Data</button>

      <h2>KPIs</h2>
      <p>Net Production: ${netProduction}</p>
      <p>Collection Rate: {collectionRate.toFixed(1)}%</p>
      <p>Production vs Goal: {productionVsGoal.toFixed(1)}%</p>

      <h2>Saved Entries</h2>
{entries.map((entry, i) => (
  <div key={i} style={{ marginBottom: 10 }}>
    <p>Production: {entry.production}</p>
    <p>Collections: {entry.collections}</p>
    <hr />
  </div>
))}<h2>Saved Entries</h2>
{entries.map((entry, i) => (
  <div key={i} style={{ marginBottom: 10 }}>
    <p>Production: {entry.production}</p>
    <p>Collections: {entry.collections}</p>
    <hr />
  </div>
))}
    </main>
  );
}
