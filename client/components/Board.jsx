import React from 'react';
import Cell from './Cell';
import './Board.css';

const Board = ({ board }) => {
    if (!board || !Array.isArray(board)) {
        return <div className="board">No board data</div>;
    }
    
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
