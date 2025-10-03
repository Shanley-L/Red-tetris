
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
    renderWithPiece,
} = require('./logic/gameLogic');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const publicPath = path.join(__dirname, '..', 'public');

// Room management
const rooms = new Map(); // roomName -> Room

app.use(express.static(publicPath));

app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

function serializePiece(piece) {
    return { shape: piece.shape, color: piece.color };
}

function makePieceFromTetromino(t) {
    return { type: t.type, shape: t.shape, color: t.color, x: 3, y: 0, r: 0 };
}

function checkGameEnd(room) {
    const activePlayers = room.getPlayers();
    if (activePlayers.length <= 1) {
        if (activePlayers.length === 1) {
            // We have a winner!
            const winner = activePlayers[0];
            console.log(`\n=== GAME ENDED ===`);
            console.log(`Winner: ${winner.name}`);
            console.log(`=== END GAME ===\n`);
            
            // Announce winner to all players
            room.getPlayers().forEach(player => {
                player.socket.emit('gameEnd', { 
                    winner: winner.name, 
                    isWinner: player.socketId === winner.socketId 
                });
            });
            
            // Stop the game
            room.stopGame();
            return true;
        } else {
            // No players left
            console.log(`\n=== GAME ENDED ===`);
            console.log(`No players remaining`);
            console.log(`=== END GAME ===\n`);
            room.stopGame();
            return true;
        }
    }
    return false;
}

function handleGameTick(room) {
    if (!room.gameStarted) return;
    
    // Move pieces down and give new pieces to players who need them individually
    room.getPlayers().forEach(player => {
        const grid = player.board.grid;
        const canFall = canPlace(grid, player.currentPiece, 0, 1);

        if (canFall) {
            player.currentPiece = movePiece(player.currentPiece, 0, 1);
        } else {
            // Piece needs to lock
            const locked = lockPiece(grid, player.currentPiece);
            const { grid: cleared, linesCleared } = clearLines(locked);
            player.board.grid = cleared;
            
            // Distribute penalty lines to other players if lines were cleared
            if (linesCleared > 0) {
                const penaltyLines = linesCleared - 1; // n-1 penalty lines
                if (penaltyLines > 0) {
                    console.log(`\n=== PENALTY LINE DISTRIBUTION ===`);
                    console.log(`Player ${player.name} cleared ${linesCleared} lines, sending ${penaltyLines} penalty lines to opponents`);
                    
                    room.getPlayers().forEach(otherPlayer => {
                        if (otherPlayer.socketId !== player.socketId) {
                            console.log(`Adding ${penaltyLines} penalty lines to ${otherPlayer.name}`);
                            otherPlayer.board.grid = addPenaltyLines(otherPlayer.board.grid, penaltyLines);
                            
                            // Send penalty notification to the player
                            otherPlayer.socket.emit('penaltyReceived', {
                                lines: penaltyLines,
                                fromPlayer: player.name
                            });
                            
                            // Check if penalty lines caused game over
                            if (!canPlace(otherPlayer.board.grid, otherPlayer.currentPiece, 0, 0)) {
                                console.log(`Game Over for ${otherPlayer.name} due to penalty lines`);
                                otherPlayer.socket.emit('gameOver');
                                room.removePlayer(otherPlayer.socketId);
                                // Reflect host reassignment and player list immediately
                                broadcastRoomUpdate(room);
                                
                                // Check if game should end (only one player left)
                                if (checkGameEnd(room)) {
                                    return; // Game ended, stop processing
                                }
                            }
                        }
                    });
                    console.log(`=== END PENALTY LINE DISTRIBUTION ===\n`);
                }
            }
            
            // Check if player needs a new sequence (reached end of current sequence)
            if (player.sequenceIndex >= player.pieceSequence.length - 1) {
                console.log(`\n=== REGENERATING SEQUENCE FOR ${player.name} ===`);
                console.log(`Player ${player.name} reached end of sequence (${player.pieceSequence.length} pieces)`);
                console.log(`Generating new 50-piece sequence for ${player.name}...`);
                
                // Generate new sequence for this player
                player.pieceSequence = [];
                const gameSeed = room.name.charCodeAt(0) + Date.now() + player.socketId.charCodeAt(0);
                let randomSeed = gameSeed;
                
                const seededRandom = () => {
                    randomSeed = (randomSeed * 1664525 + 1013904223) % Math.pow(2, 32);
                    return randomSeed / Math.pow(2, 32);
                };
                
                for (let i = 0; i < 50; i++) {
                    player.pieceSequence.push(new Tetromino(null, seededRandom));
                }
                player.sequenceIndex = 0;
                
                console.log(`Generated new sequence for ${player.name} with ${player.pieceSequence.length} pieces`);
                console.log(`First 10 pieces: ${player.pieceSequence.slice(0, 10).map(p => p.type).join(', ')}`);
                console.log(`=== END SEQUENCE REGENERATION FOR ${player.name} ===\n`);
            }
            
            // Give this player a new piece from their own sequence copy
            const newCurrentPiece = player.pieceSequence[player.sequenceIndex];
            const newNextPiece = player.pieceSequence[player.sequenceIndex + 1];
            
            console.log(`\n=== INDIVIDUAL SEQUENCE COPY PIECE DISTRIBUTION ===`);
            console.log(`Player ${player.name} piece locked, giving new piece from their own sequence copy`);
            console.log(`Player ${player.name} sequence index: ${player.sequenceIndex}`);
            console.log(`New current piece: ${newCurrentPiece.type}, new next piece: ${newNextPiece.type}`);
            
            player.currentPiece = makePieceFromTetromino(newCurrentPiece);
            player.nextPiece = newNextPiece;
            player.needsNewPiece = false;
            
            // Advance this player's sequence index
            player.sequenceIndex += 1;
            
            console.log(`Player ${player.name} got new piece: current=${newCurrentPiece.type}, next=${newNextPiece.type}`);
            console.log(`Player ${player.name} sequence index advanced to: ${player.sequenceIndex}`);
            console.log(`=== END INDIVIDUAL SEQUENCE COPY DISTRIBUTION ===\n`);
            
            // Check for game over after assigning new piece
            if (!canPlace(player.board.grid, player.currentPiece, 0, 0)) {
                console.log(`Game Over for ${player.name}`);
                player.socket.emit('gameOver');
                // Remove player from room
                room.removePlayer(player.socketId);
                // Reflect host reassignment and player list immediately
                broadcastRoomUpdate(room);
                
                // Check if game should end (only one player left)
                if (checkGameEnd(room)) {
                    return; // Game ended, stop processing
                }
                return;
            }
        }
    });
    
    // Send board updates to all players
    room.getPlayers().forEach(player => {
        const boardWithPiece = renderWithPiece(player.board.grid, player.currentPiece);
        const nextPieceSerialized = serializePiece(makePieceFromTetromino(player.nextPiece));
        
        console.log(`Sending to ${player.name}: current=${player.currentPiece.type}, next=${player.nextPiece.type}`);
        console.log(`Serialized next piece:`, nextPieceSerialized);
        
        player.socket.emit('updateBoard', {
            board: boardWithPiece,
            nextPiece: nextPieceSerialized
        });
    });
    
    // Send spectrum updates to all players
    room.getPlayers().forEach(player => {
        const otherPlayers = room.getPlayers().filter(p => p.socketId !== player.socketId);
        const spectrums = otherPlayers.map(p => ({
            name: p.name,
            spectrum: room.getSpectrum(p)
        }));
        
        player.socket.emit('roomUpdate', {
            players: room.getPlayers().map(p => ({ name: p.name, isHost: p.socketId === room.host })),
            spectrums: spectrums,
            gameStarted: room.gameStarted
        });
    });
}

function handleSoftDropTick(player) {
    const grid = player.board.grid;
    const canFall = canPlace(grid, player.currentPiece, 0, 1);

    if (canFall) {
        player.currentPiece = movePiece(player.currentPiece, 0, 1);
        const boardWithPiece = renderWithPiece(player.board.grid, player.currentPiece);
        player.socket.emit('updateBoard', {
            board: boardWithPiece,
            nextPiece: serializePiece(makePieceFromTetromino(player.nextPiece))
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
                    players: room.getPlayers().map(pl => ({ name: pl.name, isHost: pl.socketId === room.host })),
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

    socket.on('joinRoom', ({ roomName, playerName }) => {
        try {
            console.log(`Player ${playerName} trying to join room ${roomName}`);
            
            // Validate input
            if (!roomName || !playerName) {
                throw new ValidationError('Room name and player name are required');
            }
            
            if (roomName.length > 20 || playerName.length > 20) {
                throw new ValidationError('Room name and player name must be 20 characters or less');
            }
            
            // Get or create room
            if (!rooms.has(roomName)) {
                rooms.set(roomName, new Room(roomName));
            }
            
            const room = rooms.get(roomName);
            
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
                        nextPiece: serializePiece(makePieceFromTetromino(currentPlayer.nextPiece))
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
                console.log(`Player ${playerName} reconnected to room ${roomName}`);
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
                    nextPiece: serializePiece(makePieceFromTetromino(currentPlayer.nextPiece))
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
            
            console.log(`Player ${playerName} joined room ${roomName}`);
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
                currentRoom.gameLoop = setInterval(() => {
                    handleGameTick(currentRoom);
                }, currentRoom.gameSpeed);
                
                broadcastRoomUpdate(currentRoom);
                console.log(`Game started in room ${currentRoom.name}`);
                console.log(`Piece sequence index: ${currentRoom.currentPieceIndex}`);
            }
        }
    });

    socket.on('move', ({ direction }) => {
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
                let falling = currentPlayer.currentPiece;
                while (canPlace(grid, falling, 0, 1)) {
                    falling = movePiece(falling, 0, 1);
                }
                currentPlayer.currentPiece = falling;
                handleGameTick(currentRoom);
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
                        handleSoftDropTick(currentPlayer);
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
                nextPiece: serializePiece(makePieceFromTetromino(currentPlayer.nextPiece))
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

    socket.on('leaveRoom', () => {
        if (!currentRoom || !currentPlayer) return;
        console.log(`Player ${currentPlayer.name} leaving room ${currentRoom.name}`);
        const shouldDeleteRoom = currentRoom.removePlayer(socket.id);
        if (shouldDeleteRoom) {
            rooms.delete(currentRoom.name);
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
                rooms.delete(currentRoom.name);
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
