const { Tetromino, PIECE_TYPES } = require('../../../server/classes/Tetromino');

describe('Tetromino Class', () => {
    test('should create tetromino with specific type', () => {
        const tetromino = new Tetromino('I');
        
        expect(tetromino.type).toBe('I');
        expect(tetromino.shape).toBeDefined();
        expect(tetromino.color).toBe('cyan');
        expect(tetromino.x).toBe(3);
        expect(tetromino.y).toBe(0);
        expect(tetromino.r).toBe(0);
    });

    test('should create all piece types correctly', () => {
        const pieces = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];
        const expectedColors = ['cyan', 'yellow', 'purple', 'orange', 'blue', 'green', 'red'];
        
        pieces.forEach((type, index) => {
            const tetromino = new Tetromino(type);
            expect(tetromino.type).toBe(type);
            expect(tetromino.color).toBe(expectedColors[index]);
            expect(tetromino.shape).toBeDefined();
            expect(tetromino.x).toBe(3);
            expect(tetromino.y).toBe(0);
            expect(tetromino.r).toBe(0);
        });
    });

    test('should create random tetromino when no type provided', () => {
        const tetromino = new Tetromino();
        
        expect(PIECE_TYPES).toContain(tetromino.type);
        expect(tetromino.shape).toBeDefined();
        expect(tetromino.color).toBeDefined();
        expect(tetromino.x).toBe(3);
        expect(tetromino.y).toBe(0);
        expect(tetromino.r).toBe(0);
    });

    test('should use custom random function', () => {
        let callCount = 0;
        const mockRandom = () => {
            callCount++;
            return 0.5; // Should select middle piece
        };
        
        const tetromino = new Tetromino(null, mockRandom);
        
        expect(callCount).toBeGreaterThan(0);
        expect(tetromino.type).toBeDefined();
    });

    test('should have correct I-piece shape', () => {
        const iPiece = new Tetromino('I');
        const expectedShape = [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ];
        expect(iPiece.shape).toEqual(expectedShape);
    });

    test('should have correct O-piece shape', () => {
        const oPiece = new Tetromino('O');
        const expectedShape = [
            [1, 1],
            [1, 1]
        ];
        expect(oPiece.shape).toEqual(expectedShape);
    });

    test('should have correct T-piece shape', () => {
        const tPiece = new Tetromino('T');
        const expectedShape = [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ];
        expect(tPiece.shape).toEqual(expectedShape);
    });

    test('should have correct L-piece shape', () => {
        const lPiece = new Tetromino('L');
        const expectedShape = [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ];
        expect(lPiece.shape).toEqual(expectedShape);
    });

    test('should have correct J-piece shape', () => {
        const jPiece = new Tetromino('J');
        const expectedShape = [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ];
        expect(jPiece.shape).toEqual(expectedShape);
    });

    test('should have correct S-piece shape', () => {
        const sPiece = new Tetromino('S');
        const expectedShape = [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ];
        expect(sPiece.shape).toEqual(expectedShape);
    });

    test('should have correct Z-piece shape', () => {
        const zPiece = new Tetromino('Z');
        const expectedShape = [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ];
        expect(zPiece.shape).toEqual(expectedShape);
    });

    test('should export PIECE_TYPES constant', () => {
        expect(PIECE_TYPES).toBe('IOTLJSZ');
        expect(PIECE_TYPES.length).toBe(7);
    });
});
