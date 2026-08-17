import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

/**
 * Reads the current auth session on the client.
 * Route protection lives in `src/routes/_authenticated/route.tsx` — this hook is
 * only for rendering session-aware UI (account menu, sign-in CTA, etc).
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return {
    session,
    user: (session?.user ?? null) as User | null,
    loading,
    isAuthenticated: Boolean(session),
  };
}
