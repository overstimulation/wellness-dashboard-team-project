// Konfiguracja NextAuth dla aplikacji.
// Dodaliśmy provider Google (OAuth) obok istniejących 'credentials',
// aby umożliwić logowanie przez konto Google i zachować spójny dostęp do API.
import NextAuth, { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

// Wymuszamy uruchamianie tego Route Handlera w środowisku Node.js,
// ponieważ używamy modułów Node (np. 'crypto', 'bcryptjs').
// Edge Runtime nie wspiera tych modułów.
export const runtime = "nodejs";

export const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email }).select(
          "+password"
        );

        if (!user) {
          return null;
        }

        // Ważne: jeśli konto powstało przez OAuth (np. Google) i nie ma lokalnego hasła,
        // blokujemy logowanie przez 'credentials' (chroni przed mylącym UX i błędami).
        if (!user.password) {
          return null;
        }

        const isPasswordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordMatch) {
          return null;
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        };
      },
    }),
    GoogleProvider({
      // Konfiguracja Google OAuth: wartości pochodzą z .env
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Przypinam token.id do lokalnego _id z MongoDB
      if (user?.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          token.id = dbUser._id.toString();
        } else if ((user as any).id) {
          token.id = (user as any).id as string;
        }
      } else if (!token.id && token.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) {
          token.id = dbUser._id.toString();
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Tworzymy lokalny rekord User przy pierwszym logowaniu przez Google OAuth.
      if (account?.provider === "google") {
        await connectDB();
        const email = user.email;
        const name = user.name || "User";
        if (!email) {
          return false;
        }

        let existing = await User.findOne({ email });
        if (!existing) {
          // Tworzymy profil i losowe (nieużywane do logowania) hasło, ponieważ logowanie odbywa się przez Google.
          const dummyPassword = await bcrypt.hash(
            randomBytes(32).toString("hex"),
            10
          );
          const profileRef = (await import("@/models/UserProfile")).default;
          const newProfile = new profileRef({});
          const newUser = new User({
            email,
            name,
            password: dummyPassword,
            profile: newProfile._id,
          });
          newProfile.user = newUser._id;
          await newUser.save();
          await newProfile.save();
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Required for Vercel deployment
};

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth(authOptions);

