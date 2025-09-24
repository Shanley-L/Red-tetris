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

class Tetromino {
    constructor(type) {
        if (!type) {
            type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
        }
        const piece = SHAPES[type];

        this.type = type;
        this.shape = piece.shape;
        this.color = piece.color;
        this.x = 3;
        this.y = 0;
        this.r = 0; // rotation state: 0,1,2,3
    }
}

module.exports = { Tetromino, PIECE_TYPES };
