
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");

const Player = require('./classes/Player');
const Board = require('./classes/Board');
const { Tetromino } = require('./classes/Tetromino');
const {
    canPlace,
    rotatePieceWithKicks,
    movePiece,
    lockPiece,
    clearLines,
    renderWithPiece,
} = require('./logic/gameLogic');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const publicPath = path.join(__dirname, '..', 'public');

app.use(express.static(publicPath));

app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

function serializePiece(piece) {
    return { shape: piece.shape, color: piece.color };
}

function makePieceFromTetromino(t) {
    return { type: t.type, shape: t.shape, color: t.color, x: 3, y: 0, r: 0 };
}

function handleGameTick(player, socket) {
    const grid = player.board.grid;
    const canFall = canPlace(grid, player.currentPiece, 0, 1);

    if (canFall) {
        player.currentPiece = movePiece(player.currentPiece, 0, 1);
    } else {
        const locked = lockPiece(grid, player.currentPiece);
        const { grid: cleared } = clearLines(locked);
        player.board.grid = cleared;
        const t = player.nextPiece;
        player.currentPiece = makePieceFromTetromino(t);
        player.nextPiece = new Tetromino();
        if (!canPlace(player.board.grid, player.currentPiece, 0, 0)) {
            console.log("Game Over for", socket.id);
            socket.emit('gameOver');
            if (player.gameLoop) clearInterval(player.gameLoop);
            return;
        }
    }

    const boardWithPiece = renderWithPiece(player.board.grid, player.currentPiece);
    socket.emit('updateBoard', {
        board: boardWithPiece,
        nextPiece: serializePiece(makePieceFromTetromino(player.nextPiece))
    });
}

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    const player = new Player(socket.id);
    player.board = new Board();
    const t0 = new Tetromino();
    player.currentPiece = makePieceFromTetromino(t0);
    player.nextPiece = new Tetromino();

    socket.emit('updateBoard', {
        board: renderWithPiece(player.board.grid, player.currentPiece),
        nextPiece: serializePiece(makePieceFromTetromino(player.nextPiece))
    });

    player.gameLoop = setInterval(() => {
        handleGameTick(player, socket);
    }, 1000);

    socket.on('move', ({ direction }) => {
        const grid = player.board.grid;
        if (direction === 'hardDrop') {
            let falling = player.currentPiece;
            while (canPlace(grid, falling, 0, 1)) {
                falling = movePiece(falling, 0, 1);
            }
            player.currentPiece = falling;
            handleGameTick(player, socket);
            return;
        }

        if (direction === 'rotate') {
            const rotated = rotatePieceWithKicks(grid, player.currentPiece, 'CW');
            player.currentPiece = rotated;
        } else {
            let dx = 0, dy = 0;
            if (direction === 'left') dx = -1;
            if (direction === 'right') dx = 1;
            if (direction === 'down') dy = 1;

            const moved = movePiece(player.currentPiece, dx, dy);
            if (canPlace(grid, moved, 0, 0)) {
                player.currentPiece = moved;
            }
        }

        const boardWithPiece = renderWithPiece(player.board.grid, player.currentPiece);
        socket.emit('updateBoard', {
            board: boardWithPiece,
            nextPiece: serializePiece(makePieceFromTetromino(player.nextPiece))
        });
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        if (player.gameLoop) clearInterval(player.gameLoop);
    });
});

server.listen(PORT, () => {
    console.log(`Server is up on port ${PORT}`);
});
