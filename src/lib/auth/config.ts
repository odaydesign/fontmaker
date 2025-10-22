import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import TokenService from '../services/TokenService';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Email/Password Provider
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing email or password');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName || user.username,
          image: user.avatarUrl,
        };
      },
    }),

    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),

    // GitHub OAuth Provider
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    newUser: '/dashboard', // Redirect new users to dashboard
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // Add user ID to token on sign in
      if (user) {
        token.id = user.id;

        // Get user from database to include additional fields
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            username: true,
            email: true,
            subscriptionTier: true,
            tokensRemaining: true,
          },
        });

        if (dbUser) {
          token.username = dbUser.username;
          token.subscriptionTier = dbUser.subscriptionTier;
          token.tokensRemaining = dbUser.tokensRemaining;
        }
      }

      return token;
    },

    async session({ session, token }) {
      // DEBUG: Log what we're receiving
      console.log('🔍 Session Callback - Token:', token);
      console.log('🔍 Session Callback - Session before:', session);

      // Populate user data from token to session
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          image: token.picture as string,
          username: token.username as string,
          subscriptionTier: token.subscriptionTier as string,
          tokensRemaining: token.tokensRemaining as number,
        };
      }

      console.log('🔍 Session Callback - Session after:', session);
      return session;
    },

    async signIn({ user, account, profile }) {
      // For OAuth providers, create username from email if not exists
      if (account?.provider !== 'credentials' && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        // If user doesn't exist, create username from email
        if (!existingUser) {
          const emailUsername = user.email.split('@')[0];
          let username = emailUsername;
          let counter = 1;

          // Ensure username is unique
          while (await prisma.user.findUnique({ where: { username } })) {
            username = `${emailUsername}${counter}`;
            counter++;
          }

          // Update user with username
          await prisma.user.update({
            where: { email: user.email },
            data: {
              username,
              displayName: user.name || username,
            },
          });

          // Grant signup bonus tokens
          await TokenService.grantSignupBonus(user.id);
        }
      }

      return true;
    },
  },

  events: {
    async createUser({ user }) {
      // Grant signup bonus when user is created
      await TokenService.grantSignupBonus(user.id);
    },
  },

  debug: process.env.NODE_ENV === 'development',
};

export default authOptions;
