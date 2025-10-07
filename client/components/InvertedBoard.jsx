import React from 'react';
import Cell from './Cell';
import './Board.css';

const InvertedBoard = ({ board }) => {
    if (!board || !Array.isArray(board)) {
        return <div className="board">No board data</div>;
    }
    
    // Reverse the board array to invert it visually
    const invertedBoard = [...board].reverse();
    
    return (
        <div className="board inverted-board">
            {invertedBoard.map((row, y) => (
                <div className="row" key={y}>
                    {row.map((cell, x) => (
                        <Cell key={x} type={cell} />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default InvertedBoard;
