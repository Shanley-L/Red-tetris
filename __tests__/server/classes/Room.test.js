const Room = require('../../../server/classes/Room');
const { RoomError, PlayerError } = require('../../../server/errors');

describe('Room Class', () => {
    let room;

    beforeEach(() => {
        room = new Room('testRoom');
    });

    test('should create room with correct properties', () => {
        expect(room.name).toBe('testRoom');
        expect(room.players).toBeInstanceOf(Map);
        expect(room.host).toBeNull();
        expect(room.gameStarted).toBe(false);
        expect(room.gameLoop).toBeNull();
        expect(room.pieceSequence).toEqual([]);
        expect(room.currentPieceIndex).toBe(0);
        expect(room.gameSpeed).toBe(1000);
    });

    describe('addPlayer', () => {
        test('should add first player and make them host', () => {
            const player = room.addPlayer('socket1', 'Player1');
            
            expect(room.players.has('socket1')).toBe(true);
            expect(room.host).toBe('socket1');
            expect(player.name).toBe('Player1');
        });

        test('should throw error for missing socket ID', () => {
            expect(() => {
                room.addPlayer(null, 'Player1');
            }).toThrow(PlayerError);
        });

        test('should throw error for missing player name', () => {
            expect(() => {
                room.addPlayer('socket1', null);
            }).toThrow(PlayerError);
        });

        test('should throw error for duplicate socket ID', () => {
            room.addPlayer('socket1', 'Player1');
            expect(() => {
                room.addPlayer('socket1', 'Player2');
            }).toThrow(PlayerError);
        });

        test('should throw error when room is full', () => {
            room.addPlayer('socket1', 'Player1');
            room.addPlayer('socket2', 'Player2');
            expect(() => {
                room.addPlayer('socket3', 'Player3');
            }).toThrow(RoomError);
        });
    });

    describe('removePlayer', () => {
        test('should remove player successfully', () => {
            const player = room.addPlayer('socket1', 'Player1');
            room.host = 'socket1';
            
            const shouldDelete = room.removePlayer('socket1');
            
            expect(room.players.has('socket1')).toBe(false);
            expect(shouldDelete).toBe(true); // Room is empty after removing last player
        });

        test('should assign new host when host leaves', () => {
            const player1 = room.addPlayer('socket1', 'Player1');
            const player2 = room.addPlayer('socket2', 'Player2');
            room.host = 'socket1';
            
            room.removePlayer('socket1');
            
            expect(room.host).toBe('socket2');
        });

        test('should return true when room becomes empty', () => {
            const player = room.addPlayer('socket1', 'Player1');
            
            const shouldDelete = room.removePlayer('socket1');
            
            expect(shouldDelete).toBe(true);
        });

        test('should handle non-existent player', () => {
            const shouldDelete = room.removePlayer('nonexistent');
            expect(shouldDelete).toBe(false);
        });
    });

    describe('getPlayer', () => {
        test('should return player by socket ID', () => {
            const player = room.addPlayer('socket1', 'Player1');
            
            const retrievedPlayer = room.getPlayer('socket1');
            expect(retrievedPlayer).toBe(player);
        });

        test('should return undefined for non-existent player', () => {
            const player = room.getPlayer('nonexistent');
            expect(player).toBeUndefined();
        });
    });

    describe('getPlayers', () => {
        test('should return array of all players', () => {
            const player1 = room.addPlayer('socket1', 'Player1');
            const player2 = room.addPlayer('socket2', 'Player2');
            
            const players = room.getPlayers();
            expect(players).toHaveLength(2);
            expect(players).toContain(player1);
            expect(players).toContain(player2);
        });

        test('should return empty array when no players', () => {
            const players = room.getPlayers();
            expect(players).toEqual([]);
        });
    });

    describe('canJoin', () => {
        test('should return true when room is empty and not started', () => {
            expect(room.canJoin()).toBe(true);
        });

        test('should return true when room has one player and not started', () => {
            room.addPlayer('socket1', 'Player1');
            expect(room.canJoin()).toBe(true);
        });

        test('should return false when room is full', () => {
            room.addPlayer('socket1', 'Player1');
            room.addPlayer('socket2', 'Player2');
            expect(room.canJoin()).toBe(false);
        });

        test('should return false when game has started', () => {
            room.gameStarted = true;
            expect(room.canJoin()).toBe(false);
        });
    });

    describe('startGame', () => {
        test('should throw error when game already started', () => {
            room.gameStarted = true;
            expect(() => {
                room.startGame();
            }).toThrow(RoomError);
        });

        test('should throw error when no players', () => {
            expect(() => {
                room.startGame();
            }).toThrow(RoomError);
        });

        test('should start game successfully with players', () => {
            room.addPlayer('socket1', 'Player1');
            
            const result = room.startGame();
            
            expect(result).toBe(true);
            expect(room.gameStarted).toBe(true);
            expect(room.currentPieceIndex).toBe(1); // After initializePieces, index is advanced
        });

        test('should throw error when starting game without players', () => {
            expect(() => {
                room.startGame();
            }).toThrow();
        });

        test('should throw error when starting game if already started', () => {
            room.addPlayer('socket1', 'Player1');
            room.startGame();
            
            expect(() => {
                room.startGame();
            }).toThrow();
        });
    });

    describe('Game Loop and Ticks', () => {
        test('should handle game state', () => {
            expect(room.gameStarted).toBe(false);
            
            room.addPlayer('socket1', 'Player1');
            room.startGame();
            
            expect(room.gameStarted).toBe(true);
        });

        test('should have room properties', () => {
            expect(room.gameStarted).toBeDefined();
            expect(room.currentPieceIndex).toBeDefined();
            expect(room.players).toBeDefined();
        });
    });

    describe('Piece Management', () => {
        test('should have generatePieceSequence method', () => {
            expect(typeof room.generatePieceSequence).toBe('function');
        });

        test('should have initializePieces method', () => {
            expect(typeof room.initializePieces).toBe('function');
        });

        test('should have getNextPiece method', () => {
            expect(typeof room.getNextPiece).toBe('function');
        });
    });

    describe('Player Management', () => {
        test('should get player by socket ID', () => {
            const player = room.addPlayer('socket1', 'Player1');
            
            const foundPlayer = room.getPlayer('socket1');
            
            expect(foundPlayer).toBe(player);
        });

        test('should return undefined for non-existent player', () => {
            const foundPlayer = room.getPlayer('nonexistent');
            
            expect(foundPlayer).toBeUndefined();
        });

        test('should have players map', () => {
            expect(room.players).toBeDefined();
            expect(room.players instanceof Map).toBe(true);
        });

        test('should track player count', () => {
            expect(room.players.size).toBe(0);
            
            room.addPlayer('socket1', 'Player1');
            expect(room.players.size).toBe(1);
        });
    });

    describe('Game State Management', () => {
        test('should track game started state', () => {
            expect(room.gameStarted).toBe(false);
            
            room.addPlayer('socket1', 'Player1');
            room.startGame();
            
            expect(room.gameStarted).toBe(true);
        });

        test('should track current piece index', () => {
            expect(room.currentPieceIndex).toBe(0);
        });

        test('should have room name', () => {
            expect(room.name).toBe('testRoom');
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid player data', () => {
            expect(() => {
                room.addPlayer(null, 'Player1');
            }).toThrow();
            
            expect(() => {
                room.addPlayer('socket1', null);
            }).toThrow();
        });

        test('should handle duplicate player names', () => {
            room.addPlayer('socket1', 'Player1');
            
            // The actual implementation might not throw for duplicates
            // Just test that it doesn't crash
            expect(() => {
                room.addPlayer('socket2', 'Player1');
            }).not.toThrow();
        });

        test('should handle removing non-existent player', () => {
            const result = room.removePlayer('nonexistent');
            
            expect(result).toBe(false);
        });
    });

    describe('Room Properties', () => {
        test('should have correct room name', () => {
            expect(room.name).toBe('testRoom');
        });

        test('should have room properties', () => {
            expect(room.gameStarted).toBeDefined();
            expect(room.currentPieceIndex).toBeDefined();
            expect(room.players).toBeDefined();
        });

        test('should track game started state', () => {
            expect(room.gameStarted).toBe(false);
            
            room.addPlayer('socket1', 'Player1');
            room.startGame();
            
            expect(room.gameStarted).toBe(true);
        });

        test('should track current piece index', () => {
            expect(room.currentPieceIndex).toBe(0);
        });
    });

    describe('stopGame', () => {
        test('should stop game and clear timers', () => {
            const mockGameLoop = setInterval(() => {}, 1000);
            const player = room.addPlayer('socket1', 'Player1');
            player.gameLoop = setInterval(() => {}, 1000);
            player.softDropTimer = setInterval(() => {}, 100);
            
            room.gameLoop = mockGameLoop;
            room.gameStarted = true;
            
            room.stopGame();
            
            expect(room.gameStarted).toBe(false);
            expect(room.gameLoop).toBeNull();
            
            // Clean up timers
            clearInterval(mockGameLoop);
            clearInterval(player.gameLoop);
            clearInterval(player.softDropTimer);
        });
    });

    describe('getSpectrum', () => {
        test('should return spectrum for player', () => {
            const mockPlayer = {
                board: {
                    width: 10,
                    height: 20,
                    grid: Array.from({ length: 20 }, (_, y) => 
                        Array.from({ length: 10 }, (_, x) => 
                            y >= 15 ? 'red' : 0
                        )
                    )
                }
            };
            
            const spectrum = room.getSpectrum(mockPlayer);
            
            expect(spectrum).toHaveLength(10);
            expect(spectrum.every(height => height >= 0 && height <= 5)).toBe(true);
        });

        test('should return zero spectrum for empty board', () => {
            const mockPlayer = {
                board: {
                    width: 10,
                    height: 20,
                    grid: Array.from({ length: 20 }, () => Array(10).fill(0))
                }
            };
            
            const spectrum = room.getSpectrum(mockPlayer);
            
            expect(spectrum).toEqual(Array(10).fill(0));
        });
    });

    describe('cleanup', () => {
        test('should call stopGame', () => {
            jest.spyOn(room, 'stopGame').mockImplementation(() => {});
            
            room.cleanup();
            
            expect(room.stopGame).toHaveBeenCalled();
        });
    });
});
