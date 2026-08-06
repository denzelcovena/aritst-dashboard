import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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

export default function EngagementRateChart({ events = [] }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("latest_tiktok_snapshot")
        .select("posted_at, views, likes, comments, shares");
      if (error) setError(error.message);
      else setRows(data || []);
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
        <p style={{ margin: "2px 0", fontWeight: 700 }}>Engagement: {payload[0].value}%</p>
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
  const byDay = {};
  rows.forEach((r) => {
    if (!r.posted_at) return;
    const key = dateKey(r.posted_at);
    if (new Date(key) < cutoff) return;
    if (!byDay[key]) byDay[key] = { engagement: 0, views: 0 };
    byDay[key].engagement += (r.likes || 0) + (r.comments || 0) + (r.shares || 0);
    byDay[key].views += r.views || 0;
  });

  const chartData = Object.entries(byDay)
    .map(([date, v]) => ({ date, rate: v.views > 0 ? Math.round((v.engagement / v.views) * 10000) / 100 : 0 }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <p style={{ ...styles.sectionTitle, marginBottom: 0 }}>Engagement Rate</p>
        <div style={styles.tabRow}>
          {TABS.map((label, i) => (
            <button key={label} style={styles.tabBtn(activeTab === i)} onClick={() => setActiveTab(i)}>{label}</button>
          ))}
        </div>
      </div>

      {chartData.length < 2 ? (
        <p style={{ color: WHITE_MUTED, fontSize: "13px" }}>Not enough data yet in this window.</p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" tick={{ fill: WHITE_MUTED, fontSize: 10 }} />
            <YAxis tick={{ fill: WHITE_MUTED, fontSize: 10 }} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="rate" stroke="#ffcc33" strokeWidth={1.5} dot={{ fill: "#ffcc33", r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
