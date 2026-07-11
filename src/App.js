import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

function App() {
  const [stats, setStats] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [newStat, setNewStat] = useState({
    week_of: '', monthly_listeners: '', streams: '',
    saves: '', playlist_adds: '', spotify_followers: '', total_posts: ''
  });
  const [newEvent, setNewEvent] = useState({
    event_date: '', event_name: '', event_type: ''
  });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data: statsData } = await supabase.from('weekly_stats').select('*').order('week_of');
    const { data: eventsData } = await supabase.from('events').select('*').order('event_date');
    setStats(statsData || []);
    setEvents(eventsData || []);
    setLoading(false);
  }

async function addStat() {
    const cleanStat = {
      week_of: newStat.week_of,
      monthly_listeners: parseInt(newStat.monthly_listeners) || null,
      streams: parseInt(newStat.streams) || null,
      saves: parseInt(newStat.saves) || null,
      playlist_adds: parseInt(newStat.playlist_adds) || null,
      spotify_followers: parseInt(newStat.spotify_followers) || null,
      total_posts: parseInt(newStat.total_posts) || null,
    };
    const { data, error } = await supabase.from('weekly_stats').insert([cleanStat]);
    if (error) {
      console.error('Insert error:', error);
      alert('Error saving: ' + error.message);
    } else {
      console.log('Saved:', data);
    }
    setNewStat({ week_of: '', monthly_listeners: '', streams: '', saves: '', playlist_adds: '', spotify_followers: '', total_posts: '' });
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
    listeners: s.monthly_listeners,
    streams: s.streams,
    saves: s.saves,
    posts: s.total_posts,
    events: weekEvents,
  };
});

  const styles = {
    app: { fontFamily: "'Inter', sans-serif", maxWidth: '960px', margin: '0 auto', padding: '24px 20px', background: '#0b0b0b', minHeight: '100vh', color: '#fff' },
    header: { marginBottom: '32px' },
    title: { fontSize: '22px', fontWeight: '500', color: '#fff', margin: '0 0 4px 0' },
    subtitle: { fontSize: '14px', color: '#888', margin: 0 },
    tabs: { display: 'flex', gap: '8px', marginBottom: '28px' },
    tab: (active) => ({ padding: '8px 16px', background: active ? '#fff' : 'transparent', color: active ? '#000' : '#888', border: '0.5px solid', borderColor: active ? '#fff' : '#333', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }),
    section: { marginBottom: '40px' },
    sectionTitle: { fontSize: '13px', fontWeight: '500', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' },
    card: { background: '#141414', border: '0.5px solid #222', borderRadius: '12px', padding: '20px' },
    metricGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '28px' },
    metricCard: { background: '#141414', border: '0.5px solid #222', borderRadius: '8px', padding: '16px' },
    metricLabel: { fontSize: '12px', color: '#666', marginBottom: '6px' },
    metricValue: { fontSize: '24px', fontWeight: '500', color: '#fff' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: { padding: '10px 12px', textAlign: 'left', borderBottom: '0.5px solid #222', color: '#666', fontWeight: '500', fontSize: '12px' },
    td: { padding: '10px 12px', borderBottom: '0.5px solid #1a1a1a', color: '#ccc' },
    formGroup: { marginBottom: '16px' },
    label: { display: 'block', marginBottom: '6px', fontSize: '13px', color: '#888' },
    input: { padding: '10px 12px', width: '100%', boxSizing: 'border-box', background: '#1a1a1a', border: '0.5px solid #333', borderRadius: '8px', color: '#fff', fontSize: '14px' },
    button: { padding: '10px 20px', background: '#fff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
    eventItem: { padding: '10px 0', borderBottom: '0.5px solid #1a1a1a', fontSize: '13px', color: '#ccc' },
  };
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const weekEvents = payload[0]?.payload?.events || [];
  return (
    <div style={{ background: '#1a1a1a', border: '0.5px solid #333', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#fff', maxWidth: '200px' }}>
      <p style={{ margin: '0 0 6px', color: '#666', fontSize: '11px' }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ margin: '2px 0', color: p.color }}>{p.dataKey}: {p.value?.toLocaleString()}</p>
      ))}
      {weekEvents.length > 0 && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '0.5px solid #333' }}>
          <p style={{ margin: '0 0 4px', color: '#666', fontSize: '11px' }}>EVENTS</p>
          {weekEvents.map(e => (
            <p key={e.id} style={{ margin: '2px 0', color: '#eda100', fontSize: '12px' }}>• {e.event_name}</p>
          ))}
        </div>
      )}
    </div>
  );
};
  const latestStat = stats[stats.length - 1];

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <h1 style={styles.title}>Denzel Covena</h1>
        <p style={styles.subtitle}>Artist Analytics Dashboard</p>
      </div>

      <div style={styles.tabs}>
        {['dashboard', 'log stats', 'log event'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={styles.tab(activeTab === tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: '#666' }}>Loading...</p>}

      {activeTab === 'dashboard' && !loading && (
        <div>
          {latestStat && (
            <div style={styles.section}>
              <p style={styles.sectionTitle}>Latest Week — {latestStat.week_of}</p>
              <div style={styles.metricGrid}>
                {[
                  { label: 'Monthly Listeners', value: latestStat.monthly_listeners?.toLocaleString() },
                  { label: 'Streams', value: latestStat.streams?.toLocaleString() },
                  { label: 'Saves', value: latestStat.saves?.toLocaleString() },
                  { label: 'Playlist Adds', value: latestStat.playlist_adds?.toLocaleString() },
                  { label: 'Spotify Followers', value: latestStat.spotify_followers?.toLocaleString() },
                  { label: 'Total Posts', value: latestStat.total_posts?.toLocaleString() },
                ].map(m => (
                  <div key={m.label} style={styles.metricCard}>
                    <p style={styles.metricLabel}>{m.label}</p>
                    <p style={styles.metricValue}>{m.value ?? '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {chartData.length > 1 && (
            <>
              <div style={{ ...styles.card, marginBottom: '20px' }}>
                <p style={styles.sectionTitle}>Streams over time</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                    <XAxis dataKey="week" tick={{ fill: '#666', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#666', fontSize: 11 }} />
<Tooltip content={<CustomTooltip />} />                    <Line type="monotone" dataKey="streams" stroke="#2a78d6" strokeWidth={2} dot={{ fill: '#2a78d6', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ ...styles.card, marginBottom: '20px' }}>
                <p style={styles.sectionTitle}>Monthly listeners over time</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                    <XAxis dataKey="week" tick={{ fill: '#666', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#666', fontSize: 11 }} />
<Tooltip content={<CustomTooltip />} />                    <Line type="monotone" dataKey="listeners" stroke="#1baf7a" strokeWidth={2} dot={{ fill: '#1baf7a', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ ...styles.card, marginBottom: '20px' }}>
  <p style={styles.sectionTitle}>Streams vs posts</p>
  <ResponsiveContainer width="100%" height={200}>
    <BarChart data={chartData}>
      <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
      <XAxis dataKey="week" tick={{ fill: '#666', fontSize: 11 }} />
      <YAxis tick={{ fill: '#666', fontSize: 11 }} />
<Tooltip content={<CustomTooltip />} />      <Legend wrapperStyle={{ color: '#666', fontSize: '12px' }} />
      <Bar dataKey="streams" fill="#2a78d6" radius={[4, 4, 0, 0]} />
      <Bar dataKey="posts" fill="#eda100" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
</div>

              <div style={styles.card}>
                <p style={styles.sectionTitle}>Posts per week</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                    <XAxis dataKey="week" tick={{ fill: '#666', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#666', fontSize: 11 }} />
<Tooltip content={<CustomTooltip />} />                    <Bar dataKey="posts" fill="#eda100" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {chartData.length <= 1 && (
            <p style={{ color: '#666', fontSize: '14px' }}>Add at least 2 weeks of data to see charts.</p>
          )}

          <div style={{ ...styles.section, marginTop: '40px' }}>
            <p style={styles.sectionTitle}>All weeks</p>
            <div style={styles.card}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['Week', 'Listeners', 'Streams', 'Saves', 'Playlist Adds', 'Followers', 'Posts'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.map(s => (
                    <tr key={s.id}>
                      <td style={styles.td}>{s.week_of}</td>
                      <td style={styles.td}>{s.monthly_listeners?.toLocaleString()}</td>
                      <td style={styles.td}>{s.streams?.toLocaleString()}</td>
                      <td style={styles.td}>{s.saves?.toLocaleString()}</td>
                      <td style={styles.td}>{s.playlist_adds?.toLocaleString()}</td>
                      <td style={styles.td}>{s.spotify_followers?.toLocaleString()}</td>
                      <td style={styles.td}>{s.total_posts?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {stats.length === 0 && <p style={{ color: '#666', fontSize: '14px', margin: '12px 0 0' }}>No data yet.</p>}
            </div>
          </div>

          <div style={{ ...styles.section, marginTop: '40px' }}>
            <p style={styles.sectionTitle}>Events</p>
            <div style={styles.card}>
              {events.length === 0 && <p style={{ color: '#666', fontSize: '14px' }}>No events logged yet.</p>}
              {events.map(e => (
                <div key={e.id} style={styles.eventItem}>
                  <strong style={{ color: '#fff' }}>{e.event_date}</strong> — {e.event_name}
                  <span style={{ color: '#555', marginLeft: '8px' }}>({e.event_type})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'log stats' && (
        <div style={styles.card}>
          <p style={styles.sectionTitle}>Log weekly stats</p>
          {[
            { label: 'Week Of', key: 'week_of', type: 'date' },
            { label: 'Monthly Listeners', key: 'monthly_listeners', type: 'number' },
            { label: 'Streams', key: 'streams', type: 'number' },
            { label: 'Saves', key: 'saves', type: 'number' },
            { label: 'Playlist Adds', key: 'playlist_adds', type: 'number' },
            { label: 'Spotify Followers', key: 'spotify_followers', type: 'number' },
            { label: 'Total Posts This Week', key: 'total_posts', type: 'number' },
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
      )}

      {activeTab === 'log event' && (
        <div style={styles.card}>
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
      )}
    </div>
  );
}

export default App;
