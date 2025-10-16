import NextAuth from 'next-auth/next';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id || user.email; // Użyj email jako ID jeśli user.id nie istnieje
        console.log('JWT callback - user:', user);
        console.log('JWT callback - token.id:', token.id);
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      // Dodaj user ID do sesji
      if (session.user && token.id) {
        session.user.id = token.id;
        console.log('Session callback - session.user.id:', session.user.id);
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
};

export default NextAuth(authOptions);
