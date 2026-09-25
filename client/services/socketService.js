const io = require('socket.io-client');

// Singleton socket instance
let socket = null;

// Event listeners registry
const listeners = new Map();

/**
 * Initialize socket connection
 */
const initSocket = () => {
  if (!socket) {
    socket = io();
  }
  return socket;
};

/**
 * Subscribe to socket events with automatic cleanup
 * Returns unsubscribe function
 */
const on = (event, callback) => {
  if (!socket) {
    initSocket();
  }

  socket.on(event, callback);

  // Track listener for cleanup
  if (!listeners.has(event)) {
    listeners.set(event, []);
  }
  listeners.get(event).push(callback);

  // Return unsubscribe function
  return () => {
    socket.off(event, callback);
    const callbacks = listeners.get(event);
    if (callbacks) {
      const idx = callbacks.indexOf(callback);
      if (idx > -1) callbacks.splice(idx, 1);
    }
  };
};

/**
 * Emit socket event
 */
const emit = (event, data) => {
  if (!socket) {
    initSocket();
  }
  socket.emit(event, data);
};

/**
 * Remove all listeners for cleanup
 */
const cleanupAllListeners = () => {
  listeners.forEach((callbacks, event) => {
    callbacks.forEach(callback => {
      socket.off(event, callback);
    });
  });
  listeners.clear();
};

/**
 * Disconnect socket
 */
const disconnect = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  cleanupAllListeners();
};

// ============== GAME EVENTS ==============

/**
 * Join a game room
 */
const joinRoom = (roomName, playerName, mode = 'normal') => {
  emit('joinRoom', { roomName, playerName, mode });
};

/**
 * Start a game (host only)
 */
const startGame = () => {
  emit('startGame');
};

/**
 * Go back to the room lobby after a game ended
 */
const relaunchGame = () => {
  emit('relaunchGame');
};

/**
 * Move a piece (direction: left|right|down|rotate|hardDrop)
 */
const movePiece = (direction) => {
  emit('move', { direction });
};

/**
 * Stop soft drop
 */
const stopSoftDrop = () => {
  emit('stopSoftDrop');
};

/**
 * Leave current room
 */
const leaveRoom = () => {
  emit('leaveRoom');
};

/**
 * Set speed mode (bonus)
 */
const setSpeedMode = (roomName, enabled, mode = 'normal') => {
  emit('setSpeedMode', { roomName, enabled, mode });
};

// ============== LISTENERS ==============

/**
 * Listen for board updates
 */
const onUpdateBoard = (callback) => {
  return on('updateBoard', callback);
};

/**
 * Listen for room updates (players list, spectrums, game status)
 */
const onRoomUpdate = (callback) => {
  return on('roomUpdate', callback);
};

/**
 * Listen for game end (when winner is determined)
 */
const onGameEnd = (callback) => {
  return on('gameEnd', callback);
};

/**
 * Listen for game over (player eliminated)
 */
const onGameOver = (callback) => {
  return on('gameOver', callback);
};

/**
 * Listen for penalty lines received
 */
const onPenaltyReceived = (callback) => {
  return on('penaltyReceived', callback);
};

/**
 * Listen for join errors
 */
const onJoinError = (callback) => {
  return on('joinError', callback);
};

/**
 * Listen for move errors
 */
const onMoveError = (callback) => {
  return on('moveError', callback);
};

/**
 * Listen for relaunch errors
 */
const onRelaunchError = (callback) => {
  return on('relaunchError', callback);
};

/**
 * Listen for return to the room lobby (after relaunch)
 */
const onReturnedToLobby = (callback) => {
  return on('returnedToLobby', callback);
};

/**
 * Listen for disconnect
 */
const onDisconnect = (callback) => {
  return on('disconnect', callback);
};

/**
 * Listen for speed scores updates
 */
const onSpeedScoresUpdated = (callback) => {
  return on('speedScoresUpdated', callback);
};

/**
 * Listen for reverse scores updates
 */
const onReverseScoresUpdated = (callback) => {
  return on('reverseScoresUpdated', callback);
};

/**
 * Listen for newbrick scores updates
 */
const onNewbrickScoresUpdated = (callback) => {
  return on('newbrickScoresUpdated', callback);
};

// Export socket service API
const socketService = {
  // Socket control
  initSocket,
  disconnect,

  // Game commands
  joinRoom,
  startGame,
  relaunchGame,
  movePiece,
  stopSoftDrop,
  leaveRoom,
  setSpeedMode,

  // Event listeners
  onUpdateBoard,
  onRoomUpdate,
  onGameEnd,
  onGameOver,
  onPenaltyReceived,
  onJoinError,
  onMoveError,
  onRelaunchError,
  onReturnedToLobby,
  onDisconnect,
  onSpeedScoresUpdated,
  onReverseScoresUpdated,
  onNewbrickScoresUpdated,
};

module.exports = socketService;
