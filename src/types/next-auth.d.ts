import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      subscriptionTier: string;
      tokensRemaining: number;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    username?: string;
    subscriptionTier?: string;
    tokensRemaining?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    username: string;
    subscriptionTier: string;
    tokensRemaining: number;
  }
} 