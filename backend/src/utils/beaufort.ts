export function kmhToBeaufort(kmh: number): number {
  if (kmh < 1) return 0;
  if (kmh < 6) return 1;
  if (kmh < 12) return 2;
  if (kmh < 20) return 3;
  if (kmh < 29) return 4;
  if (kmh < 39) return 5;
  if (kmh < 50) return 6;
  if (kmh < 62) return 7;
  if (kmh < 75) return 8;
  if (kmh < 89) return 9;
  if (kmh < 103) return 10;
  if (kmh < 118) return 11;
  return 12;
}

export function beaufortToText(bft: number): string {
  const descriptions = [
    "Calm", "Light air", "Light breeze", "Gentle breeze",
    "Moderate breeze", "Fresh breeze", "Strong breeze",
    "High wind", "Gale", "Strong gale", "Storm",
    "Violent storm", "Hurricane"
  ];
  return descriptions[bft] || "Unknown";
}
