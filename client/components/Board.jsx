import React from 'react';
import Cell from './Cell';
import './Board.css';

const Board = ({ board }) => {
    return (
        <div className="board">
            {board.map((row, y) => (
                <div className="row" key={y}>
                    {row.map((cell, x) => (
                        <Cell key={x} type={cell} />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default Board;
