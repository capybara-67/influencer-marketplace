import { PropsWithChildren, createContext, createElement, useContext, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { observeSession, type AuthState } from '../lib/auth-session';

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({ session: null, loading: true, error: null });
  useEffect(() => {
    if (!supabase) {
      setState({ session: null, loading: false, error: null });
      return;
    }
    const auth = supabase.auth;
    const unsubscribe = observeSession(auth, setState);
    if (Platform.OS === 'web') return unsubscribe;
    const refresh = (active: boolean) => {
      if (active) auth.startAutoRefresh();
      else auth.stopAutoRefresh();
    };
    refresh(AppState.currentState === 'active');
    const listener = AppState.addEventListener('change', status => refresh(status === 'active'));
    return () => {
      unsubscribe();
      listener.remove();
      auth.stopAutoRefresh();
    };
  }, []);
  return createElement(AuthContext.Provider, { value: state }, children);
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside AuthProvider');
  return auth;
}
