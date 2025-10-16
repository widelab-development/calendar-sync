'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user || null,
    loading: status === 'loading',
    signIn: () => signIn('google'),
    signOut: () => signOut(),
  };
}
