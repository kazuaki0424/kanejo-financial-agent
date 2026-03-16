import type { Metadata } from 'next';
import { LandingPage } from '../_components/landing-page';

export const metadata: Metadata = {
  title: 'Kanejo — すべての人に、自分だけのCFOを',
  description: 'AI駆動のパーソナル金融エージェント。家計診断・節税・資産運用・固定費削減をトータルでサポート。',
};

export default function LpPage() {
  return <LandingPage />;
}
