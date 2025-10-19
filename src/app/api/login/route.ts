import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LoginBody = { password?: string };

export async function POST(req: NextRequest) {
  try {
    // Aman saat body kosong → kembalikan {} agar .json() tidak melempar error
    const body: LoginBody = await req.json().catch(() => ({}));
    const password = body?.password ?? "";
    const appPassword = (process.env.APP_PASSWORD || "").trim();

    // Mode beta: jika APP_PASSWORD kosong → proteksi nonaktif
    if (!appPassword) {
      const res = NextResponse.json({ ok: true });
      res.cookies.set("app_auth", "ok", {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        secure: true,
        maxAge: 60 * 60 * 24, // 🕐 1 hari
      });
      return res;
    }

    // Validasi password
    if (password === appPassword) {
      const res = NextResponse.json({ ok: true });
      res.cookies.set("app_auth", "ok", {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        secure: true,
        maxAge: 60 * 60 * 24, // 🕐 1 hari
      });
      return res;
    }

    // Password salah
    return NextResponse.json(
      { ok: false, error: "Password salah." },
      { status: 401 }
    );
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { ok: false, error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
