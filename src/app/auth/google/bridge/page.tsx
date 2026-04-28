import { auth } from "@/auth";
import { redirect } from "next/navigation";
import GoogleBridgeClient from "./client";

export default async function GoogleBridgePage() {
  var session = await auth();

  var railwayJwt = (session as any)?.railwayJwt as string | undefined;
  var partner = (session as any)?.partner ?? null;

  if (!railwayJwt) {
    redirect("/login?error=google_failed");
  }

  return <GoogleBridgeClient railwayJwt={railwayJwt} partner={partner} />;
}
