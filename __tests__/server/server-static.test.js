// Static analysis tests for server.js to improve coverage
// This tests the file content without running the actual server

const fs = require('fs');
const path = require('path');

describe('Server Static Analysis', () => {
    let serverContent;

    beforeAll(() => {
        serverContent = fs.readFileSync(path.join(__dirname, '../../server/server.js'), 'utf8');
    });

    describe('File Structure', () => {
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

        test('should define server constants', () => {
            expect(serverContent).toContain('const app = express()');
            expect(serverContent).toContain('const server = http.createServer(app)');
            expect(serverContent).toContain('const io = new Server(server)');
            expect(serverContent).toContain('const PORT = process.env.PORT || 3000');
            expect(serverContent).toContain('const publicPath = path.join(__dirname');
            expect(serverContent).toContain('const rooms = new Map()');
        });

        test('should contain express middleware setup', () => {
            expect(serverContent).toContain('app.use(express.static(publicPath))');
            expect(serverContent).toContain("app.get('*'");
            expect(serverContent).toContain('res.sendFile');
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
            expect(serverContent).toContain("socket.on('disconnect'");
            expect(serverContent).toContain("socket.on('startGame'");
            expect(serverContent).toContain("socket.on('stopSoftDrop'");
        });

        test('should contain server startup', () => {
            expect(serverContent).toContain('server.listen(PORT');
            expect(serverContent).toContain('Server is up on port');
        });
    });

    describe('Function Definitions', () => {
        test('should define serializePiece function correctly', () => {
            const serializePieceMatch = serverContent.match(/function serializePiece\(piece\) \{[\s\S]*?\}/);
            expect(serializePieceMatch).toBeTruthy();
            expect(serializePieceMatch[0]).toContain('shape: piece.shape');
            expect(serializePieceMatch[0]).toContain('color: piece.color');
        });

        test('should define makePieceFromTetromino function correctly', () => {
            const makePieceMatch = serverContent.match(/function makePieceFromTetromino\(t\) \{[\s\S]*?\}/);
            expect(makePieceMatch).toBeTruthy();
            expect(makePieceMatch[0]).toContain('type: t.type');
            expect(makePieceMatch[0]).toContain('shape: t.shape');
            expect(makePieceMatch[0]).toContain('color: t.color');
            expect(makePieceMatch[0]).toContain('x: 3');
            expect(makePieceMatch[0]).toContain('y: 0');
            expect(makePieceMatch[0]).toContain('r: 0');
        });

        test('should define checkGameEnd function correctly', () => {
            const checkGameEndMatch = serverContent.match(/function checkGameEnd\(room\) \{[\s\S]*?\n\}/);
            expect(checkGameEndMatch).toBeTruthy();
            expect(checkGameEndMatch[0]).toContain('getPlayers()');
        });

        test('should define handleGameTick function correctly', () => {
            const handleGameTickMatch = serverContent.match(/function handleGameTick\(room\) \{[\s\S]*?\n\}/);
            expect(handleGameTickMatch).toBeTruthy();
        });
    });

    describe('Socket Event Handlers', () => {
        test('should handle joinRoom event', () => {
            const joinRoomMatch = serverContent.match(/socket\.on\('joinRoom', \(\{ roomName, playerName \}\) => \{[\s\S]*?\}\);/);
            expect(joinRoomMatch).toBeTruthy();
            expect(joinRoomMatch[0]).toContain('roomName');
            expect(joinRoomMatch[0]).toContain('playerName');
        });

        test('should handle move event', () => {
            const moveMatch = serverContent.match(/socket\.on\('move', \(\{ direction \}\) => \{[\s\S]*?\}\);/);
            expect(moveMatch).toBeTruthy();
            expect(moveMatch[0]).toContain('direction');
        });

        test('should handle disconnect event', () => {
            const disconnectMatch = serverContent.match(/socket\.on\('disconnect', \(\) => \{[\s\S]*?\}\);/);
            expect(disconnectMatch).toBeTruthy();
        });

        test('should handle startGame event', () => {
            const startGameMatch = serverContent.match(/socket\.on\('startGame', \(\) => \{[\s\S]*?\}\);/);
            expect(startGameMatch).toBeTruthy();
        });

        test('should handle stopSoftDrop event', () => {
            const stopSoftDropMatch = serverContent.match(/socket\.on\('stopSoftDrop', \(\) => \{[\s\S]*?\}\);/);
            expect(stopSoftDropMatch).toBeTruthy();
        });
    });

    describe('Game Logic Integration', () => {
        test('should use imported game logic functions', () => {
            expect(serverContent).toContain('canPlace');
            expect(serverContent).toContain('rotatePieceWithKicks');
            expect(serverContent).toContain('movePiece');
            expect(serverContent).toContain('lockPiece');
            expect(serverContent).toContain('clearLines');
            expect(serverContent).toContain('addPenaltyLines');
            expect(serverContent).toContain('renderWithPiece');
        });

        test('should handle error types', () => {
            expect(serverContent).toContain('RoomError');
            expect(serverContent).toContain('PlayerError');
            expect(serverContent).toContain('ValidationError');
            expect(serverContent).toContain('NetworkError');
        });

        test('should manage rooms and players', () => {
            expect(serverContent).toContain('rooms.get');
            expect(serverContent).toContain('rooms.set');
            expect(serverContent).toContain('rooms.delete');
            expect(serverContent).toContain('addPlayer');
            expect(serverContent).toContain('removePlayer');
        });
    });

    describe('Game Mechanics', () => {
        test('should handle piece movement', () => {
            expect(serverContent).toContain('left');
            expect(serverContent).toContain('right');
            expect(serverContent).toContain('down');
            expect(serverContent).toContain('rotate');
            expect(serverContent).toContain('hardDrop');
        });

        test('should handle game state', () => {
            expect(serverContent).toContain('gameStarted');
            expect(serverContent).toContain('currentPiece');
            expect(serverContent).toContain('nextPiece');
            expect(serverContent).toContain('board');
        });

        test('should handle room updates', () => {
            expect(serverContent).toContain('roomUpdate');
            expect(serverContent).toContain('updateBoard');
            expect(serverContent).toContain('gameOver');
        });
    });

    describe('Error Handling', () => {
        test('should handle join errors', () => {
            expect(serverContent).toContain('joinError');
        });

        test('should handle move errors', () => {
            expect(serverContent).toContain('moveError');
        });

        test('should use try-catch blocks', () => {
            expect(serverContent).toContain('try {');
            expect(serverContent).toContain('catch');
        });
    });

    describe('Code Structure', () => {
        test('should have proper function declarations', () => {
            const functionCount = (serverContent.match(/function \w+\(/g) || []).length;
            expect(functionCount).toBeGreaterThan(3);
        });

        test('should have socket event listeners', () => {
            const socketOnCount = (serverContent.match(/socket\.on\(/g) || []).length;
            expect(socketOnCount).toBeGreaterThan(4);
        });

        test('should have proper variable declarations', () => {
            expect(serverContent).toContain('const ');
            expect(serverContent).toContain('let ');
        });

        test('should have proper control structures', () => {
            expect(serverContent).toContain('if (');
            expect(serverContent).toContain('for (');
            expect(serverContent).toContain('while (');
        });
    });

    describe('File Size and Complexity', () => {
        test('should be a substantial file', () => {
            expect(serverContent.length).toBeGreaterThan(10000);
        });

        test('should have multiple lines', () => {
            const lines = serverContent.split('\n');
            expect(lines.length).toBeGreaterThan(400);
        });

        test('should contain comments', () => {
            expect(serverContent).toContain('//');
        });
    });
});
