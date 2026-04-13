import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  var country = req.headers.get("x-vercel-ip-country") || "IN";
  var city = req.headers.get("x-vercel-ip-city") || "";
  return NextResponse.json({ country, city });
}
