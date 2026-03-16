import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ThemeToggle } from './theme-toggle';

const meta: Meta<typeof ThemeToggle> = {
  title: 'Shared/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ThemeToggle>;

export const Default: Story = {};
