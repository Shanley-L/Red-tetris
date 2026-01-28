const Player = require('../../../server/classes/Player');

describe('Player Class', () => {
    let player;

    beforeEach(() => {
        player = new Player('test-socket-id');
    });

    // Test: Vérifie que Player est créé avec un socketId
    // Le socketId identifie de manière unique un joueur dans une session
    test('should create player with socket ID', () => {
        expect(player.socketId).toBe('test-socket-id');
    });

    // Test: Vérifie que Player initialise toutes ses propriétés avec des valeurs par défaut
    // Garantit que le joueur est dans un état cohérent au démarrage
    test('should initialize with default values', () => {
        expect(player.name).toBe('Player');
        expect(player.board).toBeNull();
        expect(player.currentPiece).toBeNull();
        expect(player.gameLoop).toBeNull();
        expect(player.isSoftDropping).toBe(false);
        expect(player.softDropTimer).toBeNull();
        expect(player.needsNewPiece).toBe(false);
        expect(player.pieceSequence).toEqual([]);
        expect(player.sequenceIndex).toBe(0);
    });

    // Test: Vérifie que les propriétés d'un Player peuvent être modifiées
    // Important pour la gestion dynamique de l'état du joueur pendant le jeu
    test('should allow setting properties', () => {
        player.name = 'TestPlayer';
        player.isSoftDropping = true;
        player.sequenceIndex = 5;
        
        expect(player.name).toBe('TestPlayer');
        expect(player.isSoftDropping).toBe(true);
        expect(player.sequenceIndex).toBe(5);
    });

    // Test: Vérifie que Player gère correctement la séquence de pièces
    // Exigence du sujet : "players receive the same sequence of blocks"
    test('should handle piece sequence operations', () => {
        const mockSequence = [
            { type: 'I', shape: [[1,1,1,1]], color: 'cyan' },
            { type: 'O', shape: [[1,1],[1,1]], color: 'yellow' }
        ];
        
        player.pieceSequence = mockSequence;
        player.sequenceIndex = 1;
        
        expect(player.pieceSequence).toEqual(mockSequence);
        expect(player.sequenceIndex).toBe(1);
    });

    // Test: Vérifie que Player gère les timers (gameLoop, softDropTimer)
    // Les timers contrôlent la chute automatique et le soft drop
    test('should handle timer properties', () => {
        const mockTimer = setInterval(() => {}, 1000);
        
        player.gameLoop = mockTimer;
        player.softDropTimer = mockTimer;
        
        expect(player.gameLoop).toBe(mockTimer);
        expect(player.softDropTimer).toBe(mockTimer);
        
        // Clean up
        clearInterval(mockTimer);
    });
});
