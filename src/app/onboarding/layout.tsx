export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-16 items-center justify-center border-b border-border bg-surface">
        <span className="font-display text-xl text-foreground">Kanejo</span>
      </header>
      {children}
    </div>
  );
}
