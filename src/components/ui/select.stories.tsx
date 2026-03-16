import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Select, SelectItem } from './select';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => (
    <Select label="都道府県" placeholder="選択してください">
      <SelectItem value="tokyo">東京都</SelectItem>
      <SelectItem value="osaka">大阪府</SelectItem>
      <SelectItem value="kanagawa">神奈川県</SelectItem>
      <SelectItem value="aichi">愛知県</SelectItem>
      <SelectItem value="fukuoka">福岡県</SelectItem>
    </Select>
  ),
};

export const WithError: Story = {
  render: () => (
    <Select label="職業" error="選択は必須です">
      <SelectItem value="employee">会社員</SelectItem>
      <SelectItem value="self-employed">自営業</SelectItem>
      <SelectItem value="freelance">フリーランス</SelectItem>
      <SelectItem value="part-time">パート・アルバイト</SelectItem>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select label="プラン" defaultValue="basic" disabled>
      <SelectItem value="basic">ベーシック</SelectItem>
      <SelectItem value="middle">ミドル</SelectItem>
      <SelectItem value="high_end">ハイエンド</SelectItem>
    </Select>
  ),
};
