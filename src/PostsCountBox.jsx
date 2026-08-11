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
function dateKey(d) {
  return new Date(d).toISOString().split("T")[0];
}

export default function PostsCountBox() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.from("latest_tiktok_snapshot").select("posted_at");
      if (error) setError(error.message);
      else setRows(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const styles = {
    sectionTitle: { fontSize: "11px", fontWeight: "700", color: WHITE_MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" },
    tabRow: { display: "flex", gap: "16px", marginBottom: "14px" },
    tabBtn: (active) => ({ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "11px", fontWeight: "700", letterSpacing: "0.04em", textTransform: "uppercase", color: active ? "#fff" : WHITE_MUTED }),
bigNumber: { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: "72px", fontWeight: "800", color: "#fff", margin: 0, lineHeight: 0.95, letterSpacing: "-1px" },
    subLabel: { fontSize: "11px", color: WHITE_MUTED, textTransform: "uppercase", letterSpacing: "0.06em", margin: "4px 0 0" },
  };

  if (loading) return <p style={{ color: WHITE_MUTED, fontSize: "13px" }}>Loading...</p>;
  if (error) return <p style={{ color: "#ff8f8f", fontSize: "13px" }}>Error: {error}</p>;

  const postsByDay = {};
  rows.forEach((r) => {
    if (!r.posted_at) return;
    const key = dateKey(r.posted_at);
    postsByDay[key] = (postsByDay[key] || 0) + 1;
  });

  let count;
  if (activeTab === 0) {
    count = postsByDay[dateKey(startOfDaysAgo(1))] || 0;
  } else {
    const cutoff = startOfDaysAgo(WINDOW_DAYS[activeTab]);
    count = Object.entries(postsByDay).reduce((sum, [date, c]) => (new Date(date) >= cutoff ? sum + c : sum), 0);
  }

  const sparklineDays = [];
  for (let i = 13; i >= 0; i--) {
    sparklineDays.push(postsByDay[dateKey(startOfDaysAgo(i))] || 0);
  }
  const maxVal = Math.max(...sparklineDays, 1);

  return (
    <div>
      <p style={styles.sectionTitle}># of Posts</p>
      <div style={styles.tabRow}>
        {TABS.map((label, i) => (
          <button key={label} style={styles.tabBtn(activeTab === i)} onClick={() => setActiveTab(i)}>{label}</button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p style={styles.bigNumber}>{count}</p>
          <p style={styles.subLabel}>{TABS[activeTab]}</p>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "48px" }}>
          {sparklineDays.map((v, i) => (
            <div
              key={i}
              style={{
                width: "7px",
                height: `${Math.max((v / maxVal) * 44, 3)}px`,
                background: i === sparklineDays.length - 1 ? "#ffcc33" : "rgba(255,255,255,0.35)",
                borderRadius: "2px",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
