'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface AuthResult {
  error: string | null;
}

export async function signInWithEmail(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = formData.get('redirect') as string | null;

  if (!email || !password) {
    return { error: 'メールアドレスとパスワードを入力してください。' };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: 'メールアドレスまたはパスワードが正しくありません。' };
  }

  redirect(redirectTo ?? '/');
}

export async function signUpWithEmail(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!email || !password) {
    return { error: 'メールアドレスとパスワードを入力してください。' };
  }

  if (password.length < 8) {
    return { error: 'パスワードは8文字以上で入力してください。' };
  }

  if (password !== confirmPassword) {
    return { error: 'パスワードが一致しません。' };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  });

  if (error) {
    return { error: 'アカウントの作成に失敗しました。もう一度お試しください。' };
  }

  redirect('/login?message=confirmation_sent');
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  });

  if (error || !data.url) {
    redirect('/login?error=oauth_error');
  }

  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
