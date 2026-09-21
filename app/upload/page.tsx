'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function UploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData, // sent as multipart/form-data, not JSON, since it includes a file
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      router.push('/dashboard');
    } else {
      setError(data.error);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Subir documento</CardTitle>
          <CardDescription>
            Selecciona un proyecto y sube el archivo. Luego podrás indexar sus
            detalles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">Proyecto</Label>
              <Select name="projectId" required>
                <SelectTrigger id="projectId">
                  <SelectValue placeholder="Selecciona un proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">
                    Facturas médicas (Acme Corp)
                  </SelectItem>
                  <SelectItem value="2">Contratos (Acme Corp)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">Archivo</Label>
              <Input id="file" name="file" type="file" required />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Subiendo...' : 'Subir'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
