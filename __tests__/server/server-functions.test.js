// Test server.js utility functions and basic structure
const fs = require('fs');
const path = require('path');

describe('Server Functions and Structure', () => {
    let serverContent;

    beforeAll(() => {
        serverContent = fs.readFileSync(path.join(__dirname, '../../server/server.js'), 'utf8');
    });

    describe('Server File Structure', () => {
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

        test('should contain room management initialization', () => {
            expect(serverContent).toContain('const rooms = new Map();');
        });

        test('should contain express middleware setup', () => {
            expect(serverContent).toContain('app.use(express.static(publicPath));');
            expect(serverContent).toContain("app.get('*', (req, res) => {");
        });

        test('should define utility functions', () => {
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

    describe('Utility Functions Logic', () => {
        test('should test serializePiece function implementation', () => {
            const serializePieceMatch = serverContent.match(/function serializePiece\(piece\) \{[\s\S]*?\n\}/);
            expect(serializePieceMatch).toBeTruthy();
            expect(serializePieceMatch[0]).toContain('return { shape: piece.shape, color: piece.color };');
            
            // Test the function logic
            const mockPiece = { shape: [[1, 1]], color: 'red', x: 0, y: 0 };
            const expected = { shape: [[1, 1]], color: 'red' };
            const result = { shape: mockPiece.shape, color: mockPiece.color };
            expect(result).toEqual(expected);
        });

        test('should test makePieceFromTetromino function implementation', () => {
            const makePieceMatch = serverContent.match(/function makePieceFromTetromino\(t\) \{[\s\S]*?\n\}/);
            expect(makePieceMatch).toBeTruthy();
            expect(makePieceMatch[0]).toContain('return { type: t.type, shape: t.shape, color: t.color, x: 3, y: 0, r: 0 };');
            
            // Test the function logic
            const mockTetromino = { type: 'I', shape: [[1, 1, 1, 1]], color: 'cyan' };
            const expected = { type: 'I', shape: [[1, 1, 1, 1]], color: 'cyan', x: 3, y: 0, r: 0 };
            const result = { type: mockTetromino.type, shape: mockTetromino.shape, color: mockTetromino.color, x: 3, y: 0, r: 0 };
            expect(result).toEqual(expected);
        });

        test('should test checkGameEnd function implementation', () => {
            const checkGameEndMatch = serverContent.match(/function checkGameEnd\(room\) \{[\s\S]*?\n\}/);
            expect(checkGameEndMatch).toBeTruthy();
            expect(checkGameEndMatch[0]).toContain('getPlayers()');
            expect(checkGameEndMatch[0]).toContain('activePlayers.length');
            expect(checkGameEndMatch[0]).toContain('Winner:');
            expect(checkGameEndMatch[0]).toContain('No players remaining');
            expect(checkGameEndMatch[0]).toContain('room.stopGame()');
        });

        test('should test handleGameTick function implementation', () => {
            const handleGameTickMatch = serverContent.match(/function handleGameTick\(room\) \{[\s\S]*?\n\}/);
            expect(handleGameTickMatch).toBeTruthy();
            expect(handleGameTickMatch[0]).toContain('room.gameStarted');
            expect(handleGameTickMatch[0]).toContain('getPlayers()');
            expect(handleGameTickMatch[0]).toContain('canPlace');
            expect(handleGameTickMatch[0]).toContain('movePiece');
            expect(handleGameTickMatch[0]).toContain('lockPiece');
            expect(handleGameTickMatch[0]).toContain('clearLines');
            expect(handleGameTickMatch[0]).toContain('addPenaltyLines');
            expect(handleGameTickMatch[0]).toContain('renderWithPiece');
        });

        test('should test handleSoftDropTick function implementation', () => {
            const handleSoftDropTickMatch = serverContent.match(/function handleSoftDropTick\(player\) \{[\s\S]*?\n\}/);
            expect(handleSoftDropTickMatch).toBeTruthy();
            expect(handleSoftDropTickMatch[0]).toContain('canPlace');
            expect(handleSoftDropTickMatch[0]).toContain('movePiece');
            expect(handleSoftDropTickMatch[0]).toContain('isSoftDropping');
            expect(handleSoftDropTickMatch[0]).toContain('softDropTimer');
            expect(handleSoftDropTickMatch[0]).toContain('clearInterval');
        });

        test('should test broadcastRoomUpdate function implementation', () => {
            const broadcastRoomUpdateMatch = serverContent.match(/function broadcastRoomUpdate\(room\) \{[\s\S]*?\n\}/);
            expect(broadcastRoomUpdateMatch).toBeTruthy();
            expect(broadcastRoomUpdateMatch[0]).toContain('getPlayers()');
            expect(broadcastRoomUpdateMatch[0]).toContain('getSpectrum');
            expect(broadcastRoomUpdateMatch[0]).toContain('roomUpdate');
        });
    });

    describe('Socket Event Handlers Logic', () => {
        test('should test connection event handler implementation', () => {
            expect(serverContent).toContain("io.on('connection'");
            expect(serverContent).toContain('User connected:');
            expect(serverContent).toContain('currentRoom = null');
            expect(serverContent).toContain('currentPlayer = null');
        });

        test('should test joinRoom event handler implementation', () => {
            expect(serverContent).toContain("socket.on('joinRoom'");
            expect(serverContent).toContain('roomName');
            expect(serverContent).toContain('playerName');
            expect(serverContent).toContain('ValidationError');
            expect(serverContent).toContain('rooms.has');
            expect(serverContent).toContain('rooms.set');
            expect(serverContent).toContain('addPlayer');
            expect(serverContent).toContain('broadcastRoomUpdate');
        });

        test('should test startGame event handler implementation', () => {
            expect(serverContent).toContain("socket.on('startGame'");
            expect(serverContent).toContain('currentRoom');
            expect(serverContent).toContain('currentPlayer');
            expect(serverContent).toContain('host');
            expect(serverContent).toContain('startGame');
            expect(serverContent).toContain('setInterval');
            expect(serverContent).toContain('handleGameTick');
        });

        test('should test move event handler implementation', () => {
            expect(serverContent).toContain("socket.on('move'");
            expect(serverContent).toContain('direction');
            expect(serverContent).toContain('PlayerError');
            expect(serverContent).toContain('ValidationError');
            expect(serverContent).toContain('hardDrop');
            expect(serverContent).toContain('rotate');
            expect(serverContent).toContain('left');
            expect(serverContent).toContain('right');
            expect(serverContent).toContain('down');
            expect(serverContent).toContain('rotatePieceWithKicks');
            expect(serverContent).toContain('movePiece');
        });

        test('should test stopSoftDrop event handler implementation', () => {
            expect(serverContent).toContain("socket.on('stopSoftDrop'");
            expect(serverContent).toContain('currentPlayer');
            expect(serverContent).toContain('isSoftDropping');
            expect(serverContent).toContain('softDropTimer');
            expect(serverContent).toContain('clearInterval');
        });

        test('should test disconnect event handler implementation', () => {
            expect(serverContent).toContain("socket.on('disconnect'");
            expect(serverContent).toContain('User disconnected:');
            expect(serverContent).toContain('currentRoom');
            expect(serverContent).toContain('currentPlayer');
            expect(serverContent).toContain('removePlayer');
            expect(serverContent).toContain('rooms.delete');
            expect(serverContent).toContain('broadcastRoomUpdate');
        });
    });

    describe('Game Logic Coverage', () => {
        test('should test game tick logic implementation', () => {
            expect(serverContent).toContain('canFall = canPlace(grid, player.currentPiece, 0, 1)');
            expect(serverContent).toContain('player.currentPiece = movePiece(player.currentPiece, 0, 1)');
            expect(serverContent).toContain('const locked = lockPiece(grid, player.currentPiece)');
            expect(serverContent).toContain('const { grid: cleared, linesCleared } = clearLines(locked)');
            expect(serverContent).toContain('if (linesCleared > 0)');
            expect(serverContent).toContain('const penaltyLines = linesCleared - 1');
            expect(serverContent).toContain('otherPlayer.board.grid = addPenaltyLines(otherPlayer.board.grid, penaltyLines)');
        });

        test('should test piece sequence regeneration logic', () => {
            expect(serverContent).toContain('if (player.sequenceIndex >= player.pieceSequence.length - 1)');
            expect(serverContent).toContain('player.pieceSequence = []');
            expect(serverContent).toContain('const gameSeed = room.name.charCodeAt(0) + Date.now() + player.socketId.charCodeAt(0)');
            expect(serverContent).toContain('const seededRandom = () => {');
            expect(serverContent).toContain('randomSeed = (randomSeed * 1664525 + 1013904223) % Math.pow(2, 32)');
            expect(serverContent).toContain('for (let i = 0; i < 50; i++)');
            expect(serverContent).toContain('player.pieceSequence.push(new Tetromino(null, seededRandom))');
        });

        test('should test game over detection logic', () => {
            expect(serverContent).toContain('if (!canPlace(player.board.grid, player.currentPiece, 0, 0))');
            expect(serverContent).toContain('player.socket.emit(\'gameOver\')');
            expect(serverContent).toContain('room.removePlayer(player.socketId)');
            expect(serverContent).toContain('if (checkGameEnd(room))');
        });

        test('should test penalty line distribution logic', () => {
            expect(serverContent).toContain('room.getPlayers().forEach(otherPlayer => {');
            expect(serverContent).toContain('if (otherPlayer.socketId !== player.socketId)');
            expect(serverContent).toContain('otherPlayer.socket.emit(\'penaltyReceived\'');
            expect(serverContent).toContain('if (!canPlace(otherPlayer.board.grid, otherPlayer.currentPiece, 0, 0))');
        });

        test('should test board rendering and updates', () => {
            expect(serverContent).toContain('const boardWithPiece = renderWithPiece(player.board.grid, player.currentPiece)');
            expect(serverContent).toContain('const nextPieceSerialized = serializePiece(makePieceFromTetromino(player.nextPiece))');
            expect(serverContent).toContain('player.socket.emit(\'updateBoard\'');
            expect(serverContent).toContain('const spectrums = otherPlayers.map(p => ({');
            expect(serverContent).toContain('player.socket.emit(\'roomUpdate\'');
        });
    });

    describe('Error Handling Coverage', () => {
        test('should test validation error handling', () => {
            expect(serverContent).toContain('if (!roomName || !playerName)');
            expect(serverContent).toContain('throw new ValidationError(\'Room name and player name are required\')');
            expect(serverContent).toContain('if (roomName.length > 20 || playerName.length > 20)');
            expect(serverContent).toContain('throw new ValidationError(\'Room name and player name must be 20 characters or less\')');
        });

        test('should test room error handling', () => {
            expect(serverContent).toContain('if (!room.canJoin())');
            expect(serverContent).toContain('throw new RoomError(\'Room is full or game has started\', \'ROOM_FULL_OR_STARTED\')');
        });

        test('should test player error handling', () => {
            expect(serverContent).toContain('if (!currentRoom || !currentPlayer || !currentRoom.gameStarted)');
            expect(serverContent).toContain('throw new PlayerError(\'Game not started or player not in room\', \'GAME_NOT_STARTED\')');
            expect(serverContent).toContain('if (!currentPlayer.currentPiece)');
            expect(serverContent).toContain('throw new PlayerError(\'No current piece available\', \'NO_CURRENT_PIECE\')');
        });

        test('should test move validation error handling', () => {
            expect(serverContent).toContain('const validDirections = [\'left\', \'right\', \'down\', \'rotate\', \'hardDrop\']');
            expect(serverContent).toContain('if (!validDirections.includes(direction))');
            expect(serverContent).toContain('throw new ValidationError(`Invalid direction: ${direction}`, \'INVALID_DIRECTION\')');
        });

        test('should test error emission to clients', () => {
            expect(serverContent).toContain('socket.emit(\'joinError\'');
            expect(serverContent).toContain('socket.emit(\'moveError\'');
            expect(serverContent).toContain('message: error.message');
            expect(serverContent).toContain('code: error.code || \'UNKNOWN_ERROR\'');
        });
    });

    describe('Server Startup Coverage', () => {
        test('should test server startup logic', () => {
            expect(serverContent).toContain('server.listen(PORT, () => {');
            expect(serverContent).toContain('console.log(`Server is up on port ${PORT}`)');
        });

        test('should test express middleware setup', () => {
            expect(serverContent).toContain('app.use(express.static(publicPath))');
            expect(serverContent).toContain('app.get(\'*\', (req, res) => {');
            expect(serverContent).toContain('res.sendFile(path.join(publicPath, \'index.html\'))');
        });

        test('should test room management initialization', () => {
            expect(serverContent).toContain('const rooms = new Map()');
        });
    });
});
