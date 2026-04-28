import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    railwayJwt?: string;
    partner?: Record<string, any>;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    railwayJwt?: string;
    partner?: Record<string, any>;
  }
}
