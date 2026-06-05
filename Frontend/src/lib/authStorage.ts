const TOKEN_KEY = "token";

export const getStoredToken = () => {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch (_error) {
    return null;
  }
};

export const setStoredToken = (token: string | null) => {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  } catch (_error) {
    // Ignore storage access failures in privacy-restricted browsers.
  }
};
