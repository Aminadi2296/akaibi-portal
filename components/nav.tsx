import { getSession } from '@/lib/session';

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
      <span className="font-semibold">Akaibi Portal</span>

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
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </nav>
  );
}
