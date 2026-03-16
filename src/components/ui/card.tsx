import { cn } from '@/lib/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps): React.ReactElement {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-border bg-surface p-6',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardHeader({ className, children, ...props }: CardHeaderProps): React.ReactElement {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function CardTitle({ className, children, ...props }: CardTitleProps): React.ReactElement {
  return (
    <h3 className={cn('text-lg font-medium text-foreground', className)} {...props}>
      {children}
    </h3>
  );
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function CardDescription({ className, children, ...props }: CardDescriptionProps): React.ReactElement {
  return (
    <p className={cn('text-sm text-ink-muted', className)} {...props}>
      {children}
    </p>
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardContent({ className, children, ...props }: CardContentProps): React.ReactElement {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardFooter({ className, children, ...props }: CardFooterProps): React.ReactElement {
  return (
    <div className={cn('mt-4 flex items-center gap-3', className)} {...props}>
      {children}
    </div>
  );
}
