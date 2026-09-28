'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload as UploadIcon,
  Files,
  FolderUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { FileTypeIcon } from './file-preview';
import { cn } from '@/lib/utils';

interface UploadItem {
  id: string;
  file: File;
  relativePath?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function isIgnoredFile(pathOrName: string): boolean {
  const parts = pathOrName.split('/');
  for (const part of parts) {
    if (
      part.startsWith('.') ||
      part.startsWith('._') ||
      part === 'Thumbs.db' ||
      part === 'desktop.ini'
    ) {
      return true;
    }
  }
  return false;
}

export function UploadDialog({
  projectId,
  onUploaded,
}: {
  projectId: string;
  onUploaded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'files' | 'folder'>('files');
  const [queue, setQueue] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  function resetState() {
    setQueue([]);
    setUploading(false);
    setIsDragging(false);
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (uploading) return;
    setOpen(nextOpen);
    if (!nextOpen) {
      resetState();
    }
  }

  const addFilesToQueue = useCallback(
    (newFiles: { file: File; relativePath?: string }[]) => {
      setError(null);
      const items: UploadItem[] = [];
      newFiles.forEach((item, index) => {
        const path = item.relativePath || item.file.name;
        if (!isIgnoredFile(path)) {
          items.push({
            id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
            file: item.file,
            relativePath: item.relativePath,
            status: 'pending',
          });
        }
      });
      if (items.length === 0) return;
      setQueue((prev) => [...prev, ...items]);
    },
    [],
  );

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const list: { file: File; relativePath?: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      list.push({ file: files[i] });
    }
    addFilesToQueue(list);
    e.target.value = '';
  }

  function handleFolderInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const list: { file: File; relativePath?: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relPath = (file as unknown as { webkitRelativePath?: string })
        .webkitRelativePath;
      list.push({ file, relativePath: relPath || file.name });
    }
    addFilesToQueue(list);
    e.target.value = '';
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (uploading) return;

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) {
      const fallbackFiles = e.dataTransfer.files;
      if (fallbackFiles && fallbackFiles.length > 0) {
        const list: { file: File }[] = [];
        for (let i = 0; i < fallbackFiles.length; i++) {
          list.push({ file: fallbackFiles[i] });
        }
        addFilesToQueue(list);
      }
      return;
    }

    const collectedFiles: { file: File; relativePath?: string }[] = [];

    async function traverseEntry(
      entry: any,
      currentPath: string = '',
    ): Promise<void> {
      if (entry.isFile) {
        const file: File = await new Promise((resolve, reject) => {
          entry.file(resolve, reject);
        });
        const relativePath = currentPath
          ? `${currentPath}/${file.name}`
          : file.name;
        if (!isIgnoredFile(relativePath)) {
          collectedFiles.push({ file, relativePath });
        }
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        const readBatch = (): Promise<any[]> =>
          new Promise((resolve, reject) => {
            dirReader.readEntries(resolve, reject);
          });

        let entries: any[] = [];
        let batch: any[];
        do {
          batch = await readBatch();
          entries = entries.concat(batch);
        } while (batch.length > 0);

        const nextPath = currentPath
          ? `${currentPath}/${entry.name}`
          : entry.name;
        for (const child of entries) {
          await traverseEntry(child, nextPath);
        }
      }
    }

    const entries: any[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.webkitGetAsEntry) {
        const entry = item.webkitGetAsEntry();
        if (entry) entries.push(entry);
      }
    }

    if (entries.length > 0) {
      for (const entry of entries) {
        await traverseEntry(entry);
      }
      addFilesToQueue(collectedFiles);
    } else {
      const files = e.dataTransfer.files;
      const list: { file: File }[] = [];
      for (let i = 0; i < files.length; i++) {
        list.push({ file: files[i] });
      }
      addFilesToQueue(list);
    }
  }

  function removeItem(id: string) {
    if (uploading) return;
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }

  function clearQueue() {
    if (uploading) return;
    setQueue([]);
    setError(null);
  }

  async function startUpload() {
    if (queue.length === 0 || !projectId || uploading) return;

    setUploading(true);
    setError(null);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const pendingItems = queue.filter((item) => item.status !== 'success');
    if (pendingItems.length === 0) {
      setUploading(false);
      return;
    }

    const CONCURRENCY = 3;
    let currentIndex = 0;
    let anyError = false;

    async function worker() {
      while (currentIndex < pendingItems.length) {
        if (signal.aborted) break;
        const index = currentIndex++;
        const item = pendingItems[index];

        setQueue((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, status: 'uploading' } : it,
          ),
        );

        try {
          const formData = new FormData();
          formData.append('file', item.file);
          formData.append('projectId', projectId);
          if (item.relativePath) {
            formData.append('relativePath', item.relativePath);
          }

          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
            signal,
          });
          const data = await res.json();

          if (res.ok && data.success) {
            setQueue((prev) =>
              prev.map((it) =>
                it.id === item.id
                  ? { ...it, status: 'success', error: undefined }
                  : it,
              ),
            );
          } else {
            anyError = true;
            const errMsg = data.error || 'Error al subir';
            setQueue((prev) =>
              prev.map((it) =>
                it.id === item.id
                  ? { ...it, status: 'error', error: errMsg }
                  : it,
              ),
            );
            if (data.error && data.error.toLowerCase().includes('límite')) {
              setError(data.error);
            }
          }
        } catch (err: unknown) {
          const e = err as { name?: string; message?: string };
          if (e.name === 'AbortError') {
            return;
          }
          anyError = true;
          setQueue((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    status: 'error',
                    error: e.message || 'Error de conexión',
                  }
                : it,
            ),
          );
        }
      }
    }

    const workerPromises = Array.from(
      { length: Math.min(CONCURRENCY, pendingItems.length) },
      () => worker(),
    );

    await Promise.all(workerPromises);

    setUploading(false);
    onUploaded();

    if (!anyError && !signal.aborted) {
      setTimeout(() => {
        setOpen(false);
        resetState();
      }, 700);
    }
  }

  function cancelUpload() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setUploading(false);
  }

  const totalFiles = queue.length;
  const successFiles = queue.filter((i) => i.status === 'success').length;
  const errorFiles = queue.filter((i) => i.status === 'error').length;
  const totalBytes = queue.reduce((sum, item) => sum + item.file.size, 0);
  const progressPercent =
    totalFiles > 0 ? Math.round((successFiles / totalFiles) * 100) : 0;
  const allCompleted = totalFiles > 0 && successFiles === totalFiles;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button onClick={() => setOpen(true)}>
        <UploadIcon className="size-4" />
        Subir Archivo
      </Button>

      <DialogContent className="max-h-[85vh] flex flex-col max-w-lg overflow-hidden p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>Subir documentos</DialogTitle>
          <DialogDescription>
            Aparecerán en &quot;Pendientes&quot; hasta que se indexen.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable body content so footer buttons are never pushed off-screen */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
          {/* Tabs matching the application style */}
          <Tabs
            value={mode}
            onValueChange={(val) => {
              if (!uploading) setMode(val as 'files' | 'folder');
            }}
          >
            <TabsList className="w-full">
              <TabsTrigger value="files" className="flex-1 w-auto">
                Archivos individuales
              </TabsTrigger>
              <TabsTrigger value="folder" className="flex-1 w-auto">
                Carga masiva
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />
          <input
            ref={folderInputRef}
            type="file"
            className="hidden"
            onChange={handleFolderInputChange}
            {...({
              webkitdirectory: '',
              directory: '',
              multiple: true,
            } as unknown as React.InputHTMLAttributes<HTMLInputElement>)}
          />

          {/* Drag & drop box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!uploading) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => {
              if (uploading) return;
              if (mode === 'files') {
                fileInputRef.current?.click();
              } else {
                folderInputRef.current?.click();
              }
            }}
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-5 text-center transition-colors cursor-pointer',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/20',
              uploading && 'pointer-events-none opacity-60',
            )}
          >
            {mode === 'files' ? (
              <>
                <div className="rounded-full bg-muted p-2.5 text-muted-foreground">
                  <Files className="size-5" />
                </div>
                <p className="mt-2 text-sm font-medium">
                  Arrastra archivos aquí o haz clic para explorar
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Puedes seleccionar uno o varios documentos a la vez
                </p>
              </>
            ) : (
              <>
                <div className="rounded-full bg-muted p-2.5 text-muted-foreground">
                  <FolderUp className="size-5" />
                </div>
                <p className="mt-2 text-sm font-medium">
                  Arrastra una carpeta aquí o haz clic para seleccionarla
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Carga todos los archivos y subcarpetas que contiene
                </p>
              </>
            )}
          </div>

          {/* Files selected section with controlled compact height */}
          {totalFiles > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  <strong className="text-foreground">{totalFiles}</strong>{' '}
                  {totalFiles === 1
                    ? 'archivo seleccionado'
                    : 'archivos seleccionados'}{' '}
                  ({formatBytes(totalBytes)})
                </span>
                {!uploading && (
                  <button
                    type="button"
                    onClick={clearQueue}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Quitar todos
                  </button>
                )}
              </div>

              {/* Progress bar during or after upload */}
              {(uploading || successFiles > 0 || errorFiles > 0) && (
                <div className="space-y-1.5 rounded-lg border bg-muted/40 p-2 text-xs">
                  <div className="flex justify-between">
                    <span>
                      {uploading
                        ? `Subiendo... (${successFiles}/${totalFiles})`
                        : allCompleted
                          ? '¡Todos los archivos fueron subidos con éxito!'
                          : `Finalizado: ${successFiles} exitosos, ${errorFiles} fallidos`}
                    </span>
                    <span className="font-semibold">{progressPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        allCompleted ? 'bg-green-600' : 'bg-primary',
                      )}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Compact scrollable file list: max-h-36 avoids pushing dialog off-screen */}
              <div className="max-h-36 overflow-y-auto divide-y rounded-lg border text-xs">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-2 hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileTypeIcon filename={item.file.name} />
                      <div className="flex flex-col min-w-0">
                        <span
                          className="truncate text-xs font-medium text-foreground"
                          title={item.file.name}
                        >
                          {item.file.name}
                        </span>
                        {item.relativePath &&
                          item.relativePath !== item.file.name && (
                            <span
                              className="truncate text-[10px] text-muted-foreground"
                              title={item.relativePath}
                            >
                              {item.relativePath}
                            </span>
                          )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        {formatBytes(item.file.size)}
                      </span>

                      {item.status === 'pending' && !uploading && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="rounded p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                          title="Quitar de la lista"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}

                      {item.status === 'uploading' && (
                        <Loader2 className="size-3.5 animate-spin text-primary" />
                      )}

                      {item.status === 'success' && (
                        <CheckCircle2 className="size-3.5 text-green-600" />
                      )}

                      {item.status === 'error' && (
                        <span
                          className="flex items-center gap-1 text-destructive"
                          title={item.error}
                        >
                          <AlertCircle className="size-3.5" />
                          <span className="hidden sm:inline text-[10px] truncate max-w-[100px]">
                            {item.error}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Footer pinned at bottom, always accessible */}
        <DialogFooter className="shrink-0 pt-3 border-t mt-2">
          {uploading ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cancelUpload}
            >
              Cancelar subida
            </Button>
          ) : (
            <DialogClose
              className={buttonVariants({ variant: 'outline' })}
              type="button"
            >
              {allCompleted ? 'Listo' : 'Cancelar'}
            </DialogClose>
          )}

          {!allCompleted && (
            <Button
              type="button"
              disabled={totalFiles === 0 || uploading}
              onClick={startUpload}
            >
              {uploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                `Subir${totalFiles > 0 ? ` (${totalFiles})` : ''}`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
