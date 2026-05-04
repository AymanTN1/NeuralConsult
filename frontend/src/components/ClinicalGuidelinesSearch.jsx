import React, { useState } from 'react';
import api from '../services/api';

const ClinicalGuidelinesSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const { data } = await api.get(`/api/clinical-guidance/search?q=${encodeURIComponent(query)}`);
      setResults(data.results || []);
    } catch (error) {
      console.error("Erreur lors de la recherche dans les guides", error);
    } finally {
      setLoading(false);
    }
  };

  const quickQueries = [
    "Dosage patch nicotine Fagerstrom élevé",
    "Protocole femme enceinte tabac",
    "Gestion manque de nicotine irritabilité",
    "Contre-indications Champix",
    "Réduction progressive vs arrêt brusque"
  ];

  return (
    <div className="clinical-search-container p-3 bg-white rounded-3 shadow-sm border">
      <h5 className="fw-bold mb-3 d-flex align-items-center">
        <i className="bi bi-book-half me-2 text-primary"></i>
        Centre de Ressources Cliniques (RAG)
      </h5>
      <p className="small text-muted mb-4">
        Recherchez des protocoles officiels directement dans le <strong>Guide Marocain</strong> et les <strong>Guidelines de l'OMS</strong>.
      </p>

      <form onSubmit={handleSearch} className="mb-4">
        <div className="input-group">
          <input 
            type="text" 
            className="form-control" 
            placeholder="Rechercher un protocole, dosage, symptôme..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-search"></i>}
          </button>
        </div>
      </form>

      <div className="quick-queries mb-4">
        <span className="small text-muted d-block mb-2">Suggestions rapides :</span>
        <div className="d-flex flex-wrap gap-2">
          {quickQueries.map(q => (
            <button 
              key={q} 
              className="btn btn-sm btn-outline-light text-dark border shadow-sm" 
              onClick={() => { setQuery(q); handleSearch(); }}
              style={{ fontSize: '0.75rem' }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="search-results">
        {loading && <div className="text-center py-4 text-muted small">Analyse des documents médicaux en cours...</div>}
        
        {!loading && searched && results.length === 0 && (
          <div className="text-center py-4 text-muted small">Aucun résultat trouvé dans les guides officiels.</div>
        )}

        {!loading && results.map((res, index) => (
          <div key={index} className="result-card p-3 mb-3 border-start border-4 border-primary bg-light rounded-2">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle mb-1" style={{ fontSize: '0.65rem' }}>
                <i className="bi bi-file-earmark-text me-1"></i> {res.source}
              </span>
              <span className="text-success small fw-bold"><i className="bi bi-check-circle-fill"></i> Vérifié</span>
            </div>
            <p className="mb-0 small text-dark lh-sm" style={{ textAlign: 'justify' }}>
              {res.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClinicalGuidelinesSearch;
