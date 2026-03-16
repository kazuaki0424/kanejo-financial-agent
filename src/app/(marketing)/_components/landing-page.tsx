'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

// ============================================================
// Data
// ============================================================

const FEATURES = [
  {
    icon: '📊',
    title: '家計診断',
    description: '収支分析・資産可視化・家計スコアで、あなたの家計の健康度を数値化します。',
  },
  {
    icon: '🗺️',
    title: 'ライフプランシミュレーション',
    description: '結婚・住宅・退職など、ライフイベントを配置して30年先の資産推移を予測。',
  },
  {
    icon: '💰',
    title: '節税・補助金',
    description: 'ふるさと納税・iDeCo・NISAの最適化、補助金マッチング、確定申告ガイド。',
  },
  {
    icon: '💳',
    title: 'サービス比較',
    description: 'クレジットカード・保険・通信の最適プランを、あなたの支出パターンから提案。',
  },
  {
    icon: '🤖',
    title: 'AIエージェント',
    description: 'Claude AIが家計データを分析し、具体的なアクションタスクを提案・実行。',
  },
  {
    icon: '📚',
    title: '金融リテラシー',
    description: 'あなたのレベルに合わせた学習コンテンツで、お金の知識を身につけましょう。',
  },
] as const;

const PRICING = [
  {
    name: 'ベーシック',
    price: '無料',
    description: '家計管理の基礎',
    features: ['家計診断ダッシュボード', '基本的なシミュレーション', 'ふるさと納税計算', '学習コンテンツ'],
    highlighted: false,
  },
  {
    name: 'ミドル',
    price: '¥980/月',
    description: '節税・資産運用のフル活用',
    features: ['ベーシックの全機能', 'AIインサイト', 'シナリオ比較', '節税最適化', 'サービス比較', 'エージェント機能'],
    highlighted: true,
  },
  {
    name: 'ハイエンド',
    price: '¥2,980/月',
    description: '資産運用の高度な戦略',
    features: ['ミドルの全機能', '高度な資産分析', 'カスタムAIアドバイス', '優先サポート'],
    highlighted: false,
  },
] as const;

// ============================================================
// Components
// ============================================================

export function LandingPage(): React.ReactElement {
  return (
    <>
      <Nav />
      <Hero />
      <Features />
      <Pricing />
      <Cta />
      <Footer />
    </>
  );
}

function Nav(): React.ReactElement {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <span className="font-display text-xl text-foreground">Kanejo</span>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">ログイン</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">無料で始める</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}

function Hero(): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 60]);

  return (
    <section ref={ref} className="relative overflow-hidden px-4 pt-20 pb-24 sm:pt-32 sm:pb-32">
      <motion.div style={{ opacity, y }} className="mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="primary" className="mb-6">AI駆動のパーソナル金融エージェント</Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-4xl leading-tight text-foreground sm:text-5xl md:text-6xl"
        >
          すべての人に、
          <br />
          <span className="text-primary">自分だけのCFO</span>を。
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-ink-muted"
        >
          Kanejoは、AIがあなたの家計を分析し、節税・資産運用・固定費削減まで
          トータルでサポートするパーソナル金融エージェントです。
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <Button asChild size="lg">
            <Link href="/register">無料で始める</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/login">ログイン</Link>
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-sm text-ink-subtle"
        >
          クレジットカード不要・3分で登録完了
        </motion.p>
      </motion.div>

      {/* Background decoration */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
    </section>
  );
}

function Features(): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="bg-[var(--color-surface-alt)] px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center"
        >
          <h2 className="font-display text-3xl text-foreground sm:text-4xl">
            富裕層の専属アドバイザーを、
            <br className="hidden sm:block" />
            すべてのユーザーに。
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-ink-muted">
            AIが24時間あなたの家計を見守り、最適なタイミングで最適なアクションを提案します。
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <span className="text-2xl">{feature.icon}</span>
                <h3 className="mt-3 text-base font-medium text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-ink-muted">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing(): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center"
        >
          <h2 className="font-display text-3xl text-foreground sm:text-4xl">料金プラン</h2>
          <p className="mt-4 text-ink-muted">あなたに合ったプランを選んで始めましょう</p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PRICING.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={cn(
                'relative h-full',
                plan.highlighted && 'border-primary ring-1 ring-primary/20',
              )}>
                {plan.highlighted && (
                  <Badge variant="primary" className="absolute -top-3 left-1/2 -translate-x-1/2">おすすめ</Badge>
                )}
                <h3 className="text-lg font-medium text-foreground">{plan.name}</h3>
                <p className="mt-1 font-display text-3xl text-foreground">{plan.price}</p>
                <p className="mt-1 text-sm text-ink-muted">{plan.description}</p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-ink-muted">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-positive">
                        <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild variant={plan.highlighted ? 'primary' : 'secondary'} className="mt-6 w-full">
                  <Link href="/register">{plan.price === '無料' ? '無料で始める' : 'プランを選択'}</Link>
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta(): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="bg-primary px-4 py-16 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        className="mx-auto max-w-3xl text-center"
      >
        <h2 className="font-display text-3xl text-white sm:text-4xl">
          今日から、賢い家計管理を始めましょう
        </h2>
        <p className="mt-4 text-white/80">
          3分の登録で、AIがあなたの家計を分析します。
        </p>
        <Button asChild size="lg" variant="secondary" className="mt-8 bg-white text-primary hover:bg-white/90">
          <Link href="/register">無料でアカウントを作成</Link>
        </Button>
      </motion.div>
    </section>
  );
}

function Footer(): React.ReactElement {
  return (
    <footer className="border-t border-border px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <span className="font-display text-lg text-foreground">Kanejo</span>
          <p className="text-xs text-ink-subtle">
            © {new Date().getFullYear()} Kanejo. すべての人に、自分だけのCFOを。
          </p>
        </div>
        <p className="mt-6 text-center text-[10px] leading-relaxed text-ink-subtle">
          本サービスが提供する情報は、一般的な金融知識の提供を目的としたものであり、
          特定の金融商品の勧誘や、個別の投資・税務・法律に関する助言を行うものではありません。
        </p>
      </div>
    </footer>
  );
}
