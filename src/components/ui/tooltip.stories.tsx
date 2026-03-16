import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Tooltip } from './tooltip';
import { Button } from './button';

const meta: Meta<typeof Tooltip> = {
  title: 'UI/Tooltip',
  component: Tooltip,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <Tooltip content="家計スコアの詳細を表示">
      <Button variant="secondary">ホバーしてください</Button>
    </Tooltip>
  ),
};

export const Positions: Story = {
  render: () => (
    <div className="flex items-center gap-8 p-16">
      <Tooltip content="上" side="top">
        <Button variant="secondary" size="sm">上</Button>
      </Tooltip>
      <Tooltip content="右" side="right">
        <Button variant="secondary" size="sm">右</Button>
      </Tooltip>
      <Tooltip content="下" side="bottom">
        <Button variant="secondary" size="sm">下</Button>
      </Tooltip>
      <Tooltip content="左" side="left">
        <Button variant="secondary" size="sm">左</Button>
      </Tooltip>
    </div>
  ),
};
