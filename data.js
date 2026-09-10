export const venues = [
  {
    id: "k-arena-yokohama",
    name: "Kアリーナ横浜",
    city: "横浜",
    profileVersion: "2026.09-provisional.1",
    updatedAt: "2026-09-10",
    expiresAt: "2027-03-09",
    officialUrl: "https://k-arena.com/access/",
    note: "公式は横浜駅徒歩9分、新高島駅徒歩5分と案内。終演時は出場規制と指定退場ルートがあるため、以下は検証前の保守的な試験値です。",
    stationProfiles: [
      {
        id: "yokohama",
        name: "横浜駅",
        outdoorMinutes: { low: 15, typical: 25, conservative: 40 },
        stationMinutes: { low: 8, typical: 12, conservative: 18 },
        quality: "C"
      },
      {
        id: "shin-yokohama",
        name: "新横浜駅（横浜駅経由）",
        outdoorMinutes: { low: 28, typical: 38, conservative: 52 },
        stationMinutes: { low: 12, typical: 18, conservative: 25 },
        quality: "C"
      }
    ]
  },
  {
    id: "tokyo-dome",
    name: "東京ドーム",
    city: "東京",
    profileVersion: "2026.09-provisional.1",
    updatedAt: "2026-09-10",
    expiresAt: "2027-03-09",
    officialUrl: "https://www.tokyo-dome.co.jp/dome/access/",
    note: "公式はJR水道橋駅、都営水道橋駅、後楽園駅、春日駅を最寄り駅として案内。以下は終演後実測前の試験値です。",
    stationProfiles: [
      {
        id: "suidobashi",
        name: "JR水道橋駅",
        outdoorMinutes: { low: 5, typical: 10, conservative: 18 },
        stationMinutes: { low: 5, typical: 8, conservative: 15 },
        quality: "C"
      },
      {
        id: "tokyo",
        name: "東京駅（JR水道橋駅経由）",
        outdoorMinutes: { low: 18, typical: 28, conservative: 40 },
        stationMinutes: { low: 12, typical: 18, conservative: 25 },
        quality: "C"
      }
    ]
  },
  {
    id: "kyocera-dome-osaka",
    name: "京セラドーム大阪",
    city: "大阪",
    profileVersion: "2026.09-provisional.1",
    updatedAt: "2026-09-10",
    expiresAt: "2027-03-09",
    officialUrl: "https://www.kyoceradome-osaka.jp/access/",
    note: "公式はドーム前千代崎・ドーム前駅を徒歩すぐ、JR大正駅を徒歩約7分と案内。以下は終演後実測前の試験値です。",
    stationProfiles: [
      {
        id: "dome-mae-chiyozaki",
        name: "ドーム前千代崎駅",
        outdoorMinutes: { low: 4, typical: 10, conservative: 18 },
        stationMinutes: { low: 6, typical: 12, conservative: 20 },
        quality: "C"
      },
      {
        id: "taisho",
        name: "JR大正駅",
        outdoorMinutes: { low: 8, typical: 15, conservative: 25 },
        stationMinutes: { low: 8, typical: 14, conservative: 22 },
        quality: "C"
      },
      {
        id: "shin-osaka",
        name: "新大阪駅（大正駅経由）",
        outdoorMinutes: { low: 30, typical: 45, conservative: 60 },
        stationMinutes: { low: 12, typical: 20, conservative: 30 },
        quality: "C"
      }
    ]
  }
];

export const exitProfiles = {
  "k-arena-yokohama": {
    front: { low: 8, typical: 15, conservative: 28 },
    middle: { low: 10, typical: 18, conservative: 32 },
    rear_upper: { low: 12, typical: 22, conservative: 38 },
    unknown: { low: 12, typical: 22, conservative: 40 }
  },
  "tokyo-dome": {
    front: { low: 8, typical: 16, conservative: 28 },
    middle: { low: 10, typical: 20, conservative: 32 },
    rear_upper: { low: 12, typical: 24, conservative: 38 },
    unknown: { low: 12, typical: 24, conservative: 40 }
  },
  "kyocera-dome-osaka": {
    front: { low: 8, typical: 16, conservative: 30 },
    middle: { low: 10, typical: 20, conservative: 34 },
    rear_upper: { low: 12, typical: 24, conservative: 40 },
    unknown: { low: 12, typical: 24, conservative: 42 }
  }
};

export const boardingBuffers = {
  shinkansen: 10,
  limited_express: 8,
  local_last_train: 7
};

export const dataSources = [
  {
    id: "k-arena-access",
    venueId: "k-arena-yokohama",
    kind: "official",
    url: "https://k-arena.com/access/",
    observedAt: "2026-09-10",
    claim: "横浜駅徒歩9分、新高島駅徒歩5分。"
  },
  {
    id: "k-arena-exit-route",
    venueId: "k-arena-yokohama",
    kind: "official",
    url: "https://k-arena.com/news/20260204-1/",
    observedAt: "2026-09-10",
    claim: "終演時は安全確保のため出場規制があり、退場ルート以外の階段を封鎖する場合がある。"
  },
  {
    id: "tokyo-dome-access",
    venueId: "tokyo-dome",
    kind: "official",
    url: "https://www.tokyo-dome.co.jp/dome/access/",
    observedAt: "2026-09-10",
    claim: "JR水道橋駅など複数の最寄り駅を案内。"
  },
  {
    id: "kyocera-access",
    venueId: "kyocera-dome-osaka",
    kind: "official",
    url: "https://www.kyoceradome-osaka.jp/access/",
    observedAt: "2026-09-10",
    claim: "ドーム前千代崎・ドーム前駅は徒歩すぐ、JR大正駅は徒歩約7分。"
  }
];
