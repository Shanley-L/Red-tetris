import React from 'react';
import { render, screen } from '@testing-library/react';
import Cell from '../../../client/components/Cell';

describe('Cell Component', () => {
    test('should render empty cell', () => {
        render(<Cell type={0} />);
        
        const cell = screen.getByTestId('cell');
        expect(cell).toHaveClass('cell', 'empty');
    });

    test('should render filled cell with string color', () => {
        render(<Cell type="red" />);
        
        const cell = screen.getByTestId('cell');
        expect(cell).toHaveClass('cell', 'filled', 'red');
    });

    test('should render filled cell with numeric type', () => {
        render(<Cell type={1} />);
        
        const cell = screen.getByTestId('cell');
        expect(cell).toHaveClass('cell', 'filled');
        expect(cell).not.toHaveClass('red', 'blue', 'green'); // No color class for numeric
    });

    test('should render penalty cell', () => {
        render(<Cell type={8} />);
        
        const cell = screen.getByTestId('cell');
        expect(cell).toHaveClass('cell', 'penalty');
    });

    test('should render all color types correctly', () => {
        const colors = ['red', 'blue', 'green', 'yellow', 'cyan', 'purple', 'orange'];
        
        colors.forEach(color => {
            const { unmount } = render(<Cell type={color} />);
            const cell = screen.getByTestId('cell');
            expect(cell).toHaveClass('cell', 'filled', color);
            unmount();
        });
    });

    test('should handle undefined type', () => {
        render(<Cell type={undefined} />);
        
        const cell = screen.getByTestId('cell');
        expect(cell).toHaveClass('cell', 'filled');
    });

    test('should handle null type', () => {
        render(<Cell type={null} />);
        
        const cell = screen.getByTestId('cell');
        expect(cell).toHaveClass('cell', 'filled');
    });

    test('should handle boolean type', () => {
        render(<Cell type={true} />);
        
        const cell = screen.getByTestId('cell');
        expect(cell).toHaveClass('cell', 'filled');
    });

    test('should always have base cell class', () => {
        const testCases = [0, 1, 8, 'red', 'blue', null, undefined, true];
        
        testCases.forEach(type => {
            const { unmount } = render(<Cell type={type} />);
            const cell = screen.getByTestId('cell');
            expect(cell).toHaveClass('cell');
            unmount();
        });
    });

    test('should not have conflicting classes', () => {
        render(<Cell type="red" />);
        
        const cell = screen.getByTestId('cell');
        expect(cell).toHaveClass('cell', 'filled', 'red');
        expect(cell).not.toHaveClass('empty', 'penalty');
    });

    test('should handle penalty type correctly', () => {
        render(<Cell type={8} />);
        
        const cell = screen.getByTestId('cell');
        expect(cell).toHaveClass('cell', 'penalty');
        expect(cell).not.toHaveClass('empty', 'filled');
    });
});
