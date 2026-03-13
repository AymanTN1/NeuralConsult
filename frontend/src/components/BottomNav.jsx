import React from "react";
import { NavLink } from "react-router-dom";

const BottomNav = () => (
  <nav className="navbar fixed-bottom bg-white border-top bottom-nav">
    <div className="container d-flex justify-content-around">
      <NavLink className="nav-link text-center" to="/dashboard">
        <div className="small">Accueil</div>
      </NavLink>
      <NavLink className="nav-link text-center" to="/tests">
        <div className="small">Tests</div>
      </NavLink>
      <NavLink className="nav-link text-center" to="/plan">
        <div className="small">Plan</div>
      </NavLink>
      <NavLink className="nav-link text-center" to="/journal">
        <div className="small">Journal</div>
      </NavLink>
      <NavLink className="nav-link text-center" to="/profile">
        <div className="small">Profil</div>
      </NavLink>
    </div>
  </nav>
);

export default BottomNav;
