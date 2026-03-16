/**
 * サービス詳細データ（メリット/デメリット、口コミ等）
 */

export interface ServiceDetail {
  pros: string[];
  cons: string[];
  useCases: string[];
  reviews: Review[];
}

export interface Review {
  rating: number;
  comment: string;
  userType: string;
}

export const SERVICE_DETAILS: Record<string, ServiceDetail> = {
  'cc-rakuten': {
    pros: ['年会費永年無料', '楽天市場でポイント3倍', '楽天ペイ連携でポイント二重取り', 'ポイントの使い道が豊富'],
    cons: ['楽天経済圏外では還元率が平凡', '明細がメールで届く（紙なし）', 'ETCカードは年会費550円'],
    useCases: ['楽天市場でよく買い物する方', '楽天銀行・楽天証券を利用中の方', 'ポイントを効率的に貯めたい方'],
    reviews: [
      { rating: 5, comment: '楽天市場のSPUと組み合わせるとポイントがザクザク貯まる', userType: '30代会社員' },
      { rating: 4, comment: '年会費無料で1%還元は優秀。メインカードにしている', userType: '20代フリーランス' },
      { rating: 3, comment: 'メルマガが多いのが少し気になる', userType: '40代主婦' },
    ],
  },
  'cc-jcbw': {
    pros: ['年会費永年無料', 'Amazonで2%還元', 'スターバックスで5.5%', 'セブン-イレブンで2%'],
    cons: ['39歳以下限定', 'JCBは海外で使えない場所がある', 'ポイント交換先がやや限定的'],
    useCases: ['Amazon・コンビニをよく使う方', '若年層でお得なカードを探している方'],
    reviews: [
      { rating: 5, comment: 'Amazonヘビーユーザーなので2%還元は大きい', userType: '20代会社員' },
      { rating: 4, comment: 'スタバ好きにはたまらない還元率', userType: '20代学生' },
    ],
  },
  'cc-amex-gold': {
    pros: ['空港ラウンジ無料', '手厚い海外旅行保険', 'マイル還元率が高い', 'ステータス性'],
    cons: ['年会費31,900円', '基本還元率0.5%と低め', '加盟店がVISA/Masterより少ない'],
    useCases: ['出張・海外旅行が多い方', '年収800万円以上の方', 'マイルを貯めたい方'],
    reviews: [
      { rating: 5, comment: 'ラウンジと保険の安心感は年会費以上の価値', userType: '40代管理職' },
      { rating: 4, comment: 'メタル製カードの質感が良い', userType: '30代経営者' },
    ],
  },
  'cc-three-mitsui': {
    pros: ['年会費永年無料', '対象コンビニ・飲食店で最大7%', 'SBI証券のクレカ積立に対応', 'タッチ決済対応'],
    cons: ['基本還元率0.5%と低め', 'ポイント交換レートがやや不利', '7%は条件付き'],
    useCases: ['コンビニ・マクドナルド利用が多い方', 'SBI証券で積立投資をしている方'],
    reviews: [
      { rating: 4, comment: 'セブンイレブンで7%は驚異的', userType: '20代会社員' },
      { rating: 4, comment: 'SBI証券の積立でポイントが貯まるのが嬉しい', userType: '30代投資家' },
    ],
  },
  'tel-ahamo': {
    pros: ['ドコモ回線の安定性', '20GBで2,970円はコスパ良い', '5分通話無料込み', '海外82カ国でそのまま使える'],
    cons: ['店頭サポートなし', '20GB以下のプランがない', 'キャリアメール非対応'],
    useCases: ['月10-20GB使う方', '通話もそこそこする方', '海外出張がある方'],
    reviews: [
      { rating: 5, comment: 'ドコモ品質でこの値段は最高', userType: '30代会社員' },
      { rating: 4, comment: '海外でも使えるのが便利', userType: '40代出張族' },
    ],
  },
  'tel-linemo': {
    pros: ['3GB 990円の最安クラス', 'LINEギガフリー', 'ソフトバンク回線で安定', 'eSIM対応'],
    cons: ['3GBは少ない人には不足', '店頭サポートなし', 'Yahoo!プレミアム非付帯'],
    useCases: ['Wi-Fi環境が充実している方', 'LINE中心の連絡手段の方', 'サブ回線として'],
    reviews: [
      { rating: 5, comment: 'LINEギガフリーは神。990円でこれは安すぎる', userType: '20代学生' },
      { rating: 4, comment: 'サブ回線として最適', userType: '30代会社員' },
    ],
  },
  'tel-rakuten': {
    pros: ['段階制料金で無駄がない', 'Rakuten Linkで通話無料', '楽天ポイントが貯まる', 'データ無制限3,278円'],
    cons: ['地下・建物内で繋がりにくい場合あり', 'プラチナバンド整備中', '楽天回線エリアが限定的'],
    useCases: ['月によってデータ使用量が変わる方', '楽天経済圏の方', '通話が多い方'],
    reviews: [
      { rating: 4, comment: '使った分だけなのが嬉しい。3GB以下の月は1,078円', userType: '30代フリーランス' },
      { rating: 3, comment: '電波がやや不安定な場所がある', userType: '20代会社員' },
    ],
  },
};

export function getServiceDetail(serviceId: string): ServiceDetail | null {
  return SERVICE_DETAILS[serviceId] ?? null;
}
