import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import User from '../models/User.js';
import connectDB from './mongodb.js';
import CredentialsProvider from 'next-auth/providers/credentials';


export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Postman Login",
      credentials: {
        username: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // For testing purpose, you can just return a mock user
        if (credentials?.username === "postman@test.com" &&
            credentials?.password === "1234") {
          return {
            id: "999",
            name: "Postman User",
            email: "postman@test.com"
          };
        }

        // Return null if login fails
        return null;
      }
    })
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

 

          dbUser = await User.create({
            email: user.email,
            name: user.name || user.email.split('@')[0],
            image: user.image || '',
            handle,
    
            emailVerified: profile?.email_verified ? new Date() : null,
            // bio, image, status, lastSeen, friends, blocked will use schema defaults
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
        // console.log("session", session);
        // console.log("token", token);
        const dbUser = await User.findOne({ email: session.user.email });
        if (dbUser) {
          session.user.id = dbUser._id.toString();
          session.user.handle = dbUser.handle;
          session.user.bio = dbUser.bio;
          session.user.status = dbUser.status;
          session.user.image = dbUser.image;
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
