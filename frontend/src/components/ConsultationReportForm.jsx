import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ConsultationReportForm = ({ appointmentId, onSave }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data } = await api.get(`/api/medical/appointments/${appointmentId}/report`);
        setReport(data);
      } catch (error) {
        console.error("Erreur lors du chargement du rapport", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [appointmentId]);

  const handleChange = (field, value) => {
    setReport(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const { data } = await api.post(`/api/medical/appointments/${appointmentId}/report`, report);
      setReport(data);
      setMessage({ type: 'success', text: 'Rapport enregistré avec succès.' });
      if (onSave) onSave(data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Chargement du formulaire médical...</div>;
  if (!report) return null;

  const isInitial = report.reportType === 'INITIAL_ASSESSMENT';

  return (
    <div className="medical-report-container p-3">
      <div className="medical-report-header mb-4 d-flex justify-content-between align-items-start">
        <div>
          <h4 className="fw-bold text-dark mb-1">{report.title}</h4>
          <p className="text-muted small mb-0">Date de consultation : {new Date(report.consultationDate).toLocaleDateString('fr-FR')}</p>
        </div>
        <div className={`badge ${isInitial ? 'bg-primary' : 'bg-info'} fs-6`}>
           {isInitial ? 'Bilan Initial' : `Suivi N°${report.followUpNumber}`}
        </div>
      </div>

      {message && (
        <div className={`alert ${message.type === 'error' ? 'alert-danger' : 'alert-success'} mb-4 py-2 small`}>
          {message.text}
        </div>
      )}

      {/* SECTION 1: CONSOMMATION */}
      <div className="medical-section-card mb-4">
        <h6 className="section-subtitle mb-3 text-uppercase fw-bold text-secondary small">Consommation & Dépendance</h6>
        
        {!isInitial && (
          <div className="row g-3 mb-4 pb-3 border-bottom">
             <div className="col-md-6">
                <label className="form-label small fw-bold">Patient en arrêt ?</label>
                <div className="d-flex gap-4 mt-1">
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="stopped" id="stopYes" checked={report.patientStopped === true} onChange={() => handleChange('patientStopped', true)} />
                    <label className="form-check-label small" htmlFor="stopYes">Oui</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="stopped" id="stopNo" checked={report.patientStopped === false} onChange={() => handleChange('patientStopped', false)} />
                    <label className="form-check-label small" htmlFor="stopNo">Non</label>
                  </div>
                </div>
             </div>
             {report.patientStopped ? (
               <div className="col-md-6">
                 <label className="form-label small fw-bold">Nombre de jours d'arrêt total</label>
                 <input type="number" className="form-control form-control-sm" value={report.daysSinceStop || ''} onChange={e => handleChange('daysSinceStop', e.target.value)} placeholder="0" />
               </div>
             ) : (
               <div className="col-md-6">
                 <label className="form-label small fw-bold">Réduction ≥ 50% ?</label>
                 <div className="d-flex gap-4 mt-1">
                   <div className="form-check">
                     <input className="form-check-input" type="radio" name="reduction" id="redYes" checked={report.reductionPlus50Percent === true} onChange={() => handleChange('reductionPlus50Percent', true)} />
                     <label className="form-check-label small" htmlFor="redYes">Oui</label>
                   </div>
                   <div className="form-check">
                     <input className="form-check-input" type="radio" name="reduction" id="redNo" checked={report.reductionPlus50Percent === false} onChange={() => handleChange('reductionPlus50Percent', false)} />
                     <label className="form-check-label small" htmlFor="redNo">Non</label>
                   </div>
                 </div>
               </div>
             )}
          </div>
        )}

        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label small fw-bold">Consommation journalière</label>
            <div className="input-group input-group-sm">
              <input type="number" className="form-control" value={report.tobaccoConsumptionDaily || ''} onChange={e => handleChange('tobaccoConsumptionDaily', e.target.value)} />
              <span className="input-group-text">cig/j</span>
            </div>
          </div>
          <div className="col-md-4">
            <label className="form-label small fw-bold">CO expiré</label>
            <div className="input-group input-group-sm">
              <input type="number" className="form-control" value={report.coExpiredPpm || ''} onChange={e => handleChange('coExpiredPpm', e.target.value)} />
              <span className="input-group-text">ppm</span>
            </div>
          </div>
          <div className="col-md-4">
            <label className="form-label small fw-bold">Temps depuis dernière cig.</label>
            <input type="text" className="form-control form-control-sm" placeholder="ex: 45 min" value={report.timeSinceLastCigarette || ''} onChange={e => handleChange('timeSinceLastCigarette', e.target.value)} />
          </div>
          {isInitial && (
            <div className="col-md-4">
              <label className="form-label small fw-bold">Cigarettes depuis lever</label>
              <input type="number" className="form-control form-control-sm" value={report.cigarettesSinceWaking || ''} onChange={e => handleChange('cigarettesSinceWaking', e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: CIGARETTE ELECTRONIQUE (SUIVI) OU DATE ARRET (INITIAL) */}
      <div className="medical-section-card mb-4">
        <h6 className="section-subtitle mb-3 text-uppercase fw-bold text-secondary small">
          {isInitial ? 'Objectifs' : 'Cigarette Électronique'}
        </h6>
        {isInitial ? (
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
               <label className="form-label small fw-bold">Une date d'arrêt a-t-elle été fixée ?</label>
               <div className="d-flex gap-3 mt-1">
                 <button className={`btn btn-sm ${report.stopDateFixed ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => handleChange('stopDateFixed', true)}>Oui</button>
                 <button className={`btn btn-sm ${report.stopDateFixed === false ? 'btn-danger' : 'btn-outline-secondary'}`} onClick={() => handleChange('stopDateFixed', false)}>Non</button>
               </div>
            </div>
            <div className="col-md-6">
               <label className="form-label small fw-bold">Démarche de réduction</label>
               <select className="form-select form-select-sm" value={report.reductionStrategy || ''} onChange={e => handleChange('reductionStrategy', e.target.value)}>
                  <option value="">Choisir...</option>
                  <option value="NONE">Sans traitement dans un premier temps</option>
                  <option value="WITH_TREATMENT">Avec un traitement prescrit</option>
               </select>
            </div>
          </div>
        ) : (
          <div>
             <div className="form-check form-switch mb-3">
               <input className="form-check-input" type="checkbox" checked={!!report.usesElectronicCigarette} onChange={e => handleChange('usesElectronicCigarette', e.target.checked)} id="eCigSwitch" />
               <label className="form-check-label fw-bold small" htmlFor="eCigSwitch">Utilisation d'une cigarette électronique</label>
             </div>
             {report.usesElectronicCigarette && (
               <div className="row g-3 p-3 bg-light rounded-3">
                 <div className="col-md-4">
                   <label className="form-label small">Volume liquide / semaine</label>
                   <input type="text" className="form-control form-control-sm" value={report.eLiquidVolumePerWeek || ''} onChange={e => handleChange('eLiquidVolumePerWeek', e.target.value)} />
                 </div>
                 <div className="col-md-4">
                   <label className="form-label small">Dosage nicotine</label>
                   <input type="text" className="form-control form-control-sm" value={report.nicotineCartridgeDosage || ''} onChange={e => handleChange('nicotineCartridgeDosage', e.target.value)} />
                 </div>
                 <div className="col-md-4 d-flex align-items-end pb-1">
                   <div className="form-check">
                     <input className="form-check-input" type="checkbox" checked={!!report.eCigUsageIncreased} onChange={e => handleChange('eCigUsageIncreased', e.target.checked)} id="eCigInc" />
                     <label className="form-check-label small" htmlFor="eCigInc">Usage plus fréquent ?</label>
                   </div>
                 </div>
               </div>
             )}
          </div>
        )}
      </div>

      {/* SECTION 3: TRAITEMENT PRESPRIT */}
      <div className="medical-section-card mb-4 bg-light border-0">
        <h6 className="section-subtitle mb-3 text-uppercase fw-bold text-primary small">Traitements Prescrits</h6>
        
        <div className="form-check mb-3">
          <input className="form-check-input" type="checkbox" checked={!!report.prescribedNrt} onChange={e => handleChange('prescribedNrt', e.target.checked)} id="nrtMaster" />
          <label className="form-check-label fw-bold text-dark" htmlFor="nrtMaster">Substitution Nicotinique (NRT)</label>
        </div>

        {report.prescribedNrt && (
          <div className="ms-4 p-3 bg-white rounded-3 shadow-sm mb-4">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <input className="form-check-input" type="checkbox" checked={!!report.nrtPatch} onChange={e => handleChange('nrtPatch', e.target.checked)} />
                  <span className="small fw-bold">Dispositif (Patch) :</span>
                  <select className="form-select form-select-sm w-auto" value={report.nrtPatchDosage || ''} onChange={e => handleChange('nrtPatchDosage', e.target.value)}>
                    <option value="">Durée...</option>
                    <option value="16h">16h</option>
                    <option value="24h">24h</option>
                  </select>
                </div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <input className="form-check-input" type="checkbox" checked={!!report.nrtGum} onChange={e => handleChange('nrtGum', e.target.checked)} />
                  <span className="small fw-bold">Gommes :</span>
                  <select className="form-select form-select-sm w-auto" value={report.nrtGumDosage || ''} onChange={e => handleChange('nrtGumDosage', e.target.value)}>
                    <option value="">Dose...</option>
                    <option value="2mg">2mg</option>
                    <option value="4mg">4mg</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <input className="form-check-input" type="checkbox" checked={!!report.nrtLozenge} onChange={e => handleChange('nrtLozenge', e.target.checked)} />
                  <span className="small fw-bold">Comprimés :</span>
                  <select className="form-select form-select-sm w-auto" value={report.nrtLozengeDosage || ''} onChange={e => handleChange('nrtLozengeDosage', e.target.value)}>
                    <option value="">Dose...</option>
                    <option value="1mg">1mg</option>
                    <option value="1.5mg">1.5mg</option>
                    <option value="2mg">2mg</option>
                    <option value="2.5mg">2.5mg</option>
                    <option value="4mg">4mg</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="d-flex flex-wrap gap-4 mt-3 pt-2 border-top">
               <div className="form-check"><input className="form-check-input" type="checkbox" checked={!!report.nrtMouthSpray} onChange={e => handleChange('nrtMouthSpray', e.target.checked)} id="spray" /><label className="form-check-label small" htmlFor="spray">Spray buccal</label></div>
               <div className="form-check"><input className="form-check-input" type="checkbox" checked={!!report.nrtInhaler} onChange={e => handleChange('nrtInhaler', e.target.checked)} id="inhaler" /><label className="form-check-label small" htmlFor="inhaler">Inhaleurs</label></div>
               <div className="form-check"><input className="form-check-input" type="checkbox" checked={!!report.nrtMicrotab} onChange={e => handleChange('nrtMicrotab', e.target.checked)} id="micro" /><label className="form-check-label small" htmlFor="micro">Microtab</label></div>
            </div>
          </div>
        )}

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="form-check card p-2 bg-white border-0 shadow-sm"><input className="form-check-input ms-1" type="checkbox" checked={!!report.prescribedBupropion} onChange={e => handleChange('prescribedBupropion', e.target.checked)} id="bup" /><label className="form-check-label small fw-bold ms-4" htmlFor="bup">Bupropion (Zyban®)</label></div>
          </div>
          <div className="col-md-6">
            <div className="form-check card p-2 bg-white border-0 shadow-sm"><input className="form-check-input ms-1" type="checkbox" checked={!!report.prescribedVarenicline} onChange={e => handleChange('prescribedVarenicline', e.target.checked)} id="var" /><label className="form-check-label small fw-bold ms-4" htmlFor="var">Varenicline (Champix®)</label></div>
          </div>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-md-4"><div className="form-check"><input className="form-check-input" type="checkbox" checked={!!report.behavioralTechniques} onChange={e => handleChange('behavioralTechniques', e.target.checked)} id="bt" /><label className="form-check-label small" htmlFor="bt">Techniques comportementales</label></div></div>
          <div className="col-md-4"><div className="form-check"><input className="form-check-input" type="checkbox" checked={!!report.psychologicalReferral} onChange={e => handleChange('psychologicalReferral', e.target.checked)} id="psy" /><label className="form-check-label small" htmlFor="psy">Orientation Psy</label></div></div>
          <div className="col-md-4"><div className="form-check"><input className="form-check-input" type="checkbox" checked={!!report.dieteticCare} onChange={e => handleChange('dieteticCare', e.target.checked)} id="diet" /><label className="form-check-label small" htmlFor="diet">Prise en charge diététique</label></div></div>
        </div>
      </div>

      {/* SECTION 4: OBSERVATIONS */}
      <div className="medical-section-card mb-4">
        <label className="form-label small fw-bold">Observations Cliniques</label>
        <textarea className="form-control form-control-sm" rows="4" placeholder="Points clés de la consultation..." value={report.observations || ''} onChange={e => handleChange('observations', e.target.value)} />
      </div>

      <div className="d-grid gap-2 mt-4">
        <button className="btn btn-dark btn-lg fw-bold" onClick={handleSave} disabled={saving}>
          {saving ? 'Sauvegarde en cours...' : 'Valider le compte-rendu médical'}
        </button>
      </div>
    </div>
  );
};

export default ConsultationReportForm;
