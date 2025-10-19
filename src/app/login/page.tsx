"use client";

import React, { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Login gagal");
      window.location.href = "/";
    } catch (err: unknown) {
  setError(err instanceof Error ? err.message : "Terjadi kesalahan");
} finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-950 via-emerald-900 to-amber-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
        <h1 className="text-2xl font-semibold text-amber-50 mb-4">Masuk</h1>
        <p className="text-amber-100 text-sm mb-6">
          Masukkan password untuk mengakses <b>BCS Sapi Analis</b>.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl bg-white text-gray-900 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div className="text-red-200 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium disabled:opacity-60"
          >
            {loading ? "Memeriksa..." : "Masuk"}
          </button>
        </form>

        <footer className="mt-6 text-center text-xs text-amber-100/80">
          Dibuat oleh Dimas
        </footer>
      </div>
    </main>
  );
}
