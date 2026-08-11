import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const TABS = ["Yesterday", "Last 7 days", "Last 30 days"];
const WINDOW_DAYS = [1, 7, 30];
const WHITE_MUTED = "rgba(255,255,255,0.55)";

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
      if (error) setError(error.message);
      else setRows(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const styles = {
    sectionTitle: { fontSize: "11px", fontWeight: "700", color: WHITE_MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" },
    tabRow: { display: "flex", gap: "16px", marginBottom: "18px" },
    tabBtn: (active) => ({ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "11px", fontWeight: "700", letterSpacing: "0.04em", textTransform: "uppercase", color: active ? "#fff" : WHITE_MUTED }),
    pairGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" },
    pairLabel: { fontSize: "11px", color: WHITE_MUTED, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "700" },
pairValue: { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: "42px", fontWeight: "800", color: "#fff", margin: 0, letterSpacing: "-0.5px" },
    seeVideo: { fontSize: "11px", color: "#ffcc33", textDecoration: "none" },
  };

  if (loading) return <p style={{ color: WHITE_MUTED, fontSize: "13px" }}>Loading TikTok stats...</p>;
  if (error) return <p style={{ color: "#ff8f8f", fontSize: "13px" }}>Error: {error}</p>;

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
  const topLiked = windowed.length ? windowed.reduce((a, b) => ((b.likes || 0) > (a.likes || 0) ? b : a)) : null;
  const topViewed = windowed.length ? windowed.reduce((a, b) => ((b.views || 0) > (a.views || 0) ? b : a)) : null;

  return (
    <div>
      <p style={styles.sectionTitle}>TikTok Performance</p>
      <div style={styles.tabRow}>
        {TABS.map((label, i) => (
          <button key={label} style={styles.tabBtn(activeTab === i)} onClick={() => setActiveTab(i)}>{label}</button>
        ))}
      </div>

      {windowed.length === 0 ? (
        <p style={{ color: WHITE_MUTED, fontSize: "13px" }}>No posts in this window yet.</p>
      ) : (
        <>
          <div style={styles.pairGrid}>
            <div>
              <p style={styles.pairLabel}>Total Views</p>
              <p style={styles.pairValue}>{totalViews.toLocaleString()}</p>
            </div>
            <div>
              <p style={styles.pairLabel}>Total Likes</p>
              <p style={styles.pairValue}>{totalLikes.toLocaleString()}</p>
            </div>
          </div>
          <div style={styles.pairGrid}>
            <div>
              <p style={styles.pairLabel}>Top Likes</p>
              <p style={styles.pairValue}>{(topLiked?.likes || 0).toLocaleString()}</p>
              {topLiked?.video_url && (
                <a href={topLiked.video_url} target="_blank" rel="noopener noreferrer" style={styles.seeVideo}>See video</a>
              )}
            </div>
            <div>
              <p style={styles.pairLabel}>Top Viewed</p>
              <p style={styles.pairValue}>{(topViewed?.views || 0).toLocaleString()}</p>
              {topViewed?.video_url && (
                <a href={topViewed.video_url} target="_blank" rel="noopener noreferrer" style={styles.seeVideo}>See video</a>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
