import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

var RAILWAY = "https://smartgumastha-backend-production.up.railway.app";

export var { handlers, auth, signIn, signOut } = NextAuth({
  basePath: "/api/nextauth",
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Only runs on initial Google sign-in (account is populated once)
      if (account?.provider === "google" && profile?.email) {
        try {
          var res = await fetch(
            `${RAILWAY}/api/presence/partner-auth/google-signin`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-google-sync-secret": process.env.GOOGLE_SYNC_SECRET ?? "",
              },
              body: JSON.stringify({
                email: profile.email,
                name: profile.name ?? "",
                picture: (profile as any).picture ?? (profile as any).image ?? "",
              }),
            }
          );
          var data = await res.json();
          if (data.success && data.token) {
            token.railwayJwt = data.token as string;
            token.partner = data.partner;
          }
        } catch (e) {
          console.error("[NextAuth] Railway exchange error:", e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).railwayJwt = (token as any).railwayJwt;
      (session as any).partner = (token as any).partner;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
