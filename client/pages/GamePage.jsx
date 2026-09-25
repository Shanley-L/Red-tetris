import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socketService from '../services/socketService';
import Board from '../components/Board';
import NextPiece from '../components/NextPiece';
import './GamePage.css';

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
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState(null);
  const [isWinner, setIsWinner] = useState(false);
  const [isEliminated, setIsEliminated] = useState(false);
  const [isSolo, setIsSolo] = useState(false);
  const [isTopPlayer, setIsTopPlayer] = useState(false);
  const [waitingForLobby, setWaitingForLobby] = useState(false);
  const [penaltyNotification, setPenaltyNotification] = useState(null);
  const appRef = useRef(null);
  const gameStartedRef = useRef(false);

  const joinedRef = useRef(false);

  useEffect(() => {
    // Initialize socket and join room
    socketService.initSocket();
    
    if (!joinedRef.current) {
      socketService.joinRoom(roomName, playerName, 'normal');
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

    // Listen on window to catch keyboard events even if focus is elsewhere
    // This ensures controls work without needing to click on the game area
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Auto-focus the game area for better UX
    const currentApp = appRef.current;
    if (currentApp) {
      currentApp.focus();
    }

    // Subscribe to socket events
    const unsubUpdateBoard = socketService.onUpdateBoard(({ board, nextPiece }) => {
      setBoard(board);
      setNextPiece(nextPiece);
    });

    const unsubRoomUpdate = socketService.onRoomUpdate(({ players, spectrums, gameStarted }) => {
      setPlayers(players);
      setSpectrums(spectrums);
      setGameStarted(gameStarted);
      setIsHost(players.find(p => p.name === playerName)?.isHost || false);
    });

    const unsubReturnedToLobby = socketService.onReturnedToLobby(() => {
      setGameEnded(false);
      setIsEliminated(false);
      setIsWinner(false);
      setIsSolo(false);
      setWinner(null);
      setWaitingForLobby(false);
    });

    const unsubJoinError = socketService.onJoinError(({ message }) => {
      setError(message);
    });

    const unsubMoveError = socketService.onMoveError(({ message, code }) => {
      console.error(`Move error: ${message} (${code})`);
    });

    const unsubGameOver = socketService.onGameOver(({ solo, isTopPlayer } = {}) => {
      setGameEnded(true);
      setIsEliminated(true);
      setIsWinner(false);
      setIsSolo(Boolean(solo));
      setIsTopPlayer(Boolean(isTopPlayer));
      setGameStarted(false);
    });

    const unsubGameEnd = socketService.onGameEnd(({ winner, isWinner, isTopPlayer }) => {
      setGameEnded(true);
      setWinner(winner);
      setIsWinner(isWinner);
      setIsTopPlayer(Boolean(isTopPlayer));
      setGameStarted(false);
    });

    const unsubPenaltyReceived = socketService.onPenaltyReceived(({ lines, fromPlayer }) => {
      setPenaltyNotification({
        lines,
        fromPlayer,
        timestamp: Date.now()
      });
      
      setTimeout(() => {
        setPenaltyNotification(null);
      }, 3000);
    });

    const unsubDisconnect = socketService.onDisconnect(() => {
      console.log('Socket disconnected during game');
    });

    return () => {
      // Cleanup event listeners
      unsubUpdateBoard?.();
      unsubRoomUpdate?.();
      unsubReturnedToLobby?.();
      unsubJoinError?.();
      unsubMoveError?.();
      unsubGameOver?.();
      unsubGameEnd?.();
      unsubPenaltyReceived?.();
      unsubDisconnect?.();

      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [roomName, playerName]);

  const handleLeave = () => {
    socketService.leaveRoom();
    navigate('/');
  };

  const handleStartGame = () => {
    socketService.startGame();
  };

  const handleRelaunchGame = () => {
    setWaitingForLobby(true);
    socketService.relaunchGame();
  };

  // Keep a ref in sync with gameStarted state for event handlers
  useEffect(() => {
    gameStartedRef.current = gameStarted;
  }, [gameStarted]);

  // Auto-focus the game area when it's rendered and game starts
  useEffect(() => {
    if (appRef.current && gameStarted) {
      appRef.current.focus();
    }
  }, [gameStarted]);

  if (error) {
    return (
      <div className="game-page">
        <div className="content">
          <div className="error-message">
            <h2>Unable to join the room</h2>
            <p>{error}</p>
            <button onClick={handleLeave}>Back to Home</button>
          </div>
        </div>
      </div>
    );
  }

  if (gameEnded) {
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
                <h2>{isSolo ? 'Game Over' : '💀 You Were Eliminated 💀'}</h2>
                <p>{isSolo ? 'Your board got too full!' : 'Better luck next time! Your board got too full.'}</p>
              </>
            ) : (
              <>
                <h2>Game Over</h2>
                <p>Winner: {winner}</p>
              </>
            )}
            {waitingForLobby ? (
              <p className="waiting-lobby">Waiting for the current game to end...</p>
            ) : (
              <button className="relaunch-button" onClick={handleRelaunchGame}>
                {isTopPlayer ? 'Relaunch Game' : 'Back to Lobby'}
              </button>
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
          
          {!gameStarted && !isHost && (
            <div className="game-status">Waiting for the host to start the game...</div>
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

export default GamePage;
