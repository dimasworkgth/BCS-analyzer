export type BcsDetail = {
  kategori: "Sangat Kurus" | "Kurus" | "Optimal" | "Gemuk" | "Sangat Gemuk";
  rekomendasi: string;
};

export function getBcsDetail(score: number): BcsDetail {
  let kategori: BcsDetail["kategori"];

  if (score >= 1 && score <= 3) {
    kategori = "Sangat Kurus";
  } else if (score > 3 && score < 5) {         // 4.0 - 4.9
    kategori = "Kurus";
  } else if (score >= 5 && score <= 6) {       // 5.0 - 6.0
    kategori = "Optimal";
  } else if (score > 6 && score < 8) {         // 7.0 - 7.9
    kategori = "Gemuk";
  } else {
    kategori = "Sangat Gemuk";                 // 8.0 - 9.0
  }

  const rekomendasiMap: Record<BcsDetail["kategori"], string> = {
    "Sangat Kurus":
      "Tingkatkan energi & protein: tambah konsentrat berkualitas, hijauan premium, serta mineral-vitamin.",
    "Kurus":
      "Perlu peningkatan pakan konsentrat kaya energi & protein; pantau kenaikan bobot mingguan.",
    "Optimal":
      "Pertahankan komposisi pakan seimbang; pastikan kualitas hijauan & air selalu baik.",
    "Gemuk":
      "Kurangi konsentrat tinggi energi; fokus pada hijauan berkualitas dan aktivitas agar tidak obesitas.",
    "Sangat Gemuk":
      "Batasi pakan berenergi tinggi; susun diet penurunan BCS bertahap dengan hijauan dominan dan monitoring rutin.",
  };

  return { kategori, rekomendasi: rekomendasiMap[kategori] };
}
