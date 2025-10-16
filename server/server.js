
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");

const Player = require('./classes/Player');
const Board = require('./classes/Board');
const Room = require('./classes/Room');
const { Tetromino } = require('./classes/Tetromino');
const { RoomError, PlayerError, ValidationError, NetworkError } = require('./errors');
const {
    canPlace,
    rotatePieceWithKicks,
    movePiece,
    lockPiece,
    clearLines,
    addPenaltyLines,
    addPenaltyLinesReverse,
    renderWithPiece,
} = require('./logic/gameLogic');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const { updateScore, getTopScores, addSpeedGameScore, getTopSpeedGameScores, addReverseGameScore, getTopReverseGameScores, addNewbrickGameScore, getTopNewbrickGameScores } = require('./database');

const PORT = process.env.PORT || 3000;
const publicPath = path.join(__dirname, '..', 'public');

const rooms = new Map();

function getRoomKey(roomName, mode = 'normal') {
    return `${mode}:${roomName}`;
}

app.use(express.static(publicPath));

app.get('/api/scoreboard', async (req, res) => {
    try {
        const n = Math.max(1, Math.min(100, Number(req.query.n) || 20));
        res.set('Cache-Control', 'no-store');
        const scores = await getTopScores(n);
        res.json(scores);
    } catch (e) {
        console.error('Error fetching scoreboard:', e);
        res.status(500).json({ error: 'failed' });
    }
});

app.get('/api/speed-scores', async (req, res) => {
    try {
        const n = Math.max(1, Math.min(10, Number(req.query.n) || 3));
        res.set('Cache-Control', 'no-store');
        const scores = await getTopSpeedGameScores(n);
        res.json(scores);
    } catch (e) {
        res.status(500).json({ error: 'failed' });
    }
});

app.get('/api/reverse-scores', async (req, res) => {
    try {
        const n = Math.max(1, Math.min(10, Number(req.query.n) || 3));
        res.set('Cache-Control', 'no-store');
        const scores = await getTopReverseGameScores(n);
        res.json(scores);
    } catch (e) {
        res.status(500).json({ error: 'failed' });
    }
});

app.get('/api/newbrick-scores', async (req, res) => {
    try {
        const n = Math.max(1, Math.min(10, Number(req.query.n) || 3));
        res.set('Cache-Control', 'no-store');
        const scores = await getTopNewbrickGameScores(n);
        res.json(scores);
    } catch (e) {
        res.status(500).json({ error: 'failed' });
    }
});

app.post('/api/test-speed-broadcast', async (req, res) => {
    try {
        const scores = await getTopSpeedGameScores(3);
        io.emit('speedScoresUpdated', scores);
        res.json({ success: true, scores });
    } catch (e) {
        res.status(500).json({ error: 'failed' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

function serializePiece(piece) {
    if (!piece) return null;
    return { shape: piece.shape, color: piece.color };
}


function makePieceFromTetromino(t, roomMode = 'normal') {
    if (!t) return null;
    
    if (roomMode === 'bonus-reverse') {
        return { type: t.type, shape: t.shape, color: t.color, x: 3, y: 18, r: 0 };
    } else {
        return { type: t.type, shape: t.shape, color: t.color, x: 3, y: 0, r: 0 };
    }
}

function canPlaceReverse(grid, piece, offsetX = 0, offsetY = 0) {
    if (!piece) return false;
    const height = grid.length;
    const width = grid[0]?.length || 0;

    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x] !== 0) {
                const newX = piece.x + x + offsetX;
                const newY = piece.y + y + offsetY;

                // For reverse gravity: pieces can move upward (negative y direction)
                // Game over happens when pieces reach the top (y < 0)
                if (newX < 0 || newX >= width || newY < 0) return false;
                // Check collision with existing blocks
                if (newY < height && grid[newY][newX] !== 0) return false;
            }
        }
    }
    return true;
}

function clearLinesReverse(grid) {
    // For reverse gravity, we need to add empty lines at the bottom (not top)
    const width = grid[0]?.length || 0;
    let linesCleared = 0;
    const newGrid = [];

    for (let y = 0; y < grid.length; y++) {
        // Only clear lines that are full AND don't contain penalty blocks (8)
        const full = grid[y].every(cell => cell !== 0 && cell !== 8);
        if (full) {
            linesCleared++;
        } else {
            newGrid.push(grid[y].slice());
        }
    }
    // Add empty lines at the bottom for reverse gravity
    while (newGrid.length < grid.length) {
        newGrid.push(Array(width).fill(0));
    }
    return { grid: newGrid, linesCleared };
}

async function checkGameEnd(room) {
    const activePlayers = room.getPlayers();
    if (activePlayers.length <= 1) {
        if (activePlayers.length === 1) {
            const winner = activePlayers[0];
            
            // Announce winner to all players
            room.getPlayers().forEach(player => {
                player.socket.emit('gameEnd', { 
                    winner: winner.name, 
                    isWinner: player.socketId === winner.socketId 
                });
            });
            // Persist winner score for bonus rooms
            if (room.roomMode === 'bonus') {
                try {
                    await updateScore(winner.name, winner.score || 0, true);
                    const snapshot = await getTopScores(5);
                    // Emit scoreboard update immediately
                    const topScores = await getTopScores(10);
                    io.emit('scoreboardUpdated', topScores);
                    // Also emit a specific bonus scoreboard update
                    io.emit('bonusScoreboardUpdated', topScores);
                } catch (e) {
                    console.error('[SCOREBOARD] Failed to persist winner score:', e?.message);
                }
            }
            
            // Persist speed game score if this is a speed game
            if (room.speedMode) {
                try {
                    await addSpeedGameScore(winner.name, winner.score || 0);
                    const speedScores = await getTopSpeedGameScores(3);
                    io.emit('speedScoresUpdated', speedScores);
                } catch (e) {
                    console.error('[SPEED SCORES] Failed to persist winner score:', e?.message);
                }
            }

            // Persist reverse game score if reverse mode
            if (room.roomMode === 'bonus-reverse') {
                try {
                    await addReverseGameScore(winner.name, winner.score || 0);
                    const reverseScores = await getTopReverseGameScores(3);
                    io.emit('reverseScoresUpdated', reverseScores);
                } catch (e) {
                    console.error('[REVERSE SCORES] Failed to persist winner score:', e?.message);
                }
            }

            // Persist newbrick game score if newbrick mode
            if (room.roomMode === 'bonus-newbrick') {
                try {
                    await addNewbrickGameScore(winner.name, winner.score || 0);
                    const newbrickScores = await getTopNewbrickGameScores(3);
                    io.emit('newbrickScoresUpdated', newbrickScores);
                } catch (e) {
                    console.error('[NEWBRICK SCORES] Failed to persist winner score:', e?.message);
                }
            }
            
            // Stop the game
            room.stopGame();
            return true;
        } else {
            // No players left
            room.stopGame();
            return true;
        }
    }
    return false;
}

async function handleGameTick(room) {
    if (!room || !room.gameStarted) return;
    
    const gravityDirection = room.roomMode === 'bonus-reverse' ? -1 : 1;
    
    // Move pieces and give new pieces to players who need them individually
    for (const player of room.getPlayers()) {
        try {
        // Skip players without current piece (game ended)
        if (!player.currentPiece) {
            continue;
        }
        
        const grid = player.board.grid;
        const now = Date.now();
        const interval = room.speedMode ? (player.dropIntervalMs || room.gameSpeed) : room.gameSpeed;
        const canFall = room.roomMode === 'bonus-reverse' 
            ? canPlaceReverse(grid, player.currentPiece, 0, gravityDirection)
            : canPlace(grid, player.currentPiece, 0, gravityDirection);

        if (canFall && (!room.speedMode || now - (player.lastDropTime || 0) >= interval)) {
            player.currentPiece = movePiece(player.currentPiece, 0, gravityDirection);
            if (room.speedMode) {
                player.lastDropTime = now;
            }
        } else if (!canFall) {
            // Piece needs to lock
            const locked = lockPiece(grid, player.currentPiece);
            const { grid: cleared, linesCleared } = room.roomMode === 'bonus-reverse' 
                ? clearLinesReverse(locked) 
                : clearLines(locked);
            player.board.grid = cleared;

            if (room.speedMode) {
                player.locksSinceSpeedUp = (player.locksSinceSpeedUp || 0) + 1;
                if (player.locksSinceSpeedUp % 3 === 0) {
                    const prev = player.dropIntervalMs || room.gameSpeed;
                    player.dropIntervalMs = Math.max(20, Math.floor(prev * 0.85));
                }
                player.lastDropTime = Date.now();
            }

            if ((room.roomMode === 'bonus' || room.roomMode === 'bonus-reverse' || room.roomMode === 'bonus-newbrick') && linesCleared > 0) {
                const add = linesCleared === 1 ? 100 : linesCleared === 2 ? 300 : linesCleared === 3 ? 500 : 800;
                player.score = (player.score || 0) + add;
            }
            
            if (linesCleared > 0) {
                const penaltyLines = linesCleared - 1; // n-1 penalty lines
                if (penaltyLines > 0) {
                    for (const otherPlayer of room.getPlayers()) {
                        if (otherPlayer.socketId !== player.socketId) {
                            if (room.roomMode === 'bonus-reverse') {
                                otherPlayer.board.grid = addPenaltyLinesReverse(otherPlayer.board.grid, penaltyLines);
                            } else {
                                otherPlayer.board.grid = addPenaltyLines(otherPlayer.board.grid, penaltyLines);
                            }
                            if (otherPlayer.currentPiece) {
                                let adjusted;
                                if (room.roomMode === 'bonus-reverse') {
                                    adjusted = { ...otherPlayer.currentPiece, y: otherPlayer.currentPiece.y + penaltyLines };
                                    while (!canPlaceReverse(otherPlayer.board.grid, adjusted, 0, 0) && adjusted.y < 25) {
                                        adjusted = { ...adjusted, y: adjusted.y + 1 };
                                    }
                                    if (canPlaceReverse(otherPlayer.board.grid, adjusted, 0, 0)) {
                                        otherPlayer.currentPiece = adjusted;
                                    }
                                } else {
                                    adjusted = { ...otherPlayer.currentPiece, y: otherPlayer.currentPiece.y - penaltyLines };
                                    while (!canPlace(otherPlayer.board.grid, adjusted, 0, 0) && adjusted.y > -6) {
                                        adjusted = { ...adjusted, y: adjusted.y - 1 };
                                    }
                                    if (canPlace(otherPlayer.board.grid, adjusted, 0, 0)) {
                                        otherPlayer.currentPiece = adjusted;
                                    }
                                }
                            }
                            
                            otherPlayer.socket.emit('penaltyReceived', {
                                lines: penaltyLines,
                                fromPlayer: player.name
                            });
                            
                            if (!canPlace(otherPlayer.board.grid, otherPlayer.currentPiece, 0, 0)) {
                                // Persist loser score in bonus modes
                                if (room.roomMode === 'bonus') {
                                    try {
                                        await updateScore(otherPlayer.name, otherPlayer.score || 0, false);
                                        const snapshot = await getTopScores(5);
                                        console.log('[SCOREBOARD] Loser persisted:', otherPlayer.name, 'score=', otherPlayer.score || 0);
                                        console.log('[SCOREBOARD] Top 5 now:', JSON.stringify(snapshot));
                                        const topScores = await getTopScores(10);
                                        io.emit('scoreboardUpdated', topScores);
                                    } catch (e) {
                                        console.error('[SCOREBOARD] Failed to persist loser score:', e?.message);
                                    }
                                } else if (room.roomMode === 'bonus-reverse') {
                                    try {
                                        await addReverseGameScore(otherPlayer.name, otherPlayer.score || 0);
                                        const reverseScores = await getTopReverseGameScores(3);
                                        io.emit('reverseScoresUpdated', reverseScores);
                                    } catch (e) {
                                        console.error('[REVERSE SCORES] Failed to persist loser score:', e?.message);
                                    }
                                } else if (room.roomMode === 'bonus-newbrick') {
                                    try {
                                        await addNewbrickGameScore(otherPlayer.name, otherPlayer.score || 0);
                                        const newbrickScores = await getTopNewbrickGameScores(3);
                                        io.emit('newbrickScoresUpdated', newbrickScores);
                                    } catch (e) {
                                        console.error('[NEWBRICK SCORES] Failed to persist loser score:', e?.message);
                                    }
                                }
                                otherPlayer.socket.emit('gameOver');
                                room.removePlayer(otherPlayer.socketId);
                                // Reflect host reassignment and player list immediately
                                broadcastRoomUpdate(room);
                                
                                // Check if game should end (only one player left)
                                if (await checkGameEnd(room)) {
                                    return; // Game ended, stop processing
                                }
                            }
                        }
                    }
                }
            }
            
            room.extendSequencesIfNeeded(50, 2);
            
            const newCurrentPiece = player.pieceSequence[player.sequenceIndex];
            const newNextPiece = player.pieceSequence[player.sequenceIndex + 1];
            
            
            player.currentPiece = newCurrentPiece ? makePieceFromTetromino(newCurrentPiece, room.roomMode) : null;
            player.nextPiece = newNextPiece;
            player.needsNewPiece = false;
            
            player.sequenceIndex += 1;
            
            
            if (!canPlace(player.board.grid, player.currentPiece, 0, 0)) {
                // Persist loser score in bonus modes
                if (room.roomMode === 'bonus') {
                    try {
                        await updateScore(player.name, player.score || 0, false);
                        const snapshot = await getTopScores(5);
                        // Emit scoreboard update immediately
                        const topScores = await getTopScores(10);
                        io.emit('scoreboardUpdated', topScores);
                        // Also emit a specific bonus scoreboard update
                        io.emit('bonusScoreboardUpdated', topScores);
                    } catch (e) {
                        console.error('[SCOREBOARD] Failed to persist loser score:', e?.message);
                    }
                } else if (room.roomMode === 'bonus-reverse') {
                    try {
                        await addReverseGameScore(player.name, player.score || 0);
                        const reverseScores = await getTopReverseGameScores(3);
                        io.emit('reverseScoresUpdated', reverseScores);
                    } catch (e) {
                        console.error('[REVERSE SCORES] Failed to persist loser score:', e?.message);
                    }
                } else if (room.roomMode === 'bonus-newbrick') {
                    try {
                        await addNewbrickGameScore(player.name, player.score || 0);
                        const newbrickScores = await getTopNewbrickGameScores(3);
                        io.emit('newbrickScoresUpdated', newbrickScores);
                    } catch (e) {
                        console.error('[NEWBRICK SCORES] Failed to persist loser score:', e?.message);
                    }
                }
                player.socket.emit('gameOver');
                // Remove player from room
                room.removePlayer(player.socketId);
                // Reflect host reassignment and player list immediately
                broadcastRoomUpdate(room);
                
                // Check if game should end (only one player left)
                if (await checkGameEnd(room)) {
                    return; // Game ended, stop processing
                }
                return;
            }
        }
        } catch (err) {
            console.error('Error during game tick for player', player?.name, err?.message);
        }
    }
    
    room.getPlayers().forEach(player => {
        const boardWithPiece = player.currentPiece
            ? renderWithPiece(player.board.grid, player.currentPiece)
            : player.board.grid;
        const nextPieceSerialized = player.nextPiece
            ? serializePiece(makePieceFromTetromino(player.nextPiece, room.roomMode))
            : null;
        
        
        player.socket.emit('updateBoard', {
            board: boardWithPiece,
            nextPiece: nextPieceSerialized
        });
    });
    
    room.getPlayers().forEach(player => {
        const otherPlayers = room.getPlayers().filter(p => p.socketId !== player.socketId);
        const spectrums = otherPlayers.map(p => ({
            name: p.name,
            spectrum: room.getSpectrum(p)
        }));
        
        player.socket.emit('roomUpdate', {
            players: room.getPlayers().map(p => ({ 
                name: p.name, 
                isHost: p.socketId === room.host, 
                score: (room.roomMode === 'bonus' || room.roomMode === 'bonus-reverse' || room.roomMode === 'bonus-newbrick') ? (p.score || 0) : undefined 
            })),
            spectrums: spectrums,
            gameStarted: room.gameStarted
        });
    });
}

function handleSoftDropTick(player, roomMode = 'normal') {
    const grid = player.board.grid;
    const gravityDirection = roomMode === 'bonus-reverse' ? -1 : 1;
    const canFall = roomMode === 'bonus-reverse' 
        ? canPlaceReverse(grid, player.currentPiece, 0, gravityDirection)
        : canPlace(grid, player.currentPiece, 0, gravityDirection);

    if (canFall) {
        player.currentPiece = movePiece(player.currentPiece, 0, gravityDirection);
        const boardWithPiece = player.currentPiece
            ? renderWithPiece(player.board.grid, player.currentPiece)
            : player.board.grid;
        player.socket.emit('updateBoard', {
            board: boardWithPiece,
            nextPiece: player.nextPiece ? serializePiece(makePieceFromTetromino(player.nextPiece, roomMode)) : null
        });
    } else {
        // Piece can't fall anymore, stop soft drop
        player.isSoftDropping = false;
        if (player.softDropTimer) {
            clearInterval(player.softDropTimer);
            player.softDropTimer = null;
        }
        
        // Send spectrum updates when piece locks during soft drop
        if (player.room) {
            const room = player.room;
            room.getPlayers().forEach(p => {
                const otherPlayers = room.getPlayers().filter(other => other.socketId !== p.socketId);
                const spectrums = otherPlayers.map(other => ({
                    name: other.name,
                    spectrum: room.getSpectrum(other)
                }));
                
                p.socket.emit('roomUpdate', {
                    players: room.getPlayers().map(pl => ({ 
                        name: pl.name, 
                        isHost: pl.socketId === room.host,
                        score: (room.roomMode === 'bonus' || room.roomMode === 'bonus-reverse' || room.roomMode === 'bonus-newbrick') ? (pl.score || 0) : undefined
                    })),
                    spectrums: spectrums,
                    gameStarted: room.gameStarted
                });
            });
        }
    }
}

function broadcastRoomUpdate(room) {
    const players = room.getPlayers();
    players.forEach(player => {
        const otherPlayers = players.filter(p => p.socketId !== player.socketId);
        const spectrums = otherPlayers.map(p => ({
            name: p.name,
            spectrum: room.getSpectrum(p)
        }));
        
        player.socket.emit('roomUpdate', {
            players: players.map(p => ({ name: p.name, isHost: p.socketId === room.host })),
            spectrums: spectrums,
            gameStarted: room.gameStarted
        });
    });
}

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    let currentRoom = null;
    let currentPlayer = null;

    socket.on('joinRoom', ({ roomName, playerName, mode = 'normal' }) => {
        try {
            console.log(`Player ${playerName} trying to join room ${roomName}`);
            
            // Validate input
            if (!roomName || !playerName) {
                throw new ValidationError('Room name and player name are required');
            }
            
            if (roomName.length > 20 || playerName.length > 20) {
                throw new ValidationError('Room name and player name must be 20 characters or less');
            }
            
            // Get or create room (namespaced by mode)
            const roomKey = getRoomKey(roomName, mode);
            if (!rooms.has(roomKey)) {
                const newRoom = new Room(roomName);
                newRoom.mapKey = roomKey;
                newRoom.roomMode = mode;
                rooms.set(roomKey, newRoom);
            }
            const room = rooms.get(roomKey);
            
            // Check if player with this name is already in the room (reconnection)
            const existingPlayer = room.getPlayers().find(p => p.name === playerName);
            if (existingPlayer) {
                // Player is reconnecting, update socket reference and ID
                const oldSocketId = existingPlayer.socketId;
                existingPlayer.socket = socket;
                existingPlayer.socketId = socket.id;
                currentPlayer = existingPlayer;
                currentRoom = room;
                
                // Update the room's player map with new socket ID
                room.players.delete(oldSocketId); // Remove old entry
                room.players.set(socket.id, existingPlayer); // Add with new socket ID
                
                // Send current board state
                if (currentPlayer.currentPiece) {
                    const boardWithPiece = renderWithPiece(currentPlayer.board.grid, currentPlayer.currentPiece);
                    socket.emit('updateBoard', {
                        board: boardWithPiece,
                        nextPiece: currentPlayer.nextPiece ? serializePiece(makePieceFromTetromino(currentPlayer.nextPiece, currentRoom.roomMode)) : null
                    });
                } else {
                    // No pieces yet, send empty board
                    socket.emit('updateBoard', {
                        board: currentPlayer.board.grid,
                        nextPiece: null
                    });
                }
                
                // Broadcast room update
                broadcastRoomUpdate(room);
            console.log(`Player ${playerName} reconnected to room ${roomName} (${mode})`);
                return;
            }
            
            // Check if room can accept new players
            if (!room.canJoin()) {
                throw new RoomError('Room is full or game has started', 'ROOM_FULL_OR_STARTED');
            }
            
            // Add new player to room
            currentPlayer = room.addPlayer(socket.id, playerName);
            currentPlayer.socket = socket;
            currentRoom = room;
            
            // Don't initialize pieces until game starts
            // Pieces will be given when the game actually starts
            
            // Send initial board state
            if (currentPlayer.currentPiece) {
                const boardWithPiece = renderWithPiece(currentPlayer.board.grid, currentPlayer.currentPiece);
                socket.emit('updateBoard', {
                    board: boardWithPiece,
                    nextPiece: serializePiece(makePieceFromTetromino(currentPlayer.nextPiece, currentRoom.roomMode))
                });
            } else {
                // No pieces yet, send empty board
                socket.emit('updateBoard', {
                    board: currentPlayer.board.grid,
                    nextPiece: null
                });
            }
            
            // Broadcast room update to all players
            broadcastRoomUpdate(room);
            
            console.log(`Player ${playerName} joined room ${roomName} (${mode})`);
        } catch (error) {
            console.error(`Error joining room: ${error.message}`);
            socket.emit('joinError', { 
                message: error.message,
                code: error.code || 'UNKNOWN_ERROR'
            });
        }
    });

    socket.on('startGame', () => {
        if (!currentRoom || !currentPlayer) return;
        
        if (currentPlayer.socketId === currentRoom.host && !currentRoom.gameStarted) {
            const gameStarted = currentRoom.startGame();
            
            if (gameStarted) {
                // Start game loop for the room
                currentRoom.gameLoop = setInterval(async () => {
                    await handleGameTick(currentRoom);
                }, currentRoom.gameSpeed);
                
                broadcastRoomUpdate(currentRoom);
                console.log(`Game started in room ${currentRoom.name}`);
                console.log(`Piece sequence index: ${currentRoom.currentPieceIndex}`);
            }
        }
    });

    socket.on('move', async ({ direction }) => {
        try {
            if (!currentRoom || !currentPlayer || !currentRoom.gameStarted) {
                throw new PlayerError('Game not started or player not in room', 'GAME_NOT_STARTED');
            }
            
            if (!currentPlayer.currentPiece) {
                throw new PlayerError('No current piece available', 'NO_CURRENT_PIECE');
            }
            
            const validDirections = ['left', 'right', 'down', 'rotate', 'hardDrop'];
            if (!validDirections.includes(direction)) {
                throw new ValidationError(`Invalid direction: ${direction}`, 'INVALID_DIRECTION');
            }
            
            const grid = currentPlayer.board.grid;
            
            if (direction === 'hardDrop') {
                const gravityDirection = currentRoom.roomMode === 'bonus-reverse' ? -1 : 1;
                let falling = currentPlayer.currentPiece;
                const canPlaceFunc = currentRoom.roomMode === 'bonus-reverse' ? canPlaceReverse : canPlace;
                while (canPlaceFunc(grid, falling, 0, gravityDirection)) {
                    falling = movePiece(falling, 0, gravityDirection);
                }
                currentPlayer.currentPiece = falling;
                await handleGameTick(currentRoom);
                return;
            }

            if (direction === 'rotate') {
                const rotated = rotatePieceWithKicks(grid, currentPlayer.currentPiece, 'CW');
                currentPlayer.currentPiece = rotated;
            } else if (direction === 'down') {
                // Start soft drop
                if (!currentPlayer.isSoftDropping) {
                    currentPlayer.isSoftDropping = true;
                    if (currentPlayer.softDropTimer) {
                        clearInterval(currentPlayer.softDropTimer);
                    }
                    currentPlayer.softDropTimer = setInterval(() => {
                        handleSoftDropTick(currentPlayer, currentRoom.roomMode);
                    }, 50);
                }
            } else {
                let dx = 0, dy = 0;
                if (direction === 'left') dx = -1;
                if (direction === 'right') dx = 1;

                const moved = movePiece(currentPlayer.currentPiece, dx, dy);
                if (canPlace(grid, moved, 0, 0)) {
                    currentPlayer.currentPiece = moved;
                }
            }

            const boardWithPiece = renderWithPiece(currentPlayer.board.grid, currentPlayer.currentPiece);
            socket.emit('updateBoard', {
                board: boardWithPiece,
                nextPiece: serializePiece(makePieceFromTetromino(currentPlayer.nextPiece, currentRoom.roomMode))
            });
        } catch (error) {
            console.error(`Error handling move: ${error.message}`);
            socket.emit('moveError', { 
                message: error.message,
                code: error.code || 'MOVE_ERROR'
            });
        }
    });

    socket.on('stopSoftDrop', () => {
        if (!currentPlayer) return;
        
        if (currentPlayer.isSoftDropping) {
            currentPlayer.isSoftDropping = false;
            if (currentPlayer.softDropTimer) {
                clearInterval(currentPlayer.softDropTimer);
                currentPlayer.softDropTimer = null;
            }
        }
    });

    socket.on('setSpeedMode', ({ roomName, enabled, mode = 'normal' }) => {
        try {
            if (!roomName) return;
            const roomKey = getRoomKey(roomName, mode);
            const room = rooms.get(roomKey);
            if (!room) return;
            // Only allow a player in the room to toggle
            if (!currentPlayer || !currentRoom || currentRoom.mapKey !== roomKey) return;
            room.speedMode = Boolean(enabled);
            room.dropsSinceSpeedUp = 0;
            // Initialize per-player timers when enabling
            if (room.speedMode) {
                const now = Date.now();
                room.getPlayers().forEach(p => {
                    p.dropIntervalMs = Math.max(100, Math.floor(room.gameSpeed * 0.8));
                    p.lastDropTime = now;
                    p.dropsSinceSpeedUp = 0;
                    p.locksSinceSpeedUp = 0;
                });
                // Speed mode: increase room tick frequency so per-player intervals can be effective
                if (currentRoom && currentRoom === room) {
                    if (currentRoom.gameLoop) clearInterval(currentRoom.gameLoop);
                    currentRoom.gameLoop = setInterval(async () => {
                        await handleGameTick(currentRoom);
                    }, 50);
                    console.log(`Speed mode enabled: room ${roomName} tick set to 50ms`);
                }
            } else {
                // Restore default room tick frequency when disabling speed mode
                if (currentRoom && currentRoom === room) {
                    if (currentRoom.gameLoop) clearInterval(currentRoom.gameLoop);
                    currentRoom.gameLoop = setInterval(async () => {
                        await handleGameTick(currentRoom);
                    }, currentRoom.gameSpeed);
                    console.log(`Speed mode disabled: room ${roomName} tick restored to ${currentRoom.gameSpeed}ms`);
                }
            }
        } catch (e) {
            console.error('Failed to set speed mode', e);
        }
    });

    socket.on('leaveRoom', () => {
        if (!currentRoom || !currentPlayer) return;
        console.log(`Player ${currentPlayer.name} leaving room ${currentRoom.name}`);
        const shouldDeleteRoom = currentRoom.removePlayer(socket.id);
        if (shouldDeleteRoom) {
            // Clean up the room properly before deleting
            currentRoom.cleanup();
            const roomKey = currentRoom.mapKey || getRoomKey(currentRoom.name, currentRoom.roomMode || 'normal');
            rooms.delete(roomKey);
            console.log(`Room ${currentRoom.name} deleted`);
        } else {
            broadcastRoomUpdate(currentRoom);
        }
        currentRoom = null;
        currentPlayer = null;
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        
        if (currentRoom && currentPlayer) {
            const shouldDeleteRoom = currentRoom.removePlayer(socket.id);
            if (shouldDeleteRoom) {
                // Clean up the room properly before deleting
                currentRoom.cleanup();
                const roomKey = currentRoom.mapKey || getRoomKey(currentRoom.name, currentRoom.roomMode || 'normal');
                rooms.delete(roomKey);
                console.log(`Room ${currentRoom.name} deleted`);
            } else {
                broadcastRoomUpdate(currentRoom);
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is up on port ${PORT}`);
});
