// components/SocialGrowthChart.jsx
// Dual-axis chart: TikTok posting volume/engagement (bars) vs Spotify
// monthly listeners (line), bucketed by day.

import { useEffect, useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "./supabaseClient";

function CustomSocialTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      style={{
        background: "#1a1a1a",
        border: "1px solid #333",
        borderRadius: 8,
        padding: "10px 14px",
        color: "#eee",
      }}
    >
      <p style={{ marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ margin: 0, color: entry.color }}>
          {entry.name}: {entry.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function SocialGrowthChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [tiktokRes, spotifyRes] = await Promise.all([
          supabase
            .from("tiktok_posts")
            .select("captured_date, views, likes, comments, shares")
            .order("captured_date", { ascending: true }),
          supabase
            .from("spotify_stats")
            .select("captured_date, monthly_listeners")
            .order("captured_date", { ascending: true }),
        ]);

        if (tiktokRes.error) throw tiktokRes.error;
        if (spotifyRes.error) throw spotifyRes.error;

        const byDate = {};
        for (const row of tiktokRes.data) {
          const d = row.captured_date;
          if (!byDate[d]) {
            byDate[d] = { date: d, totalEngagement: 0, postCount: 0 };
          }
          byDate[d].totalEngagement +=
            (row.views ?? 0) + (row.likes ?? 0) + (row.comments ?? 0) + (row.shares ?? 0);
          byDate[d].postCount += 1;
        }

        for (const row of spotifyRes.data) {
          const d = row.captured_date;
          if (!byDate[d]) {
            byDate[d] = { date: d, totalEngagement: 0, postCount: 0 };
          }
          byDate[d].monthlyListeners = row.monthly_listeners;
        }

        const merged = Object.values(byDate).sort((a, b) =>
          a.date.localeCompare(b.date)
        );

        setData(merged);
      } catch (err) {
        console.error("Failed to load social growth data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) return <div style={{ color: "#888" }}>Loading social growth data...</div>;
  if (error) return <div style={{ color: "#e55" }}>Error loading chart: {error}</div>;
  if (data.length === 0) {
    return (
      <div style={{ color: "#888" }}>
        No data yet — this fills in after the nightly sync has run at least once.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 400 }}>
      <h3 style={{ color: "#eee", marginBottom: 12 }}>
        Posting Activity vs. Spotify Monthly Listeners
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="date" stroke="#888" />
          <YAxis
            yAxisId="left"
            stroke="#888"
            label={{ value: "TikTok Engagement", angle: -90, position: "insideLeft", fill: "#888" }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#888"
            label={{ value: "Monthly Listeners", angle: 90, position: "insideRight", fill: "#888" }}
          />
          <Tooltip content={<CustomSocialTooltip />} />
          <Legend />
          <Bar yAxisId="left" dataKey="totalEngagement" name="TikTok Engagement" fill="#1DB954" opacity={0.8} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="monthlyListeners"
            name="Spotify Monthly Listeners"
            stroke="#1ED760"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
