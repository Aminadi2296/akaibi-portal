import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const errorMessage =
    searchParams?.error === '1'
      ? 'Credenciales inválidas. Inténtalo de nuevo.'
      : searchParams?.error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <Image
            src="/akaibi-logo.svg"
            alt="Akaibi Portal"
            width={128}
            height={32}
            className="h-8 w-auto"
          />
          <CardDescription>
            Inicia sesión para acceder a tus proyectos y documentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form method="POST" action="/api/login" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {errorMessage && (
              <p className="text-sm text-red-500">{errorMessage}</p>
            )}
            <Button type="submit" className="w-full">
              Iniciar sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
