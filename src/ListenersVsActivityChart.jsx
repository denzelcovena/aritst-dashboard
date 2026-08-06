import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const TABS = ["Last 7 days", "Last 30 days", "Last 365 days"];
const WINDOW_DAYS = [7, 30, 365];
const WHITE_MUTED = "rgba(255,255,255,0.55)";

function startOfDaysAgo(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}
function dateKey(d) {
  return new Date(d).toISOString().split("T")[0];
}

export default function ListenersVsActivityChart({ events = [] }) {
  const [spotifyRows, setSpotifyRows] = useState([]);
  const [tiktokRows, setTiktokRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [metric, setMetric] = useState("posts");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const [spotifyRes, tiktokRes] = await Promise.all([
        supabase.from("spotify_stats").select("captured_date, monthly_listeners").order("captured_date", { ascending: true }),
        supabase.from("latest_tiktok_snapshot").select("posted_at, views"),
      ]);
      if (spotifyRes.error) setError(spotifyRes.error.message);
      else if (tiktokRes.error) setError(tiktokRes.error.message);
      else {
        setSpotifyRows(spotifyRes.data || []);
        setTiktokRows(tiktokRes.data || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const styles = {
    sectionTitle: { fontSize: "11px", fontWeight: "700", color: WHITE_MUTED, textTransform: "uppercase", letterSpacing: "0.1em" },
    tabRow: { display: "flex", gap: "16px" },
    tabBtn: (active) => ({ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "11px", fontWeight: "700", letterSpacing: "0.04em", textTransform: "uppercase", color: active ? "#fff" : WHITE_MUTED }),
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const dayEvents = events.filter((e) => e.event_date === label);
    return (
      <div style={{ background: "#fff", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: "#1c4fd6", maxWidth: "220px" }}>
        <p style={{ margin: "0 0 4px", color: "#6b83c9", fontSize: "10px" }}>{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ margin: "2px 0", fontWeight: 700 }}>{p.name}: {p.value?.toLocaleString()}</p>
        ))}
        {dayEvents.length > 0 && (
          <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px solid #eee" }}>
            {dayEvents.map((e) => (<p key={e.id} style={{ margin: "2px 0", color: "#b8860b", fontSize: "11px" }}>• {e.event_name}</p>))}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <p style={{ color: WHITE_MUTED, fontSize: "13px" }}>Loading...</p>;
  if (error) return <p style={{ color: "#ff8f8f", fontSize: "13px" }}>Error: {error}</p>;

  const cutoff = startOfDaysAgo(WINDOW_DAYS[activeTab]);

  const postsByDay = {};
  const viewsByDay = {};
  tiktokRows.forEach((r) => {
    if (!r.posted_at) return;
    const key = dateKey(r.posted_at);
    postsByDay[key] = (postsByDay[key] || 0) + 1;
    viewsByDay[key] = (viewsByDay[key] || 0) + (r.views || 0);
  });

  const chartData = spotifyRows
    .filter((r) => new Date(r.captured_date) >= cutoff)
    .map((r) => ({
      date: r.captured_date,
      listeners: r.monthly_listeners,
      activity: metric === "posts" ? (postsByDay[r.captured_date] || 0) : (viewsByDay[r.captured_date] || 0),
    }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "8px" }}>
        <p style={{ ...styles.sectionTitle, marginBottom: 0 }}>Posts/Views vs Listeners</p>
        <div style={styles.tabRow}>
          {TABS.map((label, i) => (
            <button key={label} style={styles.tabBtn(activeTab === i)} onClick={() => setActiveTab(i)}>{label}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: "16px", marginBottom: "14px" }}>
        <button style={styles.tabBtn(metric === "posts")} onClick={() => setMetric("posts")}>● Posts</button>
        <button style={styles.tabBtn(metric === "views")} onClick={() => setMetric("views")}>● Views</button>
        <span style={{ ...styles.tabBtn(true), color: "#fff" }}>● Listeners</span>
      </div>

      {chartData.length < 2 ? (
        <p style={{ color: WHITE_MUTED, fontSize: "13px" }}>Not enough data yet in this window.</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" tick={{ fill: WHITE_MUTED, fontSize: 10 }} />
            <YAxis yAxisId="left" tick={{ fill: WHITE_MUTED, fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: WHITE_MUTED, fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Line yAxisId="left" type="monotone" dataKey="listeners" name="Monthly Listeners" stroke="#fff" strokeWidth={1.5} dot={{ fill: "#fff", r: 3 }} />
            <Line yAxisId="right" type="monotone" dataKey="activity" name={metric === "posts" ? "Posts" : "Views"} stroke="#ffcc33" strokeWidth={1.5} dot={{ fill: "#ffcc33", r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
