import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Board from '../../components/Board';
import NextPiece from '../../components/NextPiece';
import '../GamePage.css';

const BonusGameSpeed = () => {
  const { roomName, playerName } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState([]);
  const [nextPiece, setNextPiece] = useState(null);
  const [players, setPlayers] = useState([]);
  const [spectrums, setSpectrums] = useState([]);
  const [scores, setScores] = useState({});
  const [gameStarted, setGameStarted] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState(null);
  const [isWinner, setIsWinner] = useState(false);
  const [isEliminated, setIsEliminated] = useState(false);
  const [penaltyNotification, setPenaltyNotification] = useState(null);
  const appRef = useRef(null);
  const gameStartedRef = useRef(false);
  const joinedRef = useRef(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io();
    }
    const socket = socketRef.current;

    if (!joinedRef.current && !gameStarted) {
      socket.emit('joinRoom', { roomName, playerName, mode: 'bonus' });
      joinedRef.current = true;
    }

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
      if (dir && gameStartedRef.current) socket.emit('move', { direction: dir });
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
      const map = {};
      players.forEach(p => { if (typeof p.score === 'number') map[p.name] = p.score; });
      setScores(map);
      setSpectrums(spectrums);
      setGameStarted(gameStarted);
      setIsHost(players.find(p => p.name === playerName)?.isHost || false);
    });

    socket.on('joinError', ({ message, code }) => {
      setError(`${message} (${code})`);
    });

    socket.on('moveError', ({ message, code }) => {
      console.error(`Move error: ${message} (${code})`);
    });

    socket.on('gameOver', () => {
      setGameEnded(true);
      setIsEliminated(true);
      setIsWinner(false);
      setGameStarted(false);
      socket.emit('leaveRoom');
    });

    socket.on('gameEnd', ({ winner, isWinner }) => {
      setGameEnded(true);
      setWinner(winner);
      setIsWinner(isWinner);
      setGameStarted(false);
      socket.emit('leaveRoom');
    });

    socket.on('penaltyReceived', ({ lines, fromPlayer }) => {
      setPenaltyNotification({ lines, fromPlayer, timestamp: Date.now() });
      setTimeout(() => setPenaltyNotification(null), 3000);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected during bonus game');
      // Don't try to reconnect if game is in progress
      if (gameStarted) {
        console.log('Bonus game in progress, not attempting reconnection');
      }
    });

    return () => {
      socket.off('updateBoard');
      socket.off('roomUpdate');
      socket.off('joinError');
      socket.off('moveError');
      socket.off('gameOver');
      socket.off('gameEnd');
      socket.off('penaltyReceived');
      if (currentApp) {
        currentApp.removeEventListener('keydown', handleKeyDown);
        currentApp.removeEventListener('keyup', handleKeyUp);
      }
    };
  }, [roomName, playerName]);

  const handleLeave = () => {
    setTimeout(() => socketRef.current?.emit('leaveRoom'), 0);
    navigate('/bonus');
  };

  const handleStartGame = () => {
    socketRef.current?.emit('startGame');
    // Inform server this room should be in speed mode for bonus namespace
    socketRef.current?.emit('setSpeedMode', { roomName, enabled: true, mode: 'bonus' });
  };

  useEffect(() => {
    gameStartedRef.current = gameStarted;
  }, [gameStarted]);

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

  if (gameEnded) {
    setTimeout(() => socketRef.current?.emit('leaveRoom'), 0);
    return (
      <div className="game-page">
        <div className="content">
          <div className={`game-end-message ${isEliminated ? 'eliminated' : ''}`}>
            {isWinner ? (
              <>
                <h2>🎉 You Won! 🎉</h2>
                <p>Congratulations! You are the last player standing!</p>
              </>
            ) : isEliminated ? (
              <>
                <h2>💀 You Were Eliminated 💀</h2>
                <p>Better luck next time! Your board got too full.</p>
              </>
            ) : (
              <>
                <h2>Game Over</h2>
                <p>Winner: {winner}</p>
              </>
            )}
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
          <div className="brand">Red Tetris — Speed</div>
          <div className="meta">Room: {roomName} · Player: {playerName}</div>
          {isHost && <div className="host-indicator">HOST</div>}
        </header>
        <div className="room-info">
          <div className="players-list">
            <h3>Players ({players.length}/2)</h3>
            {players.map(player => (
              <div key={player.name} className={`player ${player.isHost ? 'host' : ''}`}>
                {player.name} {player.isHost && '(Host)'} — {scores[player.name] ?? 0}
              </div>
            ))}
          </div>
          {!gameStarted && isHost && (
            <button className="start-game-button" onClick={handleStartGame}>Start Game</button>
          )}
          {gameStarted && <div className="game-status">Game in Progress</div>}
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
                        <div key={i} className="spectrum-bar" style={{ height: `${height * 2}px` }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
          <div className="board-wrapper">
            <Board board={board} />
            {penaltyNotification && (
              <div className="penalty-notification">
                <div className="penalty-message">
                  <div className="penalty-icon">⚠️</div>
                  <div className="penalty-text">
                    <div className="penalty-lines">{penaltyNotification.lines} LINE PENALTY</div>
                    <div className="penalty-from">from {penaltyNotification.fromPlayer}</div>
                  </div>
                </div>
              </div>
            )}
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

export default BonusGameSpeed;


