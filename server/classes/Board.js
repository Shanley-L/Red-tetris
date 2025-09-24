class Board {
    constructor() {
        this.width = 10;
        this.height = 20;
        this.grid = this.createEmptyGrid();
    }

    createEmptyGrid() {
        return Array.from({ length: this.height }, () => Array(this.width).fill(0));
    }
}

module.exports = Board;
