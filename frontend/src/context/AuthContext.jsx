import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// ─── Mock user for demo ───────────────────────────────────────────────────────
const MOCK_USER = {
  id: 'user_001',
  name: 'Traveller',
  email: 'demo@tripwise.app',
  avatar: null,
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tripwise_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setIsAuthenticated(true);
      }
    } catch {
      localStorage.removeItem('tripwise_user');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * login() – Frontend mock; replace body with real API call in Stage 2.
   * Shape: loginUser(email, password) → { user, token }
   */
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      // ── Placeholder: swap for real API call later ──
      await new Promise((r) => setTimeout(r, 800)); // simulate network
      if (!email || !password) throw new Error('Email and password are required.');

      const loggedInUser = { ...MOCK_USER, email };
      localStorage.setItem('tripwise_user', JSON.stringify(loggedInUser));
      // TODO: also store JWT token returned from backend
      setUser(loggedInUser);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Login failed. Please try again.';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * register() – Frontend mock; replace body with real API call in Stage 2.
   */
  const register = async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 800));
      if (!name || !email || !password) throw new Error('All fields are required.');

      const newUser = { ...MOCK_USER, name, email };
      localStorage.setItem('tripwise_user', JSON.stringify(newUser));
      setUser(newUser);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Registration failed. Please try again.';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  /** logout() – clear local state and storage */
  const logout = () => {
    localStorage.removeItem('tripwise_user');
    localStorage.removeItem('tripwise_token');
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  const clearError = () => setError(null);

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;
