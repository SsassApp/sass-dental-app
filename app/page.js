"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
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
    date: date,
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
  if (date) {
    loadData();
  }
}, [date, practiceId]);
  useEffect(() => {
  if (user) {
    loadPractices();
  }
}, [user]);
  
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
  const goal = Number(goals.production) || 0;

  const netProduction = production - adjustments;
  const collectionRate = production ? (collections / production) * 100 : 0;
  const productionVsGoal = goal ? (production / goal) * 100 : 0;
const totalProduction = entries.reduce((sum, e) => sum + Number(e.production || 0), 0);
const totalCollections = entries.reduce((sum, e) => sum + Number(e.collections || 0), 0);
const totalNewPatients = entries.reduce((sum, e) => sum + Number(e.newPatients || 0), 0);
const totalScheduled = entries.reduce((sum, e) => sum + Number(e.scheduled || 0), 0);
const totalKept = entries.reduce((sum, e) => sum + Number(e.kept || 0), 0);
const totalSameDay = entries.reduce((sum, e) => sum + Number(e.sameDayTreatment || 0), 0);

const productionVsGoalSummary = goal ? (totalProduction / goal) * 100 : 0;
const collectionRateSummary = totalProduction ? (totalCollections / totalProduction) * 100 : 0;
const showRateSummary = totalScheduled ? (totalKept / totalScheduled) * 100 : 0;
const sameDayRateSummary = totalProduction ? (totalSameDay / totalProduction) * 100 : 0;
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
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
};  
const navItem = {
  background: "transparent",
  border: "none",
  color: "white",
  textAlign: "left",
  padding: "10px 0",
  cursor: "pointer",
  fontSize: 14
 };  
return (
  <div style={{ display: "flex", minHeight: "100vh"}}>
  <div style={{
  width: 220,
  background: "#111827",
  color: "white",
  padding: 20,
  display: "flex",
  flexDirection: "column"
}}>
  <h2 style={{ marginBottom: 30 }}>🦷 Dental SaaS</h2>

};
  <button style={navItem}>Dashboard</button>
  <button style={navItem}>Reports</button>
  <button style={navItem}>Settings</button>

  <div style={{ marginTop: "auto", fontSize: 12, opacity: 0.6 }}>
    Logged in as<br />{user.email}</div>
  </div>
<div style={{
  flex: 1,
  padding: 30,
  background: "#f5f7fb",
  fontFamily: "sans-serif"
}}>

      <h1 style={{ marginBottom: 20 }}>Sass Dental Dashboard</h1>
 <div style={cardStyle}>
  <h3>Practice</h3>

  <select
    value={practiceId}
    onChange={(e) => setPracticeId(e.target.value)}
    style={{
      padding: 8,
      borderRadius: 6,
      border: "1px solid #ddd",
      marginRight: 10
    }}
  >
    {practices.map((p, i) => (
      <option key={i} value={p}>
        {p}
      </option>
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
    style={{
      padding: "8px 12px",
      borderRadius: 6,
      border: "none",
      background: "#4f46e5",
      color: "white",
      cursor: "pointer"
    }}
  >
   + Add Practice
</button>
</div>
  <h2>Goals</h2>

<div style={{ border: "1px solid #ccc", padding: 10, borderRadius: 10 }}>
  <input
    placeholder="Production Goal"
    value={goals.production}
    onChange={(e) => setGoals({ ...goals, production: e.target.value })}
  />
  <input
    placeholder="New Patients Goal"
    value={goals.newPatients}
    onChange={(e) => setGoals({ ...goals, newPatients: e.target.value })}
  />
  <input
    placeholder="Show Rate Goal (%)"
    value={goals.showRate}
    onChange={(e) => setGoals({ ...goals, showRate: e.target.value })}
  />
  <input
    placeholder="Same Day Tx Goal (%)"
    value={goals.sameDay}
    onChange={(e) => setGoals({ ...goals, sameDay: e.target.value })}
  />
</div>
    <h2>Daily Summary</h2>
     <div style={{ ...cardStyle, marginTop: 20 }}>
  <h3>Production Trend</h3>

  <LineChart width={500} height={300} data={chartData}>
    <CartesianGrid stroke="#eee" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="production" stroke="#4f46e5" strokeWidth={3} />
    <Line type="monotone" dataKey="collections" stroke="#10b981" strokeWidth={3} />
  </LineChart>
</div>

<div style={{
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 15,
  marginTop: 20
}}>
  <div style={{ ...cardStyle, textAlign: "center" }}>
    <strong>Production vs Goal</strong>
    <p style={{ color: getColor(productionVsGoalSummary, 100, 80) }}>
  {productionVsGoalSummary.toFixed(1)}%
</p>
  </div>

  <div style={{ ...cardStyle, textAlign: "center" }}>
    <strong>Collection Rate</strong>
    <p style={{ color: getColor(collectionRateSummary, 98, 90) }}>
  {collectionRateSummary.toFixed(1)}%
</p>
  </div>

  <div style={{ ...cardStyle, textAlign: "center" }}>
    <strong>New Patients</strong>
    <p style={{ color: getColor(totalNewPatients, goals.newPatients, goals.newPatients * 0.5)}}>
  {totalNewPatients}
</p>
  </div>

  <div style={{ ...cardStyle, textAlign: "center" }}>
    <strong>Show Rate</strong>
    <p style={{ color: getColor(showRateSummary, goals.showRate, goals.showRate * 0.8)}}>
  {showRateSummary.toFixed(1)}%
</p>
  </div>

  <div style={{ ...cardStyle, textAlign: "center" }}>
    <strong>Same Day Tx</strong>
    <p style={{ color: getColor(sameDayRateSummary, goals.sameDay, goals.sameDay * 0.5)}}>
  {sameDayRateSummary.toFixed(1)}%
</p>
  </div>
</div>
    <input
  type="date"
  value={date}
  onChange={(e) => setDate(e.target.value)}
/>

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

      <h2>KPIs</h2>
      <p>Net Production: ${netProduction}</p>
      <p>Collection Rate: {collectionRate.toFixed(1)}%</p>
      <p>Production vs Goal: {productionVsGoal.toFixed(1)}%</p>

      <h2>Saved Entries</h2>

{entries.length === 0 ? (
  <p>No data for this date</p>
) : (
  entries.map((entry, i) => (
    <div key={i} style={{ marginBottom: 10 }}>
      <p>Date: {entry.date}</p>
      <p>Production: {entry.production}</p>
      <p>Collections: {entry.collections}</p>
      <hr />
    </div>
  ))
)}

</div> {/* main content */}
</div> {/* layout */}

);
}
