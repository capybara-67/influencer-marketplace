import type { Session, SupabaseClient } from '@supabase/supabase-js';

export type AuthState = {
  session: Session | null;
  loading: boolean;
  error: string | null;
};
type AuthSource = Pick<SupabaseClient['auth'], 'getSession' | 'onAuthStateChange'>;

export function observeSession(auth: AuthSource, update: (state: AuthState) => void) {
  let active = true;
  let revision = 0;
  const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
    if (!active) return;
    revision++;
    update({ session, loading: false, error: null });
  });
  const restoreRevision = revision;
  void (async () => {
    try {
      const { data, error } = await auth.getSession();
      if (active && revision === restoreRevision) {
        update({ session: data.session, loading: false, error: error?.message ?? null });
      }
    } catch (failure: unknown) {
      if (active && revision === restoreRevision) {
        update({ session: null, loading: false, error: failure instanceof Error ? failure.message : 'Unable to restore your session.' });
      }
    }
  })();
  return () => {
    active = false;
    subscription.unsubscribe();
  };
}
