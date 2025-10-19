/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Buffer } from "buffer";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---- MASTER PROMPT (berbasis panduan ilmiah BCS 1–9 untuk sapi potong) ----
function buildMasterPrompt(gender: string) {
  return `
Anda adalah model vision yang menilai Body Condition Score (BCS) sapi potong pada skala 1–9, berbasis TIGA foto: sisi kanan, sisi kiri, dan bagian belakang. Jenis kelamin sapi: ${gender}.

Area evaluasi WAJIB diperhatikan: tulang belakang (spine/back), tulang rusuk (ribs), hooks & pins (pinggul), pangkal ekor (tailhead), dan brisket.

Pedoman skor (ringkas):
- BCS 1: Sangat kurus (emaciated). Tulang punggung & rusuk sangat tajam/menonjol, hooks & pins jelas, tailhead cekung sangat dalam, lemak tidak tampak.
- BCS 2: Sangat kurus. Tulang tetap jelas; hampir tanpa lemak.
- BCS 3: Kurus. Sedikit jaringan lemak tipis; tulang masih menonjol.
- BCS 4: Borderline kurus. Ribs belakang sebagian tertutup; tulang punggung & pinggul masih terlihat; sedikit lemak di tailhead.
- BCS 5: Optimal. Tulang rusuk tidak terlihat jelas; punggung relatif rata; lemak cukup di pinggul & tailhead.
- BCS 6: Baik. Punggung mulai cembung ringan; terasa empuk di rusuk & tailhead.
- BCS 7: Gemuk. Punggung cembung; brisket mulai berlemak; siluet tubuh makin “kotak”.
- BCS 8–9: Sangat gemuk/obes. Pockets of fat di tailhead & brisket; punggung sangat cembung; tulang tidak teraba.

Instruksi:
1) Nilai BCS dengan menggabungkan bukti visual dari KETIGA foto.
2) Gunakan prinsip "evidence-first": ringkas bukti dari area kunci (spine/ribs/hooks-pins/tailhead/brisket).
3) Pertimbangkan bias foto (pencahayaan, sudut, bulu). Jika meragukan, turunkan "tingkat_keyakinan".
4) Output HANYA JSON VALID (tanpa teks lain).

FORMAT JSON:
{
  "skor_bcs": <number 1..9, boleh pecahan, mis. 5.5>,
  "analisis_singkat": "<maks 2 kalimat; bukti visual dari 3 sudut>",
  "tingkat_keyakinan": "<Tinggi|Sedang|Rendah>"
}
  `.trim();
}

async function fileToInlineData(file: File) {
  const mimeType = file.type || "image/jpeg";
  const ab = await file.arrayBuffer();
  const b64 = Buffer.from(ab).toString("base64");
  return { inlineData: { mimeType, data: b64 } };
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const gender = String(form.get("gender") || "Jantan");

    const right = form.get("right");
    const left  = form.get("left");
    const rear  = form.get("rear");

    if (!(right instanceof File) || !(left instanceof File) || !(rear instanceof File)) {
      return NextResponse.json({ error: "FormData tidak lengkap. Unggah 3 foto: right, left, rear." }, { status: 400 });
    }

    const prompt     = buildMasterPrompt(gender);
    const partRight  = await fileToInlineData(right);
    const partLeft   = await fileToInlineData(left);
    const partRear   = await fileToInlineData(rear);

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GOOGLE_API_KEY belum diset di Environment Variables (Vercel)." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }, partRight, partLeft, partRear] }],
    });

    const text =
      (result as any)?.response?.text?.() ||
      (result as any)?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "";

    // Paksa JSON valid
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) json = JSON.parse(m[0]);
      else throw new Error("Model tidak mengembalikan JSON valid.");
    }

    const out = {
      skor_bcs: Number(json.skor_bcs),
      analisis_singkat: String(json.analisis_singkat || ""),
      tingkat_keyakinan: String(json.tingkat_keyakinan || "Sedang"),
    };

    if (Number.isNaN(out.skor_bcs)) throw new Error("Nilai skor_bcs tidak valid.");

    return NextResponse.json(out, { status: 200 });
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
