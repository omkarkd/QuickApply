import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Configure axios to send cookies
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState(localStorage.getItem('session_token'));

  // Create axios instance with auth headers
  const authAxios = useCallback(() => {
    const instance = axios.create({
      withCredentials: true,
      headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}
    });
    return instance;
  }, [sessionToken]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const storedToken = localStorage.getItem('session_token');
    if (storedToken) {
      try {
        const response = await axios.get(`${API}/auth/me`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        setUser(response.data);
        setSessionToken(storedToken);
      } catch (error) {
        localStorage.removeItem('session_token');
        setUser(null);
        setSessionToken(null);
      }
    }
    setLoading(false);
  };

  // Handle Emergent Google OAuth callback
  const handleOAuthCallback = async (sessionId) => {
    try {
      const response = await axios.post(`${API}/auth/session`, 
        { session_id: sessionId },
        { withCredentials: true }
      );
      const { user: userData, session_token } = response.data;
      localStorage.setItem('session_token', session_token);
      setSessionToken(session_token);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw error;
    }
  };

  // Legacy email/password login
  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, 
      { email, password },
      { withCredentials: true }
    );
    const { user: userData, session_token } = response.data;
    localStorage.setItem('session_token', session_token);
    setSessionToken(session_token);
    setUser(userData);
    return userData;
  };

  // Legacy email/password register
  const register = async (name, email, password) => {
    const response = await axios.post(`${API}/auth/register`, 
      { name, email, password },
      { withCredentials: true }
    );
    const { user: userData, session_token } = response.data;
    localStorage.setItem('session_token', session_token);
    setSessionToken(session_token);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, {
        withCredentials: true,
        headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('session_token');
    setSessionToken(null);
    setUser(null);
  };

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${sessionToken}`
  });

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      getAuthHeaders,
      handleOAuthCallback,
      authAxios 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
