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
    }
}

module.exports = Player;
