import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authApi from './api/auth';
import { getAccessToken } from './api/token-storage';
import { registerForPushNotifications } from './push-notifications';

type AuthContextValue = {
  user: authApi.AuthUser | null;
  /** True only while the initial silent-login check runs on app launch. */
  bootstrapping: boolean;
  setUser: (user: authApi.AuthUser | null) => void;
  refreshUser: () => Promise<authApi.AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<authApi.AuthUser | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setUser(null);
      return null;
    }
    try {
      const status = await authApi.getStatus();
      setUser(status);
      return status;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setBootstrapping(false));
  }, [refreshUser]);

  // Re-registers the device's push token whenever a user becomes logged in — covers both a
  // fresh login and the silent session restore on app launch, so a reinstalled/updated app
  // keeps its token current without needing a separate "did I already register" flag.
  useEffect(() => {
    if (user) registerForPushNotifications();
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, bootstrapping, setUser, refreshUser }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
