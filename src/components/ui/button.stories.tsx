import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { children: 'ボタン', variant: 'primary' },
};

export const Secondary: Story = {
  args: { children: 'ボタン', variant: 'secondary' },
};

export const Ghost: Story = {
  args: { children: 'ボタン', variant: 'ghost' },
};

export const Danger: Story = {
  args: { children: '削除する', variant: 'danger' },
};

export const Small: Story = {
  args: { children: '小さいボタン', size: 'sm' },
};

export const Large: Story = {
  args: { children: '大きいボタン', size: 'lg' },
};

export const Disabled: Story = {
  args: { children: '無効', disabled: true },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
