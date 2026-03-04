export const ADMIN_AUTH_KEY = "lakminda_admin_auth";
export const AUTH_ROLE_KEY = "lakminda_auth_role";
export const AUTH_NAME_KEY = "lakminda_auth_name";
export const AUTH_EMAIL_KEY = "lakminda_auth_email";
export const AUTH_TOKEN_KEY = "lakminda_auth_token";
export const AUTH_USER_ID_KEY = "lakminda_auth_user_id";
export const AUTH_EVENT_NAME = "lakminda-auth-changed";

const getStorageValue = (key) => sessionStorage.getItem(key) || localStorage.getItem(key) || "";
const setStorageValue = (key, value, persistent) => {
  if (persistent) localStorage.setItem(key, value);
  else sessionStorage.setItem(key, value);
};
const removeStorageValue = (key) => {
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
};

export const getAuthSession = () => {
  const legacyAdmin = sessionStorage.getItem(ADMIN_AUTH_KEY) === "true";
  const role = getStorageValue(AUTH_ROLE_KEY) || (legacyAdmin ? "admin" : "");
  const name = getStorageValue(AUTH_NAME_KEY) || (role === "admin" ? "Admin" : "");
  const email = getStorageValue(AUTH_EMAIL_KEY);
  const token = getStorageValue(AUTH_TOKEN_KEY);
  const userId = getStorageValue(AUTH_USER_ID_KEY);

  if (legacyAdmin && !getStorageValue(AUTH_ROLE_KEY)) {
    sessionStorage.setItem(AUTH_ROLE_KEY, "admin");
    sessionStorage.setItem(AUTH_NAME_KEY, "Admin");
  }

  return { role, name, email, token, userId };
};

export const setAuthSession = ({ role, name, email = "", token = "", userId = "", persistent = true }) => {
  if (role) setStorageValue(AUTH_ROLE_KEY, role, persistent);
  if (name) setStorageValue(AUTH_NAME_KEY, name, persistent);
  if (email) setStorageValue(AUTH_EMAIL_KEY, email, persistent);
  if (token) setStorageValue(AUTH_TOKEN_KEY, token, persistent);
  if (userId) setStorageValue(AUTH_USER_ID_KEY, userId, persistent);

  if (role === "admin") {
    sessionStorage.setItem(ADMIN_AUTH_KEY, "true");
  } else {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
  }

  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
};

export const clearAuthSession = () => {
  removeStorageValue(ADMIN_AUTH_KEY);
  removeStorageValue(AUTH_ROLE_KEY);
  removeStorageValue(AUTH_NAME_KEY);
  removeStorageValue(AUTH_EMAIL_KEY);
  removeStorageValue(AUTH_TOKEN_KEY);
  removeStorageValue(AUTH_USER_ID_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
};
