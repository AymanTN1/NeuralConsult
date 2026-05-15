import React, { useEffect, useRef, useState } from 'react';
import api from '../services/api';

/* ─── Source icon mapping ──────────────────────────────── */
const SOURCES_ICONS = {
  'PDF local':            'bi-file-earmark-text-fill',
  'Article scientifique': 'bi-journal-medical',
  'Base scientifique':    'bi-database-fill',
  default:                'bi-link-45deg',
};
const sourceIcon = (type) => SOURCES_ICONS[type] || SOURCES_ICONS.default;

/* ─── WELCOME message ──────────────────────────────────── */
const WELCOME = {
  role: 'ai',
  content:
    "Bonjour Docteur 👋\n\nJe suis votre assistant clinique RAG spécialisé en tabacologie.\n\nPosez-moi n'importe quelle question clinique — protocoles, dosages, contre-indications, populations spéciales — et je rechercherai dans les **guides officiels marocains**, les **guidelines OMS** et **PubMed** pour vous apporter une réponse toujours sourcée.\n\nChaque réponse sera accompagnée de ses sources (guides PDF officiels ou articles PubMed) afin que vous puissiez vérifier les recommandations.",
  status: 'DONE',
  results: [],
};

/* ─── Source card ──────────────────────────────────────── */
const SourceCard = ({ result, isClarifying }) => (
  <div className={`rag-source-card ${isClarifying ? 'rag-source-card--preview' : ''}`}>
    <div className="rag-source-header">
      {result.id && <span className="rag-source-id">[{result.id}]</span>}
      <i className={`bi ${sourceIcon(result.source_type || result.type)} me-2`} />
      <span className="rag-source-type">{result.source_type || result.type || 'Source'}</span>
      <span className="rag-source-name">{result.source || result.name}</span>
      {result.url && (
        <a href={result.url} target="_blank" rel="noreferrer" className="rag-source-link ms-auto">
          <i className="bi bi-box-arrow-up-right me-1" />Voir
        </a>
      )}
    </div>
    {result.content && (
      <p className="rag-source-content">
        {result.content.slice(0, 300)}{result.content.length > 300 ? '…' : ''}
      </p>
    )}
    {isClarifying && !result.content && (
      <p className="rag-source-content rag-source-content--preview">
        <i className="bi bi-hourglass-split me-1" />Sera interrogée après votre réponse…
      </p>
    )}
  </div>
);

/* ─── Sources section ──────────────────────────────────── */
const SourcesSection = ({ results, status, isSearching }) => {
  if (isSearching) {
    return (
      <div className="rag-sources">
        <div className="rag-sources-title">
          <span className="rag-dot" /><span className="rag-dot" /><span className="rag-dot" />
          &nbsp;Recherche en cours dans les guides et PubMed…
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) return null;

  const isClarifying = status === 'CLARIFYING';
  const hasContent   = results.some(r => r.content);

  return (
    <div className="rag-sources">
      <div className="rag-sources-title">
        {isClarifying ? (
          <>
            <i className="bi bi-database me-2 text-primary" />
            Sources qui seront interrogées ({results.length})
          </>
        ) : (
          <>
            <i className="bi bi-database-fill-check me-2 text-success" />
            {hasContent
              ? `${results.length} source${results.length > 1 ? 's' : ''} trouvée${results.length > 1 ? 's' : ''}`
              : `Sources consultées (${results.length})`
            }
          </>
        )}
      </div>
      {results.map((r, i) => (
        <SourceCard key={i} result={r} isClarifying={isClarifying && !r.content} />
      ))}
    </div>
  );
};

/* ─── Single message bubble ────────────────────────────── */
const Message = ({ msg }) => {
  const isDoctor    = msg.role === 'doctor';
  const isSearching = msg.status === 'SEARCHING';

  return (
    <div className={`rag-message ${isDoctor ? 'rag-message--doctor' : 'rag-message--ai'}`}>
      {!isDoctor && (
        <div className="rag-avatar">
          <i className="bi bi-cpu-fill" />
        </div>
      )}

      <div className="rag-bubble-wrap">
        {/* Text bubble */}
        <div className={`rag-bubble ${isDoctor ? 'rag-bubble--doctor' : 'rag-bubble--ai'}`}>
          {isSearching ? (
            <span className="rag-searching">
              <span className="rag-dot" /><span className="rag-dot" /><span className="rag-dot" />
              Recherche dans les guides officiels et PubMed…
            </span>
          ) : (
            <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
          )}
        </div>

        {/* Sources — always shown for AI messages (not doctor, not the searching placeholder) */}
        {!isDoctor && !isSearching && (
          <SourcesSection
            results={msg.results}
            status={msg.status}
            isSearching={false}
          />
        )}

        {/* Model badge */}
        {!isDoctor && !isSearching && msg.model && (
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

/* ─── Main Page ────────────────────────────────────────── */
const ClinicalGuidancePage = () => {
  const [messages, setMessages]   = useState([WELCOME]);
  const [draft, setDraft]         = useState('');
  const [loading, setLoading]     = useState(false);
  const bottomRef  = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getHistory = () =>
    messages
      .filter(m => m.role !== 'searching' && m.status !== 'SEARCHING')
      .map(m => ({
        role: m.role === 'doctor' ? 'user' : 'assistant',
        content: m.content,
      }));

  const send = async () => {
    const text = draft.trim();
    if (!text || loading) return;
    setDraft('');

    const doctorMsg    = { role: 'doctor',    content: text,  results: [], status: 'DONE' };
    const searchingMsg = { role: 'ai', content: '', status: 'SEARCHING', results: [] };
    setMessages(prev => [...prev, doctorMsg, searchingMsg]);
    setLoading(true);

    try {
      const { data } = await api.post('/api/clinical-guidance/rag/chat', {
        doctor_message: text,
        conversation_history: getHistory(),
      });

      const aiMsg = {
        role:    'ai',
        content: data.reply || 'Aucune réponse générée.',
        status:  data.status || 'DONE',
        results: data.results || [],
        model:   data.model_name,
      };

      setMessages(prev => {
        const updated = [...prev];
        const idx = updated.findLastIndex(m => m.status === 'SEARCHING');
        if (idx !== -1) updated[idx] = aiMsg;
        else updated.push(aiMsg);
        return updated;
      });
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        const idx = updated.findLastIndex(m => m.status === 'SEARCHING');
        const errMsg = {
          role: 'ai',
          content: "⚠️ Erreur de connexion au service IA. Vérifiez que le service est démarré.",
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

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const reset = () => { setMessages([WELCOME]); setDraft(''); };

  const QUICK = [
    'Protocole NRT femme enceinte',
    'Contre-indications Champix / Varenicline',
    'Dosage patch nicotine Fagerstrom élevé',
    'Sevrage tabac patient BPCO',
    'Gestion rechute post-arrêt tabac',
  ];

  return (
    <div className="rag-page">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="rag-header">
        <div>
          <div className="hero-kicker">Intelligence Médicale Sourcée</div>
          <h2>Assistant Clinique RAG</h2>
          <p className="muted-text mb-0">
            Chaque réponse est <strong>toujours accompagnée de ses sources</strong> — guides officiels (PDF) ou articles PubMed.
          </p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={reset}>
          <i className="bi bi-arrow-counterclockwise me-2" />Nouvelle recherche
        </button>
      </div>

      {/* ── Quick suggestions ───────────────────────────── */}
      {messages.length <= 1 && (
        <div className="rag-quick-wrap">
          <p className="rag-quick-label">Suggestions rapides :</p>
          <div className="rag-quick-list">
            {QUICK.map(q => (
              <button key={q} className="rag-quick-btn"
                onClick={() => { setDraft(q); textareaRef.current?.focus(); }}>
                <i className="bi bi-lightning-charge-fill me-1" />{q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Chat thread ─────────────────────────────────── */}
      <div className="rag-thread">
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ───────────────────────────────────── */}
      <div className="rag-input-bar">
        <textarea
          ref={textareaRef}
          className="rag-input"
          rows={2}
          placeholder="Posez votre question clinique… (Entrée pour envoyer)"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
        />
        <button className="rag-send-btn" onClick={send} disabled={loading || !draft.trim()}>
          {loading
            ? <span className="spinner-border spinner-border-sm" />
            : <i className="bi bi-send-fill" />
          }
        </button>
      </div>
    </div>
  );
};

export default ClinicalGuidancePage;
