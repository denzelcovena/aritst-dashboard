import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const TABS = ["Yesterday", "Last 7 days", "Last 30 days"];
const WINDOW_DAYS = [1, 7, 30];
const WHITE_MUTED = "rgba(255,255,255,0.55)";
const YELLOW = "#ffcc33";

function startOfDaysAgo(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}
function fmtDate(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function dateRangeLabel(tabIndex) {
  if (tabIndex === 0) return fmtDate(startOfDaysAgo(1));
  const start = startOfDaysAgo(WINDOW_DAYS[tabIndex] - 1);
  const end = startOfDaysAgo(0);
  end.setDate(end.getDate() - 1);
  return `${fmtDate(start)} – ${fmtDate(end)}`;
}
function formatCompact(n) {
  const abs = Math.abs(n);
  if (abs >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toLocaleString();
}
const PERIOD_PHRASE = ["yesterday", "the previous 7 days", "the previous 30 days"];

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
    tabRow: { display: "flex", gap: "16px", marginBottom: "6px" },
    tabBtn: (active) => ({ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "11px", fontWeight: "700", letterSpacing: "0.04em", textTransform: "uppercase", color: active ? "#fff" : WHITE_MUTED }),
    dateLabel: { fontSize: "11px", color: WHITE_MUTED, margin: "0 0 14px" },
    compareLine: { fontSize: "13px", color: "#fff", margin: "0 0 18px", lineHeight: 1.5 },
    pairGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" },
    pairLabel: { fontSize: "11px", color: WHITE_MUTED, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "700" },
    pairValue: { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: "42px", fontWeight: "800", color: "#fff", margin: 0, letterSpacing: "-0.5px" },
    seeVideo: { fontSize: "11px", color: YELLOW, textDecoration: "none" },
  };

  if (loading) return <p style={{ color: WHITE_MUTED, fontSize: "13px" }}>Loading TikTok stats...</p>;
  if (error) return <p style={{ color: "#ff8f8f", fontSize: "13px" }}>Error: {error}</p>;

  function windowFor(tabIndex, offsetPeriods) {
    const days = WINDOW_DAYS[tabIndex];
    const end = startOfDaysAgo(days * offsetPeriods);
    const start = startOfDaysAgo(days * (offsetPeriods + 1));
    return rows.filter((r) => {
      const posted = new Date(r.posted_at);
      return posted >= start && posted < end;
    });
  }

  const windowed = windowFor(activeTab, 0);
  const prevWindowed = windowFor(activeTab, 1);

  const totalViews = windowed.reduce((sum, r) => sum + (r.views || 0), 0);
  const totalLikes = windowed.reduce((sum, r) => sum + (r.likes || 0), 0);
  const prevTotalViews = prevWindowed.reduce((sum, r) => sum + (r.views || 0), 0);
  const prevTotalLikes = prevWindowed.reduce((sum, r) => sum + (r.likes || 0), 0);

  const topLiked = windowed.length ? windowed.reduce((a, b) => ((b.likes || 0) > (a.likes || 0) ? b : a)) : null;
  const topViewed = windowed.length ? windowed.reduce((a, b) => ((b.views || 0) > (a.views || 0) ? b : a)) : null;

  let compareSentence = null;
  if (prevWindowed.length > 0) {
    const dv = totalViews - prevTotalViews;
    const dl = totalLikes - prevTotalLikes;
    const viewsPhrase = `${formatCompact(Math.abs(dv))} ${dv >= 0 ? "more" : "fewer"} views`;
    const likesPhrase = `${formatCompact(Math.abs(dl))} ${dl >= 0 ? "more" : "fewer"} likes`;
    compareSentence = `That's ${viewsPhrase} and ${likesPhrase} than ${PERIOD_PHRASE[activeTab]}.`;
  }

  return (
    <div>
      <p style={styles.sectionTitle}>TikTok Performance</p>
      <div style={styles.tabRow}>
        {TABS.map((label, i) => (
          <button key={label} style={styles.tabBtn(activeTab === i)} onClick={() => setActiveTab(i)}>{label}</button>
        ))}
      </div>
      <p style={styles.dateLabel}>{dateRangeLabel(activeTab)}</p>

      {windowed.length === 0 ? (
        <p style={{ color: WHITE_MUTED, fontSize: "13px" }}>No posts in this window yet.</p>
      ) : (
        <>
          {compareSentence && <p style={styles.compareLine}>{compareSentence}</p>}

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
