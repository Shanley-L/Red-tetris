import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import Board from '../components/Board';
import '../app.css';

const socket = io();

const GamePage = () => {
    const { roomName, playerName } = useParams();
    const [board, setBoard] = useState([]);
    const appRef = useRef(null);

    useEffect(() => {
        // Announce that the player is joining the room
        socket.emit('joinRoom', { roomName, playerName });

        const handleKeyDown = (event) => {
            event.preventDefault();
            const directions = {
                'ArrowLeft': 'left',
                'ArrowRight': 'right',
                'ArrowDown': 'down',
                'ArrowUp': 'rotate',
                ' ': 'hardDrop'
            };
            const direction = directions[event.key];
            if (direction) {
                socket.emit('move', { direction });
            }
        };

        socket.on('updateBoard', (grid) => setBoard(grid));
        socket.on('gameOver', () => alert('Game Over!'));

        const currentApp = appRef.current;
        if (currentApp) {
            currentApp.focus();
            currentApp.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            socket.off('updateBoard');
            socket.off('gameOver');
            if (currentApp) {
                currentApp.removeEventListener('keydown', handleKeyDown);
            }
            // Optional: socket.emit('leaveRoom', { roomName });
        };
    }, [roomName, playerName]); // Re-run effect if room or player name changes

    return (
        <div className="app" ref={appRef} tabIndex="0">
            <h1>Red Tetris</h1>
            <h2>Room: {roomName} | Player: {playerName}</h2>
            <Board board={board} />
        </div>
    );
};

export default GamePage;
