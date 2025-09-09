import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

    return (
        <div className="home-page">
            <h1>Red Tetris</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Enter Room Name"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Enter Your Name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    required
                />
                <button type="submit">Join Game</button>
            </form>
        </div>
    );
};

export default HomePage;
