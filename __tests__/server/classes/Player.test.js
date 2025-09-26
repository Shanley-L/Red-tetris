const Player = require('../../../server/classes/Player');

describe('Player Class', () => {
    let player;

    beforeEach(() => {
        player = new Player('test-socket-id');
    });

    test('should create player with socket ID', () => {
        expect(player.socketId).toBe('test-socket-id');
    });

    test('should initialize with default values', () => {
        expect(player.name).toBe('Player');
        expect(player.board).toBeNull();
        expect(player.currentPiece).toBeNull();
        expect(player.gameLoop).toBeNull();
        expect(player.isSoftDropping).toBe(false);
        expect(player.softDropTimer).toBeNull();
        expect(player.needsNewPiece).toBe(false);
        expect(player.pieceSequence).toEqual([]);
        expect(player.sequenceIndex).toBe(0);
    });

    test('should allow setting properties', () => {
        player.name = 'TestPlayer';
        player.isSoftDropping = true;
        player.sequenceIndex = 5;
        
        expect(player.name).toBe('TestPlayer');
        expect(player.isSoftDropping).toBe(true);
        expect(player.sequenceIndex).toBe(5);
    });

    test('should handle piece sequence operations', () => {
        const mockSequence = [
            { type: 'I', shape: [[1,1,1,1]], color: 'cyan' },
            { type: 'O', shape: [[1,1],[1,1]], color: 'yellow' }
        ];
        
        player.pieceSequence = mockSequence;
        player.sequenceIndex = 1;
        
        expect(player.pieceSequence).toEqual(mockSequence);
        expect(player.sequenceIndex).toBe(1);
    });

    test('should handle timer properties', () => {
        const mockTimer = setInterval(() => {}, 1000);
        
        player.gameLoop = mockTimer;
        player.softDropTimer = mockTimer;
        
        expect(player.gameLoop).toBe(mockTimer);
        expect(player.softDropTimer).toBe(mockTimer);
        
        // Clean up
        clearInterval(mockTimer);
    });
});
