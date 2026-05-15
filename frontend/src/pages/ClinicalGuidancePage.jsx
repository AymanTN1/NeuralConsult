import React, { useEffect, useRef, useState } from 'react';
import api from '../services/api';

/* ─── helpers ─────────────────────────────────────────── */
const WELCOME = {
  role: 'ai',
  content:
    "Bonjour Docteur 👋\n\nJe suis votre assistant clinique RAG spécialisé en tabacologie.\n\nPosez-moi n'importe quelle question clinique — protocoles, dosages, contre-indications, populations spéciales — et je rechercherai dans les **guides officiels marocains**, les **guidelines OMS** et **PubMed** pour vous apporter une réponse sourcée.\n\nComment puis-je vous aider ?",
  status: 'DONE',
  results: [],
};

const SOURCES_ICONS = {
  'PDF local': 'bi-file-earmark-text-fill',
  'Article scientifique': 'bi-journal-medical',
  default: 'bi-link-45deg',
};

const sourceIcon = (type) => SOURCES_ICONS[type] || SOURCES_ICONS.default;

const SourceCard = ({ result }) => (
  <div className="rag-source-card">
    <div className="rag-source-header">
      <i className={`bi ${sourceIcon(result.source_type)} me-2`} />
      <span className="rag-source-type">{result.source_type}</span>
      <span className="rag-source-name">{result.source}</span>
    </div>
    <p className="rag-source-content">{result.content.slice(0, 280)}{result.content.length > 280 ? '…' : ''}</p>
    {result.url && (
      <a href={result.url} target="_blank" rel="noreferrer" className="rag-source-link">
        <i className="bi bi-box-arrow-up-right me-1" />Voir la source
      </a>
    )}
  </div>
);

const Message = ({ msg }) => {
  const isDoctor = msg.role === 'doctor';
  const isSearching = msg.status === 'SEARCHING';

  return (
    <div className={`rag-message ${isDoctor ? 'rag-message--doctor' : 'rag-message--ai'}`}>
      {!isDoctor && (
        <div className="rag-avatar">
          <i className="bi bi-cpu-fill" />
        </div>
      )}
      <div className="rag-bubble-wrap">
        <div className={`rag-bubble ${isDoctor ? 'rag-bubble--doctor' : 'rag-bubble--ai'}`}>
          {isSearching ? (
            <span className="rag-searching">
              <span className="rag-dot" /><span className="rag-dot" /><span className="rag-dot" />
              Recherche en cours dans les guides médicaux et PubMed…
            </span>
          ) : (
            <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
          )}
        </div>

        {!isDoctor && msg.results && msg.results.length > 0 && (
          <div className="rag-sources">
            <div className="rag-sources-title">
              <i className="bi bi-database-fill-check me-2 text-success" />
              {msg.results.length} source{msg.results.length > 1 ? 's' : ''} trouvée{msg.results.length > 1 ? 's' : ''}
            </div>
            {msg.results.map((r, i) => (
              <SourceCard key={i} result={r} />
            ))}
          </div>
        )}

        {!isDoctor && msg.model && (
          <div className="rag-model-badge">
            <i className="bi bi-stars me-1" />{msg.model}
          </div>
        )}
      </div>
      {isDoctor && (
        <div className="rag-avatar rag-avatar--doctor">
          <i className="bi bi-person-badge-fill" />
        </div>
      )}
    </div>
  );
};

/* ─── Main Page ─────────────────────────────────────────── */
const ClinicalGuidancePage = () => {
  const [messages, setMessages] = useState([WELCOME]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getHistory = () =>
    messages
      .filter((m) => m.role !== 'searching')
      .map((m) => ({
        role: m.role === 'doctor' ? 'user' : 'assistant',
        content: m.content,
      }));

  const send = async () => {
    const text = draft.trim();
    if (!text || loading) return;

    setDraft('');

    const doctorMsg = { role: 'doctor', content: text, results: [] };
    const searchingMsg = { role: 'ai', content: '', status: 'SEARCHING', results: [] };
    setMessages((prev) => [...prev, doctorMsg, searchingMsg]);
    setLoading(true);

    try {
      const { data } = await api.post('/api/clinical-guidance/rag/chat', {
        doctor_message: text,
        conversation_history: getHistory(),
      });

      const aiMsg = {
        role: 'ai',
        content: data.reply || 'Aucune réponse générée.',
        status: data.status || 'DONE',
        results: data.results || [],
        model: data.model_name,
      };

      setMessages((prev) => {
        // Replace the "searching" placeholder with the real response
        const updated = [...prev];
        const idx = updated.findLastIndex((m) => m.status === 'SEARCHING');
        if (idx !== -1) updated[idx] = aiMsg;
        else updated.push(aiMsg);
        return updated;
      });
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        const idx = updated.findLastIndex((m) => m.status === 'SEARCHING');
        const errMsg = {
          role: 'ai',
          content: "Je suis désolé, une erreur s'est produite lors de la recherche. Vérifiez que le service IA est démarré.",
          status: 'DONE',
          results: [],
        };
        if (idx !== -1) updated[idx] = errMsg;
        else updated.push(errMsg);
        return updated;
      });
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const reset = () => {
    setMessages([WELCOME]);
    setDraft('');
  };

  const QUICK = [
    'Protocole NRT femme enceinte',
    'Contre-indications Champix / Varenicline',
    'Dosage patch nicotine Fagerstrom score élevé',
    'Sevrage tabac patient BPCO',
    'Gestion rechute post-arrêt tabac',
  ];

  return (
    <div className="rag-page">
      {/* Header */}
      <div className="rag-header">
        <div className="rag-header-left">
          <div className="hero-kicker">Intelligence Médicale</div>
          <h2>Assistant Clinique RAG</h2>
          <p className="muted-text">
            Dialogue avec l'IA pour obtenir des recommandations sourcées depuis les guides officiels et PubMed.
          </p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={reset}>
          <i className="bi bi-arrow-counterclockwise me-2" />Nouvelle recherche
        </button>
      </div>

      {/* Quick queries (only shown at start) */}
      {messages.length <= 1 && (
        <div className="rag-quick-wrap">
          <p className="rag-quick-label">Suggestions rapides :</p>
          <div className="rag-quick-list">
            {QUICK.map((q) => (
              <button
                key={q}
                className="rag-quick-btn"
                onClick={() => { setDraft(q); textareaRef.current?.focus(); }}
              >
                <i className="bi bi-lightning-charge-fill me-1" />{q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat thread */}
      <div className="rag-thread">
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="rag-input-bar">
        <textarea
          ref={textareaRef}
          className="rag-input"
          rows={2}
          placeholder="Posez votre question clinique… (Entrée pour envoyer, Shift+Entrée pour sauter une ligne)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
        />
        <button
          className="rag-send-btn"
          onClick={send}
          disabled={loading || !draft.trim()}
        >
          {loading ? (
            <span className="spinner-border spinner-border-sm" />
          ) : (
            <i className="bi bi-send-fill" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ClinicalGuidancePage;
