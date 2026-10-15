import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, LoginResponse } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, pass: string) => Promise<LoginResponse>;
  verifyOtp: (otpSessionId: string, code: string) => Promise<void>;
  resendOtp: (otpSessionId: string) => Promise<{ success: boolean; otpSessionId: string; emailMasked: string; message: string }>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('balcad_crm_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api.getMe()
      .then((res) => {
        if (res && res.user) {
          setUser(res.user);
        } else {
          localStorage.removeItem('balcad_crm_token');
          setUser(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('balcad_crm_token');
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const handleAuthExpired = (e?: any) => {
      localStorage.removeItem('balcad_crm_token');
      localStorage.removeItem('balcad_crm_active_user');
      localStorage.removeItem('balcad_crm_active_user_v3');
      setUser(null);
      const msg = e?.detail?.message || localStorage.getItem('balcad_auth_disabled_msg');
      if (msg) {
        setError(msg);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'balcad_crm_token' && !e.newValue) {
        setUser(null);
      }
    };

    window.addEventListener('balcad_auth_expired', handleAuthExpired);
    window.addEventListener('storage', handleStorage);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('balcad_auth');
      channel.onmessage = (event) => {
        if (event.data?.type === 'USER_DISABLED') {
          // Check if notification is targeted to another user
          const activeUserStr = localStorage.getItem('balcad_crm_active_user_v3') || localStorage.getItem('balcad_crm_active_user');
          if (activeUserStr && event.data?.userId) {
            try {
              const active = JSON.parse(activeUserStr);
              if (active.id !== event.data.userId && active.username?.toLowerCase() !== event.data?.username?.toLowerCase()) {
                return; // Not for this user
              }
            } catch {}
          }

          // Query server to verify active status
          api.getMe()
            .then((res) => {
              if (res && res.user && res.user.status === 'disabled') {
                localStorage.setItem('balcad_auth_disabled_msg', 'dis user is disabled please contact the Super admin');
                localStorage.removeItem('balcad_crm_token');
                localStorage.removeItem('balcad_crm_active_user');
                localStorage.removeItem('balcad_crm_active_user_v3');
                setUser(null);
                setError('dis user is disabled please contact the Super admin');
                window.dispatchEvent(new CustomEvent('balcad_auth_expired', { detail: { message: 'dis user is disabled please contact the Super admin' } }));
              }
            })
            .catch(() => {
              // Ignore network glitches; never boot valid sessions on network errors
            });
        }
      };
    } catch {}

    return () => {
      window.removeEventListener('balcad_auth_expired', handleAuthExpired);
      window.removeEventListener('storage', handleStorage);
      try {
        channel?.close();
      } catch {}
    };
  }, []);

  // Periodic user status heartbeat (instantly boots disabled employees)
  useEffect(() => {
    if (!user || user.role === 'super_admin') return;

    const checkActiveStatus = async () => {
      try {
        const res = await api.getMe();
        if (res && res.user && res.user.status === 'disabled') {
          localStorage.setItem('balcad_auth_disabled_msg', 'dis user is disabled please contact the Super admin');
          localStorage.removeItem('balcad_crm_token');
          localStorage.removeItem('balcad_crm_active_user');
          localStorage.removeItem('balcad_crm_active_user_v3');
          setUser(null);
          setError('dis user is disabled please contact the Super admin');
          window.dispatchEvent(new CustomEvent('balcad_auth_expired', { detail: { message: 'dis user is disabled please contact the Super admin' } }));
        }
      } catch (err: any) {
        if (err?.code === 'USER_DISABLED' || String(err?.message || '').toLowerCase().includes('disabled')) {
          localStorage.setItem('balcad_auth_disabled_msg', 'dis user is disabled please contact the Super admin');
          localStorage.removeItem('balcad_crm_token');
          localStorage.removeItem('balcad_crm_active_user');
          localStorage.removeItem('balcad_crm_active_user_v3');
          setUser(null);
          setError('dis user is disabled please contact the Super admin');
          window.dispatchEvent(new CustomEvent('balcad_auth_expired', { detail: { message: 'dis user is disabled please contact the Super admin' } }));
        }
      }
    };

    const interval = setInterval(checkActiveStatus, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Safety Inactivity Auto-logout (10 minutes of inactivity)
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes = 600,000 ms
    let timeoutId: any;

    const handleInactivityLogout = () => {
      localStorage.removeItem('balcad_crm_token');
      localStorage.removeItem('balcad_crm_active_user');
      localStorage.removeItem('balcad_crm_active_user_v3');
      setUser(null);
      const expiredMsg =
        'Session-kaagii wuu dhacay sababtoo ah 10 daqiiqo wax dhaqdhaqaaq ah ma samayn (Session expired due to 10 minutes of inactivity). Fadlan dib u soo gal.';
      setError(expiredMsg);
      localStorage.setItem('balcad_auth_disabled_msg', expiredMsg);
      window.dispatchEvent(
        new CustomEvent('balcad_auth_expired', { detail: { message: expiredMsg } })
      );
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleInactivityLogout, INACTIVITY_TIMEOUT_MS);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [user]);

  const login = async (username: string, pass: string): Promise<LoginResponse> => {
    setError(null);
    try {
      const res = await api.login(username, pass);
      if (!res.requiresOtp && res.user) {
        setUser(res.user);
      }
      return res;
    } catch (err: any) {
      const msg = String(err.message || '');
      const finalMsg = (
        msg.toLowerCase().includes('disabled') ||
        msg.toLowerCase().includes('administrator') ||
        msg.toLowerCase().includes('super admin') ||
        msg.includes('403') ||
        msg.toLowerCase().includes('forbidden') ||
        msg.includes('<html')
      )
        ? 'dis user is disabled please contact the Super admin'
        : (err.message || 'Invalid username or password.');
      setError(finalMsg);
      throw new Error(finalMsg);
    }
  };

  const verifyOtp = async (otpSessionId: string, code: string): Promise<void> => {
    setError(null);
    try {
      const res = await api.verifyOtp(otpSessionId, code);
      if (res && res.user) {
        setUser(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Koodhka OTP ma saxana.');
      throw err;
    }
  };

  const resendOtp = async (otpSessionId: string) => {
    setError(null);
    try {
      return await api.resendOtp(otpSessionId);
    } catch (err: any) {
      setError(err.message || 'Khalad ayaa dhacay markii koodhka dib loo dirayay.');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignored
    } finally {
      localStorage.removeItem('balcad_crm_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        verifyOtp,
        resendOtp,
        logout,
        error,
        clearError: () => setError(null),
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
