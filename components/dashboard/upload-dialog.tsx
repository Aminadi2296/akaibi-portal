'use client';

import { useState } from 'react';
import { Upload as UploadIcon } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

export function UploadDialog({
  projectId,
  onUploaded,
}: {
  projectId: string;
  onUploaded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file || !projectId) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    setUploading(false);

    if (data.success) {
      setFile(null);
      (e.target as HTMLFormElement).reset();
      setOpen(false);
      onUploaded();
    } else {
      setError(data.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <UploadIcon className="size-4" />
        Subir
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir un archivo nuevo</DialogTitle>
          <DialogDescription>
            Aparecerá en &quot;Pendientes&quot; hasta que se indexe.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Archivo</Label>
            <Input
              id="file"
              type="file"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <DialogClose
              className={buttonVariants({ variant: 'outline' })}
              type="button"
            >
              Cancelar
            </DialogClose>
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Subiendo...' : 'Subir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
