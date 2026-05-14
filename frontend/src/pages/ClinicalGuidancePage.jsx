import React from 'react';
import ClinicalGuidelinesSearch from '../components/ClinicalGuidelinesSearch';

const ClinicalGuidancePage = () => {
  return (
    <div className="doctor-workspace">
      <div className="workspace-header">
        <div className="header-left">
          <div className="hero-kicker">Ressources Cliniques (RAG)</div>
          <h2>Intelligence Médicale</h2>
          <p className="muted-text">
            Recherchez des protocoles officiels, des dosages, et des recommandations pour le sevrage tabagique.
          </p>
        </div>
      </div>

      <div className="workspace-grid mt-4" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="workspace-column">
          <div className="workspace-card p-4">
            <ClinicalGuidelinesSearch />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalGuidancePage;
