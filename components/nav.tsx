import { getSession } from '@/lib/session';
import Image from 'next/image';
import { LogOut } from 'lucide-react';

export default async function Nav() {
  const session = await getSession();

  const initials = (session.name ?? session.email ?? '?')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <nav className="flex items-center justify-between border-b bg-background px-6 py-3">
      <Image
        src="/akaibi-logo.svg"
        alt="Akaibi Portal"
        width={128}
        height={32}
        className="h-8 w-auto"
      />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {initials}
          </div>
          <span className="text-sm text-muted-foreground">
            {session.name ?? session.email}
          </span>
        </div>

        <form action="/api/logout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            title="Cerrar sesión"
          >
            <LogOut className="size-4" />
            {/* <span className="hidden sm:inline"></span> */}
          </button>
        </form>
      </div>
    </nav>
  );
}
