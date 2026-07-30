// src/TikTokStatsCard.jsx
// Yesterday / Last 7 days / Last 30 days TikTok performance card, plus
// "Winners" (top liked + top viewed post in that window, with a link to it).
//
// Reads from the `latest_tiktok_snapshot` view (not the raw tiktok_posts
// table) so a video that's been re-scraped on multiple nights only counts
// once. Buckets by `posted_at` (the actual post date), not `captured_date`
// (the scrape date) — so a quiet posting day correctly shows as quiet,
// instead of re-showing an old post's growing view count as if it were new.

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const TABS = ["Yesterday", "Last 7 days", "Last 30 days"];
const WINDOW_DAYS = [1, 7, 30];

function startOfDaysAgo(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

export default function TikTokStatsCard() {
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
        .select("video_id, account_name, views, likes, video_url, posted_at");

      if (error) {
        setError(error.message);
      } else {
        setRows(data || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const styles = {
    card: { background: "#141414", border: "0.5px solid #222", borderRadius: "12px", padding: "20px" },
    sectionTitle: { fontSize: "13px", fontWeight: "500", color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" },
    tabRow: { display: "flex", gap: "4px", background: "#1a1a1a", borderRadius: "8px", padding: "3px" },
    tabBtn: (active) => ({
      border: "none",
      background: active ? "#2a2a2a" : "transparent",
      color: active ? "#fff" : "#888",
      fontSize: "12px",
      padding: "6px 12px",
      borderRadius: "6px",
      cursor: "pointer",
    }),
    metricGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", margin: "16px 0" },
    metricBox: { background: "#1a1a1a", borderRadius: "8px", padding: "14px" },
    metricLabel: { fontSize: "12px", color: "#666", margin: "0 0 4px" },
    metricValue: { fontSize: "22px", fontWeight: "500", color: "#fff", margin: 0 },
    winnersGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" },
    winnerBox: { background: "#1a1a1a", borderRadius: "8px", padding: "14px" },
    winnerLabel: { fontSize: "11px", color: "#666", margin: "0 0 4px" },
    winnerValue: { fontSize: "18px", fontWeight: "500", color: "#fff", margin: "0 0 6px" },
    seeVideo: { fontSize: "12px", color: "#2a78d6", textDecoration: "none" },
  };

  if (loading) return <div style={{ ...styles.card, color: "#888" }}>Loading TikTok stats...</div>;
  if (error) return <div style={{ ...styles.card, color: "#e34948" }}>Error: {error}</div>;

  const cutoff = startOfDaysAgo(WINDOW_DAYS[activeTab]);
  const windowed =
    activeTab === 0
      ? rows.filter((r) => {
          const posted = new Date(r.posted_at);
          const y = startOfDaysAgo(1);
          const today = startOfDaysAgo(0);
          return posted >= y && posted < today;
        })
      : rows.filter((r) => new Date(r.posted_at) >= cutoff);

  const totalViews = windowed.reduce((sum, r) => sum + (r.views || 0), 0);
  const totalLikes = windowed.reduce((sum, r) => sum + (r.likes || 0), 0);

  const topLiked = windowed.length
    ? windowed.reduce((a, b) => ((b.likes || 0) > (a.likes || 0) ? b : a))
    : null;
  const topViewed = windowed.length
    ? windowed.reduce((a, b) => ((b.views || 0) > (a.views || 0) ? b : a))
    : null;

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <p style={styles.sectionTitle}>TikTok performance</p>
        <div style={styles.tabRow}>
          {TABS.map((label, i) => (
            <button key={label} style={styles.tabBtn(activeTab === i)} onClick={() => setActiveTab(i)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {windowed.length === 0 ? (
        <p style={{ color: "#666", fontSize: "13px" }}>No posts in this window yet.</p>
      ) : (
        <>
          <div style={styles.metricGrid}>
            <div style={styles.metricBox}>
              <p style={styles.metricLabel}>Total views</p>
              <p style={styles.metricValue}>{totalViews.toLocaleString()}</p>
            </div>
            <div style={styles.metricBox}>
              <p style={styles.metricLabel}>Total likes</p>
              <p style={styles.metricValue}>{totalLikes.toLocaleString()}</p>
            </div>
          </div>

          <p style={{ ...styles.sectionTitle, marginBottom: "8px", fontSize: "11px" }}>Winners</p>
          <div style={styles.winnersGrid}>
            <div style={styles.winnerBox}>
              <p style={styles.winnerLabel}>Top likes</p>
              <p style={styles.winnerValue}>{(topLiked?.likes || 0).toLocaleString()}</p>
              {topLiked?.video_url && (
                <a href={topLiked.video_url} target="_blank" rel="noopener noreferrer" style={styles.seeVideo}>
                  See video
                </a>
              )}
            </div>
            <div style={styles.winnerBox}>
              <p style={styles.winnerLabel}>Top views</p>
              <p style={styles.winnerValue}>{(topViewed?.views || 0).toLocaleString()}</p>
              {topViewed?.video_url && (
                <a href={topViewed.video_url} target="_blank" rel="noopener noreferrer" style={styles.seeVideo}>
                  See video
                </a>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
