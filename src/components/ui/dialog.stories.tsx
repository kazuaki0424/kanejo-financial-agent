import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Dialog, DialogTrigger, DialogContent } from './dialog';
import { Button } from './button';
import { Input } from './input';

const meta: Meta<typeof Dialog> = {
  title: 'UI/Dialog',
  component: Dialog,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger>
        <Button>ダイアログを開く</Button>
      </DialogTrigger>
      <DialogContent
        title="収入源を追加"
        description="新しい収入源の情報を入力してください。"
      >
        <div className="flex flex-col gap-4">
          <Input label="収入名" placeholder="例: 副業収入" />
          <Input label="月額" placeholder="例: 100,000" />
          <div className="mt-2 flex justify-end gap-3">
            <Button variant="secondary" size="sm">キャンセル</Button>
            <Button size="sm">追加する</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  ),
};

export const Confirmation: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger>
        <Button variant="danger">削除する</Button>
      </DialogTrigger>
      <DialogContent title="本当に削除しますか？" description="この操作は取り消せません。">
        <div className="mt-2 flex justify-end gap-3">
          <Button variant="secondary" size="sm">キャンセル</Button>
          <Button variant="danger" size="sm">削除する</Button>
        </div>
      </DialogContent>
    </Dialog>
  ),
};
