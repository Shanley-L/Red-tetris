const Board = require('../../../server/classes/Board');

describe('Board Class', () => {
    let board;

    beforeEach(() => {
        board = new Board();
    });

    // Test: Vérifie que Board crée une grille avec les bonnes dimensions (10x20)
    // Exigence du sujet : "Each field is 10 columns wide and 20 rows tall"
    test('should create board with correct dimensions', () => {
        expect(board.width).toBe(10);
        expect(board.height).toBe(20);
    });

    // Test: Vérifie que Board initialise une grille vide (20 lignes, 10 colonnes)
    // Garantit que la structure de données est correcte au démarrage
    test('should create empty grid', () => {
        expect(board.grid).toBeDefined();
        expect(board.grid.length).toBe(20);
        expect(board.grid[0].length).toBe(10);
    });

    // Test: Vérifie que toutes les cellules sont initialisées à 0 (vide)
    // Garantit que la grille est complètement vide au départ
    test('should have all cells initialized to 0', () => {
        for (let y = 0; y < board.height; y++) {
            for (let x = 0; x < board.width; x++) {
                expect(board.grid[y][x]).toBe(0);
            }
        }
    });

    // Test: Vérifie que la grille peut être modifiée (ajout de blocs)
    // Important pour la logique de jeu : on doit pouvoir placer des blocs
    test('should allow grid modification', () => {
        board.grid[0][0] = 'red';
        board.grid[19][9] = 'blue';
        
        expect(board.grid[0][0]).toBe('red');
        expect(board.grid[19][9]).toBe('blue');
    });

    // Test: Vérifie que la structure de la grille est maintenue après modifications
    // Garantit que les dimensions restent correctes même après avoir rempli la grille
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
