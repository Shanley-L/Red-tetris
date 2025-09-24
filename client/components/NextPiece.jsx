import React from 'react';

const NextPiece = ({ piece }) => {
  if (!piece) return null;

  const size = 4;
  const grid = Array.from({ length: size }, () => Array(size).fill(0));

  const offsetX = Math.floor((size - piece.shape[0].length) / 2);
  const offsetY = Math.floor((size - piece.shape.length) / 2);

  piece.shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (y + offsetY < size && x + offsetX < size) {
        grid[y + offsetY][x + offsetX] = cell;
      }
    });
  });

  return (
    <div className="next-piece">
      <h3>Next Piece</h3>
      {grid.map((row, y) => (
        <div key={y} className="row">
          {row.map((cell, x) => (
            <div
              key={x}
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: cell ? piece.color : '#222',
                border: '1px solid #333',
                boxSizing: 'border-box'
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default NextPiece;
