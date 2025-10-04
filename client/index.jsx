import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BonusHomePage from './pages/BONUS/BonusHomePage';
import GamePage from './pages/GamePage';
import BonusGameSpeed from './pages/BONUS/BonusGameSpeed';
import './pages/HomePage.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <Router>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/bonus" element={<BonusHomePage />} />
      <Route path="/bonus-speed/:roomName/:playerName" element={<BonusGameSpeed />} />
      <Route path="/:roomName/:playerName" element={<GamePage />} />
    </Routes>
  </Router>
);

