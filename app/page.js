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

  const [darkMode, setDarkMode] = useState(false);
  const [range, setRange] = useState("week");

  const [data, setData] = useState({
    production: "",
    collections: "",
    adjustments: "",
  });

  const [entries, setEntries] = useState([]);
  const [date, setDate] = useState("");

  const [practiceId, setPracticeId] = useState("default");
  const [practices, setPractices] = useState(["default"]);

  const [goals, setGoals] = useState({
    production: 12000,
  });

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
      if (entry.practiceId === practiceId) {
        list.push(entry);
      }
    });

    setEntries(list);
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
    if (user) loadPractices();
  }, [user]);

  useEffect(() => {
    loadData();
  }, [practiceId]);

  if (!user) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Login</h1>
        <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} style={inputStyle}/>
        <input placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} style={inputStyle}/>
        <button onClick={login} style={primaryButton}>Login</button>
      </main>
    );
  }

  // FILTER DATA
  const filterEntries = () => {
    const now = new Date();

    return entries.filter((e) => {
      const d = new Date(e.date);

      if (range === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      }

      if (range === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return d >= monthAgo;
      }

      return true;
    });
  };

  const filtered = filterEntries();

  const totalProduction = filtered.reduce((sum, e) => sum + Number(e.production || 0), 0);
  const totalCollections = filtered.reduce((sum, e) => sum + Number(e.collections || 0), 0);

  const forecast = Math.round((totalProduction / (filtered.length || 1)) * 30);

  const chartData = filtered.map((e) => ({
    date: e.date,
    production: Number(e.production || 0),
    collections: Number(e.collections || 0),
  }));

  const getColor = (val, goal) => {
    if (val >= goal) return "green";
    if (val >= goal * 0.7) return "orange";
    return "red";
  };

  const theme = darkMode
    ? { bg: "#0f172a", card: "#1e293b", text: "white" }
    : { bg: "#f8fafc", card: "#fff", text: "#000" };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.bg, color: theme.text }}>

      {/* SIDEBAR */}
      <div style={{ width: 240, padding: 20, background: darkMode ? "#020617" : "#111827", color: "white" }}>
        <h2>🦷 Dental SaaS</h2>

        <button style={navItem}>Dashboard</button>
        <button style={navItem}>Reports</button>

        <div style={{ marginTop: 20 }}>
          <select value={practiceId} onChange={(e) => setPracticeId(e.target.value)} style={inputStyle}>
            {practices.map((p, i) => (
              <option key={i}>{p}</option>
            ))}
          </select>

          <button onClick={async () => {
            const name = prompt("New practice:");
            if (name) {
              const updated = [...practices, name];
              setPractices(updated);
              await savePractices(updated);
            }
          }} style={primaryButton}>
            + Practice
          </button>
        </div>

        <div style={{ marginTop: "auto", fontSize: 12 }}>{user.email}</div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: 30 }}>
        <h1>Dashboard</h1>

        {/* CONTROLS */}
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => setRange("day")} style={rangeBtn(range === "day")}>Day</button>
          <button onClick={() => setRange("week")} style={rangeBtn(range === "week")}>Week</button>
          <button onClick={() => setRange("month")} style={rangeBtn(range === "month")}>Month</button>

          <button onClick={() => setDarkMode(!darkMode)} style={{ marginLeft: 10 }}>
            🌙 Toggle
          </button>
        </div>

<div style={{ marginTop: 20, ...cardStyle(theme) }}>
  <h3 style={{ marginBottom: 10 }}>Daily Entry</h3>

  <input
    type="date"
    value={date}
    onChange={(e) => setDate(e.target.value)}
    style={inputStyle}
  />

  <input
    placeholder="Production"
    value={data.production}
    onChange={(e) => setData({ ...data, production: e.target.value })}
    style={inputStyle}
  />

  <input
    placeholder="Collections"
    value={data.collections}
    onChange={(e) => setData({ ...data, collections: e.target.value })}
    style={inputStyle}
  />

  <input
    placeholder="Adjustments"
    value={data.adjustments}
    onChange={(e) => setData({ ...data, adjustments: e.target.value })}
    style={inputStyle}
  />

  <button onClick={saveData} style={primaryButton}>
    💾 Save Entry
  </button>
</div>
        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 15 }}>
          <div style={{ ...cardStyle(theme) }}>
            <p>Production</p>
            <h2 style={{ color: getColor(totalProduction, goals.production) }}>${totalProduction}</h2>
          </div>

          <div style={{ ...cardStyle(theme) }}>
            <p>Collections</p>
            <h2>${totalCollections}</h2>
          </div>

          <div style={{ ...cardStyle(theme) }}>
            <p>Forecast (30d)</p>
            <h2>${forecast}</h2>
          </div>
        </div>

        {/* CHART */}
        <div style={{ marginTop: 20, ...cardStyle(theme) }}>
          <LineChart width={700} height={300} data={chartData}>
            <CartesianGrid stroke="#ccc" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line dataKey="production" stroke="#4f46e5" />
            <Line dataKey="collections" stroke="#10b981" />
          </LineChart>
        </div>
      </div>
    </div>
  );
}

/* STYLES */
const inputStyle = {
  padding: 8,
  borderRadius: 6,
  border: "1px solid #ccc",
  marginBottom: 8,
  width: "100%",
};

const primaryButton = {
  background: "#4f46e5",
  color: "white",
  padding: 8,
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  width: "100%",
};

const navItem = {
  display: "block",
  background: "none",
  border: "none",
  color: "white",
  marginTop: 10,
  cursor: "pointer",
};

const rangeBtn = (active) => ({
  padding: "6px 10px",
  marginRight: 5,
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  background: active ? "#4f46e5" : "#e5e7eb",
  color: active ? "white" : "black",
});

const cardStyle = (theme) => ({
  background: theme.card,
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
});
