// src/lib/calibration.ts
export type BcsDetail = {
  kategori: string;
  rekomendasi: string;
};

export function getBcsDetail(score: number): BcsDetail {
  const s = Number(score);

  if (s >= 1 && s <= 3) {
    return {
      kategori: "Sangat Kurus",
      rekomendasi:
        "Tingkatkan pakan konsentrat kaya energi & protein, tambah hijauan berkualitas; evaluasi kesehatan dan parasit.",
    };
  }
  if (s > 3 && s < 5) {
    return {
      kategori: "Kurus",
      rekomendasi:
        "Perbaiki keseimbangan ransum, tambah konsentrat dan mineral-vitamin; pantau kenaikan bobot mingguan.",
    };
  }
  if (s >= 5 && s <= 6) {
    return {
      kategori: "Optimal",
      rekomendasi:
        "Pertahankan ransum saat ini; jaga kualitas hijauan dan konsentrat, pastikan air bersih tersedia.",
    };
  }
  if (s > 6 && s < 8) {
    return {
      kategori: "Gemuk",
      rekomendasi:
        "Kurangi konsentrat tinggi energi; tingkatkan aktivitas/gerak; pantau risiko metabolik.",
    };
  }
  // 8–9
  return {
    kategori: "Sangat Gemuk",
    rekomendasi:
      "Turunkan densitas energi ransum, fokus pada hijauan berkualitas sedang; awasi risiko laminitis & gangguan metabolik.",
  };
}
