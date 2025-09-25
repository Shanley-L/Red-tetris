const Player = require('./Player');
const Board = require('./Board');
const { Tetromino } = require('./Tetromino');

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
    }

    addPlayer(socketId, playerName) {
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
        if (this.gameStarted || this.players.size === 0) return false;
        
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
        
        // Clear all player timers
        this.players.forEach(player => {
            if (player.gameLoop) clearInterval(player.gameLoop);
            if (player.softDropTimer) clearInterval(player.softDropTimer);
        });
    }

    generatePieceSequence() {
        // Generate a sequence of pieces that all players will receive
        this.pieceSequence = [];
        
        // Use a consistent seed for this game (based on room name and current time)
        const gameSeed = this.name.charCodeAt(0) + Date.now();
        this.setRandomSeed(gameSeed);
        
        for (let i = 0; i < 1000; i++) { // Generate enough pieces for a game
            this.pieceSequence.push(new Tetromino(null, () => this.seededRandom()));
        }
        this.currentPieceIndex = 0;
        
        console.log(`Generated piece sequence for room ${this.name} with seed ${gameSeed}`);
        console.log(`First 20 pieces: ${this.pieceSequence.slice(0, 20).map(p => p.type).join(', ')}`);
        console.log(`Sequence length: ${this.pieceSequence.length}`);
    }

    setRandomSeed(seed) {
        // Simple linear congruential generator for consistent randomness
        this.randomSeed = seed;
    }

    seededRandom() {
        // Linear congruential generator
        this.randomSeed = (this.randomSeed * 1664525 + 1013904223) % Math.pow(2, 32);
        return this.randomSeed / Math.pow(2, 32);
    }

    getNextPiece() {
        if (this.currentPieceIndex >= this.pieceSequence.length) {
            // Regenerate if we run out
            this.generatePieceSequence();
        }
        const piece = this.pieceSequence[this.currentPieceIndex++];
        console.log(`Room ${this.name}: Giving piece ${piece.type} at index ${this.currentPieceIndex - 1}`);
        return piece;
    }

    initializePieces() {
        console.log(`\n=== INITIALIZING PIECES ===`);
        console.log(`Initializing pieces for ${this.players.size} players`);
        console.log(`Current sequence index: ${this.currentPieceIndex}`);
        console.log(`Players: ${Array.from(this.players.values()).map(p => p.name).join(', ')}`);
        
        // Give all players the SAME pieces from the SAME sequence positions
        const currentPiece = this.pieceSequence[this.currentPieceIndex];
        const nextPiece = this.pieceSequence[this.currentPieceIndex + 1];
        
        console.log(`Giving all players: current=${currentPiece.type}, next=${nextPiece.type}`);
        console.log(`Piece at index ${this.currentPieceIndex}: ${currentPiece.type}`);
        console.log(`Piece at index ${this.currentPieceIndex + 1}: ${nextPiece.type}`);
        
        this.players.forEach(player => {
            player.currentPiece = this.makePieceFromTetromino(currentPiece);
            player.nextPiece = nextPiece;
            
            console.log(`Player ${player.name} got pieces: current=${currentPiece.type}, next=${nextPiece.type}`);
            
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
        
        // Advance sequence index by 2 (current + next piece)
        this.currentPieceIndex += 2;
        console.log(`Sequence index advanced to: ${this.currentPieceIndex}`);
        console.log(`=== END INITIALIZATION ===\n`);
    }

    makePieceFromTetromino(t) {
        return { type: t.type, shape: t.shape, color: t.color, x: 3, y: 0, r: 0 };
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
        // Room will be removed from the rooms map by the server
    }

    getSpectrum(player) {
        // Return spectrum (column heights) for other players
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
