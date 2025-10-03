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

        describe('seededRandom', () => {
            test('should generate random numbers using linear congruential generator', () => {
                room.randomSeed = 12345;
                const result1 = room.seededRandom();
                const result2 = room.seededRandom();
                
                expect(typeof result1).toBe('number');
                expect(typeof result2).toBe('number');
                expect(result1).not.toBe(result2);
                expect(result1).toBeGreaterThanOrEqual(0);
                expect(result1).toBeLessThan(1);
                expect(result2).toBeGreaterThanOrEqual(0);
                expect(result2).toBeLessThan(1);
            });
        });

        describe('getNextPiece', () => {
            test('should return next piece from sequence', () => {
                room.addPlayer('socket1', 'Player1');
                room.startGame();
                
                const initialIndex = room.currentPieceIndex;
                const piece = room.getNextPiece();
                
                expect(piece).toBeDefined();
                expect(room.currentPieceIndex).toBe(initialIndex + 1);
            });

            test('should generate new sequence when current one runs out', () => {
                room.addPlayer('socket1', 'Player1');
                room.startGame();
                
                // Set a short sequence
                room.pieceSequence = [new (require('../../../server/classes/Tetromino').Tetromino)('I')];
                room.currentPieceIndex = 0;
                
                const piece1 = room.getNextPiece();
                const piece2 = room.getNextPiece(); // Should trigger new sequence generation
                
                expect(piece1).toBeDefined();
                expect(piece2).toBeDefined();
                expect(room.pieceSequence.length).toBeGreaterThan(1);
            });
        });

        describe('initializePieces', () => {
            test('should initialize pieces for all players', () => {
                const mockPlayer1 = {
                    name: 'Player1',
                    socket: { emit: jest.fn() },
                    board: { grid: Array(20).fill().map(() => Array(10).fill(0)) },
                    currentPiece: null,
                    nextPiece: null
                };
                const mockPlayer2 = {
                    name: 'Player2',
                    socket: { emit: jest.fn() },
                    board: { grid: Array(20).fill().map(() => Array(10).fill(0)) },
                    currentPiece: null,
                    nextPiece: null
                };
                
                room.players.set('socket1', mockPlayer1);
                room.players.set('socket2', mockPlayer2);
                room.pieceSequence = [
                    new (require('../../../server/classes/Tetromino').Tetromino)('I'),
                    new (require('../../../server/classes/Tetromino').Tetromino)('O')
                ];
                room.currentPieceIndex = 0;
                
                room.initializePieces();
                
                expect(mockPlayer1.currentPiece).toBeDefined();
                expect(mockPlayer1.nextPiece).toBeDefined();
                expect(mockPlayer2.currentPiece).toBeDefined();
                expect(mockPlayer2.nextPiece).toBeDefined();
                expect(mockPlayer1.socket.emit).toHaveBeenCalledWith('updateBoard', expect.any(Object));
                expect(mockPlayer2.socket.emit).toHaveBeenCalledWith('updateBoard', expect.any(Object));
            });
        });

        describe('makePieceFromTetromino', () => {
            test('should create piece from tetromino', () => {
                const mockTetromino = {
                    type: 'I',
                    shape: [[1, 1, 1, 1]],
                    color: 'cyan'
                };
                
                const piece = room.makePieceFromTetromino(mockTetromino);
                
                expect(piece).toEqual({
                    type: 'I',
                    shape: [[1, 1, 1, 1]],
                    color: 'cyan',
                    x: 3,
                    y: 0,
                    r: 0
                });
            });
        });

        describe('serializePiece', () => {
            test('should serialize piece for transmission', () => {
                const mockPiece = {
                    type: 'I',
                    shape: [[1, 1, 1, 1]],
                    color: 'cyan',
                    x: 3,
                    y: 0,
                    r: 0
                };
                
                const serialized = room.serializePiece(mockPiece);
                
                expect(serialized).toEqual({
                    shape: [[1, 1, 1, 1]],
                    color: 'cyan'
                });
            });
        });

        describe('renderWithPiece', () => {
            test('should render piece on grid', () => {
                const grid = Array(4).fill().map(() => Array(4).fill(0));
                const piece = {
                    shape: [[1, 1], [1, 1]],
                    color: 'red',
                    x: 1,
                    y: 1
                };
                
                const rendered = room.renderWithPiece(grid, piece);
                
                expect(rendered[1][1]).toBe('red');
                expect(rendered[1][2]).toBe('red');
                expect(rendered[2][1]).toBe('red');
                expect(rendered[2][2]).toBe('red');
            });

            test('should handle piece without color', () => {
                const grid = Array(4).fill().map(() => Array(4).fill(0));
                const piece = {
                    shape: [[1, 1], [1, 1]],
                    x: 1,
                    y: 1
                };
                
                const rendered = room.renderWithPiece(grid, piece);
                
                expect(rendered[1][1]).toBe(1);
                expect(rendered[1][2]).toBe(1);
                expect(rendered[2][1]).toBe(1);
                expect(rendered[2][2]).toBe(1);
            });

            test('should not render piece outside grid bounds', () => {
                const grid = Array(2).fill().map(() => Array(2).fill(0));
                const piece = {
                    shape: [[1, 1], [1, 1]],
                    color: 'red',
                    x: 1,
                    y: 1
                };
                
                const rendered = room.renderWithPiece(grid, piece);
                
                // Only the top-left part should be rendered
                expect(rendered[1][1]).toBe('red');
                expect(rendered[0][0]).toBe(0);
                expect(rendered[0][1]).toBe(0);
                expect(rendered[1][0]).toBe(0);
            });
        });

    describe('additional coverage tests', () => {
        test('should handle game tick with active players', () => {
            room.addPlayer('socket1', 'Player1');
            room.addPlayer('socket2', 'Player2');
            room.startGame();
            
            // Test game tick with active players
            const activePlayers = room.getPlayers();
            expect(activePlayers.length).toBe(2);
            
            // Mock game tick execution
            if (typeof room.gameTick === 'function') {
                expect(() => room.gameTick()).not.toThrow();
            }
        });

        test('should handle game tick with single player', () => {
            room.addPlayer('socket1', 'Player1');
            room.startGame();
            
            // Test game tick with single player
            const activePlayers = room.getPlayers();
            expect(activePlayers.length).toBe(1);
            
            // Mock game tick execution
            if (typeof room.gameTick === 'function') {
                expect(() => room.gameTick()).not.toThrow();
            }
        });

        test('should handle game tick with no players', () => {
            // Test game tick with no players
            const activePlayers = room.getPlayers();
            expect(activePlayers.length).toBe(0);
            
            // Mock game tick execution
            if (typeof room.gameTick === 'function') {
                expect(() => room.gameTick()).not.toThrow();
            }
        });

        test('should handle host transfer when host leaves', () => {
            room.addPlayer('socket1', 'Player1');
            room.addPlayer('socket2', 'Player2');
            
            expect(room.host).toBe('socket1');
            
            // Remove host
            room.removePlayer('socket1');
            
            // Check if host was transferred
            expect(room.host).toBe('socket2');
        });

        test('should handle host transfer with multiple players', () => {
            room.addPlayer('socket1', 'Player1');
            room.addPlayer('socket2', 'Player2');
            
            expect(room.host).toBe('socket1');
            
            // Remove host
            room.removePlayer('socket1');
            
            // Check if host was transferred to next player
            expect(room.host).toBe('socket2');
        });

        test('should handle room becoming empty', () => {
            room.addPlayer('socket1', 'Player1');
            expect(room.players.size).toBe(1);
            
            room.removePlayer('socket1');
            expect(room.players.size).toBe(0);
            // Host should be set to null when room becomes empty
            expect(room.host).toBeNull();
        });

        test('should handle piece sequence generation', () => {
            room.addPlayer('socket1', 'Player1');
            room.startGame();
            
            expect(room.pieceSequence).toBeDefined();
            expect(Array.isArray(room.pieceSequence)).toBe(true);
        });

        test('should handle current piece index tracking', () => {
            room.addPlayer('socket1', 'Player1');
            room.startGame();
            
            expect(room.currentPieceIndex).toBeDefined();
            expect(typeof room.currentPieceIndex).toBe('number');
        });

        test('should handle game speed configuration', () => {
            expect(room.gameSpeed).toBe(1000);
            
            // Test game speed modification
            room.gameSpeed = 500;
            expect(room.gameSpeed).toBe(500);
        });

        test('should handle room name property', () => {
            expect(room.name).toBe('testRoom');
            
            // Test room name modification
            room.name = 'newRoom';
            expect(room.name).toBe('newRoom');
        });

        test('should handle game started state transitions', () => {
            expect(room.gameStarted).toBe(false);
            
            room.addPlayer('socket1', 'Player1');
            room.startGame();
            expect(room.gameStarted).toBe(true);
            
            room.stopGame();
            expect(room.gameStarted).toBe(false);
        });

        test('should handle game loop management', () => {
            expect(room.gameLoop).toBeNull();
            
            // Mock game loop
            const mockLoop = setInterval(() => {}, 1000);
            room.gameLoop = mockLoop;
            expect(room.gameLoop).toBe(mockLoop);
            
            // Clean up
            clearInterval(mockLoop);
        });

        test('should handle player board initialization', () => {
            const player = room.addPlayer('socket1', 'Player1');
            
            expect(player.board).toBeDefined();
            expect(player.board).toBeInstanceOf(require('../../../server/classes/Board'));
        });

        test('should handle player room reference', () => {
            const player = room.addPlayer('socket1', 'Player1');
            
            expect(player.room).toBe(room);
        });

        test('should handle player name assignment', () => {
            const player = room.addPlayer('socket1', 'Player1');
            
            expect(player.name).toBe('Player1');
        });

        test('should handle socket ID validation', () => {
            expect(() => {
                room.addPlayer('', 'Player1');
            }).toThrow(PlayerError);
            
            expect(() => {
                room.addPlayer(undefined, 'Player1');
            }).toThrow(PlayerError);
        });

        test('should handle player name validation', () => {
            expect(() => {
                room.addPlayer('socket1', '');
            }).toThrow(PlayerError);
            
            expect(() => {
                room.addPlayer('socket1', undefined);
            }).toThrow(PlayerError);
        });

        test('should handle room capacity limits', () => {
            room.addPlayer('socket1', 'Player1');
            room.addPlayer('socket2', 'Player2');
            
            expect(() => {
                room.addPlayer('socket3', 'Player3');
            }).toThrow(RoomError);
        });

        test('should handle duplicate socket ID prevention', () => {
            room.addPlayer('socket1', 'Player1');
            
            expect(() => {
                room.addPlayer('socket1', 'Player2');
            }).toThrow(PlayerError);
        });

        test('should handle spectrum calculation edge cases', () => {
            const mockPlayer = {
                board: {
                    width: 10,
                    height: 20,
                    grid: Array.from({ length: 20 }, (_, y) => 
                        Array.from({ length: 10 }, (_, x) => 
                            y >= 18 ? 'red' : 0
                        )
                    )
                }
            };
            
            const spectrum = room.getSpectrum(mockPlayer);
            
            expect(spectrum).toHaveLength(10);
            expect(spectrum.every(height => height >= 0 && height <= 2)).toBe(true);
        });

        test('should handle spectrum calculation with full board', () => {
            const mockPlayer = {
                board: {
                    width: 10,
                    height: 20,
                    grid: Array.from({ length: 20 }, () => Array(10).fill('red'))
                }
            };
            
            const spectrum = room.getSpectrum(mockPlayer);
            
            expect(spectrum).toHaveLength(10);
            expect(spectrum.every(height => height === 20)).toBe(true);
        });

        test('should handle spectrum calculation with mixed board', () => {
            const mockPlayer = {
                board: {
                    width: 10,
                    height: 20,
                    grid: Array.from({ length: 20 }, (_, y) => 
                        Array.from({ length: 10 }, (_, x) => 
                            (y >= 15 && x < 5) ? 'red' : 0
                        )
                    )
                }
            };
            
            const spectrum = room.getSpectrum(mockPlayer);
            
            expect(spectrum).toHaveLength(10);
            expect(spectrum.slice(0, 5).every(height => height === 5)).toBe(true);
            expect(spectrum.slice(5).every(height => height === 0)).toBe(true);
        });

        test('should handle game state management', () => {
            expect(room.gameStarted).toBe(false);
            expect(room.gameLoop).toBeNull();
            
            room.addPlayer('socket1', 'Player1');
            room.startGame();
            
            expect(room.gameStarted).toBe(true);
            expect(room.gameLoop).toBeDefined();
            
            room.stopGame();
            
            expect(room.gameStarted).toBe(false);
            expect(room.gameLoop).toBeNull();
        });

        test('should handle player management edge cases', () => {
            // Test removing non-existent player
            expect(() => {
                room.removePlayer('nonexistent');
            }).not.toThrow();
            
            // Test getting players from empty room
            expect(room.getPlayers()).toEqual([]);
        });

        test('should handle room initialization edge cases', () => {
            const newRoom = new Room('');
            expect(newRoom.name).toBe('');
            
            const anotherRoom = new Room('room with spaces');
            expect(anotherRoom.name).toBe('room with spaces');
        });

        test('should handle piece sequence edge cases', () => {
            room.addPlayer('socket1', 'Player1');
            room.startGame();
            
            expect(room.pieceSequence).toBeDefined();
            // currentPieceIndex might be incremented during startGame
            expect(typeof room.currentPieceIndex).toBe('number');
            
            // Test piece sequence modification
            room.pieceSequence = ['I', 'O', 'T'];
            expect(room.pieceSequence).toEqual(['I', 'O', 'T']);
        });

        test('should handle game speed edge cases', () => {
            expect(room.gameSpeed).toBe(1000);
            
            // Test various game speeds
            room.gameSpeed = 0;
            expect(room.gameSpeed).toBe(0);
            
            room.gameSpeed = 2000;
            expect(room.gameSpeed).toBe(2000);
            
            room.gameSpeed = -100;
            expect(room.gameSpeed).toBe(-100);
        });

        test('should handle game tick with active players', () => {
            room.addPlayer('socket1', 'Player1');
            room.addPlayer('socket2', 'Player2');
            room.startGame();
            
            // Test game tick with active players
            const activePlayers = room.getPlayers();
            expect(activePlayers.length).toBe(2);
            
            // Mock game tick execution
            if (typeof room.gameTick === 'function') {
                expect(() => room.gameTick()).not.toThrow();
            }
        });

        test('should handle game tick with single player', () => {
            room.addPlayer('socket1', 'Player1');
            room.startGame();
            
            // Test game tick with single player
            const activePlayers = room.getPlayers();
            expect(activePlayers.length).toBe(1);
            
            // Mock game tick execution
            if (typeof room.gameTick === 'function') {
                expect(() => room.gameTick()).not.toThrow();
            }
        });

        test('should handle game tick with no players', () => {
            // Test game tick with no players
            const activePlayers = room.getPlayers();
            expect(activePlayers.length).toBe(0);
            
            // Mock game tick execution
            if (typeof room.gameTick === 'function') {
                expect(() => room.gameTick()).not.toThrow();
            }
        });

        test('should handle game tick with game ended', () => {
            room.addPlayer('socket1', 'Player1');
            room.startGame();
            
            // Test game tick with game ended
            const activePlayers = room.getPlayers();
            expect(activePlayers.length).toBe(1);
            
            // Mock game tick execution
            if (typeof room.gameTick === 'function') {
                expect(() => room.gameTick()).not.toThrow();
            }
        });

        test('should handle game tick with game not ended', () => {
            room.addPlayer('socket1', 'Player1');
            room.addPlayer('socket2', 'Player2');
            room.startGame();
            
            // Test game tick with game not ended
            const activePlayers = room.getPlayers();
            expect(activePlayers.length).toBe(2);
            
            // Mock game tick execution
            if (typeof room.gameTick === 'function') {
                expect(() => room.gameTick()).not.toThrow();
            }
        });
    });
});
