import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge } from './badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'positive', 'negative', 'warning', 'info'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { children: 'ベーシック', variant: 'default' },
};

export const Primary: Story = {
  args: { children: '推奨', variant: 'primary' },
};

export const Positive: Story = {
  args: { children: '+12.5%', variant: 'positive' },
};

export const Negative: Story = {
  args: { children: '-3.2%', variant: 'negative' },
};

export const Warning: Story = {
  args: { children: '期限間近', variant: 'warning' },
};

export const Info: Story = {
  args: { children: '新着', variant: 'info' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="default">デフォルト</Badge>
      <Badge variant="primary">推奨</Badge>
      <Badge variant="positive">+12.5%</Badge>
      <Badge variant="negative">-3.2%</Badge>
      <Badge variant="warning">期限間近</Badge>
      <Badge variant="info">新着</Badge>
    </div>
  ),
};

export const TierBadges: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Badge variant="default">ベーシック</Badge>
      <Badge variant="primary">ミドル</Badge>
      <Badge variant="warning">ハイエンド</Badge>
    </div>
  ),
};
