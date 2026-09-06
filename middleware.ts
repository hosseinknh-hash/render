import { NextRequest, NextResponse } from "next/server";

// Basic-auth gate for the staff leads dashboard and its APIs.
// /api/leads/intake and /api/sms/inbound are public webhooks and stay excluded.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/api/leads/intake") return NextResponse.next();

  const user = process.env.ADMIN_USERNAME;
  const pass = process.env.ADMIN_PASSWORD;
  if (!user || !pass) return NextResponse.next(); // not configured — leave open in dev

  const auth = req.headers.get("authorization");
  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded);
      const separatorIndex = decoded.indexOf(":");
      const u = decoded.slice(0, separatorIndex);
      const p = decoded.slice(separatorIndex + 1);
      if (u === user && p === pass) return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Leads Dashboard"' },
  });
}

export const config = {
  matcher: ["/leads/:path*", "/api/leads/:path*"],
};
