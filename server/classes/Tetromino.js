const SHAPES = {
    'I': { shape: [[1, 1, 1, 1]], color: 'cyan' },
    'O': { shape: [[1, 1], [1, 1]], color: 'yellow' },
    'T': { shape: [[0, 1, 0], [1, 1, 1]], color: 'purple' },
    'L': { shape: [[0, 0, 1], [1, 1, 1]], color: 'orange' },
    'J': { shape: [[1, 0, 0], [1, 1, 1]], color: 'blue' },
    'S': { shape: [[0, 1, 1], [1, 1, 0]], color: 'green' },
    'Z': { shape: [[1, 1, 0], [0, 1, 1]], color: 'red' }
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
    }

    rotate() {
        const newShape = [];
        for (let y = 0; y < this.shape[0].length; y++) {
            const newRow = [];
            for (let x = 0; x < this.shape.length; x++) {
                newRow.push(this.shape[x][y]);
            }
            newShape.push(newRow);
        }
        this.shape = newShape.map(row => row.reverse());
    }
}

module.exports = { Tetromino, PIECE_TYPES };
