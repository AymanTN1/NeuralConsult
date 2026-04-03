const normalizeRole = (role) => String(role || "").trim().toUpperCase();

export const hasRole = (user, role) => {
  if (!Array.isArray(user?.roles)) {
    return false;
  }
  const expected = normalizeRole(role);
  return user.roles.some((item) => normalizeRole(item) === expected);
};

export const isDoctor = (user) => hasRole(user, "ROLE_DOCTOR") || hasRole(user, "DOCTOR");

export const isAdmin = (user) => hasRole(user, "ROLE_ADMIN");

export const isPatient = (user) => {
  if (!Array.isArray(user?.roles) || user.roles.length === 0) {
    return true;
  }
  return hasRole(user, "ROLE_PATIENT") || hasRole(user, "PATIENT") || hasRole(user, "ROLE_USER") || hasRole(user, "USER");
};
