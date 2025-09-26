import React from 'react';
import { render, screen } from '@testing-library/react';
import Board from '../../../client/components/Board';

// Mock the Cell component
jest.mock('../../../client/components/Cell', () => {
    return function MockCell({ type }) {
        return <div data-testid="cell" data-type={type}></div>;
    };
});

describe('Board Component', () => {
    test('should render empty board', () => {
        const emptyBoard = Array.from({ length: 20 }, () => Array(10).fill(0));
        
        render(<Board board={emptyBoard} />);
        
        const cells = screen.getAllByTestId('cell');
        expect(cells).toHaveLength(200); // 20 rows × 10 columns
        
        // All cells should be empty (type 0)
        cells.forEach(cell => {
            expect(cell.getAttribute('data-type')).toBe('0');
        });
    });

    test('should render board with pieces', () => {
        const boardWithPieces = Array.from({ length: 20 }, (_, y) => 
            Array.from({ length: 10 }, (_, x) => {
                if (y >= 18 && x >= 4 && x <= 6) return 'red';
                if (y === 19 && x === 5) return 'blue';
                return 0;
            })
        );
        
        render(<Board board={boardWithPieces} />);
        
        const cells = screen.getAllByTestId('cell');
        expect(cells).toHaveLength(200);
        
        // Check that some cells have pieces
        const filledCells = cells.filter(cell => 
            cell.getAttribute('data-type') !== '0'
        );
        expect(filledCells.length).toBeGreaterThan(0);
    });

    test('should render board with penalty blocks', () => {
        const boardWithPenalty = Array.from({ length: 20 }, (_, y) => 
            Array.from({ length: 10 }, (_, x) => {
                if (y === 19) return 8; // Penalty block
                return 0;
            })
        );
        
        render(<Board board={boardWithPenalty} />);
        
        const cells = screen.getAllByTestId('cell');
        const penaltyCells = cells.filter(cell => 
            cell.getAttribute('data-type') === '8'
        );
        expect(penaltyCells).toHaveLength(10); // Bottom row should be penalty blocks
    });

    test('should render board with mixed content', () => {
        const mixedBoard = Array.from({ length: 20 }, (_, y) => 
            Array.from({ length: 10 }, (_, x) => {
                if (y === 18 && x === 5) return 'cyan';
                if (y === 19 && x === 4) return 8; // Penalty
                if (y === 19 && x === 6) return 'yellow';
                return 0;
            })
        );
        
        render(<Board board={mixedBoard} />);
        
        const cells = screen.getAllByTestId('cell');
        expect(cells).toHaveLength(200);
        
        // Check specific cells
        const cyanCell = cells.find(cell => 
            cell.getAttribute('data-type') === 'cyan'
        );
        const penaltyCell = cells.find(cell => 
            cell.getAttribute('data-type') === '8'
        );
        const yellowCell = cells.find(cell => 
            cell.getAttribute('data-type') === 'yellow'
        );
        
        expect(cyanCell).toBeDefined();
        expect(penaltyCell).toBeDefined();
        expect(yellowCell).toBeDefined();
    });

    test('should handle undefined board prop', () => {
        render(<Board board={undefined} />);
        
        // Should not crash and render nothing or empty state
        expect(screen.queryByTestId('cell')).not.toBeInTheDocument();
    });

    test('should handle empty board array', () => {
        render(<Board board={[]} />);
        
        // Should not crash
        expect(screen.queryByTestId('cell')).toBeNull();
    });

    test('should maintain correct grid structure', () => {
        const testBoard = Array.from({ length: 20 }, (_, y) => 
            Array.from({ length: 10 }, (_, x) => y * 10 + x)
        );
        
        render(<Board board={testBoard} />);
        
        const cells = screen.getAllByTestId('cell');
        expect(cells).toHaveLength(200);
        
        // Check that cells are in correct order
        cells.forEach((cell, index) => {
            const expectedType = index.toString();
            expect(cell.getAttribute('data-type')).toBe(expectedType);
        });
    });
});
