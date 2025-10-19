"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { getBcsDetail } from "@/lib/calibration";

type AnalyzeResult = {
  skor_bcs: number;
  analisis_singkat: string;
  tingkat_keyakinan: "Tinggi" | "Sedang" | "Rendah" | string;
};

type SlotKey = "right" | "left" | "rear";

export default function HomePage() {
  const [gender, setGender] = useState<"Jantan" | "Betina">("Jantan");
  const [files, setFiles] = useState<Record<SlotKey, File | null>>({
    right: null,
    left: null,
    rear: null,
  });
  const [previews, setPreviews] = useState<Record<SlotKey, string>>({
    right: "",
    left: "",
    rear: "",
  });
  const [dragOver, setDragOver] = useState<Record<SlotKey, boolean>>({
    right: false,
    left: false,
    rear: false,
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<
    (AnalyzeResult & { kategori?: string; rekomendasi?: string }) | null
  >(null);

  const inputRefs = {
    right: useRef<HTMLInputElement>(null),
    left: useRef<HTMLInputElement>(null),
    rear: useRef<HTMLInputElement>(null),
  };

  const onPick = (slot: SlotKey) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFile(slot, file);
  };

  function handleFile(slot: SlotKey, file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("File harus gambar (JPEG/PNG).");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setStatus("Ukuran gambar maksimal 6MB per foto.");
      return;
    }
    setFiles((s) => ({ ...s, [slot]: file }));
    setPreviews((s) => ({ ...s, [slot]: URL.createObjectURL(file) }));
    setStatus("");
  }

  const onDrop = (slot: SlotKey) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver((s) => ({ ...s, [slot]: false }));
    const file = e.dataTransfer.files?.[0] || null;
    handleFile(slot, file);
  };
  const onDragOver = (slot: SlotKey) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver((s) => ({ ...s, [slot]: true }));
  };
  const onDragLeave = (slot: SlotKey) => () => {
    setDragOver((s) => ({ ...s, [slot]: false }));
  };

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    setStatus("");

    if (!files.right || !files.left || !files.rear) {
      setStatus("Lengkapi tiga foto: kanan, kiri, belakang.");
      return;
    }

    setLoading(true);
    setStatus("Menganalisis...");

    try {
      const fd = new FormData();
      fd.append("gender", gender);
      fd.append("right", files.right);
      fd.append("left", files.left);
      fd.append("rear", files.rear);

      const res = await fetch("/api/analyze", { method: "POST", body: fd });

      // Hindari `any`
      type AnalyzeAPI = AnalyzeResult & Partial<{ error: string }>;
      const data = (await res.json()) as AnalyzeAPI;

      if (!res.ok || data.error) {
        throw new Error(data?.error || "Analisis gagal.");
      }

      const detail = getBcsDetail(Number(data.skor_bcs));
      const withCalib = {
        ...data,
        kategori: detail.kategori,
        rekomendasi: detail.rekomendasi,
      };
      setResult(withCalib);
      setStatus("Selesai ✔");
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  const Slot = ({ slot, label }: { slot: SlotKey; label: string }) => (
    <div
      onClick={() => inputRefs[slot].current?.click()}
      onDrop={onDrop(slot)}
      onDragOver={onDragOver(slot)}
      onDragLeave={onDragLeave(slot)}
      className={[
        "cursor-pointer border-2 border-dashed rounded-2xl p-3 min-h-[220px] transition",
        dragOver[slot] ? "border-emerald-400 bg-white/10" : "border-white/30 bg-white/5",
      ].join(" ")}
    >
      <div className="text-sm font-medium mb-2 text-amber-50">{label}</div>
      {previews[slot] ? (
        <div className="relative w-full h-40 rounded-xl overflow-hidden">
          <Image
            src={previews[slot]}
            alt={label}
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      ) : (
        <div className="text-xs text-amber-100/80 h-40 flex items-center justify-center rounded-xl bg-white/10">
          Klik untuk pilih / drag & drop
        </div>
      )}
      <input
        ref={inputRefs[slot]}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPick(slot)}
      />
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-950 via-emerald-900 to-amber-900">
      <header className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold text-amber-50">BCS Sapi Analis</h1>
        <span className="text-xs text-amber-100/80">Mode Beta</span>
      </header>

      <div className="max-w-6xl mx-auto px-4 pb-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Kolom Kiri: Form */}
        <section className="space-y-6">
          <form onSubmit={handleAnalyze} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Slot slot="right" label="Foto Sisi Kanan" />
              <Slot slot="left" label="Foto Sisi Kiri" />
              <Slot slot="rear" label="Foto Bagian Belakang" />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-amber-50">Jenis Kelamin:</span>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as "Jantan" | "Betina")}
                className="border border-white/30 bg-white/10 text-amber-50 rounded-xl px-3 py-2 text-sm"
              >
                <option className="text-gray-900" value="Jantan">
                  Jantan
                </option>
                <option className="text-gray-900" value="Betina">
                  Betina
                </option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium disabled:opacity-60"
            >
              {loading ? "Menganalisis..." : "Analisis Sekarang"}
            </button>

            {status && <div className="text-sm text-amber-100/90">{status}</div>}
          </form>
        </section>

        {/* Kolom Kanan: Hasil */}
        <section className="rounded-2xl p-5 min-h-[360px] bg-white/10 border border-white/20">
          {!result ? (
            <div className="text-amber-100/80">
              Unggah 3 foto + pilih jenis kelamin. Lalu klik <b>Analisis Sekarang</b>.
            </div>
          ) : (
            <div className="space-y-3 text-amber-50">
              <div className="text-sm uppercase tracking-wide text-amber-200/90">
                Tingkat Keyakinan: <b>{result.tingkat_keyakinan}</b>
              </div>
              <div className="text-5xl font-bold text-white">{result.skor_bcs}</div>
              <p className="text-amber-100/90">{result.analisis_singkat}</p>

              {result.kategori && (
                <div className="mt-3 p-4 rounded-xl bg-emerald-50/90 border border-emerald-200 text-gray-900">
                  <div className="text-sm text-gray-600">Kategori</div>
                  <div className="text-lg font-semibold">{result.kategori}</div>
                  <div className="mt-1 text-gray-700">{result.rekomendasi}</div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <footer className="py-6 text-center text-xs text-amber-100/80">Dibuat oleh Dimas</footer>
    </main>
  );
}
