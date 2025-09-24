import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Board from '../components/Board';
import NextPiece from '../components/NextPiece';
import './GamePage.css';


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
    <div className="game-page" ref={appRef} tabIndex="0">
      <div className="content">
        <header className="game-header">
          <div className="brand">Red Tetris</div>
          <div className="meta">Room: {roomName} · Player: {playerName}</div>
        </header>
        <button className="leave-button" onClick={handleLeave}>Leave Room</button>
        <div className="game-layout">
          <aside className="side-left">
            <div className="card">
              <NextPiece piece={nextPiece} />
            </div>
          </aside>
          <div className="board-wrapper">
            <Board board={board} />
          </div>
          <aside className="side-right">
            <div className="card controls">
              <h3>Controls</h3>
              <ul>
                <li>← →: Move</li>
                <li>↑: Rotate</li>
                <li>↓: Soft Drop</li>
                <li>Space: Hard Drop</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default GamePage;
