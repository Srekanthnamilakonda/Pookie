import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import Leaderboard from './Leaderboard.jsx';
import BattleRoom from './BattleRoom.jsx';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/battle" element={<BattleRoom />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
