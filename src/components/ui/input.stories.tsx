import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Input } from './input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
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
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    label: '年収',
    placeholder: '例: 5,000,000',
  },
};

export const WithHint: Story = {
  args: {
    label: 'メールアドレス',
    placeholder: 'example@kanejo.jp',
    hint: 'ログインに使用します',
  },
};

export const WithError: Story = {
  args: {
    label: '年収',
    placeholder: '例: 5,000,000',
    value: 'abc',
    error: '数値を入力してください',
  },
};

export const Disabled: Story = {
  args: {
    label: '年収',
    value: '5,000,000',
    disabled: true,
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Input label="通常" placeholder="入力してください" />
      <Input label="ヒント付き" placeholder="入力してください" hint="補足テキスト" />
      <Input label="エラー" value="不正な値" error="正しい値を入力してください" />
      <Input label="無効" value="編集不可" disabled />
    </div>
  ),
};
