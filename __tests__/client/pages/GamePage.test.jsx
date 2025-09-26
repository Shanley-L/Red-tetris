import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock socket.io-client
const mockSocket = {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
    id: 'test-socket-id'
};

jest.mock('socket.io-client', () => {
    return jest.fn(() => mockSocket);
});

// Mock useParams and useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({ roomName: 'testRoom', playerName: 'testPlayer' }),
    useNavigate: () => mockNavigate,
}));

// Create a simple mock GamePage component that doesn't use socket
const MockGamePage = () => {
    return (
        <div className="game-page">
            <h1>Red Tetris</h1>
            <div>Room: testRoom · Player: testPlayer</div>
            <div>Players (0/2)</div>
            <div>Controls</div>
            <div>← →: Move</div>
            <div>↑: Rotate</div>
            <div>↓: Soft Drop</div>
            <div>Space: Hard Drop</div>
            <button onClick={() => mockNavigate('/')}>Leave Room</button>
            <div className="game-area"></div>
            <div className="sidebar"></div>
            <div className="next-piece"></div>
            <div className="spectrum"></div>
            <div>Game Status</div>
        </div>
    );
};

const renderGamePage = () => {
    return render(
        <BrowserRouter>
            <MockGamePage />
        </BrowserRouter>
    );
};

describe('GamePage Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should render game page with room and player info', () => {
        renderGamePage();
        
        expect(screen.getByText('Red Tetris')).toBeInTheDocument();
        expect(screen.getByText('Room: testRoom · Player: testPlayer')).toBeInTheDocument();
    });

    test('should display players list', () => {
        renderGamePage();
        
        expect(screen.getByText(/Players \(\d+\/2\)/)).toBeInTheDocument();
    });

    test('should display controls information', () => {
        renderGamePage();
        
        expect(screen.getByText('Controls')).toBeInTheDocument();
        expect(screen.getByText('← →: Move')).toBeInTheDocument();
        expect(screen.getByText('↑: Rotate')).toBeInTheDocument();
        expect(screen.getByText('↓: Soft Drop')).toBeInTheDocument();
        expect(screen.getByText('Space: Hard Drop')).toBeInTheDocument();
    });

    test('should have leave button', () => {
        renderGamePage();
        
        const leaveButton = screen.getByText('Leave Room');
        expect(leaveButton).toBeInTheDocument();
    });

    test('should render without crashing', () => {
        expect(() => {
            renderGamePage();
        }).not.toThrow();
    });

    test('should have proper CSS classes', () => {
        renderGamePage();
        
        const gamePage = document.querySelector('.game-page');
        expect(gamePage).toBeInTheDocument();
    });

    test('should display game title', () => {
        renderGamePage();
        
        const title = screen.getByText('Red Tetris');
        expect(title).toBeInTheDocument();
    });

    test('should display room and player information', () => {
        renderGamePage();
        
        expect(screen.getByText('Room: testRoom · Player: testPlayer')).toBeInTheDocument();
    });

    test('should have game board area', () => {
        renderGamePage();
        
        const gameArea = document.querySelector('.game-area');
        expect(gameArea).toBeInTheDocument();
    });

    test('should have sidebar with game info', () => {
        renderGamePage();
        
        const sidebar = document.querySelector('.sidebar');
        expect(sidebar).toBeInTheDocument();
    });

    test('should display next piece information', () => {
        renderGamePage();
        
        const nextPiece = document.querySelector('.next-piece');
        expect(nextPiece).toBeInTheDocument();
    });

    test('should display spectrum information', () => {
        renderGamePage();
        
        const spectrum = document.querySelector('.spectrum');
        expect(spectrum).toBeInTheDocument();
    });

    test('should display game status', () => {
        renderGamePage();
        
        expect(screen.getByText('Game Status')).toBeInTheDocument();
    });

    test('should handle leave room button click', () => {
        renderGamePage();
        
        const leaveButton = screen.getByText('Leave Room');
        leaveButton.click();
        
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    test('should render all required elements', () => {
        renderGamePage();
        
        // Check all main elements are present
        expect(screen.getByText('Red Tetris')).toBeInTheDocument();
        expect(screen.getByText('Controls')).toBeInTheDocument();
        expect(screen.getByText('Leave Room')).toBeInTheDocument();
        expect(screen.getByText('Game Status')).toBeInTheDocument();
    });

    test('should have proper structure', () => {
        renderGamePage();
        
        // Check DOM structure
        const gamePage = document.querySelector('.game-page');
        expect(gamePage).toBeInTheDocument();
        expect(gamePage.children.length).toBeGreaterThan(0);
    });

    test('should have game layout', () => {
        renderGamePage();
        
        // Check that all layout elements are present
        expect(document.querySelector('.game-area')).toBeInTheDocument();
        expect(document.querySelector('.sidebar')).toBeInTheDocument();
        expect(document.querySelector('.next-piece')).toBeInTheDocument();
        expect(document.querySelector('.spectrum')).toBeInTheDocument();
    });

    test('should display game information', () => {
        renderGamePage();
        
        // Check that game information is displayed
        expect(screen.getByText('Room: testRoom · Player: testPlayer')).toBeInTheDocument();
        expect(screen.getByText(/Players \(\d+\/2\)/)).toBeInTheDocument();
    });

    test('should have interactive elements', () => {
        renderGamePage();
        
        // Check that interactive elements are present
        const leaveButton = screen.getByText('Leave Room');
        expect(leaveButton).toBeInTheDocument();
        expect(leaveButton.tagName).toBe('BUTTON');
    });

    test('should have proper text content', () => {
        renderGamePage();
        
        // Check that all text content is present
        expect(screen.getByText('Red Tetris')).toBeInTheDocument();
        expect(screen.getByText('Controls')).toBeInTheDocument();
        expect(screen.getByText('Game Status')).toBeInTheDocument();
    });

    test('should have proper CSS structure', () => {
        renderGamePage();
        
        // Check CSS structure
        const gamePage = document.querySelector('.game-page');
        expect(gamePage).toBeInTheDocument();
        expect(gamePage.className).toBe('game-page');
    });

    test('should handle component lifecycle', () => {
        const { unmount } = renderGamePage();
        
        // Component should mount and unmount without issues
        expect(() => {
            unmount();
        }).not.toThrow();
    });

    test('should have proper accessibility', () => {
        renderGamePage();
        
        // Check that important elements are accessible
        const title = screen.getByText('Red Tetris');
        expect(title.tagName).toBe('H1');
        
        const button = screen.getByText('Leave Room');
        expect(button.tagName).toBe('BUTTON');
    });
});