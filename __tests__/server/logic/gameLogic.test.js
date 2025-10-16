const {
    cloneGrid,
    canPlace,
    rotateShape,
    rotateShapeCCW,
    rotatePieceWithKicks,
    movePiece,
    lockPiece,
    clearLines,
    addPenaltyLines,
    addPenaltyLinesReverse,
    renderWithPiece,
} = require('../../../server/logic/gameLogic');

describe('Game Logic Functions', () => {
    let testGrid;
    let testPiece;

    beforeEach(() => {
        // Create a 10x20 test grid
        testGrid = Array.from({ length: 20 }, () => Array(10).fill(0));
        
        // Create a test T-piece
        testPiece = {
            type: 'T',
            shape: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: 'purple',
            x: 3,
            y: 0,
            r: 0
        };
    });

    describe('canPlace', () => {
        test('should return true for valid placement', () => {
            expect(canPlace(testGrid, testPiece, 0, 0)).toBe(true);
        });

        test('should return false for out of bounds (left)', () => {
            testPiece.x = -1;
            expect(canPlace(testGrid, testPiece, 0, 0)).toBe(false);
        });

        test('should return false for out of bounds (right)', () => {
            testPiece.x = 8; // Piece width 3, grid width 10, so x=8 would overflow
            expect(canPlace(testGrid, testPiece, 0, 0)).toBe(false);
        });

        test('should return false for out of bounds (bottom)', () => {
            testPiece.y = 19; // Piece height 3, grid height 20, so y=19 would overflow
            expect(canPlace(testGrid, testPiece, 0, 0)).toBe(false);
        });

        test('should return false for collision with existing blocks', () => {
            // Place a block at (4, 1)
            testGrid[1][4] = 'red';
            testPiece.x = 3; // T-piece would collide at (4, 1)
            expect(canPlace(testGrid, testPiece, 0, 0)).toBe(false);
        });

        test('should return true for placement above existing blocks', () => {
            // Place blocks at bottom
            testGrid[19][4] = 'red';
            testPiece.y = 0; // Piece at top should be fine
            expect(canPlace(testGrid, testPiece, 0, 0)).toBe(true);
        });

        test('should handle offset parameters correctly', () => {
            expect(canPlace(testGrid, testPiece, 1, 1)).toBe(true);
            expect(canPlace(testGrid, testPiece, -5, 0)).toBe(false); // More negative to ensure out of bounds
        });
    });

    describe('rotateShape', () => {
        test('should rotate 2x2 shape correctly', () => {
            const shape = [
                [1, 0],
                [1, 1]
            ];
            const rotated = rotateShape(shape);
            const expected = [
                [1, 1],
                [1, 0]
            ];
            expect(rotated).toEqual(expected);
        });

        test('should rotate 3x3 shape correctly', () => {
            const shape = [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ];
            const rotated = rotateShape(shape);
            const expected = [
                [0, 1, 0],
                [0, 1, 1],
                [0, 1, 0]
            ];
            expect(rotated).toEqual(expected);
        });

        test('should handle 4x4 I-piece rotation', () => {
            const shape = [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ];
            const rotated = rotateShape(shape);
            const expected = [
                [0, 0, 1, 0],
                [0, 0, 1, 0],
                [0, 0, 1, 0],
                [0, 0, 1, 0]
            ];
            expect(rotated).toEqual(expected);
        });
    });

    describe('rotateShapeCCW', () => {
        test('should rotate counter-clockwise correctly', () => {
            const shape = [
                [1, 0],
                [1, 1]
            ];
            const rotated = rotateShapeCCW(shape);
            const expected = [
                [0, 1],
                [1, 1]
            ];
            expect(rotated).toEqual(expected);
        });
    });

    describe('rotatePieceWithKicks', () => {
        test('should rotate piece when possible', () => {
            const rotated = rotatePieceWithKicks(testGrid, testPiece, 'CW');
            expect(rotated.r).toBe(1);
            expect(rotated.shape).not.toEqual(testPiece.shape);
        });

        test('should return original piece when rotation fails', () => {
            // Fill grid to prevent rotation
            for (let y = 0; y < 20; y++) {
                for (let x = 0; x < 10; x++) {
                    testGrid[y][x] = 'red';
                }
            }
            const rotated = rotatePieceWithKicks(testGrid, testPiece, 'CW');
            expect(rotated).toEqual(testPiece);
        });

        test('should handle CCW rotation', () => {
            const rotated = rotatePieceWithKicks(testGrid, testPiece, 'CCW');
            expect(rotated.r).toBe(3);
        });

        test('should apply wall kicks when needed', () => {
            // Position piece near right wall
            testPiece.x = 7;
            const rotated = rotatePieceWithKicks(testGrid, testPiece, 'CW');
            expect(rotated.x).toBeLessThanOrEqual(7); // Should kick left if needed
        });
    });

    describe('movePiece', () => {
        test('should move piece horizontally', () => {
            const moved = movePiece(testPiece, 1, 0);
            expect(moved.x).toBe(4);
            expect(moved.y).toBe(0);
        });

        test('should move piece vertically', () => {
            const moved = movePiece(testPiece, 0, 1);
            expect(moved.x).toBe(3);
            expect(moved.y).toBe(1);
        });

        test('should move piece diagonally', () => {
            const moved = movePiece(testPiece, 1, 1);
            expect(moved.x).toBe(4);
            expect(moved.y).toBe(1);
        });

        test('should not modify original piece', () => {
            const originalX = testPiece.x;
            const originalY = testPiece.y;
            movePiece(testPiece, 1, 1);
            expect(testPiece.x).toBe(originalX);
            expect(testPiece.y).toBe(originalY);
        });
    });

    describe('lockPiece', () => {
        test('should place piece on grid', () => {
            const locked = lockPiece(testGrid, testPiece);
            
            // Check that piece blocks are placed (should be color or shape value)
            // T-piece at x=3, y=0: shape [0,1,0], [1,1,1], [0,0,0]
            expect(locked[0][4]).toBe('purple'); // Top center (y=0, x=3+1=4)
            expect(locked[1][3]).toBe('purple'); // Middle left (y=1, x=3+0=3)
            expect(locked[1][4]).toBe('purple'); // Middle center (y=1, x=3+1=4)
            expect(locked[1][5]).toBe('purple'); // Middle right (y=1, x=3+2=5)
        });

        test('should not modify original grid', () => {
            const originalGrid = testGrid.map(row => row.slice());
            lockPiece(testGrid, testPiece);
            expect(testGrid).toEqual(originalGrid);
        });

        test('should handle piece at bottom of grid', () => {
            testPiece.y = 18;
            const locked = lockPiece(testGrid, testPiece);
            expect(locked[18][4]).toBe('purple'); // Top center (y=18, x=3+1=4)
            expect(locked[19][3]).toBe('purple'); // Middle left (y=19, x=3+0=3)
        });
    });

    describe('clearLines', () => {
        test('should clear full lines', () => {
            // Fill a line completely
            testGrid[19] = Array(10).fill('red');
            
            const result = clearLines(testGrid);
            expect(result.linesCleared).toBe(1);
            expect(result.grid[19]).toEqual(Array(10).fill(0));
        });

        test('should clear multiple full lines', () => {
            // Fill two lines
            testGrid[18] = Array(10).fill('red');
            testGrid[19] = Array(10).fill('red');
            
            const result = clearLines(testGrid);
            expect(result.linesCleared).toBe(2);
            expect(result.grid[18]).toEqual(Array(10).fill(0));
            expect(result.grid[19]).toEqual(Array(10).fill(0));
        });

        test('should not clear lines with gaps', () => {
            // Fill line with one gap
            testGrid[19] = Array(10).fill('red');
            testGrid[19][5] = 0; // Gap
            
            const result = clearLines(testGrid);
            expect(result.linesCleared).toBe(0);
        });

        test('should not clear lines with penalty blocks', () => {
            // Fill line with penalty blocks (value 8)
            testGrid[19] = Array(10).fill(8);
            
            const result = clearLines(testGrid);
            expect(result.linesCleared).toBe(0);
        });

        test('should maintain grid height after clearing', () => {
            testGrid[19] = Array(10).fill('red');
            
            const result = clearLines(testGrid);
            expect(result.grid.length).toBe(20);
        });
    });

    describe('addPenaltyLines', () => {
        test('should add penalty lines at bottom', () => {
            const result = addPenaltyLines(testGrid, 2);
            expect(result.length).toBe(20);
            
            // Check that penalty lines were added (contain value 8)
            const hasPenaltyBlocks = result.some(row => row.includes(8));
            expect(hasPenaltyBlocks).toBe(true);
        });

        test('should maintain grid height', () => {
            const result = addPenaltyLines(testGrid, 5);
            expect(result.length).toBe(20);
        });

        test('should handle zero penalty lines', () => {
            const result = addPenaltyLines(testGrid, 0);
            expect(result).toEqual(testGrid);
        });

        test('should not modify original grid', () => {
            const originalGrid = testGrid.map(row => row.slice());
            addPenaltyLines(testGrid, 1);
            expect(testGrid).toEqual(originalGrid);
        });
    });

    describe('renderWithPiece', () => {
        test('should render piece on grid', () => {
            const rendered = renderWithPiece(testGrid, testPiece);
            
            // Check that piece is rendered (should be color or shape value)
            // T-piece at x=3, y=0: shape [0,1,0], [1,1,1], [0,0,0]
            expect(rendered[0][4]).toBe('purple'); // Top center (y=0, x=3+1=4)
            expect(rendered[1][3]).toBe('purple'); // Middle left (y=1, x=3+0=3)
            expect(rendered[1][4]).toBe('purple'); // Middle center (y=1, x=3+1=4)
            expect(rendered[1][5]).toBe('purple'); // Middle right (y=1, x=3+2=5)
        });

        test('should not modify original grid', () => {
            const originalGrid = testGrid.map(row => row.slice());
            renderWithPiece(testGrid, testPiece);
            expect(testGrid).toEqual(originalGrid);
        });

        test('should handle piece partially off grid', () => {
            testPiece.x = -1; // Partially off left edge
            const rendered = renderWithPiece(testGrid, testPiece);
            // T-piece at x=-1, y=0: shape [0,1,0], [1,1,1], [0,0,0]
            // Only positions with x >= 0 will be rendered
            // [0][1] -> x=-1+1=0, y=0+0=0 -> rendered[0][0]
            // [1][1] -> x=-1+1=0, y=0+1=1 -> rendered[1][0]
            // [1][2] -> x=-1+2=1, y=0+1=1 -> rendered[1][1]
            expect(rendered[0][0]).toBe('purple'); // Top center visible part
            expect(rendered[1][0]).toBe('purple'); // Middle center visible part
            expect(rendered[1][1]).toBe('purple'); // Middle right visible part
        });

        test('should handle piece with no color', () => {
            delete testPiece.color;
            const rendered = renderWithPiece(testGrid, testPiece);
            // T-piece at x=3, y=0: shape [0,1,0], [1,1,1], [0,0,0]
            // Should use shape value (1) since no color
            expect(rendered[0][4]).toBe(1); // Top center (y=0, x=3+1=4)
            expect(rendered[1][3]).toBe(1); // Middle left (y=1, x=3+0=3)
            expect(rendered[1][4]).toBe(1); // Middle center (y=1, x=3+1=4)
            expect(rendered[1][5]).toBe(1); // Middle right (y=1, x=3+2=5)
        });
    });

    describe('cloneGrid', () => {
        test('should create a deep copy of the grid', () => {
            const originalGrid = [
                [1, 0, 1],
                [0, 1, 0],
                [1, 0, 1]
            ];
            
            const cloned = cloneGrid(originalGrid);
            
            expect(cloned).toEqual(originalGrid);
            expect(cloned).not.toBe(originalGrid); // Different reference
            expect(cloned[0]).not.toBe(originalGrid[0]); // Different row references
        });

        test('should handle empty grid', () => {
            const originalGrid = [];
            const cloned = cloneGrid(originalGrid);
            
            expect(cloned).toEqual([]);
            expect(cloned).not.toBe(originalGrid);
        });

        test('should handle single row grid', () => {
            const originalGrid = [[1, 0, 1]];
            const cloned = cloneGrid(originalGrid);
            
            expect(cloned).toEqual([[1, 0, 1]]);
            expect(cloned[0]).not.toBe(originalGrid[0]);
        });
    });

    describe('rotateShapeCCW', () => {
        test('should rotate 2x2 shape counter-clockwise', () => {
            const shape = [
                [1, 1],
                [0, 1]
            ];
            
            const rotated = rotateShapeCCW(shape);
            const expected = [
                [1, 1],
                [1, 0]
            ];
            
            expect(rotated).toEqual(expected);
        });

        test('should rotate 3x2 shape counter-clockwise', () => {
            const shape = [
                [1, 0],
                [1, 1],
                [1, 0]
            ];
            
            const rotated = rotateShapeCCW(shape);
            const expected = [
                [0, 1, 0],
                [1, 1, 1]
            ];
            
            expect(rotated).toEqual(expected);
        });

        test('should handle empty shape', () => {
            const shape = [];
            
            expect(() => rotateShapeCCW(shape)).toThrow();
        });

        test('should handle single cell shape', () => {
            const shape = [[1]];
            const rotated = rotateShapeCCW(shape);
            
            expect(rotated).toEqual([[1]]);
        });
    });

    describe('rotatePieceWithKicks', () => {
        test('should rotate piece with successful kick', () => {
            const piece = {
                shape: [[1, 1], [1, 0]],
                x: 5,
                y: 5,
                r: 0,
                type: 'T'
            };
            
            const rotated = rotatePieceWithKicks(testGrid, piece, 'CW');
            
            expect(rotated.r).toBe(1);
            expect(rotated.shape).not.toEqual(piece.shape);
        });

        test('should not rotate if no valid kick found', () => {
            const piece = {
                shape: [[1, 1, 1, 1]], // I-piece
                x: 0,
                y: 0,
                r: 0,
                type: 'I'
            };
            
            // Fill grid to prevent rotation
            for (let i = 0; i < 20; i++) {
                testGrid[i][0] = 1;
                testGrid[i][1] = 1;
            }
            
            const rotated = rotatePieceWithKicks(testGrid, piece, 'CW');
            
            expect(rotated.r).toBe(0);
            expect(rotated.shape).toEqual(piece.shape);
        });

        test('should handle counter-clockwise rotation', () => {
            const piece = {
                shape: [[1, 1], [1, 0]],
                x: 5,
                y: 5,
                r: 1,
                type: 'T'
            };
            
            const rotated = rotatePieceWithKicks(testGrid, piece, 'CCW');
            
            expect(rotated.r).toBe(0);
        });
    });

    describe('movePiece', () => {
        test('should move piece left successfully', () => {
            const piece = {
                shape: [[1, 1], [1, 0]],
                x: 5,
                y: 5
            };
            
            const moved = movePiece(piece, -1, 0);
            
            expect(moved.x).toBe(4);
            expect(moved.y).toBe(5);
        });

        test('should move piece right successfully', () => {
            const piece = {
                shape: [[1, 1], [1, 0]],
                x: 5,
                y: 5
            };
            
            const moved = movePiece(piece, 1, 0);
            
            expect(moved.x).toBe(6);
            expect(moved.y).toBe(5);
        });

        test('should move piece down successfully', () => {
            const piece = {
                shape: [[1, 1], [1, 0]],
                x: 5,
                y: 5
            };
            
            const moved = movePiece(piece, 0, 1);
            
            expect(moved.x).toBe(5);
            expect(moved.y).toBe(6);
        });

        test('should move piece regardless of collision (collision check is separate)', () => {
            const piece = {
                shape: [[1, 1], [1, 0]],
                x: 0,
                y: 5
            };
            
            const moved = movePiece(piece, -1, 0);
            
            expect(moved.x).toBe(-1); // movePiece just moves, doesn't check collision
            expect(moved.y).toBe(5);
        });
    });

    describe('addPenaltyLines', () => {
        test('should add penalty lines to grid', () => {
            const grid = Array.from({ length: 20 }, () => Array(10).fill(0));
            const linesToAdd = 2;
            
            const result = addPenaltyLines(grid, linesToAdd);
            
            // Check that penalty lines were added at the bottom (with random gaps)
            expect(result[18]).toContain(8); // Should contain penalty blocks
            expect(result[19]).toContain(8); // Should contain penalty blocks
            expect(result.length).toBe(20); // Should maintain grid size
        });

        test('should handle zero penalty lines', () => {
            const grid = Array.from({ length: 20 }, () => Array(10).fill(0));
            const linesToAdd = 0;
            
            const result = addPenaltyLines(grid, linesToAdd);
            
            expect(result).toEqual(grid);
        });

        test('should handle maximum penalty lines', () => {
            const grid = Array.from({ length: 20 }, () => Array(10).fill(0));
            const linesToAdd = 20;
            
            const result = addPenaltyLines(grid, linesToAdd);
            
            // All lines should contain penalty blocks (with random gaps)
            result.forEach(row => {
                expect(row).toContain(8); // Should contain penalty blocks
                expect(row.length).toBe(10); // Should maintain width
            });
        });
    });

    describe('addPenaltyLinesReverse', () => {
        test('should add penalty lines to top of grid for reverse gravity', () => {
            const grid = Array.from({ length: 20 }, () => Array(10).fill(0));
            const linesToAdd = 2;
            
            const result = addPenaltyLinesReverse(grid, linesToAdd);
            
            // Check that penalty lines were added at the top (with random gaps)
            expect(result[0]).toContain(8); // Should contain penalty blocks
            expect(result[1]).toContain(8); // Should contain penalty blocks
            expect(result.length).toBe(20); // Should maintain grid size
        });

        test('should handle zero penalty lines', () => {
            const grid = Array.from({ length: 20 }, () => Array(10).fill(0));
            const linesToAdd = 0;
            
            const result = addPenaltyLinesReverse(grid, linesToAdd);
            
            expect(result).toEqual(grid);
        });

        test('should handle maximum penalty lines', () => {
            const grid = Array.from({ length: 20 }, () => Array(10).fill(0));
            const linesToAdd = 20;
            
            const result = addPenaltyLinesReverse(grid, linesToAdd);
            
            // All lines should contain penalty blocks (with random gaps)
            result.forEach(row => {
                expect(row).toContain(8); // Should contain penalty blocks
                expect(row.length).toBe(10); // Should maintain width
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle null/undefined grid in canPlace', () => {
            const piece = { shape: [[1]], x: 0, y: 0 };
            
            expect(() => canPlace(null, piece)).toThrow();
            expect(() => canPlace(undefined, piece)).toThrow();
        });

        test('should handle null/undefined piece in canPlace', () => {
            expect(canPlace(testGrid, null)).toBe(false);
            expect(canPlace(testGrid, undefined)).toBe(false);
        });

        test('should handle empty shape in canPlace', () => {
            const piece = { shape: [], x: 0, y: 0 };
            
            expect(canPlace(testGrid, piece)).toBe(true);
        });

        test('should handle malformed grid in canPlace', () => {
            const malformedGrid = [[1, 0], [1]]; // Inconsistent row lengths
            const piece = { shape: [[1]], x: 0, y: 0 };
            
            expect(canPlace(malformedGrid, piece)).toBe(false);
        });

        test('should handle very large offsets in canPlace', () => {
            const piece = { shape: [[1]], x: 0, y: 0 };
            
            expect(canPlace(testGrid, piece, 1000, 1000)).toBe(false);
            expect(canPlace(testGrid, piece, -1000, -1000)).toBe(false);
        });
    });
});
