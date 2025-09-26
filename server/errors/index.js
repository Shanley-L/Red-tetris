// Custom Error subclasses for the Tetris game
// Using 'this' is explicitly allowed for Error subclasses per requirements

class GameError extends Error {
    constructor(message, code = 'GAME_ERROR') {
        super(message);
        this.name = 'GameError';
        this.code = code;
    }
}

class RoomError extends GameError {
    constructor(message, code = 'ROOM_ERROR') {
        super(message, code);
        this.name = 'RoomError';
    }
}

class PlayerError extends GameError {
    constructor(message, code = 'PLAYER_ERROR') {
        super(message, code);
        this.name = 'PlayerError';
    }
}

class ValidationError extends GameError {
    constructor(message, code = 'VALIDATION_ERROR') {
        super(message, code);
        this.name = 'ValidationError';
    }
}

class NetworkError extends GameError {
    constructor(message, code = 'NETWORK_ERROR') {
        super(message, code);
        this.name = 'NetworkError';
    }
}

module.exports = {
    GameError,
    RoomError,
    PlayerError,
    ValidationError,
    NetworkError
};
