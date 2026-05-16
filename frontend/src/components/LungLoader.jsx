import React from 'react';

const LungLoader = ({ text = "Analyse clinique en cours..." }) => {
  return (
    <div className="lung-loader-overlay">
      <div className="clinical-loader-ring mb-3"></div>
      <div className="loading-text" style={{ fontWeight: 'bold', letterSpacing: '1px', color: 'var(--nc-primary-solid)', textTransform: 'uppercase' }}>
        {text}
      </div>
      <div className="mt-2 text-muted small">
        NeuralConsult Intelligence
      </div>
    </div>
  );
};

export default LungLoader;
