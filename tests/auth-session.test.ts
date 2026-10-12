import test from 'node:test';
import assert from 'node:assert/strict';
import type { Session } from '@supabase/supabase-js';
import { observeSession, type AuthState } from '../lib/auth-session.ts';

function source() {
  let resolve!: (value: { data: { session: Session | null }; error: null }) => void;
  let reject!: (error: Error) => void;
  let callback!: (event: 'SIGNED_OUT' | 'SIGNED_IN', session: Session | null) => void;
  let unsubscribed = false;
  const promise = new Promise<{ data: { session: Session | null }; error: null }>((yes, no) => { resolve = yes; reject = no; });
  const auth = {
    getSession: () => promise,
    onAuthStateChange: (fn: typeof callback) => {
      callback = fn;
      return { data: { subscription: { unsubscribe: () => { unsubscribed = true; } } } };
    },
  };
  return { auth: auth as Parameters<typeof observeSession>[0], resolve, reject, emit: (event: 'SIGNED_OUT' | 'SIGNED_IN', session: Session | null) => callback(event, session), isUnsubscribed: () => unsubscribed };
}
const oldSession = { access_token: 'old test session' } as Session;

test('a delayed restoration cannot sign a user back in after logout', async () => {
  const mock = source(); const states: AuthState[] = [];
  const stop = observeSession(mock.auth, state => states.push(state));
  mock.emit('SIGNED_OUT', null);
  mock.resolve({ data: { session: oldSession }, error: null });
  await Promise.resolve();
  assert.deepEqual(states, [{ session: null, loading: false, error: null }]);
  stop();
});
test('restoration failures end loading and report the error', async () => {
  const mock = source(); const states: AuthState[] = [];
  const stop = observeSession(mock.auth, state => states.push(state));
  mock.reject(new Error('Storage unavailable'));
  await Promise.resolve();
  assert.equal(states[0].loading, false);
  assert.equal(states[0].error, 'Storage unavailable');
  mock.emit('SIGNED_IN', oldSession);
  assert.equal(states[1].error, null);
  assert.equal(states[1].session, oldSession);
  stop();
});
test('unmount unsubscribes and ignores pending restoration and events', async () => {
  const mock = source(); const states: AuthState[] = [];
  const stop = observeSession(mock.auth, state => states.push(state));
  stop();
  mock.resolve({ data: { session: oldSession }, error: null });
  mock.emit('SIGNED_IN', oldSession);
  await Promise.resolve();
  assert.equal(mock.isUnsubscribed(), true);
  assert.equal(states.length, 0);
});
