import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Board from '../components/Board';
import NextPiece from '../components/NextPiece';
import '../app.css';

const socket = io();

const GamePage = () => {
  const { roomName, playerName } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState([]);
  const [nextPiece, setNextPiece] = useState(null);
  const appRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      event.preventDefault();
      const directions = {
        'ArrowLeft': 'left',
        'ArrowRight': 'right',
        'ArrowDown': 'down',
        'ArrowUp': 'rotate',
        ' ': 'hardDrop'
      };
      const dir = directions[event.key];
      if (dir) socket.emit('move', { direction: dir });
    };

    const currentApp = appRef.current;
    if (currentApp) {
      currentApp.focus();
      currentApp.addEventListener('keydown', handleKeyDown);
    }

    socket.on('updateBoard', ({ board, nextPiece }) => {
      setBoard(board);
      setNextPiece(nextPiece);
    });

    socket.on('gameOver', () => alert('Game Over!'));

    return () => {
      socket.off('updateBoard');
      socket.off('gameOver');
      if (currentApp) currentApp.removeEventListener('keydown', handleKeyDown);
      socket.emit('leaveRoom');
    };
  }, [roomName, playerName]);

  const handleLeave = () => {
    socket.emit('leaveRoom');
    navigate('/');
  };

  return (
    <div className="app" ref={appRef} tabIndex="0">
      <h1>Red Tetris</h1>
      <h2>Room: {roomName} | Player: {playerName}</h2>
      <button className="leave-button" onClick={handleLeave}>Leave Room</button>
      <div className="game-layout">
        <Board board={board} />
        <NextPiece piece={nextPiece} />
      </div>
    </div>
  );
};

export default GamePage;
