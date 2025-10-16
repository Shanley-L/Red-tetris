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

// Alternate shape set for the "new bricks" bonus mode (7 new 4x4 forms)
const NEWBRICK_SHAPES = {
    // 0100
    // 1110
    // 0100
    // 0000
    'A': { shape: [
        [0,1,0,0],
        [1,1,1,0],
        [0,1,0,0],
        [0,0,0,0]
    ], color: 'teal' },

    // 1100
    // 1110
    // 0000
    // 0000
    'B': { shape: [
        [1,1,0,0],
        [1,1,1,0],
        [0,0,0,0],
        [0,0,0,0]
    ], color: 'goldenrod' },

    // 1110
    // 1000
    // 0100
    // 0000
    'C': { shape: [
        [1,1,1,0],
        [1,0,0,0],
        [0,1,0,0],
        [0,0,0,0]
    ], color: 'magenta' },

    // 0110
    // 1100
    // 0100
    // 0000
    'D': { shape: [
        [0,1,1,0],
        [1,1,0,0],
        [0,1,0,0],
        [0,0,0,0]
    ], color: 'brown' },

    // 1000
    // 1100
    // 0110
    // 0010
    'E': { shape: [
        [1,0,0,0],
        [1,1,0,0],
        [0,1,1,0],
        [0,0,1,0]
    ], color: 'dodgerblue' },

    // 1110
    // 1010
    // 1110
    // 0000
    'F': { shape: [
        [1,1,1,0],
        [1,0,1,0],
        [1,1,1,0],
        [0,0,0,0]
    ], color: 'darkorange' },

    // 1010
    // 1110
    // 0000
    // 0000
    'G': { shape: [
        [1,0,1,0],
        [1,1,1,0],
        [0,0,0,0],
        [0,0,0,0]
    ], color: 'darkgreen' }
};

const NEWBRICK_TYPES = 'ABCDEFG';

class Tetromino {
    constructor(type, randomFn = Math.random, modeKey = 'classic') {
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
