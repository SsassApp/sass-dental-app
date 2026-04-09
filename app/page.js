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
      <main style={{ padding: 40, fontFamily: "sans-serif" }}>
        <h1 style={{ marginBottom: 20 }}>Login</h1>

        <input
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <button onClick={login} style={primaryButton}>
          Login / Sign Up
        </button>
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

  const chartData = entries.map((e) => ({
    date: e.date,
    production: Number(e.production || 0),
    collections: Number(e.collections || 0),
  }));

  const cardStyle = {
    background: "#fff",
    padding: 20,
    borderRadius: 16,
    boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
  };

  const navItem = {
    background: "transparent",
    border: "none",
    color: "white",
    textAlign: "left",
    padding: "10px 0",
    cursor: "pointer",
    fontSize: 14,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      
      {/* SIDEBAR */}
      <div style={{
        width: 240,
        background: "#0f172a",
        color: "white",
        padding: 24,
        display: "flex",
        flexDirection: "column"
      }}>
        <h2 style={{ marginBottom: 30 }}>🦷 Dental SaaS</h2>

        <button style={navItem}>🏠 Dashboard</button>
        <button style={navItem}>📊 Reports</button>
        <button style={navItem}>⚙️ Settings</button>

        <div style={{ marginTop: "auto", fontSize: 12, opacity: 0.6 }}>
          {user.email}
        </div>
      </div>

      {/* MAIN */}
      <div style={{
        flex: 1,
        padding: 30,
        background: "#f8fafc"
      }}>
        <h1 style={{ fontSize: 28, marginBottom: 20 }}>Dashboard</h1>

        {/* KPI CARDS */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 25
        }}>
          <div style={cardStyle}>
            <p style={label}>Net Production</p>
            <h2>${netProduction}</h2>
          </div>

          <div style={cardStyle}>
            <p style={label}>Collection Rate</p>
            <h2>{collectionRate.toFixed(1)}%</h2>
          </div>

          <div style={cardStyle}>
            <p style={label}>Production Goal</p>
            <h2>{productionVsGoal.toFixed(1)}%</h2>
          </div>
        </div>

        {/* PRACTICE */}
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <h3>Practice</h3>

          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <select
              value={practiceId}
              onChange={(e) => setPracticeId(e.target.value)}
              style={inputStyle}
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
              style={primaryButton}
            >
              + Add
            </button>
          </div>
        </div>

        {/* CHART */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: 15 }}>Production Trend</h3>

          <LineChart width={600} height={300} data={chartData}>
            <CartesianGrid stroke="#eee" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="production" stroke="#4f46e5" strokeWidth={3} />
            <Line type="monotone" dataKey="collections" stroke="#10b981" strokeWidth={3} />
          </LineChart>
        </div>
      </div>
    </div>
  );
}

// 🔹 Shared styles
const inputStyle = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  marginBottom: 10,
  width: "100%",
};

const primaryButton = {
  background: "#4f46e5",
  color: "white",
  border: "none",
  padding: "10px 14px",
  borderRadius: 8,
  cursor: "pointer",
};

const label = {
  fontSize: 12,
  opacity: 0.6,
};
