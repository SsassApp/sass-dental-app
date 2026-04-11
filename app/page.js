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

  const [range, setRange] = useState("day");

  const [data, setData] = useState({
    production: "",
    collections: "",
    adjustments: "",
    newPatients: "",
    referrals: "",
    providerProduction: "",
    claims30: "",
    claims60: "",
    claims90: "",
  });

  const [entries, setEntries] = useState([]);
  const [date, setDate] = useState("");

  const [practiceId, setPracticeId] = useState("default");
  const [practices, setPractices] = useState(["default"]);

  // ---------- AUTO DATE ----------
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, []);

  // ---------- LOGIN ----------
  const login = async () => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      setUser(res.user);
    } catch {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      setUser(res.user);
    }
  };

  const handle = (field, value) => {
    setData({ ...data, [field]: value });
  };

  // ---------- SAVE ----------
  const saveData = async () => {
    if (!date) {
      alert("Select a date");
      return;
    }

    await addDoc(collection(db, "entries"), {
      ...data,
      practiceId,
      date,
      createdAt: new Date(),
      user: user.email,
    });

    alert("Saved!");
    loadData();
  };

  // ---------- LOAD ----------
  const loadData = async () => {
    const querySnapshot = await getDocs(collection(db, "entries"));
    const list = [];

    querySnapshot.forEach((doc) => {
      const e = doc.data();

      if (
        e.practiceId === practiceId &&
        e.user === user.email
      ) {
        list.push(e);
      }
    });

    setEntries(list);
  };

  // ---------- PRACTICES ----------
  const savePractices = async (newList) => {
    await setDoc(doc(db, "practices", user.email), {
      user: user.email,
      list: newList,
    });
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
    if (user) loadData();
  }, [practiceId, user]);

  // ---------- LOGIN SCREEN ----------
  if (!user) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Login</h1>
        <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} style={inputStyle}/>
        <input placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} style={inputStyle}/>
        <button onClick={login} style={btn}>Login</button>
      </main>
    );
  }

  // ---------- FILTER (REPORTING MAGIC) ----------
  const now = new Date();

  const filtered = entries.filter((e) => {
    const d = new Date(e.date);

    if (range === "day") {
      return d.toDateString() === now.toDateString();
    }

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

  // ---------- TOTALS ----------
  const sum = (field) =>
    filtered.reduce((s, e) => s + Number(e[field] || 0), 0);

  const chartData = filtered.map((e) => ({
    date: e.date,
    production: Number(e.production || 0),
    collections: Number(e.collections || 0),
  }));

  return (
    <div style={{ padding: 30 }}>

      <h1>Dental Dashboard</h1>

      {/* PRACTICE */}
      <select value={practiceId} onChange={(e) => setPracticeId(e.target.value)} style={inputStyle}>
        {practices.map((p, i) => <option key={i}>{p}</option>)}
      </select>

      <button onClick={async () => {
        const name = prompt("New practice:");
        if (name) {
          const updated = [...practices, name];
          setPractices(updated);
          await savePractices(updated);
        }
      }} style={btn}>
        + Practice
      </button>

      {/* ENTRY */}
      <div style={card}>
        <h3>Daily Entry</h3>

        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />

        <h4>Financial</h4>
        <input placeholder="Production" onChange={(e) => handle("production", e.target.value)} style={inputStyle}/>
        <input placeholder="Collections" onChange={(e) => handle("collections", e.target.value)} style={inputStyle}/>
        <input placeholder="Adjustments" onChange={(e) => handle("adjustments", e.target.value)} style={inputStyle}/>

        <h4>Growth</h4>
        <input placeholder="New Patients" onChange={(e) => handle("newPatients", e.target.value)} style={inputStyle}/>
        <input placeholder="Referrals" onChange={(e) => handle("referrals", e.target.value)} style={inputStyle}/>

        <h4>Providers</h4>
        <input placeholder="Provider Production" onChange={(e) => handle("providerProduction", e.target.value)} style={inputStyle}/>

        <h4>Claims</h4>
        <input placeholder="30 Days" onChange={(e) => handle("claims30", e.target.value)} style={inputStyle}/>
        <input placeholder="60 Days" onChange={(e) => handle("claims60", e.target.value)} style={inputStyle}/>
        <input placeholder="90 Days" onChange={(e) => handle("claims90", e.target.value)} style={inputStyle}/>

        <button onClick={saveData} style={btn}>Save Entry</button>
      </div>

      {/* RANGE TOGGLE */}
      <div style={{ marginTop: 20 }}>
        <button onClick={() => setRange("day")} style={rangeBtn(range === "day")}>Day</button>
        <button onClick={() => setRange("week")} style={rangeBtn(range === "week")}>Week</button>
        <button onClick={() => setRange("month")} style={rangeBtn(range === "month")}>Month</button>
      </div>

      {/* KPI GRID */}
      <div style={grid}>
        <Card title="Production" value={`$${sum("production")}`} />
        <Card title="Collections" value={`$${sum("collections")}`} />
        <Card title="New Patients" value={sum("newPatients")} />
        <Card title="Referrals" value={sum("referrals")} />
        <Card title="Provider Production" value={`$${sum("providerProduction")}`} />
        <Card title="Claims 30" value={`$${sum("claims30")}`} />
        <Card title="Claims 60" value={`$${sum("claims60")}`} />
        <Card title="Claims 90" value={`$${sum("claims90")}`} />
      </div>

      {/* CHART */}
      <div style={card}>
        <LineChart width={700} height={300} data={chartData}>
          <CartesianGrid />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line dataKey="production" stroke="#4f46e5" />
          <Line dataKey="collections" stroke="#10b981" />
        </LineChart>
      </div>

    </div>
  );
}

// ---------- UI ----------
const Card = ({ title, value }) => (
  <div style={card}>
    <p>{title}</p>
    <h2>{value}</h2>
  </div>
);

const inputStyle = {
  padding: 8,
  marginBottom: 8,
  width: "100%",
};

const btn = {
  padding: 10,
  background: "#4f46e5",
  color: "white",
  border: "none",
  marginBottom: 10,
};

const card = {
  padding: 20,
  border: "1px solid #ddd",
  marginTop: 20,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))",
  gap: 10,
  marginTop: 20,
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
const rangeBtn = (active) => ({
  padding: "6px 10px",
  marginRight: 5,
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  background: active ? "#4f46e5" : "#e5e7eb",
  color: active ? "white" : "black",
});
