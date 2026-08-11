import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import TikTokStatsCard from './TikTokStatsCard';
import MonthlyListenersChart from './MonthlyListenersChart';
import ListenersVsActivityChart from './ListenersVsActivityChart';
import ConversionRateChart from './ConversionRateChart';
import EngagementRateChart from './EngagementRateChart';
import PostsCountBox from './PostsCountBox';
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const BLUE = '#1c4fd6';
const WHITE_MUTED = 'rgba(255,255,255,0.55)';
const DIVIDER = 'rgba(255,255,255,0.15)';
const YELLOW = '#ffcc33';

function App() {
  const [stats, setStats] = useState([]);
  const [events, setEvents] = useState([]);
  const [spotifyLatest, setSpotifyLatest] = useState(null);
  const [prevSpotify, setPrevSpotify] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [newStat, setNewStat] = useState({
    week_of: '', streams: '', saves: '', playlist_adds: ''
  });
  const [newEvent, setNewEvent] = useState({
    event_date: '', event_name: '', event_type: ''
  });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data: statsData } = await supabase.from('weekly_stats').select('*').order('week_of');
    const { data: eventsData } = await supabase.from('events').select('*').order('event_date');
    const { data: spotifyData } = await supabase
      .from('spotify_stats')
      .select('monthly_listeners, followers, captured_date')
      .order('captured_date', { ascending: false })
      .limit(2);
    setStats(statsData || []);
    setEvents(eventsData || []);
    setSpotifyLatest(spotifyData && spotifyData.length > 0 ? spotifyData[0] : null);
    setPrevSpotify(spotifyData && spotifyData.length > 1 ? spotifyData[1] : null);
    setLoading(false);
  }

  async function addStat() {
    const cleanStat = {
      week_of: newStat.week_of,
      streams: parseInt(newStat.streams) || null,
      saves: parseInt(newStat.saves) || null,
      playlist_adds: parseInt(newStat.playlist_adds) || null,
    };
    const { data, error } = await supabase.from('weekly_stats').insert([cleanStat]);
    if (error) {
      console.error('Insert error:', error);
      alert('Error saving: ' + error.message);
    } else {
      console.log('Saved:', data);
    }
    setNewStat({ week_of: '', streams: '', saves: '', playlist_adds: '' });
    fetchData();
  }

  async function addEvent() {
    await supabase.from('events').insert([newEvent]);
    setNewEvent({ event_date: '', event_name: '', event_type: '' });
    fetchData();
  }

  const chartData = stats.map(s => {
    const weekEvents = events.filter(e => e.event_date >= s.week_of && e.event_date < (() => {
      const d = new Date(s.week_of);
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    })());
    return {
      week: s.week_of,
      streams: s.streams,
      saves: s.saves,
      events: weekEvents,
    };
  });

  const styles = {
    app: { fontFamily: "'Space Grotesk', sans-serif", maxWidth: '1000px', margin: '0 auto', padding: '28px 20px 60px', background: BLUE, minHeight: '100vh', color: '#fff' },
    header: { paddingBottom: '20px', marginBottom: '28px', borderBottom: `1px solid ${DIVIDER}` },
    title: { fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' },
    tabs: { display: 'flex', gap: '18px', marginTop: '14px' },
    tab: (active) => ({ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '12px', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', color: active ? '#fff' : WHITE_MUTED, borderBottom: active ? `2px solid ${YELLOW}` : '2px solid transparent', paddingBottom: '4px' }),
    section: { paddingTop: '24px', paddingBottom: '24px', borderBottom: `1px solid ${DIVIDER}` },
    sectionTitle: { fontSize: '11px', fontWeight: '700', color: WHITE_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' },
    bigNumberLabel: { fontSize: '11px', color: WHITE_MUTED, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700' },
    bigNumberRow: { display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' },
    bigNumberValue: { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '144px', fontWeight: '800', color: '#fff', margin: 0, lineHeight: 0.9, letterSpacing: '-3px' },
    deltaText: (positive) => ({ color: YELLOW, fontSize: '18px', fontWeight: '700' }),
    deltaSub: { color: WHITE_MUTED, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' },
    pairGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '28px', marginTop: '18px' },
    pairLabel: { fontSize: '11px', color: WHITE_MUTED, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700' },
    pairValue: { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '42px', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.5px' },
    formGroup: { marginBottom: '16px' },
    label: { display: 'block', marginBottom: '6px', fontSize: '12px', color: WHITE_MUTED, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' },
    input: { padding: '10px 12px', width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.08)', border: `1px solid ${DIVIDER}`, borderRadius: '8px', color: '#fff', fontSize: '14px' },
    button: { padding: '10px 20px', background: '#fff', color: BLUE, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' },
    eventItem: { padding: '10px 0', borderBottom: `1px solid ${DIVIDER}`, fontSize: '13px', color: '#fff' },
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const weekEvents = payload[0]?.payload?.events || [];
    return (
      <div style={{ background: '#fff', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: BLUE, maxWidth: '200px' }}>
        <p style={{ margin: '0 0 4px', color: '#6b83c9', fontSize: '10px' }}>{label}</p>
        {payload.map(p => (
          <p key={p.dataKey} style={{ margin: '2px 0', fontWeight: 700 }}>{p.dataKey}: {p.value?.toLocaleString()}</p>
        ))}
        {weekEvents.length > 0 && (
          <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #eee' }}>
            {weekEvents.map(e => (
              <p key={e.id} style={{ margin: '2px 0', color: '#b8860b', fontSize: '11px' }}>• {e.event_name}</p>
            ))}
          </div>
        )}
      </div>
    );
  };

  const latestStat = stats[stats.length - 1];
  const listenerDelta = spotifyLatest && prevSpotify
    ? spotifyLatest.monthly_listeners - prevSpotify.monthly_listeners
    : null;

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <p style={styles.title}>Goodmorning, Denzel</p>
        <div style={styles.tabs}>
          {['dashboard', 'log'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={styles.tab(activeTab === tab)}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading && <p style={{ color: WHITE_MUTED }}>Loading...</p>}

      {activeTab === 'dashboard' && !loading && (
        <div>
          <div style={styles.section}>
            <p style={styles.bigNumberLabel}>Monthly Listeners</p>
            <div style={styles.bigNumberRow}>
              <p style={styles.bigNumberValue}>{spotifyLatest?.monthly_listeners?.toLocaleString() ?? '—'}</p>
              {listenerDelta !== null && (
                <>
                  <span style={styles.deltaText(listenerDelta >= 0)}>
                    {listenerDelta >= 0 ? '+' : ''}{listenerDelta.toLocaleString()}
                  </span>
                  <span style={styles.deltaSub}>from yesterday</span>
                </>
              )}
            </div>

            <div style={styles.pairGrid}>
              <div>
                <p style={styles.pairLabel}>Streams</p>
                <p style={styles.pairValue}>{latestStat?.streams?.toLocaleString() ?? '—'}</p>
              </div>
              <div>
                <p style={styles.pairLabel}>Saves</p>
                <p style={styles.pairValue}>{latestStat?.saves?.toLocaleString() ?? '—'}</p>
              </div>
              <div>
                <p style={styles.pairLabel}>Playlist Adds</p>
                <p style={styles.pairValue}>{latestStat?.playlist_adds?.toLocaleString() ?? '—'}</p>
              </div>
              <div>
                <p style={styles.pairLabel}>Spotify Followers</p>
                <p style={styles.pairValue}>{spotifyLatest?.followers?.toLocaleString() ?? '—'}</p>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <TikTokStatsCard />
          </div>

          <div style={styles.section}>
            <PostsCountBox />
          </div>

          {chartData.length > 1 && (
            <div style={styles.section}>
              <p style={styles.sectionTitle}>Streams over time</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="week" tick={{ fill: WHITE_MUTED, fontSize: 10 }} />
                  <YAxis tick={{ fill: WHITE_MUTED, fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="streams" stroke="#fff" strokeWidth={1.5} dot={{ fill: '#fff', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={styles.section}>
            <MonthlyListenersChart events={events} />
          </div>

          <div style={styles.section}>
            <ListenersVsActivityChart events={events} />
          </div>

          <div style={styles.section}>
            <ConversionRateChart events={events} />
          </div>

          <div style={styles.section}>
            <EngagementRateChart events={events} />
          </div>

          <div style={styles.section}>
            <p style={styles.sectionTitle}>Events</p>
            {events.length === 0 && <p style={{ color: WHITE_MUTED, fontSize: '13px' }}>No events logged yet.</p>}
            {events.map(e => (
              <div key={e.id} style={styles.eventItem}>
                <strong>{e.event_date}</strong> — {e.event_name}
                <span style={{ color: WHITE_MUTED, marginLeft: '8px' }}>({e.event_type})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'log' && (
        <div>
          <div style={styles.section}>
            <p style={styles.sectionTitle}>Log weekly stats</p>
            {[
              { label: 'Week Of', key: 'week_of', type: 'date' },
              { label: 'Streams', key: 'streams', type: 'number' },
              { label: 'Saves', key: 'saves', type: 'number' },
              { label: 'Playlist Adds', key: 'playlist_adds', type: 'number' },
            ].map(({ label, key, type }) => (
              <div key={key} style={styles.formGroup}>
                <label style={styles.label}>{label}</label>
                <input type={type} value={newStat[key]}
                  onChange={e => setNewStat({ ...newStat, [key]: e.target.value })}
                  style={styles.input} />
              </div>
            ))}
            <button onClick={addStat} style={styles.button}>Save Week</button>
          </div>

          <div style={styles.section}>
            <p style={styles.sectionTitle}>Log event</p>
            {[
              { label: 'Date', key: 'event_date', type: 'date' },
              { label: 'Event Name', key: 'event_name', type: 'text' },
              { label: 'Type (release, show, playlist, collab, ad)', key: 'event_type', type: 'text' },
            ].map(({ label, key, type }) => (
              <div key={key} style={styles.formGroup}>
                <label style={styles.label}>{label}</label>
                <input type={type} value={newEvent[key]}
                  onChange={e => setNewEvent({ ...newEvent, [key]: e.target.value })}
                  style={styles.input} />
              </div>
            ))}
            <button onClick={addEvent} style={styles.button}>Save Event</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;