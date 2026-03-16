import type { Metadata } from 'next';
import { OnboardingWizard } from './_components/onboarding-wizard';

export const metadata: Metadata = {
  title: 'オンボーディング — Kanejo',
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
