class Player {
    constructor(socketId) {
        this.socketId = socketId;
        this.name = 'Player';
        this.board = null;
        this.currentPiece = null;
        this.gameLoop = null;
    }
}

module.exports = Player;
