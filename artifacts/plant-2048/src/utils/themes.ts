export interface TileStyle {
  bg: string;
  color: string;
  name: string;
}

export type ThemeMap = Record<number, TileStyle>;

export interface Theme {
  id: string;
  name: string;
  tiles: ThemeMap;
  fallback: TileStyle;
}

export const plantTheme: Theme = {
  id: "plant",
  name: "식물",
  fallback: { bg: "bg-gray-800", color: "text-white", name: "초월 식물" },
  tiles: {
    2: { bg: "bg-tile-2", color: "text-text-dark", name: "씨앗" },
    4: { bg: "bg-tile-4", color: "text-text-dark", name: "싹" },
    8: { bg: "bg-tile-8", color: "text-text-dark", name: "새싹" },
    16: { bg: "bg-tile-16", color: "text-text-dark", name: "잎" },
    32: { bg: "bg-tile-32", color: "text-text-light", name: "작은 화분" },
    64: { bg: "bg-tile-64", color: "text-text-light", name: "꽃봉오리" },
    128: { bg: "bg-tile-128", color: "text-text-light", name: "꽃" },
    256: { bg: "bg-tile-256", color: "text-text-light", name: "큰 꽃" },
    512: { bg: "bg-tile-512", color: "text-text-light", name: "반짝 꽃" },
    1024: { bg: "bg-tile-1024", color: "text-text-light", name: "희귀 꽃" },
    2048: { bg: "bg-tile-2048", color: "text-text-light", name: "전설의 꽃" },
  }
};

export const THEMES: Record<string, Theme> = {
  plant: plantTheme
};
