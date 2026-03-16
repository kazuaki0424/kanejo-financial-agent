import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[480px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">概要</TabsTrigger>
        <TabsTrigger value="income">収入</TabsTrigger>
        <TabsTrigger value="expense">支出</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className="text-sm text-ink-muted">月間の収支概要が表示されます。</p>
      </TabsContent>
      <TabsContent value="income">
        <p className="text-sm text-ink-muted">収入の内訳が表示されます。</p>
      </TabsContent>
      <TabsContent value="expense">
        <p className="text-sm text-ink-muted">支出の内訳が表示されます。</p>
      </TabsContent>
    </Tabs>
  ),
};

export const WithDisabled: Story = {
  render: () => (
    <Tabs defaultValue="basic">
      <TabsList>
        <TabsTrigger value="basic">ベーシック</TabsTrigger>
        <TabsTrigger value="middle">ミドル</TabsTrigger>
        <TabsTrigger value="high" disabled>ハイエンド (準備中)</TabsTrigger>
      </TabsList>
      <TabsContent value="basic">
        <p className="text-sm text-ink-muted">ベーシックプランの内容です。</p>
      </TabsContent>
      <TabsContent value="middle">
        <p className="text-sm text-ink-muted">ミドルプランの内容です。</p>
      </TabsContent>
    </Tabs>
  ),
};
