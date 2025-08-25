import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import User from '../models/User';
import connectDB from './mongodb';

// Make sure to match the User schema requirements:
// - name: required
// - email: required, unique
// - handle: required, unique, 3-20 chars, /^[a-zA-Z0-9_-]+$/
// - inviteCode: required, unique
// - image, bio, avatar, status, lastSeen, friends, blocked

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        await connectDB();
        let dbUser = await User.findOne({ email: user.email });

        if (!dbUser) {
          // Generate a unique handle based on name or email prefix
          let baseHandle = (user.name || user.email.split('@')[0] || 'user')
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '')
            .slice(0, 20);
          if (baseHandle.length < 3) baseHandle = baseHandle.padEnd(3, '0');
          let handle = baseHandle;
          let counter = 1;
          while (await User.findOne({ handle })) {
            handle = `${baseHandle}${counter}`;
            if (handle.length > 20) handle = handle.slice(0, 20);
            counter++;
          }

          // Generate a unique inviteCode
          let inviteCode;
          let inviteTries = 0;
          do {
            inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            inviteTries++;
            if (inviteTries > 5) throw new Error('Could not generate unique invite code');
          } while (await User.findOne({ inviteCode }));

          dbUser = await User.create({
            email: user.email,
            name: user.name || user.email.split('@')[0],
            image: user.image || '',
            handle,
            inviteCode,
            emailVerified: profile?.email_verified ? new Date() : null,
            // bio, avatar, status, lastSeen, friends, blocked will use schema defaults
          });
        } else {
          // Update existing user's info
          dbUser.name = user.name || dbUser.name;
          dbUser.image = user.image || dbUser.image;
          if (profile?.email_verified) dbUser.emailVerified = new Date();
          await dbUser.save();
        }

        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    async session({ session, token }) {
      try {
        await connectDB();
        const dbUser = await User.findOne({ email: session.user.email });
        if (dbUser) {
          session.user.id = dbUser._id.toString();
          session.user.handle = dbUser.handle;
          session.user.bio = dbUser.bio;
          session.user.status = dbUser.status;
          session.user.inviteCode = dbUser.inviteCode;
          session.user.avatar = dbUser.avatar;
        }
        return session;
      } catch (error) {
        console.error("Session callback error:", error);
        return session;
      }
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        token.accessToken = account.access_token;
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          token.userId = dbUser._id.toString();
          token.handle = dbUser.handle;
        }
      }
      return token;
    },
  },
  pages: {
    signIn: '/signin',
  },
  events: {
    async signIn({ user }) {
      try {
        await connectDB();
        await User.findOneAndUpdate(
          { email: user.email },
          {
            lastSeen: new Date(),
            status: 'online'
          }
        );
      } catch (e) {
        console.error('Error updating lastSeen/status on signIn event:', e);
      }
    },
  },
};

export default NextAuth(authOptions);
