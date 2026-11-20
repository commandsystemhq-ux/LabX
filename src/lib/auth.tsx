import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { authErrorKey, displayNameOf, type Credentials } from "./auth-utils";
import type { UiKey } from "./i18n";
import { createGuestRepository, progressStore } from "./progress";
import { createSupabaseRepository, type RemoteProgressRepository } from "./progress-remote";
import { getSupabase, isSupabaseConfigured } from "./supabase";

export type AuthStatus = "loading" | "guest" | "signed-in";
/** idle = guest / not connected; syncing = loading the account's progress; error = needs retry. */
export type SyncStatus = "idle" | "syncing" | "ready" | "error";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  /** UI hint only (app_metadata.role). The server re-checks the role on every admin call. */
  isAdmin: boolean;
}

export type AuthResult = { ok: true; needsConfirmation: boolean } | { ok: false; error: UiKey };

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** False when Supabase env vars are missing: the app still works as a guest. */
  configured: boolean;
  sync: SyncStatus;
  retrySync: () => void;
  signIn: (c: Credentials) => Promise<AuthResult>;
  signUp: (c: Credentials) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  /** A fresh access token for server functions, or null when signed out. */
  getAccessToken: () => Promise<string | null>;
}

const unavailable: AuthResult = { ok: false, error: "authErrNotConfigured" };

const guestValue: AuthContextValue = {
  status: "guest",
  user: null,
  configured: isSupabaseConfigured,
  sync: "idle",
  retrySync: () => {},
  signIn: async () => unavailable,
  signUp: async () => unavailable,
  signOut: async () => {},
  getAccessToken: async () => null,
};

const AuthContext = createContext<AuthContextValue>(guestValue);

function toUser(session: Session | null): AuthUser | null {
  if (!session) return null;
  const { user } = session;
  return {
    id: user.id,
    email: user.email ?? "",
    name: displayNameOf(user),
    isAdmin: user.app_metadata?.["role"] === "admin",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [sync, setSync] = useState<SyncStatus>("idle");
  const [retryTick, setRetryTick] = useState(0);
  const repoRef = useRef<RemoteProgressRepository | null>(null);

  useEffect(() => {
    const client = getSupabase();
    if (!client) {
      setLoading(false);
      return;
    }
    let active = true;
    // Only set state in the callback: awaiting Supabase calls here can deadlock the auth lock.
    const { data } = client.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      setLoading(false);
    });
    client.auth
      .getSession()
      .then(({ data: current }) => {
        if (!active) return;
        setSession((prev) => prev ?? current.session);
        setLoading(false);
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;

  // Connect progress storage to the active account (or fall back to the guest repository).
  useEffect(() => {
    const client = getSupabase();
    if (!client || loading) return;

    if (!userId) {
      progressStore.attachRepository(createGuestRepository(true));
      setSync("idle");
      return;
    }

    let cancelled = false;
    const repo = createSupabaseRepository(client, userId, () => {
      if (!cancelled) setSync("error");
    });
    setSync("syncing");
    repo
      .hydrate()
      .then(() => {
        if (cancelled) return;
        repoRef.current = repo;
        progressStore.attachRepository(repo, true);
        setSync("ready");
      })
      .catch(() => {
        if (!cancelled) setSync("error");
      });
    return () => {
      cancelled = true;
      if (repoRef.current === repo) repoRef.current = null;
      repo.dispose();
    };
  }, [userId, loading, retryTick]);

  const signIn = useCallback(async (c: Credentials): Promise<AuthResult> => {
    const client = getSupabase();
    if (!client) return unavailable;
    try {
      const { error } = await client.auth.signInWithPassword({
        email: c.email,
        password: c.password,
      });
      return error
        ? { ok: false, error: authErrorKey(error) }
        : { ok: true, needsConfirmation: false };
    } catch (error) {
      return { ok: false, error: authErrorKey(error) };
    }
  }, []);

  const signUp = useCallback(async (c: Credentials): Promise<AuthResult> => {
    const client = getSupabase();
    if (!client) return unavailable;
    try {
      const { data, error } = await client.auth.signUp({
        email: c.email,
        password: c.password,
        options: {
          data: { display_name: c.name ?? "" },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) return { ok: false, error: authErrorKey(error) };
      return { ok: true, needsConfirmation: !data.session };
    } catch (error) {
      return { ok: false, error: authErrorKey(error) };
    }
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabase();
    if (!client) return;
    await repoRef.current?.flush().catch(() => false);
    await client.auth.signOut().catch(() => {});
  }, []);

  const getAccessToken = useCallback(async () => {
    const client = getSupabase();
    if (!client) return null;
    try {
      const { data } = await client.auth.getSession();
      return data.session?.access_token ?? null;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = toUser(session);
    return {
      status: loading ? "loading" : user ? "signed-in" : "guest",
      user,
      configured: isSupabaseConfigured,
      sync,
      retrySync: () => setRetryTick((n) => n + 1),
      signIn,
      signUp,
      signOut,
      getAccessToken,
    };
  }, [session, loading, sync, signIn, signUp, signOut, getAccessToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Safe outside a provider (tests, isolated components): behaves as a guest. */
export function useAuth() {
  return useContext(AuthContext);
}
