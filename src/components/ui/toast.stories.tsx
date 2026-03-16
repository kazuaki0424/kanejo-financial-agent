import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ToastProvider, useToast } from './toast';
import { Button } from './button';

const meta: Meta = {
  title: 'UI/Toast',
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj;

function ToastDemo(): React.ReactElement {
  const { toast } = useToast();

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="secondary"
        onClick={() =>
          toast({ title: '保存しました', description: 'プロフィールを更新しました。' })
        }
      >
        デフォルト
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            title: '保存完了',
            description: '家計データをインポートしました。',
            variant: 'success',
          })
        }
      >
        成功
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            title: 'エラーが発生しました',
            description: '接続に失敗しました。再試行してください。',
            variant: 'error',
          })
        }
      >
        エラー
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            title: '注意',
            description: 'このデータは30日後に削除されます。',
            variant: 'warning',
          })
        }
      >
        警告
      </Button>
    </div>
  );
}

export const AllVariants: Story = {
  render: () => <ToastDemo />,
};
