import React from "react";

const TermsModal = ({ accountType, onClose }) => {
  const handleViewDeontology = () => {
    window.open("/code-de-deontologie-medicale.pdf", "_blank");
  };

  const isDoctorMode = accountType === "DOCTOR";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <h2>Conditions d'utilisation</h2>
          <p className="muted-text">{isDoctorMode ? "Médecin" : "Patient"}</p>
        </div>

        <div className="modal-body">
          {isDoctorMode ? (
            <>
              <h3>Conditions pour les Médecins</h3>
              
              <section>
                <h4>1. Responsabilités Professionnelles</h4>
                <ul>
                  <li>Vous vous engagez à exercer votre profession conformément aux normes éthiques et déontologiques</li>
                  <li>Tous les avis cliniques doivent être basés sur votre expertise professionnelle</li>
                  <li>La plateforme NeuralConsult est un outil d'aide, pas un substitut à votre jugement clinique</li>
                </ul>
              </section>

              <section>
                <h4>2. Confidentialité des Patients</h4>
                <ul>
                  <li>Vous vous engagez à protéger la confidentialité des données patients</li>
                  <li>Aucune divulgation d'informations personnelles sans consentement explicite</li>
                  <li>Respect du secret professionnel en toutes circonstances</li>
                </ul>
              </section>

              <section>
                <h4>3. Disponibilité et Teleconsultation</h4>
                <ul>
                  <li>Vous confirmez votre disponibilité pour les consultations planifiées</li>
                  <li>Les patients seront informés de vos horaires de disponibilité</li>
                  <li>Toute modification de disponibilité doit être annoncée 48h en avance si possible</li>
                </ul>
              </section>

              <section>
                <h4>4. Code de Déontologie</h4>
                <p>
                  Vous acceptez de respecter le Code de Déontologie de la profession médicale. 
                  Consultez le document officiel ci-dessous:
                </p>
                <button 
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={handleViewDeontology}
                >
                  📄 Consulter le Code de Déontologie
                </button>
              </section>

              <section>
                <h4>5. Responsabilité Légale</h4>
                <ul>
                  <li>NeuralConsult ne saurait être tenue responsable des décisions cliniques</li>
                  <li>Vous demeurez responsable de votre pratique professionnelle</li>
                  <li>En cas de litige, les lois marocaines s'appliquent</li>
                </ul>
              </section>
            </>
          ) : (
            <>
              <h3>Conditions d'utilisation - Patient</h3>
              
              <section>
                <h4>1. Nature de l'application et limites médicales</h4>
                <ul>
                  <li><strong>NeuralConsult Sevrage</strong> est une plateforme numérique d'accompagnement au sevrage tabagique, combinant suivi clinique et intelligence artificielle.</li>
                  <li>L'application fournit des évaluations, un suivi régulier et une orientation, mais <strong>ne constitue pas un service d'urgence médicale ni ne remplace un médecin traitant</strong>.</li>
                  <li>En cas de détresse psychologique aiguë ou de symptômes physiques graves, vous devez impérativement contacter les services d'urgence.</li>
                </ul>
              </section>

              <section>
                <h4>2. Traitement et confidentialité des données de santé</h4>
                <ul>
                  <li>Vos informations personnelles (habitudes tabagiques, scores d'anxiété/dépression, journal quotidien) sont <strong>strictement confidentielles</strong> et traitées comme des données de santé à caractère personnel.</li>
                  <li>Elles sont partagées <strong>uniquement</strong> avec le médecin que vous choisissez dans l'annuaire pour votre suivi clinique.</li>
                  <li>Notre intelligence artificielle analyse vos données de manière sécurisée pour générer des résumés cliniques utiles à votre médecin et vous offrir un soutien pertinent 24/7.</li>
                </ul>
              </section>

              <section>
                <h4>3. Engagements du patient</h4>
                <ul>
                  <li>Vous vous engagez à fournir des informations exactes lors de votre évaluation initiale (tests Fagerström, HAD) pour garantir la pertinence de votre plan de sevrage.</li>
                  <li>Le succès du programme repose sur votre assiduité : vous êtes encouragé à remplir régulièrement votre journal de bord et à maintenir le contact avec votre médecin traitant.</li>
                  <li>Vous vous engagez à adopter un comportement respectueux au sein de la communauté et lors de vos téléconsultations.</li>
                </ul>
              </section>

              <section>
                <h4>4. Rôle de l'Intelligence Artificielle (IA)</h4>
                <ul>
                  <li>L'assistant IA est conçu pour vous offrir un soutien psychologique continu, expliquer votre évaluation et détecter d'éventuels risques pour alerter votre médecin.</li>
                  <li>L'IA ne pose <strong>aucun diagnostic</strong> médical final. Ses recommandations et ses résumés doivent toujours être validés par votre médecin associé.</li>
                </ul>
              </section>

              <section>
                <h4>5. Acceptation</h4>
                <p>
                  En cochant la case d'acceptation lors de votre inscription, vous reconnaissez avoir lu, compris et accepté les présentes conditions. Vous comprenez votre rôle actif dans ce parcours d'accompagnement vers le sevrage.
                </p>
              </section>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-secondary"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 700px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          position: relative;
        }

        .modal-close {
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #666;
          transition: color 0.2s;
        }

        .modal-close:hover {
          color: #000;
        }

        .modal-header {
          padding: 30px 30px 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 24px;
          color: #1a1a1a;
        }

        .modal-header p {
          margin: 5px 0 0 0;
        }

        .modal-body {
          padding: 30px;
        }

        .modal-body h3 {
          font-size: 18px;
          color: #1a1a1a;
          margin-bottom: 20px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 10px;
        }

        .modal-body section {
          margin-bottom: 25px;
        }

        .modal-body h4 {
          font-size: 14px;
          color: #333;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .modal-body ul {
          margin: 0;
          padding-left: 20px;
        }

        .modal-body li {
          margin-bottom: 8px;
          line-height: 1.6;
          color: #555;
        }

        .modal-body p {
          color: #555;
          line-height: 1.6;
          margin: 0 0 12px 0;
        }

        .modal-body button {
          margin-top: 10px;
        }

        .modal-footer {
          padding: 20px 30px;
          border-top: 1px solid #e0e0e0;
          text-align: right;
        }

        .modal-footer button {
          min-width: 120px;
        }
      `}</style>
    </div>
  );
};

export default TermsModal;
