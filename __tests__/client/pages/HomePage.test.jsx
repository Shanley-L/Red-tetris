import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../../../client/pages/HomePage';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

const renderHomePage = () => {
    return render(
        <BrowserRouter>
            <HomePage />
        </BrowserRouter>
    );
};

describe('HomePage Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should render home page with title', () => {
        renderHomePage();
        
        expect(screen.getByText('Red Tetris')).toBeInTheDocument();
    });

    test('should render form with room name and player name inputs', () => {
        renderHomePage();
        
        expect(screen.getByPlaceholderText('Room Name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Your Name')).toBeInTheDocument();
        expect(screen.getByText('Join Game')).toBeInTheDocument();
    });

    test('should render input validation info', () => {
        renderHomePage();
        
        expect(screen.getByText('Only letters and numbers are allowed in room names and player names')).toBeInTheDocument();
    });

    test('should render footer message', () => {
        renderHomePage();
        
        expect(screen.getByText('Have fun & stack those blocks!')).toBeInTheDocument();
    });

    test('should handle room name input change', () => {
        renderHomePage();
        
        const roomNameInput = screen.getByPlaceholderText('Room Name');
        fireEvent.change(roomNameInput, { target: { value: 'testRoom123' } });
        
        expect(roomNameInput.value).toBe('testRoom123');
    });

    test('should handle player name input change', () => {
        renderHomePage();
        
        const playerNameInput = screen.getByPlaceholderText('Your Name');
        fireEvent.change(playerNameInput, { target: { value: 'testPlayer456' } });
        
        expect(playerNameInput.value).toBe('testPlayer456');
    });

    test('should validate input to only allow letters and numbers', () => {
        renderHomePage();
        
        const roomNameInput = screen.getByPlaceholderText('Room Name');
        const playerNameInput = screen.getByPlaceholderText('Your Name');
        
        // Test with special characters
        fireEvent.change(roomNameInput, { target: { value: 'test@room#123' } });
        fireEvent.change(playerNameInput, { target: { value: 'player$name%456' } });
        
        // Should only contain letters and numbers
        expect(roomNameInput.value).toBe('testroom123');
        expect(playerNameInput.value).toBe('playername456');
    });

    test('should handle form submission with valid data', () => {
        renderHomePage();
        
        const roomNameInput = screen.getByPlaceholderText('Room Name');
        const playerNameInput = screen.getByPlaceholderText('Your Name');
        const submitButton = screen.getByText('Join Game');
        
        fireEvent.change(roomNameInput, { target: { value: 'testRoom' } });
        fireEvent.change(playerNameInput, { target: { value: 'testPlayer' } });
        fireEvent.click(submitButton);
        
        expect(mockNavigate).toHaveBeenCalledWith('/testRoom/testPlayer');
    });

    test('should not submit form with empty room name', () => {
        renderHomePage();
        
        const playerNameInput = screen.getByPlaceholderText('Your Name');
        const submitButton = screen.getByText('Join Game');
        
        fireEvent.change(playerNameInput, { target: { value: 'testPlayer' } });
        fireEvent.click(submitButton);
        
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('should not submit form with empty player name', () => {
        renderHomePage();
        
        const roomNameInput = screen.getByPlaceholderText('Room Name');
        const submitButton = screen.getByText('Join Game');
        
        fireEvent.change(roomNameInput, { target: { value: 'testRoom' } });
        fireEvent.click(submitButton);
        
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('should handle form submission via Enter key', () => {
        renderHomePage();
        
        const roomNameInput = screen.getByPlaceholderText('Room Name');
        const playerNameInput = screen.getByPlaceholderText('Your Name');
        
        fireEvent.change(roomNameInput, { target: { value: 'testRoom' } });
        fireEvent.change(playerNameInput, { target: { value: 'testPlayer' } });
        
        // Simulate Enter key press on the form (which should trigger submit)
        const form = roomNameInput.closest('form');
        fireEvent.submit(form);
        
        expect(mockNavigate).toHaveBeenCalledWith('/testRoom/testPlayer');
    });

    test('should render animated tetris pieces', () => {
        renderHomePage();
        
        // Check that tetris pieces are rendered (they should have the tetris-piece class)
        const tetrisPieces = document.querySelectorAll('.tetris-piece');
        expect(tetrisPieces.length).toBeGreaterThan(0);
    });

    test('should have proper form structure', () => {
        renderHomePage();
        
        const inputs = screen.getAllByRole('textbox');
        expect(inputs).toHaveLength(2);
        
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(2);
    });

    test('should have required attributes on inputs', () => {
        renderHomePage();
        
        const roomNameInput = screen.getByPlaceholderText('Room Name');
        const playerNameInput = screen.getByPlaceholderText('Your Name');
        
        expect(roomNameInput).toHaveAttribute('required');
        expect(playerNameInput).toHaveAttribute('required');
    });

    test('should handle input validation with mixed characters', () => {
        renderHomePage();
        
        const roomNameInput = screen.getByPlaceholderText('Room Name');
        
        // Test with mixed valid and invalid characters
        fireEvent.change(roomNameInput, { target: { value: 'test123@#$room456' } });
        
        // Should only keep letters and numbers
        expect(roomNameInput.value).toBe('test123room456');
    });

    test('should handle empty input validation', () => {
        renderHomePage();
        
        const roomNameInput = screen.getByPlaceholderText('Room Name');
        
        // Test with empty string
        fireEvent.change(roomNameInput, { target: { value: '' } });
        expect(roomNameInput.value).toBe('');
        
        // Test with only special characters
        fireEvent.change(roomNameInput, { target: { value: '@#$%^&*()' } });
        expect(roomNameInput.value).toBe('');
    });

    test('should maintain input focus after validation', () => {
        renderHomePage();
        
        const roomNameInput = screen.getByPlaceholderText('Room Name');
        roomNameInput.focus();
        
        fireEvent.change(roomNameInput, { target: { value: 'test@room' } });
        
        // Input should still be focused after validation
        expect(document.activeElement).toBe(roomNameInput);
    });

    test('should render with proper CSS classes', () => {
        renderHomePage();
        
        const homePage = document.querySelector('.home-page');
        expect(homePage).toBeInTheDocument();
        
        const title = screen.getByText('Red Tetris');
        expect(title).toHaveClass('title');
    });

    test('should handle multiple rapid input changes', () => {
        renderHomePage();
        
        const roomNameInput = screen.getByPlaceholderText('Room Name');
        
        // Simulate rapid typing
        fireEvent.change(roomNameInput, { target: { value: 't' } });
        fireEvent.change(roomNameInput, { target: { value: 'te' } });
        fireEvent.change(roomNameInput, { target: { value: 'test@' } });
        fireEvent.change(roomNameInput, { target: { value: 'test@room' } });
        
        expect(roomNameInput.value).toBe('testroom');
    });

    test('should handle form submission with whitespace in inputs', () => {
        renderHomePage();
        
        const roomNameInput = screen.getByPlaceholderText('Room Name');
        const playerNameInput = screen.getByPlaceholderText('Your Name');
        
        fireEvent.change(roomNameInput, { target: { value: '  testRoom  ' } });
        fireEvent.change(playerNameInput, { target: { value: '  testPlayer  ' } });
        
        // Input validation should clean non-alphanumeric characters
        expect(roomNameInput.value).toBe('testRoom');
        expect(playerNameInput.value).toBe('testPlayer');
        
        // But navigation should still work
        const submitButton = screen.getByText('Join Game');
        fireEvent.click(submitButton);
        
        expect(mockNavigate).toHaveBeenCalledWith('/testRoom/testPlayer');
    });
});
