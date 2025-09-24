import React from 'react';
import './Cell.css';

const Cell = ({ type }) => {
  let style = {
    width: '20px',
    height: '20px',
    border: '1px solid #333',
    boxSizing: 'border-box',
  };

  if (type === 0) {
    style.backgroundColor = '#222';
  } else if (type === 8) {
    style.backgroundColor = 'grey';
  } else if (typeof type === 'string') {
    style.backgroundColor = type;
  } else {
    style.backgroundColor = '#999';
  }

  return <div className="cell" style={style}></div>;
};

export default Cell;

