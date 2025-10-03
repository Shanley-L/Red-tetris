const Room = require('../../server/classes/Room');

describe('Room Reconnection After Game End', () => {
    let room;

    beforeEach(() => {
        room = new Room('testRoom');
    });

    test('should allow new players to join after game ends', () => {
        // Add two players and start a game
        const player1 = room.addPlayer('socket1', 'Player1');
        const player2 = room.addPlayer('socket2', 'Player2');
        
        expect(room.canJoin()).toBe(false); // Room is full
        
        room.startGame();
        expect(room.gameStarted).toBe(true);
        expect(room.canJoin()).toBe(false); // Game is running
        
        // End the game
        room.stopGame();
        expect(room.gameStarted).toBe(false);
        
        // Room should still be full but game has ended
        expect(room.players.size).toBe(2);
        expect(room.canJoin()).toBe(false); // Still full with 2 players
        
        // Remove one player (simulating disconnect)
        room.removePlayer('socket1');
        expect(room.players.size).toBe(1);
        expect(room.canJoin()).toBe(true); // Now has space and game is not running
        
        // Should be able to add a new player
        const player3 = room.addPlayer('socket3', 'Player3');
        expect(player3).toBeDefined();
        expect(room.players.size).toBe(2);
    });

    test('should reset game state when game stops', () => {
        // Add players and start game
        const player1 = room.addPlayer('socket1', 'Player1');
        const player2 = room.addPlayer('socket2', 'Player2');
        
        room.startGame();
        
        // Simulate some game state
        player1.currentPiece = { type: 'I', x: 0, y: 0 };
        player1.nextPiece = { type: 'O', x: 0, y: 0 };
        player1.isSoftDropping = true;
        player1.board.grid[19][0] = 'red'; // Add some blocks
        
        // Stop the game
        room.stopGame();
        
        // Check that game state was reset
        expect(player1.currentPiece).toBeNull();
        expect(player1.nextPiece).toBeNull();
        expect(player1.isSoftDropping).toBe(false);
        expect(player1.board.grid[19][0]).toBe(0); // Board should be cleared
        expect(room.pieceSequence).toEqual([]);
        expect(room.currentPieceIndex).toBe(0);
    });

    test('should allow starting a new game after previous game ended', () => {
        // Add players and start first game
        room.addPlayer('socket1', 'Player1');
        room.addPlayer('socket2', 'Player2');
        
        room.startGame();
        expect(room.gameStarted).toBe(true);
        
        // End the game
        room.stopGame();
        expect(room.gameStarted).toBe(false);
        
        // Should be able to start a new game
        expect(() => {
            room.startGame();
        }).not.toThrow();
        
        expect(room.gameStarted).toBe(true);
    });

    test('should handle empty room after all players disconnect', () => {
        // Add players and start game
        room.addPlayer('socket1', 'Player1');
        room.addPlayer('socket2', 'Player2');
        
        room.startGame();
        expect(room.gameStarted).toBe(true);
        
        // End the game
        room.stopGame();
        expect(room.gameStarted).toBe(false);
        
        // Remove all players
        const shouldDelete1 = room.removePlayer('socket1');
        expect(shouldDelete1).toBe(false); // Still has one player
        
        const shouldDelete2 = room.removePlayer('socket2');
        expect(shouldDelete2).toBe(true); // Room is now empty and should be deleted
        
        expect(room.players.size).toBe(0);
        expect(room.host).toBeNull();
    });
});
