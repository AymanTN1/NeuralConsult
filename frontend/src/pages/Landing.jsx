import React from "react";
import { Link } from "react-router-dom";

const Landing = () => (
  <div>
    <section className="hero-section">
      <div className="container">
        <div className="row align-items-center g-4">
          <div className="col-12 col-lg-6">
            <div className="icon-chip mb-3">
              <i className="bi bi-shield-check" /> Parcours clinique securise
            </div>
            <h1 className="display-4 fw-bold">
              Un sevrage tabagique moderne, mesure et personnalise.
            </h1>
            <p className="lead muted-text mt-3">
              NeuralConsult Sevrage combine questionnaires INPES, suivi quotidien et plans de sevrage
              intelligents pour accompagner chaque patient avec precision.
            </p>
            <div className="d-flex flex-wrap gap-2 mt-4">
              <Link to="/register" className="btn btn-dark btn-lg">
                Demarrer maintenant
              </Link>
              <Link to="/login" className="btn btn-outline-dark btn-lg">
                Se connecter
              </Link>
            </div>
            <div className="d-flex flex-wrap gap-3 mt-4">
              <div className="stat-card">
                <p className="mb-1 fw-semibold">Profiling complet</p>
                <span className="muted-text small">Tests + historique + habitudes</span>
              </div>
              <div className="stat-card">
                <p className="mb-1 fw-semibold">Plan adapte</p>
                <span className="muted-text small">NRT, suivi et rechute</span>
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-6">
            <div className="hero-card p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Vue clinique</h5>
                <span className="badge text-bg-light">Temps reel</span>
              </div>
              <div className="row g-3">
                <div className="col-12">
                  <div className="glass-panel p-3">
                    <div className="d-flex justify-content-between">
                      <div>
                        <p className="mb-1 fw-semibold">Score dependance</p>
                        <p className="muted-text small mb-0">Fagerstrom + HAD</p>
                      </div>
                      <span className="badge text-bg-dark">Priorite</span>
                    </div>
                    <div className="progress mt-3" style={{ height: 8 }}>
                      <div className="progress-bar bg-dark" style={{ width: "68%" }} />
                    </div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="glass-panel p-3">
                    <p className="mb-2 fw-semibold">Plan de sevrage</p>
                    <div className="d-flex flex-wrap gap-2">
                      <span className="badge text-bg-light">Patch + gomme</span>
                      <span className="badge text-bg-light">Suivi hebdo</span>
                      <span className="badge text-bg-light">Journal quotidien</span>
                    </div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="glass-panel p-3">
                    <p className="mb-1 fw-semibold">Alertes rechute</p>
                    <p className="muted-text small mb-0">
                      Declencheurs identifies, protocole 5 minutes et soutien immediat.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="py-5">
      <div className="container">
        <div className="text-center mb-4">
          <p className="text-uppercase muted-text small">Pourquoi NeuralConsult</p>
          <h2 className="section-title">Une plateforme clinique complete, mobile-first.</h2>
        </div>
        <div className="row g-4">
          <div className="col-12 col-md-6 col-lg-4">
            <div className="feature-card">
              <div className="feature-icon mb-3">
                <i className="bi bi-clipboard2-check" />
              </div>
              <h5 className="fw-semibold">Profiling INPES</h5>
              <p className="muted-text mb-0">CAGE, HONC, poids, activite et habitudes tabagiques.</p>
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <div className="feature-card">
              <div className="feature-icon mb-3">
                <i className="bi bi-graph-up-arrow" />
              </div>
              <h5 className="fw-semibold">Suivi intelligent</h5>
              <p className="muted-text mb-0">Dashboard analytique, tendances et alertes rechute.</p>
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <div className="feature-card">
              <div className="feature-icon mb-3">
                <i className="bi bi-person-heart" />
              </div>
              <h5 className="fw-semibold">Plan sur-mesure</h5>
              <p className="muted-text mb-0">NRT, routines, suivi psychologique et accompagnement.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="py-5 bg-white">
      <div className="container">
        <div className="row g-4 align-items-center">
          <div className="col-12 col-lg-6">
            <h2 className="section-title">Un parcours clair et rassurant.</h2>
            <p className="muted-text">
              Chaque etape est tracee, depuis l'evaluation initiale jusqu'au plan de sevrage
              et au suivi quotidien. L'equipe clinique garde une vision globale des progres.
            </p>
            <div className="d-flex flex-column gap-3 mt-4">
              <div className="d-flex align-items-center gap-3">
                <span className="feature-icon"><i className="bi bi-1-circle" /></span>
                <div>
                  <p className="mb-1 fw-semibold">Profiling initial</p>
                  <p className="muted-text mb-0">Habitudes, co-consommations, motivation.</p>
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <span className="feature-icon"><i className="bi bi-2-circle" /></span>
                <div>
                  <p className="mb-1 fw-semibold">Tests cliniques</p>
                  <p className="muted-text mb-0">Fagerstrom, HAD et evolution des scores.</p>
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <span className="feature-icon"><i className="bi bi-3-circle" /></span>
                <div>
                  <p className="mb-1 fw-semibold">Plan + journal</p>
                  <p className="muted-text mb-0">Plan de sevrage et suivi quotidien.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-6">
            <div className="glass-panel p-4">
              <div className="row g-3">
                <div className="col-6">
                  <div className="stat-card">
                    <p className="mb-1 fw-semibold">Precision</p>
                    <h3 className="fw-bold mb-0">+35%</h3>
                    <span className="muted-text small">Sur les plans adaptes</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="stat-card">
                    <p className="mb-1 fw-semibold">Adherence</p>
                    <h3 className="fw-bold mb-0">78%</h3>
                    <span className="muted-text small">Suivi quotidien</span>
                  </div>
                </div>
                <div className="col-12">
                  <div className="stat-card">
                    <p className="mb-1 fw-semibold">Scores en temps reel</p>
                    <p className="muted-text mb-0">
                      Vos decisions sont guidees par des donnees a jour et interpretees.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="py-5">
      <div className="container text-center">
        <h2 className="section-title">Pret a lancer votre sevrage ?</h2>
        <p className="muted-text mb-4">Accedez au profiling et au plan personnalise en quelques minutes.</p>
        <Link to="/register" className="btn btn-dark btn-lg">
          Creer un compte
        </Link>
      </div>
    </section>
  </div>
);

export default Landing;
