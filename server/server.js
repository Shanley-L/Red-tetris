const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");

const Player = require('./classes/Player');
const Board = require('./classes/Board');
const Tetromino = require('./classes/Tetromino');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

function handleGameTick(player, socket) {
    player.board.clear(player.currentPiece);

    if (player.board.isValidMove(player.currentPiece, 0, 1)) {
        player.currentPiece.y++;
    } else {
        player.board.draw(player.currentPiece);
        player.board.clearLines();
        
        player.currentPiece = new Tetromino();
        if (!player.board.isValidMove(player.currentPiece, 0, 0)) {
            console.log("Game Over for", socket.id);
            socket.emit('gameOver');
            if (player.gameLoop) {
                clearInterval(player.gameLoop);
            }
            return;
        }
    }

    player.board.draw(player.currentPiece);
    socket.emit('updateBoard', player.board.grid);
}

io.on('connection', (socket) => {
    console.log(`a user connected: ${socket.id}`);
    
    const player = new Player(socket.id);
    player.board = new Board();
    player.currentPiece = new Tetromino();

    player.board.draw(player.currentPiece);
    socket.emit('updateBoard', player.board.grid);

    player.gameLoop = setInterval(() => {
        handleGameTick(player, socket);
    }, 1000);

    socket.on('move', ({ direction }) => {
        player.board.clear(player.currentPiece);

        if (direction === 'hardDrop') {
            while (player.board.isValidMove(player.currentPiece, 0, 1)) {
                player.currentPiece.y++;
            }
            clearInterval(player.gameLoop);
            handleGameTick(player, socket); // Handle landing and new piece
            player.gameLoop = setInterval(() => { // Restart loop
                handleGameTick(player, socket);
            }, 1000);
        } else if (direction === 'rotate') {
            player.currentPiece.rotate();
            if (!player.board.isValidMove(player.currentPiece)) {
                player.currentPiece.rotate();
                player.currentPiece.rotate();
                player.currentPiece.rotate();
            }
        } else {
            let dx = 0;
            let dy = 0;
            if (direction === 'left') dx = -1;
            if (direction === 'right') dx = 1;
            if (direction === 'down') dy = 1;
            
            if (player.board.isValidMove(player.currentPiece, dx, dy)) {
                player.currentPiece.x += dx;
                player.currentPiece.y += dy;
            }
        }
        
        player.board.draw(player.currentPiece);
        socket.emit('updateBoard', player.board.grid);
    });

    socket.on('disconnect', () => {
        console.log(`user disconnected: ${socket.id}`);
        if (player.gameLoop) {
            clearInterval(player.gameLoop);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is up on port ${PORT}`);
});
