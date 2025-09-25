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
    }
}

module.exports = Player;
