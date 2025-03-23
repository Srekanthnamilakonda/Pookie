import { useEffect, useState } from 'react';
import axios from 'axios';

const getRank = (cookies) => {
  if (cookies >= 1000) return 'Platinum';
  if (cookies >= 500) return 'Gold';
  if (cookies >= 100) return 'Silver';
  return 'Bronze';
};

function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/user/leaderboard`)
      .then(res => {
        if (Array.isArray(res.data)) {
          setLeaders(res.data);
        } else {
          console.error('Leaderboard response is not an array:', res.data);
          setLeaders([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching leaderboard:', err);
        setLeaders([]);
        setLoading(false);
      });
  }, []);

  if (loading) return <p style={{ textAlign: 'center' }}>Loading leaderboard...</p>;

  if (!leaders.length) return <p style={{ textAlign: 'center' }}>No leaderboard data found.</p>;

  return (
    <div style={{ textAlign: 'center', marginTop: '40px' }}>
      <h2>🏆 Leaderboard (Top 10)</h2>
      <table style={{ margin: '0 auto', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ padding: '8px' }}>Rank</th>
            <th style={{ padding: '8px' }}>Username</th>
            <th style={{ padding: '8px' }}>Cookies</th>
            <th style={{ padding: '8px' }}>Title</th>
            <th style={{ padding: '8px' }}>Upgrades</th>
            <th style={{ padding: '8px' }}>Battles Won</th>
          </tr>
        </thead>
        <tbody>
          {leaders.map((user, index) => (
            <tr key={user._id}>
              <td style={{ padding: '8px' }}>#{index + 1}</td>
              <td style={{ padding: '8px' }}>{user.username}</td>
              <td style={{ padding: '8px' }}>{user.cookies}</td>
              <td style={{ padding: '8px' }}>{getRank(user.cookies)}</td>
              <td style={{ padding: '8px' }}>{user.upgrades || 0}</td>
              <td style={{ padding: '8px' }}>{user.wins || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={() => window.location.href = "/"}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#2ecc71',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        🔙 Back to Game
      </button>
    </div>
  );
}

export default Leaderboard;
