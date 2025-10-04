class Player {
    constructor(socketId) {
        this.socketId = socketId;
        this.name = 'Player';
        this.board = null;
        this.currentPiece = null;
        this.gameLoop = null;
        this.isSoftDropping = false;
        this.softDropTimer = null;
        this.needsNewPiece = false;
        this.pieceSequence = []; // Each player has their own copy of the sequence
        this.sequenceIndex = 0; // Each player has their own index
        // Speed mode per-player gravity
        this.dropIntervalMs = 1000;
        this.lastDropTime = Date.now();
        this.dropsSinceSpeedUp = 0;
    }
}

module.exports = Player;
