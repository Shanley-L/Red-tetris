
function cloneGrid(grid) {
    return grid.map(row => row.slice());
}

function canPlace(grid, piece, offsetX = 0, offsetY = 0) {
    const height = grid.length;
    const width = grid[0]?.length || 0;

    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x] !== 0) {
                const newX = piece.x + x + offsetX;
                const newY = piece.y + y + offsetY;

                if (newX < 0 || newX >= width || newY >= height) return false;
                if (newY >= 0 && grid[newY][newX] !== 0) return false;
            }
        }
    }
    return true;
}

function rotateShape(shape) {
    // 90° clockwise rotation for any rectangular matrix
    const rows = shape.length;
    const cols = shape[0].length;
    const res = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            res[x][rows - 1 - y] = shape[y][x];
        }
    }
    return res;
}

function rotateShapeCCW(shape) {
    // 90° counter-clockwise rotation for any rectangular matrix
    const rows = shape.length;
    const cols = shape[0].length;
    const res = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            res[cols - 1 - x][y] = shape[y][x];
        }
    }
    return res;
}

// Super Rotation System (SRS) wall kick data
// Offsets are pairs (dx, dy) tested in order
const SRS_KICKS_JLSTZ = {
    '0>1': [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
    '1>2': [[0,0], [1,0], [1,-1], [0,2], [1,2]],
    '2>3': [[0,0], [1,0], [1,1], [0,-2], [1,-2]],
    '3>0': [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],
    '0>3': [[0,0], [1,0], [1,1], [0,-2], [1,-2]],
    '3>2': [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
    '2>1': [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],
    '1>0': [[0,0], [1,0], [1,-1], [0,2], [1,2]],
};

const SRS_KICKS_I = {
    '0>1': [[0,0], [-2,0], [1,0], [-2,-1], [1,2]],
    '1>2': [[0,0], [-1,0], [2,0], [-1,2], [2,-1]],
    '2>3': [[0,0], [2,0], [-1,0], [2,1], [-1,-2]],
    '3>0': [[0,0], [1,0], [-2,0], [1,-2], [-2,1]],
    '0>3': [[0,0], [2,0], [-1,0], [2,1], [-1,-2]],
    '3>2': [[0,0], [-1,0], [2,0], [-1,2], [2,-1]],
    '2>1': [[0,0], [1,0], [-2,0], [1,-2], [-2,1]],
    '1>0': [[0,0], [-2,0], [1,0], [-2,-1], [1,2]],
};

function getKicks(type, fromR, toR) {
    if (type === 'O') return [[0,0]]; // O piece stays centered in this simplified model
    const key = `${fromR}>${toR}`;
    if (type === 'I') return SRS_KICKS_I[key] || [[0,0]];
    return SRS_KICKS_JLSTZ[key] || [[0,0]];
}

// direction: 'CW' or 'CCW'
function rotatePieceWithKicks(grid, piece, direction) {
    const fromR = piece.r ?? 0;
    const toR = direction === 'CCW' ? (fromR + 3) % 4 : (fromR + 1) % 4;
    const rotatedShape = direction === 'CCW' ? rotateShapeCCW(piece.shape) : rotateShape(piece.shape);
    const kicks = getKicks(piece.type, fromR, toR);

    for (const [dx, dy] of kicks) {
        const candidate = { ...piece, shape: rotatedShape, r: toR, x: piece.x + dx, y: piece.y + dy };
        if (canPlace(grid, candidate, 0, 0)) {
            return candidate;
        }
    }
    return piece; // rotation failed, return original
}

function movePiece(piece, dx, dy) {
    return { ...piece, x: piece.x + dx, y: piece.y + dy };
}

function lockPiece(grid, piece) {
    const newGrid = cloneGrid(grid);
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x] !== 0) {
                const gx = piece.x + x;
                const gy = piece.y + y;
                if (gy >= 0 && gy < newGrid.length && gx >= 0 && gx < newGrid[0].length) {
                    newGrid[gy][gx] = piece.color || piece.shape[y][x];
                }
            }
        }
    }
    return newGrid;
}

function clearLines(grid) {
    const width = grid[0]?.length || 0;
    let linesCleared = 0;
    const newGrid = [];

    for (let y = 0; y < grid.length; y++) {
        // Only clear lines that are full AND don't contain penalty blocks (8)
        const full = grid[y].every(cell => cell !== 0 && cell !== 8);
        if (full) {
            linesCleared++;
        } else {
            newGrid.push(grid[y].slice());
        }
    }
    while (newGrid.length < grid.length) {
        newGrid.unshift(Array(width).fill(0));
    }
    return { grid: newGrid, linesCleared };
}

function addPenaltyLines(grid, numLines) {
    if (numLines <= 0) return grid;
    
    const width = grid[0]?.length || 0;
    const newGrid = cloneGrid(grid);
    
    // Add penalty lines at the bottom
    for (let i = 0; i < numLines; i++) {
        // Create a penalty line with random gaps (indestructible)
        const penaltyLine = Array(width).fill(8); // Use 8 to mark penalty blocks
        // Add random gaps to make it more interesting
        const gapCount = Math.floor(Math.random() * 3) + 1; // 1-3 gaps
        for (let j = 0; j < gapCount; j++) {
            const gapPos = Math.floor(Math.random() * width);
            penaltyLine[gapPos] = 0;
        }
        newGrid.push(penaltyLine);
    }
    
    // Remove lines from the top to maintain board height
    while (newGrid.length > 20) {
        newGrid.shift();
    }
    
    return newGrid;
}

function renderWithPiece(grid, piece) {
    const merged = cloneGrid(grid);
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x] !== 0) {
                const gx = piece.x + x;
                const gy = piece.y + y;
                if (gy >= 0 && gy < merged.length && gx >= 0 && gx < merged[0].length) {
                    merged[gy][gx] = piece.color || piece.shape[y][x];
                }
            }
        }
    }
    return merged;
}

module.exports = {
    cloneGrid,
    canPlace,
    rotateShape,
    rotateShapeCCW,
    rotatePieceWithKicks,
    movePiece,
    lockPiece,
    clearLines,
    addPenaltyLines,
    renderWithPiece,
};


