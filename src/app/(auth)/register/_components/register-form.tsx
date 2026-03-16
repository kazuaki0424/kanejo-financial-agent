'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signUpWithEmail, signInWithGoogle } from '@/app/(auth)/_actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface FormState {
  error: string | null;
}

async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return signUpWithEmail(formData);
}

export function RegisterForm(): React.ReactElement {
  const [state, formAction, isPending] = useActionState(registerAction, { error: null });

  return (
    <Card>
      <form action={formAction} className="flex flex-col gap-4">
        <Input
          label="メールアドレス"
          name="email"
          type="email"
          placeholder="example@kanejo.jp"
          autoComplete="email"
          required
        />
        <Input
          label="パスワード"
          name="password"
          type="password"
          placeholder="8文字以上"
          autoComplete="new-password"
          required
          hint="8文字以上で入力してください"
        />
        <Input
          label="パスワード（確認）"
          name="confirmPassword"
          type="password"
          placeholder="もう一度入力"
          autoComplete="new-password"
          required
        />

        {state.error && (
          <p className="text-sm text-negative" role="alert">{state.error}</p>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? 'アカウント作成中...' : 'アカウントを作成'}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-surface px-3 text-xs text-ink-subtle">または</span>
        </div>
      </div>

      <form action={signInWithGoogle}>
        <Button type="submit" variant="secondary" className="w-full">
          Googleで登録
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        すでにアカウントをお持ちの方は{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          ログイン
        </Link>
      </p>
    </Card>
  );
}
