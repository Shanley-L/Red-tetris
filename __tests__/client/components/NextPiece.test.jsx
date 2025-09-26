import React from 'react';
import { render, screen } from '@testing-library/react';
import NextPiece from '../../../client/components/NextPiece';

// Mock the Cell component
jest.mock('../../../client/components/Cell', () => {
    return function MockCell({ type }) {
        return <div data-testid="cell" data-type={type}></div>;
    };
});

describe('NextPiece Component', () => {
    test('should render nothing when piece is null', () => {
        render(<NextPiece piece={null} />);
        
        expect(screen.queryByText('Next Piece')).toBeNull();
        expect(screen.queryByTestId('cell')).toBeNull();
    });

    test('should render nothing when piece is undefined', () => {
        render(<NextPiece piece={undefined} />);
        
        expect(screen.queryByText('Next Piece')).toBeNull();
        expect(screen.queryByTestId('cell')).toBeNull();
    });

    test('should render I-piece correctly', () => {
        const iPiece = {
            shape: [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            color: 'cyan'
        };
        
        render(<NextPiece piece={iPiece} />);
        
        expect(screen.getByText('Next Piece')).toBeInTheDocument();
        
        const cells = screen.getAllByTestId('cell');
        expect(cells).toHaveLength(16); // 4x4 grid
        
        // Check that I-piece is centered
        const filledCells = cells.filter(cell => 
            cell.getAttribute('data-type') === 'cyan'
        );
        expect(filledCells).toHaveLength(4); // I-piece has 4 blocks
    });

    test('should render O-piece correctly', () => {
        const oPiece = {
            shape: [
                [1, 1],
                [1, 1]
            ],
            color: 'yellow'
        };
        
        render(<NextPiece piece={oPiece} />);
        
        const cells = screen.getAllByTestId('cell');
        expect(cells).toHaveLength(16); // 4x4 grid
        
        const filledCells = cells.filter(cell => 
            cell.getAttribute('data-type') === 'yellow'
        );
        expect(filledCells).toHaveLength(4); // O-piece has 4 blocks
    });

    test('should render T-piece correctly', () => {
        const tPiece = {
            shape: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: 'purple'
        };
        
        render(<NextPiece piece={tPiece} />);
        
        const cells = screen.getAllByTestId('cell');
        expect(cells).toHaveLength(16); // 4x4 grid
        
        const filledCells = cells.filter(cell => 
            cell.getAttribute('data-type') === 'purple'
        );
        expect(filledCells).toHaveLength(4); // T-piece has 4 blocks
    });

    test('should center piece in 4x4 grid', () => {
        const smallPiece = {
            shape: [
                [1, 1]
            ],
            color: 'red'
        };
        
        render(<NextPiece piece={smallPiece} />);
        
        const cells = screen.getAllByTestId('cell');
        expect(cells).toHaveLength(16);
        
        const filledCells = cells.filter(cell => 
            cell.getAttribute('data-type') === 'red'
        );
        expect(filledCells).toHaveLength(2);
    });

    test('should handle piece without color', () => {
        const pieceWithoutColor = {
            shape: [
                [1, 1],
                [1, 1]
            ]
            // No color property
        };
        
        render(<NextPiece piece={pieceWithoutColor} />);
        
        const cells = screen.getAllByTestId('cell');
        const filledCells = cells.filter(cell => 
            cell.getAttribute('data-type') === '1'
        );
        expect(filledCells).toHaveLength(4);
    });

    test('should handle piece with zero values in shape', () => {
        const pieceWithZeros = {
            shape: [
                [1, 0, 1],
                [0, 1, 0],
                [1, 0, 1]
            ],
            color: 'blue'
        };
        
        render(<NextPiece piece={pieceWithZeros} />);
        
        const cells = screen.getAllByTestId('cell');
        const filledCells = cells.filter(cell => 
            cell.getAttribute('data-type') === 'blue'
        );
        expect(filledCells).toHaveLength(5); // 5 non-zero blocks
    });

    test('should render title correctly', () => {
        const testPiece = {
            shape: [[1]],
            color: 'green'
        };
        
        render(<NextPiece piece={testPiece} />);
        
        expect(screen.getByText('Next Piece')).toBeInTheDocument();
    });

    test('should handle irregular shape sizes', () => {
        const irregularPiece = {
            shape: [
                [1, 1, 1, 1, 1] // 1x5 shape
            ],
            color: 'orange'
        };
        
        render(<NextPiece piece={irregularPiece} />);
        
        const cells = screen.getAllByTestId('cell');
        expect(cells).toHaveLength(16); // Still 4x4 grid
        
        const filledCells = cells.filter(cell => 
            cell.getAttribute('data-type') === 'orange'
        );
        expect(filledCells).toHaveLength(5);
    });

    test('should handle empty shape', () => {
        const emptyPiece = {
            shape: [],
            color: 'red'
        };
        
        render(<NextPiece piece={emptyPiece} />);
        
        const cells = screen.getAllByTestId('cell');
        expect(cells).toHaveLength(16); // 4x4 grid
        
        const filledCells = cells.filter(cell => 
            cell.getAttribute('data-type') === 'red'
        );
        expect(filledCells).toHaveLength(0);
    });
});
