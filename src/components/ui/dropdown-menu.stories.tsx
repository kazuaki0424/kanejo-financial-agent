import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './dropdown-menu';
import { Button } from './button';

const meta: Meta<typeof DropdownMenu> = {
  title: 'UI/DropdownMenu',
  component: DropdownMenu,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof DropdownMenu>;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="secondary">メニューを開く</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>アカウント</DropdownMenuLabel>
        <DropdownMenuItem>プロフィール</DropdownMenuItem>
        <DropdownMenuItem>設定</DropdownMenuItem>
        <DropdownMenuItem>通知</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive>ログアウト</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const WithDisabledItems: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="secondary">操作</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>編集</DropdownMenuItem>
        <DropdownMenuItem>複製</DropdownMenuItem>
        <DropdownMenuItem disabled>エクスポート (準備中)</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive>削除</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
