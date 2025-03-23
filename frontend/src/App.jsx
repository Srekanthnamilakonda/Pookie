import { useEffect, useState } from 'react';
import axios from 'axios';
import Leaderboard from './Leaderboard';
import penguinBronze from './assets/penguin_bronze.png';
import penguinSilver from './assets/penguin_silver.png';
import penguinGold from './assets/penguin_gold.png';
import penguinPlatinum from './assets/penguin_platinum.png';

const API = 'http://localhost:3001/api/user';

function App() {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('username') || 'pookie';
  });
  
  const [newUsername, setNewUsername] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/${username}`)
      .then(res => {
        setUser(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [username]);

  const handleClick = () => {
    axios.post(`${API}/click`, { username })
      .then(res => setUser(res.data))
      .catch(err => console.error(err));
  };

  const handleUpgrade = () => {
    axios.post(`${API}/upgrade`, { username })
      .then(res => setUser(res.data))
      .catch(err => console.error(err));
  };

  const handleUsernameChange = () => {
    const trimmed = newUsername.trim();
    if (!trimmed) return;

    axios.post(`${API}/update-username`, {
      currentUsername: username,
      newUsername: trimmed
    })
      .then(res => {
        setUsername(trimmed);
        localStorage.setItem('username', trimmed);
        setUser(res.data);
        setNewUsername('');
      })
      .catch(err => {
        alert(err.response?.data?.error || 'Username update failed');
        console.error(err);
      });
  };

  if (loading) return <p>Loading...</p>;

  const upgradeCost = 10 * (user.upgrades + 1);
  const canAfford = user.cookies >= upgradeCost;
  const penguinCount = Math.floor(user.cookies / 10);

  const getRank = (cookies) => {
    if (cookies >= 1000) return 'Platinum';
    if (cookies >= 500) return 'Gold';
    if (cookies >= 100) return 'Silver';
    return 'Bronze';
  };
  const rank = getRank(user.cookies);

  const getRankColor = (rank) => {
    switch (rank) {
      case 'Bronze': return '#cd7f32';
      case 'Silver': return '#c0c0c0';
      case 'Gold': return '#ffd700';
      case 'Platinum': return '#f60a0a';
      default: return '#fff';
    }
  };

  const getPenguinImage = (rank) => {
    switch (rank) {
      case 'Silver': return penguinSilver;
      case 'Gold': return penguinGold;
      case 'Platinum': return penguinPlatinum;
      default: return penguinBronze;
    }
  };

  const penguinImage = getPenguinImage(rank);

  return (
    <div style={{ textAlign: 'center', marginTop: '30px' }}>
      <h1>Pookie Click</h1>

      <div style={{ marginTop: '20px' }}>
        <h3>Logged in as: {username}</h3>
        <input
          type="text"
          placeholder="New username"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          style={{
            padding: '10px',
            fontSize: '14px',
            marginRight: '10px',
            borderRadius: '5px',
            border: '1px solid #ccc'
          }}
        />
        <button
          onClick={handleUsernameChange}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: '#f39c12',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ✏️ Change Username
        </button>
        <button
  onClick={() => (window.location.href = '/battle')}
  style={{
    fontSize: '16px',
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#8e44ad',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }}
>
  ⚔️ Multiplayer Battle
</button>

      </div>

      <h2>Cookies: {user.cookies}</h2>
      <h3>Upgrades: {user.upgrades}</h3>
      <h4>Click Power: {1 + user.upgrades}</h4>
      <h3 style={{ color: getRankColor(rank) }}>Rank: {rank}</h3>

      <button
        onClick={handleClick}
        style={{
          fontSize: '24px',
          padding: '20px 40px',
          marginTop: '20px',
          cursor: 'pointer'
        }}
      >
        🍪 Click Me!
      </button>

      <br />

      <button
        onClick={handleUpgrade}
        disabled={!canAfford}
        style={{
          fontSize: '18px',
          padding: '12px 24px',
          marginTop: '20px',
          cursor: canAfford ? 'pointer' : 'not-allowed',
          backgroundColor: canAfford ? '#4CAF50' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '8px'
        }}
      >
        🔼 Buy Upgrade (Cost: {upgradeCost})
      </button>

      <br />

      <button
        onClick={() => window.location.href = "/leaderboard"}
        style={{
          fontSize: '16px',
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        🏆 View Leaderboard
      </button>

      {/* Penguin Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '10px',
          marginTop: '30px',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}
      >
        {Array.from({ length: penguinCount }).map((_, i) => (
          <img
            key={i}
            src={penguinImage}
            alt="penguin"
            style={{ width: '80px' }}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
