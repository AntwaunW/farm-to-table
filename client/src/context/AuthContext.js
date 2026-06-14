// AuthContext — global authentication state for the entire app
// Provides: user, token, loading, login(), logout()
// Persists session to localStorage so the user stays logged in after a page refresh
// The loading flag prevents pages from flashing "not logged in" while the
// stored session is being restored on first render

import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Initialize token from localStorage immediately so the axios interceptor has it on first request
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  // While true, the app is still checking localStorage for a stored session
  const [loading, setLoading] = useState(true);

  // On first mount, restore the session from localStorage if it exists
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }

    // Done checking — pages can now safely read the auth state
    setLoading(false);
  }, []);

  // Called after a successful register or login API response
  // Stores both the user object and the JWT in state and localStorage
  const login = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', tokenData);
  };

  // Clears all auth state and removes the session from localStorage
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    // Expose auth state and actions to any component in the tree via useAuth()
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Convenience hook — use this in components instead of importing useContext + AuthContext
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
