import type { Metadata } from 'next';
import { RegisterForm } from './_components/register-form';

export const metadata: Metadata = {
  title: '新規登録 — Kanejo',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
