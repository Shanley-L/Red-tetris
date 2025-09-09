import React from 'react';
import './Cell.css';

const Cell = ({ type }) => {
    let className = 'cell';
    if (type === 0) {
        className += ' empty';
    } else if (type === 8) {
        className += ' penalty';
    } else {
        className += ' filled';
    }
    return <div className={className}></div>;
};

export default Cell;
