const Player = require('./Player');
const Board = require('./Board');
const { Tetromino } = require('./Tetromino');
const { RoomError, PlayerError } = require('../errors');

class Room {
    constructor(roomName) {
        this.name = roomName;
        this.players = new Map(); // socketId -> Player
        this.host = null;
        this.gameStarted = false;
        this.gameLoop = null;
        this.pieceSequence = []; // Shared piece sequence for all players
        this.currentPieceIndex = 0;
        this.gameSpeed = 1000; // ms between drops
        this.speedMode = false; // bonus: accelerate over time
        this.dropsSinceSpeedUp = 0; // count locked pieces
    }

    addPlayer(socketId, playerName) {
        if (!socketId || !playerName) {
            throw new PlayerError('Socket ID and player name are required');
        }
        
        if (this.players.has(socketId)) {
            throw new PlayerError('Player with this socket ID already exists');
        }
        
        if (this.players.size >= 2) {
            throw new RoomError('Room is full (maximum 2 players)');
        }
        
        const player = new Player(socketId);
        player.name = playerName;
        player.board = new Board();
        player.room = this;
        
        this.players.set(socketId, player);
        
        // First player becomes host
        if (!this.host) {
            this.host = socketId;
        }
        
        return player;
    }

    removePlayer(socketId) {
        const player = this.players.get(socketId);
        if (player) {
            // Clear player's timers
            if (player.gameLoop) clearInterval(player.gameLoop);
            if (player.softDropTimer) clearInterval(player.softDropTimer);
            
            this.players.delete(socketId);
            
            // If host left, assign new host
            if (this.host === socketId && this.players.size > 0) {
                this.host = this.players.keys().next().value;
            }
            
            // If no players left, room should be cleaned up
            if (this.players.size === 0) {
            this.host = null;
                this.cleanup();
                return true; // Room should be deleted
            }
        }
        return false;
    }

    getPlayer(socketId) {
        return this.players.get(socketId);
    }

    getPlayers() {
        return Array.from(this.players.values());
    }

    canJoin() {
        return !this.gameStarted && this.players.size < 2;
    }

    startGame() {
        if (this.gameStarted) {
            throw new RoomError('Game has already started');
        }
        
        if (this.players.size === 0) {
            throw new RoomError('Cannot start game with no players');
        }
        
        this.gameStarted = true;
        
        // Generate piece sequence and reset index to ensure all players start from the same point
        this.generatePieceSequence();
        this.currentPieceIndex = 0; // Reset to beginning of sequence
        
        console.log(`Starting game in room ${this.name} with ${this.players.size} players`);
        console.log(`Piece sequence index reset to: ${this.currentPieceIndex}`);
        
        // Give all players the same starting pieces
        this.initializePieces();
        return true;
    }

    stopGame() {
        this.gameStarted = false;
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        
        // Reset players state and clear timers
        this.players.forEach(player => {
            if (player.gameLoop) clearInterval(player.gameLoop);
            if (player.softDropTimer) clearInterval(player.softDropTimer);
            player.isSoftDropping = false;
            player.currentPiece = null;
            player.nextPiece = null;
            // Reset board to empty
            if (player.board) {
                player.board = new Board();
            } else {
                player.board = new Board();
            }
            // Reset per-player sequence tracking
            player.pieceSequence = [];
            player.sequenceIndex = 0;
            player.score = 0;
        });

        // Reset room sequence tracking
        this.pieceSequence = [];
        this.currentPieceIndex = 0;
        this.dropsSinceSpeedUp = 0;
    }

    generatePieceSequence() {
        // Generate a sequence of pieces that all players will receive
        this.pieceSequence = [];
        
        // Use a consistent seed for this game (based on room name and current time)
        const gameSeed = this.name.charCodeAt(0) + Date.now();
        this.setRandomSeed(gameSeed);
        
        // Generate 50 pieces at a time
        for (let i = 0; i < 50; i++) {
            // Use alternate shapes when in newbrick bonus mode
            const modeKey = this.roomMode === 'bonus-newbrick' ? 'bonus-newbrick' : 'classic';
            this.pieceSequence.push(new Tetromino(null, () => this.seededRandom(), modeKey));
        }
        this.currentPieceIndex = 0;
        
    }

    extendSequencesIfNeeded(chunkSize = 50, minRemaining = 2) {
        const players = this.getPlayers();
        if (players.length === 0) return;
        let needsExtend = false;
        for (const p of players) {
            const remaining = (p.pieceSequence?.length || 0) - (p.sequenceIndex || 0);
            if (remaining <= minRemaining) {
                needsExtend = true;
                break;
            }
        }
        if (!needsExtend) return;

        const modeKey = this.roomMode === 'bonus-newbrick' ? 'bonus-newbrick' : 'classic';
        const sharedChunk = [];
        for (let i = 0; i < chunkSize; i++) {
            sharedChunk.push(new Tetromino(null, () => this.seededRandom(), modeKey));
        }
        players.forEach(p => {
            if (!Array.isArray(p.pieceSequence)) p.pieceSequence = [];
            p.pieceSequence = p.pieceSequence.concat(sharedChunk);
        });
    }

    setRandomSeed(seed) {
        this.randomSeed = seed;
    }

    seededRandom() {
        this.randomSeed = (this.randomSeed * 1664525 + 1013904223) % Math.pow(2, 32);
        return this.randomSeed / Math.pow(2, 32);
    }

    getNextPiece() {
        if (this.currentPieceIndex >= this.pieceSequence.length) {
            this.generatePieceSequence();
        }
        const piece = this.pieceSequence[this.currentPieceIndex++];
        return piece;
    }

    initializePieces() {
        
        // Give each player their own copy of the sequence
        this.players.forEach(player => {
            player.pieceSequence = [...this.pieceSequence];
            player.sequenceIndex = 0;
            
            const currentPiece = player.pieceSequence[player.sequenceIndex];
            const nextPiece = player.pieceSequence[player.sequenceIndex + 1];
            
            
            if (!currentPiece || !nextPiece) {
                return;
            }
            
            player.currentPiece = this.makePieceFromTetromino(currentPiece);
            player.nextPiece = nextPiece;
            
            player.sequenceIndex += 1;
            
            player.dropIntervalMs = this.gameSpeed;
            player.lastDropTime = Date.now();
            player.dropsSinceSpeedUp = 0;
            player.score = 0;
            
            // Send board update to this player
            if (player.socket) {
                const boardWithPiece = this.renderWithPiece(player.board.grid, player.currentPiece);
                const nextPieceSerialized = this.serializePiece(this.makePieceFromTetromino(player.nextPiece));
                
                console.log(`Initializing ${player.name}: current=${player.currentPiece.type}, next=${player.nextPiece.type}`);
                console.log(`Serialized next piece:`, nextPieceSerialized);
                
                player.socket.emit('updateBoard', {
                    board: boardWithPiece,
                    nextPiece: nextPieceSerialized
                });
            }
        });
    }

    makePieceFromTetromino(t) {
        if (this.roomMode === 'bonus-reverse') {
            return { type: t.type, shape: t.shape, color: t.color, x: 3, y: 18, r: 0 };
        } else {
            return { type: t.type, shape: t.shape, color: t.color, x: 3, y: 0, r: 0 };
        }
    }

    serializePiece(piece) {
        return { shape: piece.shape, color: piece.color };
    }

    renderWithPiece(grid, piece) {
        const merged = grid.map(row => row.slice());
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x] !== 0) {
                    const gx = piece.x + x;
                    const gy = piece.y + y;
                    if (gy >= 0 && gy < merged.length && gx >= 0 && gx < merged[0].length) {
                        merged[gy][gx] = piece.color || piece.shape[y][x];
                    }
                }
            }
        }
        return merged;
    }

    cleanup() {
        this.stopGame();
    }

    getSpectrum(player) {
        const spectrum = [];
        for (let x = 0; x < player.board.width; x++) {
            let height = 0;
            for (let y = 0; y < player.board.height; y++) {
                if (player.board.grid[y][x] !== 0) {
                    height = player.board.height - y;
                    break;
                }
            }
            spectrum.push(height);
        }
        return spectrum;
    }
}

module.exports = Room;
