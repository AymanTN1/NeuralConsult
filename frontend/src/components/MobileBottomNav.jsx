import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isAdmin, isDoctor, isPatient } from "../utils/roles";

const MobileBottomNav = () => {
  const { user } = useAuth();
  const adminMode = isAdmin(user);
  const doctorMode = isDoctor(user);

  const navItems = useMemo(() => {
    if (adminMode) {
      return [
        { to: "/dashboard", icon: "bi bi-shield-check", label: "Admin" },
        { to: "/profile", icon: "bi bi-person-badge", label: "Profil" }
      ];
    }
    if (doctorMode) {
      return [
        { to: "/dashboard", icon: "bi bi-speedometer2", label: "Patients" },
        { to: "/appointments", icon: "bi bi-calendar2-week", label: "Rdv" },
        { to: "/support", icon: "bi bi-chat-square-heart", label: "IA Alertes" },
        { to: "/communities", icon: "bi bi-people", label: "Groupes" },
        { to: "/profile", icon: "bi bi-person-badge", label: "Profil" }
      ];
    }
    // Patient Nav Items
    return [
      { to: "/dashboard", icon: "bi bi-house-heart", label: "Accueil" },
      { to: "/tests", icon: "bi bi-clipboard-data", label: "Tests" },
      { to: "/support", icon: "bi bi-chat-heart", label: "IA 24/7" },
      { to: "/communities", icon: "bi bi-people-fill", label: "Groupes" },
      { to: "/profile", icon: "bi bi-person-vcard", label: "Profil" }
    ];
  }, [adminMode, doctorMode]);

  if (!user) return null;

  return (
    <div className="mobile-bottom-nav">
      <div className="mobile-bottom-nav-inner">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
              `mobile-bottom-nav-link ${isActive ? "active" : ""}`
            }
          >
            <i className={`${item.icon} mobile-bottom-icon`} />
            <span className="mobile-bottom-label">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default MobileBottomNav;
