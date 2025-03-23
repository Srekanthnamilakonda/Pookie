
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
      setStatus(data.status);
      setPlayers(data.players);
      setScores(data.scores || {});
      setBets(data.bets || {});

      if (data.status === 'active') {
        const now = Date.now();
        const timeLeft = Math.ceil(new Date(data.endTime).getTime() - now) / 1000;
        setCountdown(Math.max(0, Math.floor(timeLeft)));

        const opponent = data.players.find(p => p !== username);
        setOpponentClicks(data.scores?.[opponent] || 0);

        if (timeLeft <= 0) {
          clearInterval(pollStatus);
          const res = await axios.post(`${API}/complete`, { roomId });
          setWinner(res.data.winner);
          setScores(res.data.scores);
          setBets(res.data.bets);
          setStatus('ended');
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  };

  useEffect(() => {
    if (inRoom && (status === 'waiting' || status === 'ready' || status === 'active')) {
      const interval = setInterval(pollStatus, 1000);
      return () => clearInterval(interval);
    }
  }, [inRoom, status]);

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
    }
  }, [status]);

  const handleClick = () => {
    setClicks(prev => prev + 1);
    axios.post(`${API}/click`, { roomId, username });
  };

  const createRoom = async () => {
    const res = await axios.post(`${API}/create`, { username });
    setRoomId(res.data.roomId);
    setInRoom(true);
  };

  const joinRoom = async () => {
    const res = await axios.post(`${API}/join`, { roomId, username });
    if (res.data.success) {
      setInRoom(true);
    } else {
      alert(res.data.message || 'Failed to join');
    }
  };

  const sendReady = async () => {
    await axios.post(`${API}/ready`, { roomId, username, bet });
    setIsReady(true);
    setStatus('ready');
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

          {status === 'waiting' || status === 'ready' ? (
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
          ) : status === 'active' ? (
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
          ) : status === 'ended' ? (
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
              <p>Final Clicks:</p>
              <p>{username}: {scores[username] || 0} ({bets[username] || 0} penguins)</p>
              <p>{opponent}: {scores[opponent] || 0} ({bets[opponent] || 0} penguins)</p>
            </>
          ) : null}
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
