import React from 'react';
import Cell from './Cell';
import './Board.css'; // ou Cell.css selon ton setup

const NextPiece = ({ piece }) => {
  if (!piece) return null;

  const size = 4;
  const grid = Array.from({ length: size }, () => Array(size).fill(0));

  const offsetX = Math.floor((size - piece.shape[0].length) / 2);
  const offsetY = Math.floor((size - piece.shape.length) / 2);

  piece.shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (y + offsetY < size && x + offsetX < size) {
        grid[y + offsetY][x + offsetX] = cell ? piece.color : 0;
      }
    });
  });

  return (
    <div className="next-piece">
      <h3>Next Piece</h3>
      {grid.map((row, y) => (
        <div key={y} className="row">
          {row.map((cell, x) => (
            <Cell key={x} type={cell} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default NextPiece;

