
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

import {
  loginUser,
  registerUser,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore the existing session when the app opens
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('tripwise_user');
      const token = localStorage.getItem('tripwise_token');

      if (storedUser && token) {
        const parsedUser = JSON.parse(storedUser);

        if (parsedUser && parsedUser.id) {
          setUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('tripwise_user');
          localStorage.removeItem('tripwise_token');
        }
      } else {
        localStorage.removeItem('tripwise_user');
        localStorage.removeItem('tripwise_token');
      }
    } catch {
      localStorage.removeItem('tripwise_user');
      localStorage.removeItem('tripwise_token');
    } finally {
      setLoading(false);
    }
  }, []);

  // Log in through the real backend
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await loginUser(email, password);
      const data = response.data;

      if (!data?.success || !data?.token || !data?.user) {
        throw new Error(
          data?.message || 'Login failed. Please try again.'
        );
      }

      const loggedInUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        avatar: data.user.avatar ?? null,
      };

      localStorage.setItem('tripwise_token', data.token);
      localStorage.setItem(
        'tripwise_user',
        JSON.stringify(loggedInUser)
      );

      setUser(loggedInUser);
      setIsAuthenticated(true);

      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please try again.';

      setError(message);

      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Register through the real backend
  const register = useCallback(async (name, email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await registerUser(name, email, password);
      const data = response.data;

      if (!data?.success || !data?.token || !data?.user) {
        throw new Error(
          data?.message || 'Registration failed. Please try again.'
        );
      }

      const registeredUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        avatar: data.user.avatar ?? null,
      };

      localStorage.setItem('tripwise_token', data.token);
      localStorage.setItem(
        'tripwise_user',
        JSON.stringify(registeredUser)
      );

      setUser(registeredUser);
      setIsAuthenticated(true);

      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please try again.';

      setError(message);

      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Log out and clear the local session
  const logout = useCallback(() => {
    localStorage.removeItem('tripwise_user');
    localStorage.removeItem('tripwise_token');
    localStorage.removeItem('tripwise_trip_state');
    localStorage.removeItem('tripwise_preferences');

    // Clean any user-scoped trip states
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('tripwise_trip_state_')) {
          localStorage.removeItem(key);
        }
      });
    } catch {
      // Ignore
    }

    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }

  return ctx;
}

export default AuthContext;
