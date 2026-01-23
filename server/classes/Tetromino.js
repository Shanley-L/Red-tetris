const SHAPES = {
    // Use SRS bounding boxes: I=4x4, O=2x2, others=3x3 with bottom row empty
    'I': { shape: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ], color: 'cyan' },
    'O': { shape: [[1, 1], [1, 1]], color: 'yellow' },
    'T': { shape: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ], color: 'purple' },
    'L': { shape: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ], color: 'orange' },
    'J': { shape: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ], color: 'blue' },
    'S': { shape: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ], color: 'green' },
    'Z': { shape: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ], color: 'red' }
};

const PIECE_TYPES = 'IOTLJSZ';

const NEWBRICK_SHAPES = {
    // 0110
    // 1100
    // 0000
    // 0000
    'A': { shape: [
        [1,1,1,1],
        [1,1,0,0],
        [0,0,0,0],
        [0,0,0,0]
    ], color: 'teal' }, // diagonale inversée du S

    // 0100
    // 1110
    // 1000
    // 0000
    'B': { shape: [
        [0,1,1,0],
        [1,1,1,0],
        [0,1,0,0],
        [0,0,0,0]
    ], color: 'goldenrod' }, // T modifié avec une queue

    // 1110
    // 0100
    // 0100
    // 0000
    'C': { shape: [
        [1,1,1,0],
        [0,1,0,0],
        [0,1,0,0],
        [0,0,0,0]
    ], color: 'magenta' }, // T long

    // 0110
    // 0110
    // 0100
    // 0000
    'D': { shape: [
        [0,1,1,0],
        [0,1,1,0],
        [0,1,0,0],
        [0,1,0,0]
    ], color: 'brown' }, // carré avec tige

    // 1100
    // 0110
    // 0010
    // 0000
    'E': { shape: [
        [1,1,0,0],
        [0,1,1,0],
        [0,0,1,0],
        [0,0,0,0]
    ], color: 'dodgerblue' }, // serpentin à 3 niveaux

    // 1110
    // 0010
    // 0010
    // 0000
    'F': { shape: [
        [1,1,1,0],
        [0,0,1,0],
        [0,0,1,0],
        [0,0,0,0]
    ], color: 'darkorange' }, // L étiré

    // 0100
    // 1110
    // 0100
    // 0100
    'G': { shape: [
        [0,0,0,0],
        [1,1,1,0],
        [0,1,0,0],
        [0,0,0,0]
    ], color: 'darkgreen' } // T avec extension verticale
};

const NEWBRICK_TYPES = 'ABCDEFG';

class Tetromino {
    constructor(type, randomFn = Math.random, modeKey = 'classic') {
        /* istanbul ignore next */
        // bonus-newbrick mode is out of scope for mandatory coverage
        const useNewBrick = modeKey === 'bonus-newbrick';
        const shapes = useNewBrick ? NEWBRICK_SHAPES : SHAPES;
        const types = useNewBrick ? NEWBRICK_TYPES : PIECE_TYPES;

        if (!type) {
            type = types[Math.floor(randomFn() * types.length)];
        }
        const piece = shapes[type];

        this.type = type;
        this.shape = piece.shape;
        this.color = piece.color;
        this.x = 3;
        this.y = 0;
        this.r = 0; // rotation state: 0,1,2,3
    }
}

module.exports = { Tetromino, PIECE_TYPES };
