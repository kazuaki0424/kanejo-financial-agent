import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Slider } from './slider';

const meta: Meta<typeof Slider> = {
  title: 'UI/Slider',
  component: Slider,
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
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: {
    label: '貯蓄率',
    defaultValue: [30],
    min: 0,
    max: 100,
    formatValue: (v: number) => `${v}%`,
  },
};

export const Currency: Story = {
  args: {
    label: '月額予算',
    defaultValue: [150000],
    min: 50000,
    max: 500000,
    step: 10000,
    formatValue: (v: number) => `¥${v.toLocaleString()}`,
  },
};

function ControlledSliderDemo(): React.ReactElement {
  const [value, setValue] = useState([50]);
  return (
    <div className="flex flex-col gap-4">
      <Slider
        label="インフレ率"
        value={value}
        onValueChange={setValue}
        min={0}
        max={10}
        step={0.1}
        formatValue={(v) => `${v.toFixed(1)}%`}
      />
      <p className="text-sm text-ink-muted">
        現在の値: {value[0].toFixed(1)}%
      </p>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledSliderDemo />,
};

export const Disabled: Story = {
  args: {
    label: '利回り',
    defaultValue: [5],
    min: 0,
    max: 20,
    formatValue: (v: number) => `${v}%`,
    disabled: true,
  },
};
