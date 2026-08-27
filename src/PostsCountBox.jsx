import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const TABS = ["Yesterday", "Last 7 days", "Last 30 days"];
const WINDOW_DAYS = [1, 7, 30];
const WHITE_MUTED = "rgba(255,255,255,0.55)";
const PERIOD_PHRASE = ["yesterday", "the previous 7 days", "the previous 30 days"];

function startOfDaysAgo(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}
function dateKey(d) {
  return new Date(d).toISOString().split("T")[0];
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
    tabRow: { display: "flex", gap: "16px", marginBottom: "6px" },
    tabBtn: (active) => ({ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "11px", fontWeight: "700", letterSpacing: "0.04em", textTransform: "uppercase", color: active ? "#fff" : WHITE_MUTED }),
    dateLabel: { fontSize: "11px", color: WHITE_MUTED, margin: "0 0 14px" },
    compareLine: { fontSize: "13px", color: "#fff", margin: "0 0 6px", lineHeight: 1.5 },
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

  function countFor(tabIndex, offsetPeriods) {
    const days = WINDOW_DAYS[tabIndex];
    const end = startOfDaysAgo(days * offsetPeriods);
    const start = startOfDaysAgo(days * (offsetPeriods + 1));
    return Object.entries(postsByDay).reduce((sum, [date, c]) => {
      const d = new Date(date);
      return d >= start && d < end ? sum + c : sum;
    }, 0);
  }

  const count = countFor(activeTab, 0);
  const prevCount = countFor(activeTab, 1);
  const delta = count - prevCount;
  const hasPrevData = Object.keys(postsByDay).some((date) => {
    const days = WINDOW_DAYS[activeTab];
    const end = startOfDaysAgo(days);
    const start = startOfDaysAgo(days * 2);
    const d = new Date(date);
    return d >= start && d < end;
  });

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
      <p style={styles.dateLabel}>{dateRangeLabel(activeTab)}</p>

      {hasPrevData && (
        <p style={styles.compareLine}>
          {delta === 0
            ? `Same number of posts as ${PERIOD_PHRASE[activeTab]}.`
            : `That's ${Math.abs(delta)} ${delta > 0 ? "more" : "fewer"} post${Math.abs(delta) === 1 ? "" : "s"} than ${PERIOD_PHRASE[activeTab]}.`}
        </p>
      )}

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
