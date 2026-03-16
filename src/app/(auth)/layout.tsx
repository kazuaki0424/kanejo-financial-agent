export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl text-foreground">Kanejo</h1>
          <p className="mt-1 text-sm text-ink-muted">すべての人に、自分だけのCFOを。</p>
        </div>
        {children}
      </div>
    </div>
  );
}
