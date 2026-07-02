import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [stats, setStats] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Form state
  const [newStat, setNewStat] = useState({
    week_of: '',
    monthly_listeners: '',
    streams: '',
    saves: '',
    playlist_adds: '',
    spotify_followers: '',
    total_posts: ''
  });

  const [newEvent, setNewEvent] = useState({
    event_date: '',
    event_name: '',
    event_type: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: statsData } = await supabase.from('weekly_stats').select('*').order('week_of');
    const { data: eventsData } = await supabase.from('events').select('*').order('event_date');
    setStats(statsData || []);
    setEvents(eventsData || []);
    setLoading(false);
  }

  async function addStat() {
    await supabase.from('weekly_stats').insert([newStat]);
    setNewStat({ week_of: '', monthly_listeners: '', streams: '', saves: '', playlist_adds: '', spotify_followers: '', total_posts: '' });
    fetchData();
  }

  async function addEvent() {
    await supabase.from('events').insert([newEvent]);
    setNewEvent({ event_date: '', event_name: '', event_type: '' });
    fetchData();
  }

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ borderBottom: '2px solid #333', paddingBottom: '10px' }}>Denzel Covena — Artist Dashboard</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {['dashboard', 'log stats', 'log event'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '8px 16px', background: activeTab === tab ? '#333' : '#eee', color: activeTab === tab ? '#fff' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', textTransform: 'capitalize' }}>
            {tab}
          </button>
        ))}
      </div>

      {loading && <p>Loading...</p>}

      {activeTab === 'dashboard' && (
        <div>
          <h2>Weekly Stats</h2>
          {stats.length === 0 && <p>No data yet — go to Log Stats to add your first week.</p>}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {['Week Of', 'Listeners', 'Streams', 'Saves', 'Playlist Adds', 'Followers', 'Posts'].map(h => (
                  <th key={h} style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map(s => (
                <tr key={s.id}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{s.week_of}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{s.monthly_listeners}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{s.streams}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{s.saves}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{s.playlist_adds}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{s.spotify_followers}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{s.total_posts}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 style={{ marginTop: '30px' }}>Events</h2>
          {events.length === 0 && <p>No events logged yet.</p>}
          {events.map(e => (
            <div key={e.id} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
              <strong>{e.event_date}</strong> — {e.event_name} <span style={{ color: '#888' }}>({e.event_type})</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'log stats' && (
        <div>
          <h2>Log Weekly Stats</h2>
          {[
            { label: 'Week Of', key: 'week_of', type: 'date' },
            { label: 'Monthly Listeners', key: 'monthly_listeners', type: 'number' },
            { label: 'Streams', key: 'streams', type: 'number' },
            { label: 'Saves', key: 'saves', type: 'number' },
            { label: 'Playlist Adds', key: 'playlist_adds', type: 'number' },
            { label: 'Spotify Followers', key: 'spotify_followers', type: 'number' },
            { label: 'Total Posts This Week', key: 'total_posts', type: 'number' },
          ].map(({ label, key, type }) => (
            <div key={key} style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px' }}>{label}</label>
              <input type={type} value={newStat[key]}
                onChange={e => setNewStat({ ...newStat, [key]: e.target.value })}
                style={{ padding: '8px', width: '100%', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
          ))}
          <button onClick={addStat}
            style={{ padding: '10px 20px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Save Week
          </button>
        </div>
      )}

      {activeTab === 'log event' && (
        <div>
          <h2>Log Event</h2>
          {[
            { label: 'Date', key: 'event_date', type: 'date' },
            { label: 'Event Name', key: 'event_name', type: 'text' },
            { label: 'Event Type (release, show, playlist, collab, ad)', key: 'event_type', type: 'text' },
          ].map(({ label, key, type }) => (
            <div key={key} style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px' }}>{label}</label>
              <input type={type} value={newEvent[key]}
                onChange={e => setNewEvent({ ...newEvent, [key]: e.target.value })}
                style={{ padding: '8px', width: '100%', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
          ))}
          <button onClick={addEvent}
            style={{ padding: '10px 20px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Save Event
          </button>
        </div>
      )}
    </div>
  );
}

export default App;