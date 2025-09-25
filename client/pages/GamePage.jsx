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
  const [players, setPlayers] = useState([]);
  const [spectrums, setSpectrums] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState(null);
  const appRef = useRef(null);

  useEffect(() => {
    // Join room when component mounts
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
      const dir = directions[event.key];
      if (dir && gameStarted) socket.emit('move', { direction: dir });
    };

    const handleKeyUp = (event) => {
      if (event.key === 'ArrowDown') {
        socket.emit('stopSoftDrop');
      }
    };

    const currentApp = appRef.current;
    if (currentApp) {
      currentApp.focus();
      currentApp.addEventListener('keydown', handleKeyDown);
      currentApp.addEventListener('keyup', handleKeyUp);
    }

    socket.on('updateBoard', ({ board, nextPiece }) => {
      setBoard(board);
      setNextPiece(nextPiece);
    });

    socket.on('roomUpdate', ({ players, spectrums, gameStarted }) => {
      setPlayers(players);
      setSpectrums(spectrums);
      setGameStarted(gameStarted);
      setIsHost(players.find(p => p.name === playerName)?.isHost || false);
    });

    socket.on('joinError', ({ message }) => {
      setError(message);
    });

    socket.on('gameOver', () => {
      alert('Game Over!');
      navigate('/');
    });

    return () => {
      socket.off('updateBoard');
      socket.off('roomUpdate');
      socket.off('joinError');
      socket.off('gameOver');
      if (currentApp) {
        currentApp.removeEventListener('keydown', handleKeyDown);
        currentApp.removeEventListener('keyup', handleKeyUp);
      }
    };
  }, [roomName, playerName, gameStarted, navigate]);

  const handleLeave = () => {
    navigate('/');
  };

  const handleStartGame = () => {
    socket.emit('startGame');
  };

  if (error) {
    return (
      <div className="game-page">
        <div className="content">
          <div className="error-message">
            <h2>Error: {error}</h2>
            <button onClick={handleLeave}>Back to Home</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page" ref={appRef} tabIndex="0">
      <div className="content">
        <header className="game-header">
          <div className="brand">Red Tetris</div>
          <div className="meta">Room: {roomName} · Player: {playerName}</div>
          {isHost && <div className="host-indicator">HOST</div>}
        </header>
        
        <div className="room-info">
          <div className="players-list">
            <h3>Players ({players.length}/2)</h3>
            {players.map(player => (
              <div key={player.name} className={`player ${player.isHost ? 'host' : ''}`}>
                {player.name} {player.isHost && '(Host)'}
              </div>
            ))}
          </div>
          
          {!gameStarted && isHost && (
            <button className="start-game-button" onClick={handleStartGame}>
              Start Game
            </button>
          )}
          
          {gameStarted && (
            <div className="game-status">Game in Progress</div>
          )}
        </div>

        <button className="leave-button" onClick={handleLeave}>Leave Room</button>
        
        <div className="game-layout">
          <aside className="side-left">
            <div className="card">
              <NextPiece piece={nextPiece} />
            </div>
            {spectrums.length > 0 && (
              <div className="card">
                <h3>Opponents</h3>
                {spectrums.map((spectrum, index) => (
                  <div key={index} className="spectrum-info">
                    <div className="player-name">{spectrum.name}</div>
                    <div className="spectrum-bars">
                      {spectrum.spectrum.map((height, i) => (
                        <div 
                          key={i} 
                          className="spectrum-bar" 
                          style={{ height: `${height * 2}px` }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
