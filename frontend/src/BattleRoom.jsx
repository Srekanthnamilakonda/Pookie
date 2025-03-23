import { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'https://pookie-clicker.onrender.com';

function BattleRoom() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState(() => localStorage.getItem('username') || 'pookie');
  const [inRoom, setInRoom] = useState(false);
  const [status, setStatus] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [preCountdown, setPreCountdown] = useState(null);
  const [clicks, setClicks] = useState(0);
  const [winner, setWinner] = useState('');
  const [intervalId, setIntervalId] = useState(null);

  const pollStatus = async () => {
    const res = await axios.get(`${API}/status/${roomId}`);
    const data = res.data;

    setStatus(data.status);

    if (data.status === 'active') {
      const now = Date.now();
      const timeLeft = Math.ceil(new Date(data.endTime).getTime() - now) / 1000;
      setCountdown(Math.max(0, Math.floor(timeLeft)));

      if (timeLeft <= 0) {
        clearInterval(intervalId);
        axios.post(`${API}/complete`, { roomId }).then(res => {
          setWinner(res.data.winner);
          setStatus('ended');
        });
      }
    }
  };

  const handleClick = () => {
    setClicks(prev => prev + 1);
    axios.post(`${API}/click`, { roomId, username });
  };

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
          const id = setInterval(pollStatus, 1000);
          setIntervalId(id);
        }
      }, 1000);
    }
  }, [status]);

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
    await axios.post(`${API}/ready`, { roomId, username });
    setIsReady(true);
  };

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
            <button
              onClick={sendReady}
              disabled={isReady}
              style={{ padding: '10px 20px', marginTop: '10px' }}
            >
              {isReady ? 'Waiting for opponent...' : 'Ready'}
            </button>
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
