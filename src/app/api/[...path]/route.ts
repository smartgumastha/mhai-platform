import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  "https://smartgumastha-backend-production.up.railway.app";

async function proxyRequest(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const url = `${BACKEND_URL}${pathname}${search}`;

  const headers: HeadersInit = {
    "Content-Type": req.headers.get("content-type") ?? "application/json",
  };

  const auth = req.headers.get("authorization");
  if (auth) {
    headers["Authorization"] = auth;
  }

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  try {
    const res = await fetch(url, {
      method: req.method,
      headers,
      body,
    });

    const data = await res.arrayBuffer();

    return new NextResponse(data, {
      status: res.status,
      headers: {
        "Content-Type":
          res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error("API proxy error:", error);
    return NextResponse.json(
      { error: "Backend unavailable" },
      { status: 502 },
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
