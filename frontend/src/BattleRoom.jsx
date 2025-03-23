import { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL + '/battle';

function BattleRoom() {
  const [roomId, setRoomId] = useState('');
  const [username] = useState(() => localStorage.getItem('username') || 'pookie');
  const [inRoom, setInRoom] = useState(false);
  const [status, setStatus] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [clicks, setClicks] = useState(0);
  const [opponentClicks, setOpponentClicks] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [preCountdown, setPreCountdown] = useState(null);
  const [winner, setWinner] = useState('');
  const [players, setPlayers] = useState([]);
  const [scores, setScores] = useState({});
  const [bets, setBets] = useState({});
  const [bet, setBet] = useState(1);

  const pollStatus = async () => {
    try {
      const res = await axios.get(`${API}/status/${roomId}`);
      const data = res.data;
  
      // DEBUG log to see what backend sends
      console.log("Polled status:", data.status);
  
      // Defensive fallback: if status is missing, set to 'waiting'
      const safeStatus = ['waiting', 'ready', 'active', 'ended'].includes(data.status)
        ? data.status
        : 'waiting';
  
      setStatus(safeStatus);
      setPlayers(data.players);
      setScores(data.scores || {});
      setBets(data.bets || {});
  
      const opponent = data.players.find(p => p !== username);
      setOpponentClicks(data.scores?.[opponent] || 0);
  
      // Handle countdown during 'active' status
      if (safeStatus === 'active') {
        const now = Date.now();
        const end = new Date(data.endTime).getTime();
        const timeLeft = Math.ceil((end - now) / 1000);
        const clampedTime = Math.max(0, Math.floor(timeLeft));
        setCountdown(clampedTime);
  
        if (clampedTime <= 0) {
          // Prevent duplicate completion calls
          if (status !== 'ended') {
            const res = await axios.post(`${API}/complete`, { roomId });
            setWinner(res.data.winner);
            setScores(res.data.scores);
            setBets(res.data.bets);
            setStatus('ended');
          }
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  };

// Poll status every second when in a room with a roomId
useEffect(() => {
  if (inRoom && roomId) {
    const interval = setInterval(pollStatus, 1000);
    return () => clearInterval(interval);
  }
}, [inRoom, roomId]);

// Pre-battle countdown before clicking begins
useEffect(() => {
  if (status === 'active' && preCountdown === null) {
    let pre = 3;
    setPreCountdown(pre);
    const countdownInterval = setInterval(() => {
      pre -= 1;
      setPreCountdown(pre);
      if (pre <= 0) {
        clearInterval(countdownInterval);
        setPreCountdown(0);
      }
    }, 1000);
    return () => clearInterval(countdownInterval); // cleanup on unmount or status change
  } else if (status !== 'active') {
    setPreCountdown(null); // reset if game restarts or ends
  }
}, [status]);

// Handle clicks during battle
const handleClick = () => {
  setClicks(prev => prev + 1);
  axios.post(`${API}/click`, { roomId, username });
};

// Create a new room
const createRoom = async () => {
  try {
    const res = await axios.post(`${API}/create`, { username });
    setRoomId(res.data.roomId);
    setInRoom(true);
  } catch (err) {
    console.error('Create room error:', err);
    alert('Failed to create room');
  }
};

// Join an existing room
const joinRoom = async () => {
  try {
    const res = await axios.post(`${API}/join`, { roomId, username });
    if (res.data.success) {
      setInRoom(true);
    } else {
      alert(res.data.message || 'Failed to join');
    }
  } catch (err) {
    console.error('Join error:', err.response?.data || err.message);
    alert(err.response?.data?.error || 'Failed to join room');
  }
};

// Send ready signal and place a bet
const sendReady = async () => {
  try {
    await axios.post(`${API}/ready`, { roomId, username, bet });
    setIsReady(true);
  } catch (err) {
    console.error('Ready error:', err.response?.data || err.message);
    alert(err.response?.data?.error || 'Failed to ready up');
  }
};

  const opponent = players.find(p => p !== username);

  return (
    <div style={{ textAlign: 'center', marginTop: '30px' }}>
      <h1>⚔️ Battle Room</h1>

      {!inRoom && (
        <div>
          <button onClick={createRoom} style={{ padding: '10px 20px', margin: '10px' }}>
            Create Room
          </button>
          <br />
          <input
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={{ padding: '8px', marginTop: '10px' }}
          />
          <button onClick={joinRoom} style={{ padding: '10px 20px', marginLeft: '10px' }}>
            Join Room
          </button>
        </div>
      )}

      {inRoom && (
        <div>
          <h3>Room ID: {roomId}</h3>
          <h4>Status: {status}</h4>
          <p style={{ color: 'gray' }}>DEBUG: status = {status}</p>

          {players.length > 0 && (
            <div>
              <h4>Players in Room:</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {players.map(p => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {!['active', 'ended'].includes(status) && (
            <div>
              <label>
                Bet Penguins:
                <input
                  type="number"
                  value={bet}
                  onChange={(e) => setBet(Number(e.target.value))}
                  min="1"
                  style={{ margin: '0 10px', width: '60px' }}
                />
              </label>
              <button
                onClick={sendReady}
                disabled={isReady}
                style={{ padding: '10px 20px', marginTop: '10px' }}
              >
                {isReady ? '✅ Waiting for opponent...' : '✅ Ready & Bet'}
              </button>
            </div>
          )}

          {status === 'active' && (
            <>
              {preCountdown > 0 ? (
                <h1 style={{ fontSize: '48px', color: '#f39c12' }}>
                  {preCountdown === 0 ? 'GO!' : preCountdown}
                </h1>
              ) : (
                <>
                  <h2>Time Left: {countdown}s</h2>
                  <h3>Your Clicks: {clicks}</h3>
                  <h4>Opponent Clicks: {opponentClicks}</h4>
                  <button
                    onClick={handleClick}
                    style={{ padding: '20px 40px', fontSize: '20px', marginTop: '10px' }}
                  >
                    CLICK!
                  </button>
                </>
              )}
            </>
          )}

          {status === 'ended' && (
            <>
              <h2
                style={{
                  color: winner === username ? '#27ae60' : '#e74c3c',
                  fontSize: '32px',
                  marginTop: '20px'
                }}
              >
                {winner === username ? '🏆 You Win!' : '😢 You Lost!'}
              </h2>
              <p>Winner: <strong>{winner}</strong></p>
              <p>Final Scores:</p>
              <p>{username}: {scores[username] || 0} clicks ({bets[username] || 0} 🐧)</p>
              <p>{opponent}: {scores[opponent] || 0} clicks ({bets[opponent] || 0} 🐧)</p>
            </>
          )}
        </div>
      )}

      <br />
      <button onClick={() => (window.location.href = '/')} style={{ marginTop: '20px' }}>
        🔙 Back to Game
      </button>
    </div>
  );
}

export default BattleRoom;
