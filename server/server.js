
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");

const Player = require('./classes/Player');
const Board = require('./classes/Board');
const Room = require('./classes/Room');
const { Tetromino } = require('./classes/Tetromino');
const {
    canPlace,
    rotatePieceWithKicks,
    movePiece,
    lockPiece,
    clearLines,
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

function handleGameTick(room) {
    if (!room.gameStarted) return;
    
    // Check if we need to give new pieces to ALL players
    const allPlayersNeedPieces = room.getPlayers().every(player => player.needsNewPiece);
    
    if (allPlayersNeedPieces) {
        console.log(`\n=== SYNCHRONIZED PIECE DISTRIBUTION ===`);
        console.log(`All players need pieces - giving synchronized pieces`);
        console.log(`Sequence index before giving pieces: ${room.currentPieceIndex}`);
        
        // Give ALL players the SAME pieces from the SAME sequence positions
        const currentPiece = room.pieceSequence[room.currentPieceIndex];
        const nextPiece = room.pieceSequence[room.currentPieceIndex + 1];
        
        console.log(`Giving all players: current=${currentPiece.type}, next=${nextPiece.type}`);
        console.log(`Piece at index ${room.currentPieceIndex}: ${currentPiece.type}`);
        console.log(`Piece at index ${room.currentPieceIndex + 1}: ${nextPiece.type}`);
        
        room.getPlayers().forEach(player => {
            player.currentPiece = makePieceFromTetromino(currentPiece);
            player.nextPiece = nextPiece;
            player.needsNewPiece = false;
            
            console.log(`Player ${player.name} got new piece: current=${currentPiece.type}, next=${nextPiece.type}`);
            
            // Check for game over after assigning new piece
            if (!canPlace(player.board.grid, player.currentPiece, 0, 0)) {
                console.log("Game Over for", player.socketId);
                player.socket.emit('gameOver');
                // Remove player from room
                room.removePlayer(player.socketId);
                return;
            }
        });
        
        // Advance sequence index by 2 (current + next piece) ONCE for all players
        room.currentPieceIndex += 2;
        console.log(`Sequence index advanced to: ${room.currentPieceIndex}`);
        console.log(`=== END SYNCHRONIZED DISTRIBUTION ===\n`);
    } else {
        // Move pieces down and mark who needs new pieces
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
                
                // Mark this player as needing a new piece
                player.needsNewPiece = true;
            }
        });
    }
    
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
        console.log(`Player ${playerName} trying to join room ${roomName}`);
        
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
            socket.emit('joinError', { message: 'Room is full or game has started' });
            return;
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
        if (!currentRoom || !currentPlayer || !currentRoom.gameStarted) return;
        
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
