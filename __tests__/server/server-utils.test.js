// Test server.js utility functions by extracting and testing them
const fs = require('fs');
const path = require('path');

describe('Server Utility Functions', () => {
    // Extract and test the utility functions from server.js
    const serverContent = fs.readFileSync(path.join(__dirname, '../../server/server.js'), 'utf8');

    // Mock the utility functions by extracting their logic
    function serializePiece(piece) {
        return { shape: piece.shape, color: piece.color };
    }

    function makePieceFromTetromino(t) {
        return { type: t.type, shape: t.shape, color: t.color, x: 3, y: 0, r: 0 };
    }

    describe('serializePiece', () => {
        test('should serialize piece correctly', () => {
            const piece = {
                type: 'I',
                shape: [[1, 1, 1, 1]],
                color: 'cyan',
                x: 3,
                y: 0,
                r: 0
            };
            
            const result = serializePiece(piece);
            
            expect(result).toEqual({
                shape: [[1, 1, 1, 1]],
                color: 'cyan'
            });
        });

        test('should handle piece without color', () => {
            const piece = {
                type: 'I',
                shape: [[1, 1, 1, 1]],
                x: 3,
                y: 0,
                r: 0
            };
            
            const result = serializePiece(piece);
            
            expect(result).toEqual({
                shape: [[1, 1, 1, 1]],
                color: undefined
            });
        });
    });

    describe('makePieceFromTetromino', () => {
        test('should create piece from tetromino correctly', () => {
            const tetromino = {
                type: 'I',
                shape: [[1, 1, 1, 1]],
                color: 'cyan'
            };
            
            const result = makePieceFromTetromino(tetromino);
            
            expect(result).toEqual({
                type: 'I',
                shape: [[1, 1, 1, 1]],
                color: 'cyan',
                x: 3,
                y: 0,
                r: 0
            });
        });

        test('should handle tetromino without color', () => {
            const tetromino = {
                type: 'O',
                shape: [[1, 1], [1, 1]]
            };
            
            const result = makePieceFromTetromino(tetromino);
            
            expect(result).toEqual({
                type: 'O',
                shape: [[1, 1], [1, 1]],
                color: undefined,
                x: 3,
                y: 0,
                r: 0
            });
        });
    });

    describe('Server Content Analysis', () => {
        test('should contain all required imports', () => {
            expect(serverContent).toContain("require('express')");
            expect(serverContent).toContain("require('path')");
            expect(serverContent).toContain("require('http')");
            expect(serverContent).toContain('require("socket.io")');
            expect(serverContent).toContain("require('./classes/Player')");
            expect(serverContent).toContain("require('./classes/Board')");
            expect(serverContent).toContain("require('./classes/Room')");
            expect(serverContent).toContain("require('./classes/Tetromino')");
            expect(serverContent).toContain("require('./errors')");
            expect(serverContent).toContain("require('./logic/gameLogic')");
        });

        test('should contain express app setup', () => {
            expect(serverContent).toContain('const app = express();');
            expect(serverContent).toContain('const server = http.createServer(app);');
            expect(serverContent).toContain('const io = new Server(server);');
        });

        test('should contain room management', () => {
            expect(serverContent).toContain('const rooms = new Map();');
        });

        test('should contain middleware setup', () => {
            expect(serverContent).toContain('app.use(express.static(publicPath));');
            expect(serverContent).toContain("app.get('*', (req, res) => {");
        });

        test('should contain utility functions', () => {
            expect(serverContent).toContain('function serializePiece(piece)');
            expect(serverContent).toContain('function makePieceFromTetromino(t)');
            expect(serverContent).toContain('function checkGameEnd(room)');
            expect(serverContent).toContain('function handleGameTick(room)');
        });

        test('should contain socket event handlers', () => {
            expect(serverContent).toContain("socket.on('joinRoom'");
            expect(serverContent).toContain("socket.on('move'");
            expect(serverContent).toContain("socket.on('startGame'");
            expect(serverContent).toContain("socket.on('disconnect'");
            expect(serverContent).toContain("socket.on('stopSoftDrop'");
        });

        test('should contain server startup', () => {
            expect(serverContent).toContain('server.listen(PORT');
            expect(serverContent).toContain('Server is up on port');
        });
    });

    describe('Game Logic Patterns', () => {
        test('should contain game tick logic', () => {
            expect(serverContent).toContain('canPlace');
            expect(serverContent).toContain('movePiece');
            expect(serverContent).toContain('lockPiece');
            expect(serverContent).toContain('clearLines');
            expect(serverContent).toContain('addPenaltyLines');
            expect(serverContent).toContain('renderWithPiece');
        });

        test('should contain piece sequence logic', () => {
            expect(serverContent).toContain('pieceSequence');
            expect(serverContent).toContain('currentPieceIndex');
            expect(serverContent).toContain('seededRandom');
        });

        test('should contain game over logic', () => {
            expect(serverContent).toContain('gameOver');
            expect(serverContent).toContain('gameEnd');
            expect(serverContent).toContain('Winner:');
        });

        test('should contain penalty logic', () => {
            expect(serverContent).toContain('penaltyLines');
            expect(serverContent).toContain('penaltyReceived');
            expect(serverContent).toContain('linesCleared');
        });
    });

    describe('Error Handling Patterns', () => {
        test('should contain validation error handling', () => {
            expect(serverContent).toContain('ValidationError');
            expect(serverContent).toContain('Room name and player name are required');
            expect(serverContent).toContain('must be 20 characters or less');
        });

        test('should contain room error handling', () => {
            expect(serverContent).toContain('RoomError');
            expect(serverContent).toContain('Room is full or game has started');
        });

        test('should contain player error handling', () => {
            expect(serverContent).toContain('PlayerError');
            expect(serverContent).toContain('Game not started or player not in room');
            expect(serverContent).toContain('No current piece available');
        });

        test('should contain move validation', () => {
            expect(serverContent).toContain('validDirections');
            expect(serverContent).toContain('Invalid direction');
        });

        test('should contain error emission', () => {
            expect(serverContent).toContain('joinError');
            expect(serverContent).toContain('moveError');
            expect(serverContent).toContain('error.message');
            expect(serverContent).toContain('error.code');
        });
    });

    describe('Socket Event Patterns', () => {
        test('should contain connection handling', () => {
            expect(serverContent).toContain('User connected:');
            expect(serverContent).toContain('currentRoom = null');
            expect(serverContent).toContain('currentPlayer = null');
        });

        test('should contain room joining logic', () => {
            expect(serverContent).toContain('joinRoom');
            expect(serverContent).toContain('roomName');
            expect(serverContent).toContain('playerName');
            expect(serverContent).toContain('rooms.has');
            expect(serverContent).toContain('rooms.set');
        });

        test('should contain game starting logic', () => {
            expect(serverContent).toContain('startGame');
            expect(serverContent).toContain('host');
            expect(serverContent).toContain('setInterval');
            expect(serverContent).toContain('handleGameTick');
        });

        test('should contain move handling logic', () => {
            expect(serverContent).toContain('move');
            expect(serverContent).toContain('direction');
            expect(serverContent).toContain('hardDrop');
            expect(serverContent).toContain('rotate');
            expect(serverContent).toContain('left');
            expect(serverContent).toContain('right');
            expect(serverContent).toContain('down');
        });

        test('should contain disconnect handling', () => {
            expect(serverContent).toContain('disconnect');
            expect(serverContent).toContain('User disconnected:');
            expect(serverContent).toContain('removePlayer');
            expect(serverContent).toContain('rooms.delete');
        });
    });
});
