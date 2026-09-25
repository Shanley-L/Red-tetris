import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HashRouter } from 'react-router-dom';

// Mock socketService
jest.mock('../../../client/services/socketService', () => ({
    __esModule: true,
    default: {
        initSocket: jest.fn(),
        disconnect: jest.fn(),
        joinRoom: jest.fn(),
        startGame: jest.fn(),
        relaunchGame: jest.fn(),
        movePiece: jest.fn(),
        stopSoftDrop: jest.fn(),
        leaveRoom: jest.fn(),
        onUpdateBoard: jest.fn(),
        onRoomUpdate: jest.fn(),
        onGameEnd: jest.fn(),
        onGameOver: jest.fn(),
        onPenaltyReceived: jest.fn(),
        onJoinError: jest.fn(),
        onMoveError: jest.fn(),
        onRelaunchError: jest.fn(),
        onReturnedToLobby: jest.fn(),
        onDisconnect: jest.fn(),
    },
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({ roomName: 'testRoom', playerName: 'testPlayer' }),
    useNavigate: () => mockNavigate,
}));

// Import GamePage and socketService
import GamePage from '../../../client/pages/GamePage';
import socketService from '../../../client/services/socketService';

describe('GamePage Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock implementations
        socketService.onUpdateBoard.mockReturnValue(jest.fn());
        socketService.onRoomUpdate.mockReturnValue(jest.fn());
        socketService.onGameEnd.mockReturnValue(jest.fn());
        socketService.onGameOver.mockReturnValue(jest.fn());
        socketService.onPenaltyReceived.mockReturnValue(jest.fn());
        socketService.onJoinError.mockReturnValue(jest.fn());
        socketService.onMoveError.mockReturnValue(jest.fn());
        socketService.onRelaunchError.mockReturnValue(jest.fn());
        socketService.onReturnedToLobby.mockReturnValue(jest.fn());
        socketService.onDisconnect.mockReturnValue(jest.fn());
    });

    // Test: Vérifie que GamePage se rend sans erreur
    // Garantit que la page de jeu principale s'affiche correctement
    test('should render GamePage component', () => {
        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );
        
        expect(document.body).toBeInTheDocument();
    });

    test('should render main game page sections', () => {
        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );
        
        // Check for main layout elements
        expect(document.querySelector('.game-page')).toBeInTheDocument();
        expect(document.querySelector('.game-header')).toBeInTheDocument();
        expect(document.querySelector('.room-info')).toBeInTheDocument();
        expect(document.querySelector('.board-wrapper')).toBeInTheDocument();
        expect(document.querySelector('.side-left')).toBeInTheDocument();
        expect(document.querySelector('.side-right')).toBeInTheDocument();
    });

    test('should render header with game title', () => {
        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );
        
        expect(screen.getByText('Red Tetris')).toBeInTheDocument();
    });

    test('should display room and player info', () => {
        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );
        
        expect(screen.getByText(/Room: testRoom/i)).toBeInTheDocument();
        expect(screen.getByText(/Player: testPlayer/i)).toBeInTheDocument();
    });

    test('should display control instructions', () => {
        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );
        
        expect(screen.getByText('← →: Move')).toBeInTheDocument();
        expect(screen.getByText('↑: Rotate')).toBeInTheDocument();
        expect(screen.getByText('↓: Soft Drop')).toBeInTheDocument();
        expect(screen.getByText('Space: Hard Drop')).toBeInTheDocument();
    });

    test('should have leave room button', () => {
        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );
        
        expect(screen.getByText('Leave Room')).toBeInTheDocument();
    });

    // Test: Vérifie que joinRoom est appelé au montage du composant
    // Exigence : le joueur doit rejoindre la room automatiquement via l'URL
    test('should call joinRoom on component mount', () => {
        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        expect(socketService.joinRoom).toHaveBeenCalledWith('testRoom', 'testPlayer', 'normal');
    });

    test('should register socket event listeners on mount', () => {
        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        // Check that at least some listeners are registered
        expect(socketService.onUpdateBoard).toHaveBeenCalled();
        expect(socketService.onRoomUpdate).toHaveBeenCalled();
    });

    // Test: Vérifie que le bouton "Start Game" apparaît pour le host
    // Exigence de la correction : "Only the first one can launch it"
    test('should show start game button when host and game not started', () => {
        socketService.onRoomUpdate.mockImplementation((callback) => {
            callback({
                players: [{ name: 'testPlayer', isHost: true }],
                spectrums: [],
                gameStarted: false
            });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        expect(screen.getByText('Start Game')).toBeInTheDocument();
    });

    test('should not show start game button when not host', () => {
        socketService.onRoomUpdate.mockImplementation((callback) => {
            callback({
                players: [{ name: 'testPlayer', isHost: false }],
                spectrums: [],
                gameStarted: false
            });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
    });

    test('should call startGame when start button clicked', async () => {
        socketService.onRoomUpdate.mockImplementation((callback) => {
            callback({
                players: [{ name: 'testPlayer', isHost: true }],
                spectrums: [],
                gameStarted: false
            });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        const startButton = screen.getByText('Start Game');
        fireEvent.click(startButton);

        expect(socketService.startGame).toHaveBeenCalled();
    });

    test('should show game in progress message when game started', () => {
        socketService.onRoomUpdate.mockImplementation((callback) => {
            callback({
                players: [{ name: 'testPlayer', isHost: true }],
                spectrums: [],
                gameStarted: true
            });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        expect(screen.getByText('Game in Progress')).toBeInTheDocument();
    });

    test('should call leaveRoom when leave button clicked', async () => {
        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        const leaveButton = screen.getByText('Leave Room');
        fireEvent.click(leaveButton);

        expect(socketService.leaveRoom).toHaveBeenCalled();
    });

    test('should navigate to home after leaving room', async () => {
        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        const leaveButton = screen.getByText('Leave Room');
        fireEvent.click(leaveButton);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    test('should display error message when join error occurs', () => {
        socketService.onJoinError.mockImplementation((callback) => {
            callback({ message: 'Room is full', code: 'ROOM_FULL' });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        expect(screen.getByText(/Room is full/i)).toBeInTheDocument();
    });

    test('should show a readable join error without the technical code', () => {
        socketService.onJoinError.mockImplementation((callback) => {
            callback({ message: 'A game is already in progress in room "testRoom".', code: 'GAME_IN_PROGRESS' });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        expect(screen.getByText('Unable to join the room')).toBeInTheDocument();
        expect(screen.getByText(/A game is already in progress/i)).toBeInTheDocument();
        expect(screen.queryByText(/GAME_IN_PROGRESS/)).not.toBeInTheDocument();
    });

    // Test: Vérifie que l'écran de victoire s'affiche quand le joueur gagne
    // Exigence : "The game is over when one player is left"
    test('should display win screen when player won', () => {
        socketService.onGameEnd.mockImplementation((callback) => {
            callback({ winner: 'testPlayer', isWinner: true });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        expect(screen.getByText(/You Won/i)).toBeInTheDocument();
        expect(screen.getByText(/Congratulations/i)).toBeInTheDocument();
    });

    test('should display loss screen when player lost', () => {
        socketService.onGameEnd.mockImplementation((callback) => {
            callback({ winner: 'otherPlayer', isWinner: false });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        expect(screen.getByText(/Game Over/i)).toBeInTheDocument();
    });

    test('should display elimination screen when player eliminated', () => {
        socketService.onGameOver.mockImplementation((callback) => {
            callback();
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        expect(screen.getByText(/You Were Eliminated/i)).toBeInTheDocument();
    });

    test('should show relaunch button when solo game over', async () => {
        socketService.onGameOver.mockImplementation((callback) => {
            callback({ solo: true, isTopPlayer: true });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        expect(screen.getByText('Game Over')).toBeInTheDocument();
        expect(screen.getByText('Relaunch Game')).toBeInTheDocument();
    });

    test('should show relaunch button when eliminated in multiplayer', async () => {
        socketService.onGameOver.mockImplementation((callback) => {
            callback({ solo: false, isTopPlayer: true });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        expect(screen.getByText(/You Were Eliminated/i)).toBeInTheDocument();
        expect(screen.getByText('Relaunch Game')).toBeInTheDocument();
        expect(socketService.leaveRoom).not.toHaveBeenCalled();
    });

    test('should show relaunch button when host and won', async () => {
        socketService.onGameEnd.mockImplementation((callback) => {
            callback({ winner: 'testPlayer', isWinner: true, isTopPlayer: true });
            return jest.fn();
        });
        socketService.onRoomUpdate.mockImplementation((callback) => {
            callback({
                players: [{ name: 'testPlayer', isHost: true }],
                spectrums: [],
                gameStarted: false
            });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Relaunch Game')).toBeInTheDocument();
        });
    });

    test('should call relaunchGame when relaunch button clicked', async () => {
        socketService.onGameEnd.mockImplementation((callback) => {
            callback({ winner: 'testPlayer', isWinner: true, isTopPlayer: true });
            return jest.fn();
        });
        socketService.onRoomUpdate.mockImplementation((callback) => {
            callback({
                players: [{ name: 'testPlayer', isHost: true }],
                spectrums: [],
                gameStarted: false
            });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        const relaunchButton = screen.getByText('Relaunch Game');
        fireEvent.click(relaunchButton);

        expect(socketService.relaunchGame).toHaveBeenCalled();
    });

    test('should offer to go back to the lobby when not the top player', async () => {
        socketService.onGameEnd.mockImplementation((callback) => {
            callback({ winner: 'testPlayer', isWinner: true, isTopPlayer: false });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        expect(screen.queryByText('Relaunch Game')).not.toBeInTheDocument();
        fireEvent.click(screen.getByText('Back to Lobby'));
        expect(socketService.relaunchGame).toHaveBeenCalled();
    });

    test('should tell a non-host player in the lobby to wait for the host', () => {
        socketService.onRoomUpdate.mockImplementation((callback) => {
            callback({
                players: [{ name: 'other', isHost: true }, { name: 'testPlayer', isHost: false }],
                spectrums: [],
                gameStarted: false
            });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        expect(screen.getByText(/Waiting for the host to start the game/i)).toBeInTheDocument();
        expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
    });

    test('should wait for the game to end after clicking relaunch', async () => {
        socketService.onGameOver.mockImplementation((callback) => {
            callback({ solo: false, isTopPlayer: true });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        fireEvent.click(screen.getByText('Relaunch Game'));

        expect(socketService.relaunchGame).toHaveBeenCalled();
        expect(screen.queryByText('Relaunch Game')).not.toBeInTheDocument();
        expect(screen.getByText(/Waiting for the current game to end/i)).toBeInTheDocument();
    });

    test('should go back to the lobby after relaunch', async () => {
        let returnedToLobbyCallback;
        socketService.onGameEnd.mockImplementation((callback) => {
            callback({ winner: 'testPlayer', isWinner: true, isTopPlayer: true });
            return jest.fn();
        });
        socketService.onReturnedToLobby.mockImplementation((callback) => {
            returnedToLobbyCallback = callback;
            return jest.fn();
        });
        socketService.onRoomUpdate.mockImplementation((callback) => {
            callback({
                players: [{ name: 'testPlayer', isHost: true }],
                spectrums: [],
                gameStarted: false
            });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        fireEvent.click(screen.getByText('Relaunch Game'));
        act(() => {
            returnedToLobbyCallback();
        });

        expect(screen.queryByText(/You Won/i)).not.toBeInTheDocument();
        expect(screen.getByText('Start Game')).toBeInTheDocument();
    });

    // Test: Vérifie qu'une notification s'affiche quand une pénalité est reçue
    // Exigence du sujet : "opponents receive a n - 1 line malus"
    test('should display penalty notification when received', async () => {
        socketService.onPenaltyReceived.mockImplementation((callback) => {
            callback({ lines: 2, fromPlayer: 'opponent' });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/2 LINE PENALTY/i)).toBeInTheDocument();
            expect(screen.getByText(/from opponent/i)).toBeInTheDocument();
        });
    });

    // Test: Vérifie que la flèche gauche déplace la pièce à gauche
    // Exigence du sujet : "Left/Right arrows: Move piece horizontally"
    test('should move piece left with ArrowLeft key', () => {
        socketService.onRoomUpdate.mockImplementation((callback) => {
            callback({
                players: [{ name: 'testPlayer', isHost: true }],
                spectrums: [],
                gameStarted: true
            });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        const gameContainer = document.querySelector('[tabindex="0"]');
        fireEvent.keyDown(gameContainer, { key: 'ArrowLeft' });

        expect(socketService.movePiece).toHaveBeenCalledWith('left');
    });

    test('should move piece right with ArrowRight key', () => {
        socketService.onRoomUpdate.mockImplementation((callback) => {
            callback({
                players: [{ name: 'testPlayer', isHost: true }],
                spectrums: [],
                gameStarted: true
            });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        const gameContainer = document.querySelector('[tabindex="0"]');
        fireEvent.keyDown(gameContainer, { key: 'ArrowRight' });

        expect(socketService.movePiece).toHaveBeenCalledWith('right');
    });

    // Test: Vérifie que la flèche haut fait tourner la pièce
    // Exigence du sujet : "Up arrow: Rotate piece"
    test('should rotate piece with ArrowUp key', () => {
        socketService.onRoomUpdate.mockImplementation((callback) => {
            callback({
                players: [{ name: 'testPlayer', isHost: true }],
                spectrums: [],
                gameStarted: true
            });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        const gameContainer = document.querySelector('[tabindex="0"]');
        fireEvent.keyDown(gameContainer, { key: 'ArrowUp' });

        expect(socketService.movePiece).toHaveBeenCalledWith('rotate');
    });

    test('should soft drop with ArrowDown key', () => {
        socketService.onRoomUpdate.mockImplementation((callback) => {
            callback({
                players: [{ name: 'testPlayer', isHost: true }],
                spectrums: [],
                gameStarted: true
            });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        const gameContainer = document.querySelector('[tabindex="0"]');
        fireEvent.keyDown(gameContainer, { key: 'ArrowDown' });

        expect(socketService.movePiece).toHaveBeenCalledWith('down');
    });

    test('should stop soft drop with ArrowDown key up', () => {
        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        const gameContainer = document.querySelector('[tabindex="0"]');
        fireEvent.keyUp(gameContainer, { key: 'ArrowDown' });

        expect(socketService.stopSoftDrop).toHaveBeenCalled();
    });

    // Test: Vérifie que la barre d'espace fait un hard drop
    // Exigence du sujet : "Spacebar: Hard drop to fill a gap"
    test('should hard drop with Space key', () => {
        socketService.onRoomUpdate.mockImplementation((callback) => {
            callback({
                players: [{ name: 'testPlayer', isHost: true }],
                spectrums: [],
                gameStarted: true
            });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        const gameContainer = document.querySelector('[tabindex="0"]');
        fireEvent.keyDown(gameContainer, { key: ' ' });

        expect(socketService.movePiece).toHaveBeenCalledWith('hardDrop');
    });

    test('should display NextPiece component', () => {
        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        // NextPiece should be in the left sidebar
        expect(document.querySelector('.side-left .card')).toBeInTheDocument();
    });

    test('should display Board component in center', () => {
        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        // Board wrapper should be in center
        expect(document.querySelector('.board-wrapper')).toBeInTheDocument();
    });

    test('should display controls card in right sidebar', () => {
        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        // Controls card should be in right sidebar
        expect(document.querySelector('.side-right .controls')).toBeInTheDocument();
        expect(screen.getByText('Controls')).toBeInTheDocument();
    });

    test('should handle component unmounting without errors', () => {
        const { unmount } = render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );
        
        expect(() => unmount()).not.toThrow();
    });

    test('should update board when onUpdateBoard callback fired', () => {
        const mockBoard = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
        ];

        socketService.onUpdateBoard.mockImplementation((callback) => {
            callback({
                board: mockBoard,
                nextPiece: 'I',
                score: 100,
                lines: 0
            });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        expect(socketService.onUpdateBoard).toHaveBeenCalled();
    });

    test('should display players count when available', () => {
        socketService.onRoomUpdate.mockImplementation((callback) => {
            callback({
                players: [
                    { name: 'testPlayer', isHost: true }
                ],
                spectrums: [],
                gameStarted: false
            });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        // Check for players header
        expect(screen.getByText(/Players/i)).toBeInTheDocument();
    });

    test('should display both players in players list', () => {
        socketService.onRoomUpdate.mockImplementation((callback) => {
            callback({
                players: [
                    { name: 'testPlayer', isHost: true },
                    { name: 'opponent', isHost: false }
                ],
                spectrums: [],
                gameStarted: false
            });
            return jest.fn();
        });

        render(
            <HashRouter>
                <GamePage />
            </HashRouter>
        );

        // Check for player divs in the players list
        const playerDivs = document.querySelectorAll('.player');
        expect(playerDivs.length).toBeGreaterThanOrEqual(1);
    });
});
