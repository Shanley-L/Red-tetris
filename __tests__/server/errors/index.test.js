const {
    GameError,
    RoomError,
    PlayerError,
    ValidationError,
    NetworkError
} = require('../../../server/errors');

describe('Custom Error Classes', () => {
    describe('GameError', () => {
        test('should create GameError with default code', () => {
            const error = new GameError('Test message');
            
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(GameError);
            expect(error.message).toBe('Test message');
            expect(error.name).toBe('GameError');
            expect(error.code).toBe('GAME_ERROR');
        });

        test('should create GameError with custom code', () => {
            const error = new GameError('Test message', 'CUSTOM_CODE');
            
            expect(error.message).toBe('Test message');
            expect(error.code).toBe('CUSTOM_CODE');
        });

        test('should be throwable and catchable', () => {
            expect(() => {
                throw new GameError('Test error');
            }).toThrow(GameError);
            
            expect(() => {
                throw new GameError('Test error');
            }).toThrow('Test error');
        });
    });

    describe('RoomError', () => {
        test('should create RoomError with default code', () => {
            const error = new RoomError('Room test message');
            
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(GameError);
            expect(error).toBeInstanceOf(RoomError);
            expect(error.message).toBe('Room test message');
            expect(error.name).toBe('RoomError');
            expect(error.code).toBe('ROOM_ERROR');
        });

        test('should create RoomError with custom code', () => {
            const error = new RoomError('Room test message', 'ROOM_FULL');
            
            expect(error.message).toBe('Room test message');
            expect(error.code).toBe('ROOM_FULL');
        });

        test('should be throwable and catchable', () => {
            expect(() => {
                throw new RoomError('Room error');
            }).toThrow(RoomError);
        });
    });

    describe('PlayerError', () => {
        test('should create PlayerError with default code', () => {
            const error = new PlayerError('Player test message');
            
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(GameError);
            expect(error).toBeInstanceOf(PlayerError);
            expect(error.message).toBe('Player test message');
            expect(error.name).toBe('PlayerError');
            expect(error.code).toBe('PLAYER_ERROR');
        });

        test('should create PlayerError with custom code', () => {
            const error = new PlayerError('Player test message', 'PLAYER_NOT_FOUND');
            
            expect(error.message).toBe('Player test message');
            expect(error.code).toBe('PLAYER_NOT_FOUND');
        });

        test('should be throwable and catchable', () => {
            expect(() => {
                throw new PlayerError('Player error');
            }).toThrow(PlayerError);
        });
    });

    describe('ValidationError', () => {
        test('should create ValidationError with default code', () => {
            const error = new ValidationError('Validation test message');
            
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(GameError);
            expect(error).toBeInstanceOf(ValidationError);
            expect(error.message).toBe('Validation test message');
            expect(error.name).toBe('ValidationError');
            expect(error.code).toBe('VALIDATION_ERROR');
        });

        test('should create ValidationError with custom code', () => {
            const error = new ValidationError('Validation test message', 'INVALID_INPUT');
            
            expect(error.message).toBe('Validation test message');
            expect(error.code).toBe('INVALID_INPUT');
        });

        test('should be throwable and catchable', () => {
            expect(() => {
                throw new ValidationError('Validation error');
            }).toThrow(ValidationError);
        });
    });

    describe('NetworkError', () => {
        test('should create NetworkError with default code', () => {
            const error = new NetworkError('Network test message');
            
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(GameError);
            expect(error).toBeInstanceOf(NetworkError);
            expect(error.message).toBe('Network test message');
            expect(error.name).toBe('NetworkError');
            expect(error.code).toBe('NETWORK_ERROR');
        });

        test('should create NetworkError with custom code', () => {
            const error = new NetworkError('Network test message', 'CONNECTION_LOST');
            
            expect(error.message).toBe('Network test message');
            expect(error.code).toBe('CONNECTION_LOST');
        });

        test('should be throwable and catchable', () => {
            expect(() => {
                throw new NetworkError('Network error');
            }).toThrow(NetworkError);
        });
    });

    describe('Error Inheritance', () => {
        test('all custom errors should inherit from GameError', () => {
            const roomError = new RoomError('test');
            const playerError = new PlayerError('test');
            const validationError = new ValidationError('test');
            const networkError = new NetworkError('test');
            
            expect(roomError).toBeInstanceOf(GameError);
            expect(playerError).toBeInstanceOf(GameError);
            expect(validationError).toBeInstanceOf(GameError);
            expect(networkError).toBeInstanceOf(GameError);
        });

        test('all custom errors should inherit from Error', () => {
            const gameError = new GameError('test');
            const roomError = new RoomError('test');
            const playerError = new PlayerError('test');
            const validationError = new ValidationError('test');
            const networkError = new NetworkError('test');
            
            expect(gameError).toBeInstanceOf(Error);
            expect(roomError).toBeInstanceOf(Error);
            expect(playerError).toBeInstanceOf(Error);
            expect(validationError).toBeInstanceOf(Error);
            expect(networkError).toBeInstanceOf(Error);
        });
    });

    describe('Error Stack Traces', () => {
        test('should have proper stack traces', () => {
            const error = new GameError('Test error');
            
            expect(error.stack).toBeDefined();
            expect(typeof error.stack).toBe('string');
            expect(error.stack.length).toBeGreaterThan(0);
        });

        test('should include error message in stack trace', () => {
            const error = new GameError('Test error message');
            
            expect(error.stack).toContain('Test error message');
            expect(error.stack).toContain('GameError');
        });
    });
});
