"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { addDoc, collection, getDocs, setDoc, doc } from "firebase/firestore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

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
  const [date, setDate] = useState("");

  const [practiceId, setPracticeId] = useState("default");
  const [practices, setPractices] = useState(["default"]);

  const [goals, setGoals] = useState({
    production: 12000,
    newPatients: 10,
    showRate: 90,
    sameDay: 30,
  });

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

  const savePractices = async (newList) => {
    await setDoc(doc(db, "practices", user.email), {
      user: user.email,
      list: newList,
    });
  };

  const saveData = async () => {
    await addDoc(collection(db, "entries"), {
      ...data,
      goals,
      practiceId,
      date,
      createdAt: new Date(),
      user: user.email,
    });
    alert("Saved!");
  };

  const loadData = async () => {
    const querySnapshot = await getDocs(collection(db, "entries"));
    const list = [];

    querySnapshot.forEach((doc) => {
      const entry = doc.data();
      if (entry.date === date && entry.practiceId === practiceId) {
        list.push(entry);
      }
    });

    setEntries(list);

    if (list.length > 0 && list[0].goals) {
      setGoals(list[0].goals);
    }
  };

  const loadPractices = async () => {
    const querySnapshot = await getDocs(collection(db, "practices"));

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.user === user.email) {
        setPractices(data.list);
      }
    });
  };

  useEffect(() => {
    if (date) loadData();
  }, [date, practiceId]);

  useEffect(() => {
    if (user) loadPractices();
  }, [user]);

  if (!user) {
    return (
      <main style={{ padding: 20 }}>
        <h1>Login</h1>
        <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
        <input
          placeholder="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={login}>Login / Sign Up</button>
      </main>
    );
  }

  // Calculations
  const production = Number(data.production) || 0;
  const collections = Number(data.collections) || 0;
  const adjustments = Number(data.adjustments) || 0;
  const goal = Number(goals.production) || 0;

  const netProduction = production - adjustments;
  const collectionRate = production ? (collections / production) * 100 : 0;
  const productionVsGoal = goal ? (production / goal) * 100 : 0;

  const totalProduction = entries.reduce(
    (sum, e) => sum + Number(e.production || 0),
    0
  );
  const totalCollections = entries.reduce(
    (sum, e) => sum + Number(e.collections || 0),
    0
  );

  const chartData = entries.map((e) => ({
    date: e.date,
    production: Number(e.production || 0),
    collections: Number(e.collections || 0),
  }));

  const getColor = (value, good, ok) => {
    if (value >= good) return "green";
    if (value >= ok) return "orange";
    return "red";
  };

  const cardStyle = {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  };

  const navItem = {
    background: "transparent",
    border: "none",
    color: "white",
    textAlign: "left",
    padding: "10px 0",
    cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <div
        style={{
          width: 220,
          background: "#111827",
          color: "white",
          padding: 20,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2 style={{ marginBottom: 30 }}>🦷 Dental SaaS</h2>

        <button style={navItem}>Dashboard</button>
        <button style={navItem}>Reports</button>
        <button style={navItem}>Settings</button>

        <div style={{ marginTop: "auto", fontSize: 12, opacity: 0.6 }}>
          {user.email}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div
        style={{
          flex: 1,
          padding: 30,
          background: "#f5f7fb",
        }}
      >
        <h1>SaaS Dental Dashboard</h1>

        <div style={cardStyle}>
          <h3>Practice</h3>

          <select
            value={practiceId}
            onChange={(e) => setPracticeId(e.target.value)}
          >
            {practices.map((p, i) => (
              <option key={i}>{p}</option>
            ))}
          </select>

          <button
            onClick={async () => {
              const name = prompt("New practice name:");
              if (name) {
                const updated = [...practices, name];
                setPractices(updated);
                await savePractices(updated);
              }
            }}
          >
            + Add Practice
          </button>
        </div>

        <div style={{ ...cardStyle, marginTop: 20 }}>
          <h3>Production Trend</h3>

          <LineChart width={500} height={300} data={chartData}>
            <CartesianGrid />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line dataKey="production" />
            <Line dataKey="collections" />
          </LineChart>
        </div>

        <h2>KPIs</h2>
        <p>Net Production: ${netProduction}</p>
        <p>Collection Rate: {collectionRate.toFixed(1)}%</p>
        <p>Production vs Goal: {productionVsGoal.toFixed(1)}%</p>
      </div>
    </div>
  );
}
