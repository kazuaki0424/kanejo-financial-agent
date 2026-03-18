'use client';

import { useRef } from 'react';
import { signOut } from '@/app/(auth)/_actions/auth';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface UserMenuProps {
  email?: string;
}

export function UserMenu({ email }: UserMenuProps): React.ReactElement {
  const initial = email ? email[0].toUpperCase() : 'K';
  const logoutFormRef = useRef<HTMLFormElement>(null);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
          aria-label="アカウントメニュー"
        >
          {initial}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {email && (
          <>
            <DropdownMenuLabel>{email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onSelect={() => { window.location.href = '/settings/profile'; }}>
          プロフィール
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => { window.location.href = '/settings'; }}>
          設定
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={() => { logoutFormRef.current?.requestSubmit(); }}>
          ログアウト
        </DropdownMenuItem>
      </DropdownMenuContent>
      <form ref={logoutFormRef} action={signOut} className="hidden" />
    </DropdownMenu>
  );
}
