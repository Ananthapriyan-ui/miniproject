import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

// ─── Helper: fetch or create the user's profile row ───────────────
async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, is_active, created_at')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = row not found (profile not yet created by trigger)
    console.error('Profile fetch error:', error.message);
  }
  return data || null;
}

// ─── Normalise Supabase session → app user object ─────────────────
function buildUser(supabaseUser, profile) {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    full_name:
      profile?.full_name ||
      supabaseUser.user_metadata?.full_name ||
      supabaseUser.user_metadata?.name ||
      supabaseUser.email?.split('@')[0] ||
      'SecOps Operator',
    avatar_url:
      supabaseUser.user_metadata?.avatar_url ||
      supabaseUser.user_metadata?.picture ||
      null,
    is_active: profile?.is_active ?? true,
    created_at: profile?.created_at || supabaseUser.created_at,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── Restore session on mount & listen for auth changes ───────────
  useEffect(() => {
    let mounted = true;

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        let profile = await fetchProfile(session.user.id);
        if (!profile) {
          try {
            const defaultName =
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              session.user.email?.split('@')[0] ||
              'SecOps Operator';
            await supabase.from('profiles').upsert({
              id: session.user.id,
              full_name: defaultName,
            });
            profile = await fetchProfile(session.user.id);
          } catch (e) {
            console.warn('Could not auto-create profile:', e);
          }
        }
        setUser(buildUser(session.user, profile));
      }
      setLoading(false);
    });

    // Real-time auth state listener (sign-in, sign-out, token-refresh, OAuth callback)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        let profile = await fetchProfile(session.user.id);
        if (!profile) {
          try {
            const defaultName =
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              session.user.email?.split('@')[0] ||
              'SecOps Operator';
            await supabase.from('profiles').upsert({
              id: session.user.id,
              full_name: defaultName,
            });
            profile = await fetchProfile(session.user.id);
          } catch (e) {
            console.warn('Could not auto-create profile:', e);
          }
        }
        setUser(buildUser(session.user, profile));
      } else {
        setUser(null);
      }

      // Only clear loading if it was still true (avoids a double-set on mount)
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ─── Email/Password Login ─────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { success: false, error: error.message };

    const profile = await fetchProfile(data.user.id);
    const appUser = buildUser(data.user, profile);
    setUser(appUser);
    return { success: true, user: appUser };
  }, []);

  // ─── Google OAuth Login ───────────────────────────────────────────
  const loginWithGoogle = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to initiate Google sign-in' };
    }
  }, []);

  // ─── Register ─────────────────────────────────────────────────────
  const register = useCallback(async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }, // stored in raw_user_meta_data
      },
    });

    if (error) return { success: false, error: error.message };

    // If email confirmation is disabled in Supabase, user is auto-logged in
    if (data.user && data.session) {
      // Upsert profile manually in case the DB trigger hasn't fired yet
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
      });

      const appUser = buildUser(data.user, { full_name: fullName });
      setUser(appUser);
      return { success: true, user: appUser };
    }

    // Email confirmation required — user not yet signed in
    return {
      success: false,
      error: 'Please check your email to confirm your account before signing in.',
    };
  }, []);

  // ─── Demo login (local mock — no Supabase call) ───────────────────
  const demoLogin = useCallback(() => {
    const demoUser = {
      id: 'demo-99',
      email: 'secops.lead@cloudvuln.io',
      full_name: 'Alex Mercer',
      is_active: true,
      created_at: new Date().toISOString(),
      isDemo: true,
    };
    setUser(demoUser);
    // Stash a demo flag so api.js can skip Supabase token retrieval
    localStorage.setItem('cloudvuln_demo', '1');
    return { success: true, user: demoUser };
  }, []);

  // ─── Logout ───────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    localStorage.removeItem('cloudvuln_demo');
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        loginWithGoogle,
        register,
        demoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

