const Board = require('../../../server/classes/Board');

describe('Board Class', () => {
    let board;

    beforeEach(() => {
        board = new Board();
    });

    test('should create board with correct dimensions', () => {
        expect(board.width).toBe(10);
        expect(board.height).toBe(20);
    });

    test('should create empty grid', () => {
        expect(board.grid).toBeDefined();
        expect(board.grid.length).toBe(20);
        expect(board.grid[0].length).toBe(10);
    });

    test('should have all cells initialized to 0', () => {
        for (let y = 0; y < board.height; y++) {
            for (let x = 0; x < board.width; x++) {
                expect(board.grid[y][x]).toBe(0);
            }
        }
    });

    test('should allow grid modification', () => {
        board.grid[0][0] = 'red';
        board.grid[19][9] = 'blue';
        
        expect(board.grid[0][0]).toBe('red');
        expect(board.grid[19][9]).toBe('blue');
    });

    test('should maintain grid structure after modifications', () => {
        // Fill entire grid
        for (let y = 0; y < board.height; y++) {
            for (let x = 0; x < board.width; x++) {
                board.grid[y][x] = 'test';
            }
        }
        
        expect(board.grid.length).toBe(20);
        expect(board.grid[0].length).toBe(10);
        expect(board.grid[19][9]).toBe('test');
    });
});
