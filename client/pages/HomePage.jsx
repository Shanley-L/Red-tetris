import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const SHAPES = [
    { shape: [[1,1,1,1]], color: 'cyan' },          // I
    { shape: [[1,1],[1,1]], color: 'yellow' },      // O
    { shape: [[0,1,0],[1,1,1]], color: 'purple' },  // T
    { shape: [[0,0,1],[1,1,1]], color: 'orange' },  // L
    { shape: [[1,0,0],[1,1,1]], color: 'blue' },    // J
    { shape: [[0,1,1],[1,1,0]], color: 'green' },   // S
    { shape: [[1,1,0],[0,1,1]], color: 'red' },     // Z
];

const HomePage = () => {
    const [roomName, setRoomName] = useState('');
    const [playerName, setPlayerName] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (roomName && playerName) {
            navigate(`/${roomName}/${playerName}`);
        }
    };

    const pieces = useMemo(() => (
        Array.from({ length: 15 }, (_, i) => {
            const piece = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            return {
                id: i,
                left: Math.random() * 100,
                delay: Math.random() * 5,
                speed: 4 + Math.random() * 3,
                piece
            };
        })
    ), []);

    return (
        <div className="home-page">
            {/* Fond animé */}
            {pieces.map(p => (
                <div
                    key={p.id}
                    className="tetris-piece"
                    style={{
                        left: `${p.left}vw`,
                        animationDuration: `${p.speed}s`,
                        animationDelay: `${p.delay}s`
                    }}
                >
                    {p.piece.shape.map((row, y) => (
                        <div className="row" key={y}>
                            {row.map((cell, x) => (
                                <div
  key={x}
  className={`block-cell ${cell ? 'filled' : ''}`}
  style={{ backgroundColor: cell ? p.piece.color : 'transparent' }}
/>


                            ))}
                        </div>
                    ))}
                </div>
            ))}

            <h1 className="title">Red Tetris</h1>
            <form onSubmit={handleSubmit} className="home-form">
                <input
                    type="text"
                    placeholder="Room Name"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Your Name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    required
                />
                <button type="submit">Join Game</button>
            </form>
            <p className="footer">Have fun & stack those blocks!</p>
        </div>
    );
};

export default HomePage;
