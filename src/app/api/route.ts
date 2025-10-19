import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    const appPassword = process.env.APP_PASSWORD || "";
    if (!appPassword) {
      // Jika APP_PASSWORD kosong → proteksi nonaktif → izinkan masuk
      const res = NextResponse.json({ ok: true });
      res.cookies.set("app_auth", "ok", {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 hari
      });
      return res;
    }

    if (String(password) !== appPassword) {
      return NextResponse.json({ error: "Password salah" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("app_auth", "ok", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 hari
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Bad request" }, { status: 400 });
  }
}
