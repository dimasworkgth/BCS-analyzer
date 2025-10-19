import { NextResponse, NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/api/login",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/_next",       // assets Next.js
  "/assets",      // kalau nanti ada
];

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;

  // Jika APP_PASSWORD kosong/tidak disetel → proteksi dinonaktifkan otomatis
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword || appPassword.trim() === "") {
    return NextResponse.next();
  }

  // Lewatkan public/static paths
  if (PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Cek cookie auth
  const auth = req.cookies.get("app_auth")?.value;
  if (auth === "ok") {
    return NextResponse.next();
  }

  // Belum login → redirect ke /login
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("from", path);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"], // lindungi semua kecuali asset next
};
