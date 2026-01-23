import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socketService from '../../services/socketService';
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

  useEffect(() => {
    socketService.initSocket();
    if (!joinedRef.current) {
      socketService.joinRoom(roomName, playerName, 'bonus');
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
      if (dir && gameStartedRef.current) socketService.movePiece(dir);
    };

    const handleKeyUp = (event) => {
      if (event.key === 'ArrowDown') {
        socketService.stopSoftDrop();
      }
    };

    const currentApp = appRef.current;
    if (currentApp) {
      currentApp.focus();
      currentApp.addEventListener('keydown', handleKeyDown);
      currentApp.addEventListener('keyup', handleKeyUp);
    }

    const unsubUpdateBoard = socketService.onUpdateBoard(({ board, nextPiece }) => {
      setBoard(board);
      setNextPiece(nextPiece);
    });

    const unsubRoomUpdate = socketService.onRoomUpdate(({ players, spectrums, gameStarted }) => {
      setPlayers(players);
      const map = {};
      players.forEach(p => { if (typeof p.score === 'number') map[p.name] = p.score; });
      setScores(map);
      setSpectrums(spectrums);
      setGameStarted(gameStarted);
      setIsHost(players.find(p => p.name === playerName)?.isHost || false);
    });

    const unsubJoinError = socketService.onJoinError(({ message, code }) => {
      setError(`${message} (${code})`);
    });

    const unsubMoveError = socketService.onMoveError(({ message, code }) => {
      console.error(`Move error: ${message} (${code})`);
    });

    const unsubGameOver = socketService.onGameOver(() => {
      setGameEnded(true);
      setIsEliminated(true);
      setIsWinner(false);
      setGameStarted(false);
      socketService.leaveRoom();
    });

    const unsubGameEnd = socketService.onGameEnd(({ winner, isWinner }) => {
      setGameEnded(true);
      setWinner(winner);
      setIsWinner(isWinner);
      setGameStarted(false);
      socketService.leaveRoom();
    });

    const unsubPenaltyReceived = socketService.onPenaltyReceived(({ lines, fromPlayer }) => {
      setPenaltyNotification({ lines, fromPlayer, timestamp: Date.now() });
      setTimeout(() => setPenaltyNotification(null), 3000);
    });

    const unsubDisconnect = socketService.onDisconnect(() => {
      console.log('Socket disconnected during bonus game');
      // Don't try to reconnect if game is in progress
      if (gameStarted) {
        console.log('Bonus game in progress, not attempting reconnection');
      }
    });

    return () => {
      unsubUpdateBoard();
      unsubRoomUpdate();
      unsubJoinError();
      unsubMoveError();
      unsubGameOver();
      unsubGameEnd();
      unsubPenaltyReceived();
      unsubDisconnect();
      if (currentApp) {
        currentApp.removeEventListener('keydown', handleKeyDown);
        currentApp.removeEventListener('keyup', handleKeyUp);
      }
    };
  }, [roomName, playerName]);

  const handleLeave = () => {
    socketService.leaveRoom();
    navigate('/bonus');
  };

  const handleStartGame = () => {
    socketService.startGame();
    socketService.setSpeedMode(roomName, true, 'bonus');
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


