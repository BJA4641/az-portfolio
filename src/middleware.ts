import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const signInUrl = new URL("/login", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const isTenant = token.role === "TENANT";
  const inPortal = pathname.startsWith("/portal");

  // Tenants are confined to /portal - every owner/staff page (vendors, taxes,
  // reports, etc.) is off-limits, not just its delete actions.
  if (isTenant && !inPortal) {
    return NextResponse.redirect(new URL("/portal", req.url));
  }
  // Owner/staff have no reason to be in the tenant portal.
  if (!isTenant && inPortal) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|login|listing/|_next/static|_next/image|favicon.ico).*)"
  ]
};
