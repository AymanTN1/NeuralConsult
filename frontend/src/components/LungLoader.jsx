import React from 'react';

const LungLoader = ({ text = "Analyse clinique en cours..." }) => {
  return (
    <div className="lung-loader-overlay">
      <div className="lung-container">
        <div className="lung-left"></div>
        <div className="lung-right"></div>
      </div>
      <div className="loading-text">
        {text}
      </div>
      <div className="mt-2 text-muted small">
        NeuralConsult Intelligence
      </div>
    </div>
  );
};

export default LungLoader;
