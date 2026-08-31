import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const TABS = ["Last 7 days", "Last 30 days"];
const WINDOW_DAYS = [7, 30];
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

export default function ConversionRateChart({ events = [] }) {
  const [spotifyRows, setSpotifyRows] = useState([]);
  const [tiktokRows, setTiktokRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

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
    explainer: { fontSize: "11px", color: WHITE_MUTED, margin: "2px 0 0" },
    tabRow: { display: "flex", gap: "16px" },
    tabBtn: (active) => ({ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "11px", fontWeight: "700", letterSpacing: "0.04em", textTransform: "uppercase", color: active ? "#fff" : WHITE_MUTED }),
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const dayEvents = events.filter((e) => e.event_date === label);
    return (
      <div style={{ background: "#fff", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: "#1c4fd6", maxWidth: "220px" }}>
        <p style={{ margin: "0 0 4px", color: "#6b83c9", fontSize: "10px" }}>{label}</p>
        <p style={{ margin: "2px 0", fontWeight: 700 }}>Conversion: {payload[0].value}%</p>
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

  const viewsByDay = {};
  tiktokRows.forEach((r) => {
    if (!r.posted_at) return;
    const key = dateKey(r.posted_at);
    viewsByDay[key] = (viewsByDay[key] || 0) + (r.views || 0);
  });

  const listenersByDay = {};
  spotifyRows.forEach((r) => { listenersByDay[r.captured_date] = r.monthly_listeners; });

  const sortedSpotifyDates = spotifyRows.map((r) => r.captured_date).sort();

  const chartData = [];
  sortedSpotifyDates.forEach((date, i) => {
    if (new Date(date) < cutoff) return;
    const nextDate = sortedSpotifyDates[i + 1];
    if (!nextDate) return;
    const views = viewsByDay[date];
    const gain = listenersByDay[nextDate] - listenersByDay[date];
    if (!views || views === 0) return;
    const rate = (gain / views) * 100;
    chartData.push({ date, rate: Math.round(rate * 100) / 100 });
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <p style={{ ...styles.sectionTitle, marginBottom: "2px" }}>Conversion Rate</p>
          <p style={styles.explainer}>How much a day's views turned into new listeners the next day</p>
        </div>
        <div style={styles.tabRow}>
          {TABS.map((label, i) => (
            <button key={label} style={styles.tabBtn(activeTab === i)} onClick={() => setActiveTab(i)}>{label}</button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <p style={{ color: WHITE_MUTED, fontSize: "13px" }}>Not enough data yet — needs at least two consecutive nights of Spotify data plus a day with posts.</p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" tick={{ fill: WHITE_MUTED, fontSize: 10 }} />
            <YAxis tick={{ fill: WHITE_MUTED, fontSize: 10 }} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="rate" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.rate >= 0 ? "#ffcc33" : "#ff8f8f"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
