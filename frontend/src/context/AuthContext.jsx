import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ftu_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('ftu_token') || null);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionAlert, setSessionAlert] = useState(null);

  // Fetch roster: public roster (EID hidden) when logged out, full directory (with EID) when authenticated
  const fetchRoster = async (activeToken = token) => {
    try {
      if (activeToken) {
        const res = await fetch('/api/users/directory', {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRoster(data);
          return;
        }
      }

      const res = await fetch('/api/auth/roster');
      if (res.ok) {
        const data = await res.json();
        setRoster(data);
      }
    } catch (err) {
      console.error('Failed to fetch roster:', err);
    }
  };

  useEffect(() => {
    fetchRoster(token);
  }, [token]);

  // Verify token on startup
  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          localStorage.setItem('ftu_user', JSON.stringify(userData));
        } else {
          logout();
        }
      } catch (err) {
        console.error('Auth verification error:', err);
      } finally {
        setLoading(false);
      }
    }

    verifyToken();
  }, [token]);

  const login = async (name, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    localStorage.setItem('ftu_token', data.token);
    localStorage.setItem('ftu_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setSessionAlert(null);
    return data.user;
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch {}

    localStorage.removeItem('ftu_token');
    localStorage.removeItem('ftu_user');
    setToken(null);
    setUser(null);
  };

  const handleForcedLogout = (reason) => {
    localStorage.removeItem('ftu_token');
    localStorage.removeItem('ftu_user');
    setToken(null);
    setUser(null);
    setSessionAlert(reason || 'Your session has been terminated from another device.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        roster,
        loading,
        sessionAlert,
        setSessionAlert,
        login,
        logout,
        handleForcedLogout,
        refreshRoster: fetchRoster
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

