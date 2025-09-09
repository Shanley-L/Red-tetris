const { PIECE_TYPES } = require('./Tetromino');

class Game {
    constructor(name) {
        this.name = name;
        this.players = new Map();
        this.status = 'waiting';
        this.pieceSequence = [];
        this.generatePieceSequence();
    }

    generatePieceSequence() {
        for (let i = 0; i < 1000; i++) { // Generate 1000 pieces for the game
            const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
            this.pieceSequence.push(type);
        }
    }

    getNextPieceForPlayer(playerName) {
        // For now, each player has their own piece index. We could also use a global index.
        const player = Array.from(this.players.values()).find(p => p.name === playerName);
        if (!player) return null;

        if (player.pieceIndex === undefined) {
            player.pieceIndex = 0;
        }

        const pieceType = this.pieceSequence[player.pieceIndex];
        player.pieceIndex++;
        return pieceType;
    }

    addPlayer(player) {
        this.players.set(player.socketId, player);
        console.log(`Player ${player.name} added to game ${this.name}`);
    }

    removePlayer(socketId) {
        this.players.delete(socketId);
        console.log(`Player ${socketId} removed from game ${this.name}`);
    }
}

module.exports = Game;
