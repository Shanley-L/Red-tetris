import React from 'react';
import './Cell.css';

const Cell = ({ type }) => {
  let className = 'cell';

  if (type === 0) {
    className += ' empty';
  } else if (type === 8) {
    className += ' penalty';
  } else if (typeof type === 'string') {
    // Ajouter la classe de couleur
    className += ` filled ${type}`;
  } else {
    className += ' filled';
  }

  return <div className={className} data-testid="cell"></div>;
};

export default Cell;
