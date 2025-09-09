class Board {
    constructor() {
        this.width = 10;
        this.height = 20;
        this.grid = this.createEmptyGrid();
    }

    createEmptyGrid() {
        return Array.from({ length: this.height }, () => Array(this.width).fill(0));
    }

    getSpectrum() {
        const spectrum = Array(this.width).fill(0);
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.grid[y][x] !== 0) {
                    spectrum[x] = this.height - y;
                    break; // Move to the next column once the top block is found
                }
            }
        }
        return spectrum;
    }

    isValidMove(piece, offsetX = 0, offsetY = 0) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x] !== 0) {
                    const newX = piece.x + x + offsetX;
                    const newY = piece.y + y + offsetY;

                    if (newX < 0 || newX >= this.width || newY >= this.height) {
                        return false;
                    }
                    
                    if (newY >= 0 && this.grid[newY][newX] !== 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    addPenaltyLines(count) {
        for (let i = 0; i < count; i++) {
            this.grid.shift();
            const penaltyRow = Array(this.width).fill(8);
            this.grid.push(penaltyRow);
        }
    }

    clearLines() {
        let linesCleared = 0;
        for (let y = this.height - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0 && cell !== 8)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(this.width).fill(0));
                linesCleared++;
                y++;
            }
        }
        return linesCleared;
    }

    draw(piece) {
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const boardX = piece.x + x;
                    const boardY = piece.y + y;
                    if (boardY >= 0 && boardY < this.height && boardX >= 0 && boardX < this.width) {
                        this.grid[boardY][boardX] = value;
                    }
                }
            });
        });
    }

    clear(piece) {
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const boardX = piece.x + x;
                    const boardY = piece.y + y;
                    if (boardY >= 0 && boardY < this.height && boardX >= 0 && boardX < this.width) {
                        this.grid[boardY][boardX] = 0;
                    }
                }
            });
        });
    }

    print() {
        console.log('Board:');
        this.grid.forEach(row => console.log(row.join(' ')));
    }
}

module.exports = Board;
