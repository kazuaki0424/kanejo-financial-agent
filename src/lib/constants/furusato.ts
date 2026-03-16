export interface FurusatoCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
  popularItems: FurusatoItem[];
}

export interface FurusatoItem {
  name: string;
  amount: number;
  description: string;
}

export const FURUSATO_CATEGORIES: FurusatoCategory[] = [
  {
    id: 'meat',
    label: 'お肉',
    icon: '🥩',
    description: '和牛・豚肉・鶏肉',
    popularItems: [
      { name: '黒毛和牛 切り落とし 1kg', amount: 10_000, description: '宮崎県産' },
      { name: 'ブランド豚 しゃぶしゃぶ 1.5kg', amount: 10_000, description: '鹿児島県産' },
      { name: '特選和牛 すき焼き用 500g', amount: 20_000, description: 'A5ランク' },
    ],
  },
  {
    id: 'seafood',
    label: '海産物',
    icon: '🦐',
    description: 'カニ・エビ・鮮魚',
    popularItems: [
      { name: 'ズワイガニ 1kg', amount: 15_000, description: '北海道産' },
      { name: '明太子 1kg', amount: 10_000, description: '福岡県産' },
      { name: 'うなぎ蒲焼 4尾', amount: 20_000, description: '鹿児島県産' },
    ],
  },
  {
    id: 'rice',
    label: 'お米',
    icon: '🍚',
    description: 'コシヒカリ・あきたこまち等',
    popularItems: [
      { name: 'コシヒカリ 10kg', amount: 10_000, description: '新潟県産' },
      { name: 'あきたこまち 15kg', amount: 12_000, description: '秋田県産' },
      { name: 'ゆめぴりか 10kg', amount: 12_000, description: '北海道産' },
    ],
  },
  {
    id: 'fruit',
    label: 'フルーツ',
    icon: '🍑',
    description: 'シャインマスカット・桃・みかん',
    popularItems: [
      { name: 'シャインマスカット 2房', amount: 15_000, description: '山梨県産' },
      { name: '白桃 5玉', amount: 10_000, description: '岡山県産' },
      { name: 'デコポン 5kg', amount: 10_000, description: '熊本県産' },
    ],
  },
  {
    id: 'daily',
    label: '日用品',
    icon: '🧴',
    description: 'ティッシュ・洗剤・トイレットペーパー',
    popularItems: [
      { name: 'ティッシュ 60箱', amount: 12_000, description: '大容量' },
      { name: 'トイレットペーパー 96ロール', amount: 10_000, description: '2倍巻き' },
      { name: '洗濯洗剤セット', amount: 10_000, description: '詰め替え用' },
    ],
  },
  {
    id: 'alcohol',
    label: 'お酒',
    icon: '🍺',
    description: 'ビール・日本酒・ワイン',
    popularItems: [
      { name: 'クラフトビール 24缶', amount: 15_000, description: '地ビールセット' },
      { name: '純米大吟醸 720ml×3本', amount: 15_000, description: '金賞受賞蔵' },
      { name: '芋焼酎 1.8L×2本', amount: 10_000, description: '鹿児島県産' },
    ],
  },
];

/**
 * 寄付金額のおすすめ配分を計算する
 */
export function suggestAllocation(limit: number): Array<{ category: FurusatoCategory; suggestedAmount: number }> {
  if (limit <= 2_000) return [];

  const usableLimit = limit - 2_000; // 自己負担分を除く

  // 食品系を優先的に配分
  const priorities = ['rice', 'meat', 'seafood', 'fruit', 'daily', 'alcohol'];
  const result: Array<{ category: FurusatoCategory; suggestedAmount: number }> = [];
  let remaining = usableLimit;

  for (const categoryId of priorities) {
    if (remaining <= 0) break;
    const category = FURUSATO_CATEGORIES.find((c) => c.id === categoryId);
    if (!category) continue;

    // Min item amount in this category
    const minAmount = Math.min(...category.popularItems.map((i) => i.amount));
    if (remaining < minAmount) continue;

    // Allocate up to 30% of total or remaining
    const allocation = Math.min(
      Math.floor(usableLimit * 0.30),
      remaining,
    );
    // Round to nearest 5000
    const rounded = Math.floor(allocation / 5_000) * 5_000;
    if (rounded >= minAmount) {
      result.push({ category, suggestedAmount: rounded });
      remaining -= rounded;
    }
  }

  return result;
}
