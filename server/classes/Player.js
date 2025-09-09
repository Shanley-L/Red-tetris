class Player {
    constructor(socketId) {
        this.socketId = socketId;
        this.name = 'Player';
        this.board = null;
        this.currentPiece = null;
        this.gameLoop = null;
        this.pieceIndex = 0;
    }
}

module.exports = Player;
