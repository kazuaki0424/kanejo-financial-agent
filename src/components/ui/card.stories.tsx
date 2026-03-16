import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import { Button } from './button';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>月間収支</CardTitle>
        <CardDescription>2026年3月の収支サマリー</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-display text-3xl text-foreground tabular-nums">¥238,000</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>プラン変更</CardTitle>
        <CardDescription>現在のプラン: ベーシック</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-ink-muted">
          ミドルプランにアップグレードすると、節税最適化や保険見直し機能が利用できます。
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm">アップグレード</Button>
        <Button variant="ghost" size="sm">詳細を見る</Button>
      </CardFooter>
    </Card>
  ),
};

export const MetricCard: Story = {
  render: () => (
    <Card>
      <p className="text-[13px] text-ink-muted">貯蓄率</p>
      <p className="mt-1 font-display text-[32px] leading-tight text-foreground tabular-nums">
        41<span className="text-lg text-ink-muted">%</span>
      </p>
      <p className="mt-2 text-sm font-medium text-positive">+3.2%</p>
    </Card>
  ),
};
