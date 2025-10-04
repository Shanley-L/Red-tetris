import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../HomePage.css';

const SHAPES = [
    { shape: [[1,1,1,1]], color: 'cyan' },
    { shape: [[1,1],[1,1]], color: 'yellow' },
    { shape: [[0,1,0],[1,1,1]], color: 'purple' },
    { shape: [[0,0,1],[1,1,1]], color: 'orange' },
    { shape: [[1,0,0],[1,1,1]], color: 'blue' },
    { shape: [[0,1,1],[1,1,0]], color: 'green' },
    { shape: [[1,1,0],[0,1,1]], color: 'red' },
];

const BonusHomePage = () => {
    const [roomName, setRoomName] = useState('');
    const [playerName, setPlayerName] = useState('');
    const navigate = useNavigate();
    const [mode, setMode] = useState(null);

    const validateInput = (value) => value.replace(/[^a-zA-Z0-9]/g, '');

    const handleRoomNameChange = (e) => setRoomName(validateInput(e.target.value));
    const handlePlayerNameChange = (e) => setPlayerName(validateInput(e.target.value));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (roomName && playerName) {
            if (mode === 'speed') {
                navigate(`/bonus-speed/${roomName}/${playerName}`);
            } else {
                navigate(`/${roomName}/${playerName}`);
            }
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
        <div className="home-page bonus-theme">
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

            <h1 className="title">Red Tetris — Bonus</h1>
            <form onSubmit={handleSubmit} className="home-form">
                <div className="bonus-actions" role="group" aria-label="Bonus actions">
                    <button
                        type="button"
                        className={`bonus-action speed ${mode === 'speed' ? 'selected' : ''}`}
                        onClick={() => setMode('speed')}
                    >
                        Speed game
                    </button>
                    <button
                        type="button"
                        className={`bonus-action bricks ${mode === 'bricks' ? 'selected' : ''}`}
                        onClick={() => setMode('bricks')}
                    >
                        New bricks
                    </button>
                    <button
                        type="button"
                        className={`bonus-action reverse ${mode === 'reverse' ? 'selected' : ''}`}
                        onClick={() => setMode('reverse')}
                    >
                        Reverse gravity
                    </button>
                    <button
                        type="button"
                        className={`bonus-action bomb ${mode === 'bomb' ? 'selected' : ''}`}
                        onClick={() => setMode('bomb')}
                    >
                        Bombrick
                    </button>
                </div>
                <input
                    type="text"
                    placeholder="Room Name"
                    value={roomName}
                    onChange={handleRoomNameChange}
                    required
                />
                <input
                    type="text"
                    placeholder="Your Name"
                    value={playerName}
                    onChange={handlePlayerNameChange}
                    required
                />
                <button type="submit">Join Game</button>
            </form>

            <p className="input-info">Only letters and numbers are allowed in room names and player names</p>
            <p className="footer">Have fun & stack those blocks!</p>
            <button
                type="button"
                className="bonus-button"
                onClick={() => navigate('/')}
                aria-label="Mandatory"
            >
                Mandatory
            </button>
        </div>
    );
};

export default BonusHomePage;


