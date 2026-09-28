'use client';

import { useState } from 'react';
import {
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Download,
  Copy,
  Check,
  Folder,
  FileText,
  UserCheck,
  UploadCloud,
  Pencil,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { DocumentPreview, FileTypeIcon } from './file-preview';
import {
  getFieldValue,
  getDocumentTypeLabel,
  getSchemaFor,
  type DocumentRow,
  type FieldDef,
} from '@/lib/field-schemas';
import { cn } from '@/lib/utils';

export function ViewDialog({
  doc,
  projectName,
  schema,
  userRole,
  onClose,
  onDeleted,
}: {
  doc: DocumentRow | null;
  projectName: string | undefined;
  schema: FieldDef[];
  userRole: string | undefined;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const [showFile, setShowFile] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Reset back to clean view whenever a different document opens
  const [lastDocId, setLastDocId] = useState<number | null>(null);
  if (doc && doc.id !== lastDocId) {
    setLastDocId(doc.id);
    setShowFile(false);
    setCopied(false);
    setShowActions(false);
  }

  // Resolve effective schema: uses the document's own document_type if set (e.g. photos, invoice, contract, quote),
  // falling back to the schema passed as prop.
  const effectiveSchema = doc?.document_type
    ? getSchemaFor(doc.document_type)
    : schema;

  // Extra custom fields in doc.custom_fields not in schema and not 'relativePath'
  const schemaKeys = new Set(effectiveSchema.map((f) => f.key));
  const extraFields = Object.entries(doc?.custom_fields ?? {}).filter(
    ([k, v]) => !schemaKeys.has(k) && k !== 'relativePath' && v,
  );

  function handleCopyName() {
    if (!doc?.s3_key) return;
    navigator.clipboard.writeText(doc.s3_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    if (!doc) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error ?? 'No se pudo eliminar el documento');
      }
      onDeleted?.();
      onClose();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('No se pudo eliminar el documento. Intenta de nuevo.');
    } finally {
      setDeleting(false);
    }
  }

  const fileUrl = doc?.s3_key
    ? `/api/files/${encodeURIComponent(doc.s3_key)}`
    : null;

  return (
    <Dialog
      open={!!doc}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className={cn(
          'flex flex-col transition-all duration-300 ease-in-out p-6 overflow-hidden',
          showFile
            ? 'h-[92vh] max-w-6xl'
            : 'max-h-[85vh] max-w-xl',
        )}
      >
        {/* Header with Title, Badges, and Actions */}
        <DialogHeader className="shrink-0 border-b pb-4">
          <div className="flex items-start justify-between gap-4 pr-6">
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 rounded-lg border bg-muted/50 p-2 shrink-0">
                <FileTypeIcon filename={doc?.s3_key ?? null} />
              </div>
              <div className="flex flex-col min-w-0">
                <DialogTitle className="text-base font-semibold truncate flex items-center gap-2">
                  <span className="truncate" title={doc?.s3_key ?? ''}>
                    {doc?.s3_key ?? 'Documento'}
                  </span>
                  {doc?.s3_key && (
                    <button
                      type="button"
                      onClick={handleCopyName}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
                      title="Copiar nombre de archivo"
                    >
                      {copied ? (
                        <Check className="size-3.5 text-green-600" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  )}
                </DialogTitle>

                {/* Subtitle badges */}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  {projectName && (
                    <span className="text-muted-foreground font-medium">
                      {projectName}
                    </span>
                  )}
                  {doc?.document_type && (
                    <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground">
                      {getDocumentTypeLabel(doc.document_type)}
                    </span>
                  )}
                  {doc && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium text-xs',
                        doc.status === 'indexed'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
                      )}
                    >
                      <span
                        className={cn(
                          'size-1.5 rounded-full',
                          doc.status === 'indexed'
                            ? 'bg-emerald-600'
                            : 'bg-amber-600',
                        )}
                      />
                      {doc.status === 'indexed' ? 'Indexado' : 'Pendiente'}
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>
        </DialogHeader>

        {/* Content Body: Smooth sliding preview panel + metadata panel */}
        <div className="flex flex-1 gap-5 overflow-hidden pt-4 min-h-0">
          {/* File Preview Panel (Animates open sliding smoothly) */}
          <div
            className={cn(
              'flex flex-col overflow-hidden rounded-xl border bg-muted/20 transition-all duration-300 ease-in-out',
              showFile
                ? 'flex-1 opacity-100'
                : 'w-0 opacity-0 border-0 pointer-events-none p-0 m-0',
            )}
          >
            {doc && showFile && (
              <>
                {/* Preview Toolbar */}
                <div className="flex items-center justify-between border-b bg-background/80 px-3.5 py-2 text-xs">
                  <div className="flex items-center gap-2 truncate text-muted-foreground">
                    <FileText className="size-3.5 shrink-0" />
                    <span className="truncate font-medium text-foreground">
                      Vista previa
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {fileUrl && (
                      <>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            buttonVariants({ variant: 'ghost', size: 'xs' }),
                            'gap-1 text-xs text-muted-foreground hover:text-foreground',
                          )}
                          title="Abrir en pestaña nueva"
                        >
                          <ExternalLink className="size-3.5" />
                          <span className="hidden sm:inline">Nueva pestaña</span>
                        </a>
                        <a
                          href={fileUrl}
                          download
                          className={cn(
                            buttonVariants({ variant: 'ghost', size: 'xs' }),
                            'gap-1 text-xs text-muted-foreground hover:text-foreground',
                          )}
                          title="Descargar"
                        >
                          <Download className="size-3.5" />
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* Actual File Display */}
                <div className="flex-1 overflow-hidden bg-background">
                  <DocumentPreview filename={doc.s3_key} />
                </div>
              </>
            )}
          </div>

          {/* Metadata Information Panel */}
          <div
            className={cn(
              'flex flex-col space-y-4 overflow-y-auto transition-all duration-300 ease-in-out pr-1 min-h-0',
              showFile ? 'w-80 shrink-0' : 'w-full',
            )}
          >
            {/* Metadata Card */}
            <div className="rounded-xl border bg-card p-4 space-y-4 shadow-2xs">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Información del documento
              </h3>

              <div className="grid grid-cols-2 gap-3.5">
                {doc &&
                  effectiveSchema.map((field) => {
                    const value = getFieldValue(doc, field);
                    const isLongField =
                      field.fullWidth ||
                      field.key === 'description' ||
                      field.key === 'notes';

                    return (
                      <div
                        key={field.key}
                        className={cn(
                          'space-y-1',
                          isLongField ? 'col-span-2' : 'col-span-1',
                        )}
                      >
                        <p className="text-[11px] font-medium text-muted-foreground">
                          {field.label}
                        </p>
                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words">
                          {value || (
                            <span className="text-muted-foreground/40 font-normal italic">
                              —
                            </span>
                          )}
                        </p>
                      </div>
                    );
                  })}

                {/* Any extra custom fields not covered by the schema */}
                {extraFields.map(([key, val]) => (
                  <div key={key} className="space-y-1 col-span-2">
                    <p className="text-[11px] font-medium text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words">
                      {val}
                    </p>
                  </div>
                ))}

                {/* Subido por + Indexado por — always on the same row */}
                {doc && (
                  <div className="col-span-2 border-t pt-3 mt-1">
                    <div className="grid grid-cols-2 gap-3.5">
                      {/* Subido por */}
                      <div className="space-y-1 min-w-0">
                        <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                          <UploadCloud className="size-3 text-muted-foreground shrink-0" />
                          Subido por
                        </p>
                        <div className="flex flex-col min-w-0">
                          <p
                            className="text-xs font-semibold text-foreground truncate"
                            title={doc.uploaded_by_name || doc.uploaded_by_email || `Usuario #${doc.uploaded_by}`}
                          >
                            {doc.uploaded_by_name || doc.uploaded_by_email || `Usuario #${doc.uploaded_by}`}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {new Date(doc.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Indexado por */}
                      {doc.indexed_by_name || doc.indexed_by_email || doc.indexed_by || doc.indexed_at ? (
                        <div className="space-y-1 min-w-0">
                          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                            <UserCheck className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            Indexado por
                          </p>
                          <div className="flex flex-col min-w-0">
                            <p
                              className="text-xs font-semibold text-foreground truncate"
                              title={doc.indexed_by_name || doc.indexed_by_email || `Usuario #${doc.indexed_by}`}
                            >
                              {doc.indexed_by_name || doc.indexed_by_email || `Usuario #${doc.indexed_by}`}
                            </p>
                            {doc.indexed_at && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {new Date(doc.indexed_at).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 min-w-0">
                          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                            <UserCheck className="size-3 text-muted-foreground shrink-0" />
                            Indexado por
                          </p>
                          <p className="text-xs text-muted-foreground/60 italic">
                            Pendiente
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {doc?.custom_fields?.relativePath && (
                  <div className="space-y-1 col-span-2 border-t pt-3">
                    <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                      <Folder className="size-3 text-muted-foreground" />
                      Carpeta de origen
                    </p>
                    <p className="text-xs font-mono bg-muted/60 rounded px-2 py-1 text-muted-foreground break-all">
                      {doc.custom_fields.relativePath}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <Button
                variant={showFile ? 'outline' : 'default'}
                className="w-full gap-2 shadow-2xs"
                onClick={() => setShowFile((v) => !v)}
              >
                {showFile ? (
                  <>
                    <EyeOff className="size-4" />
                    Ocultar archivo
                  </>
                ) : (
                  <>
                    <Eye className="size-4" />
                    Ver archivo
                  </>
                )}
              </Button>

              {/* Secondary actions row */}
              {doc && (userRole === 'admin' || userRole === 'employee') && (
                <div className="flex items-center justify-center gap-1">
                  {/* Toggle actions button */}
                  <button
                    type="button"
                    onClick={() => setShowActions((v) => !v)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                      showActions && 'bg-muted text-foreground',
                    )}
                    title="Acciones"
                  >
                    Acciones
                  </button>

                  {/* Expandable edit + delete buttons */}
                  <div
                    className={cn(
                      'flex items-center gap-1 overflow-hidden transition-all duration-200 ease-in-out',
                      showActions ? 'max-w-xs opacity-100' : 'max-w-0 opacity-0 pointer-events-none',
                    )}
                  >
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors whitespace-nowrap"
                    >
                      <Pencil className="size-3.5 shrink-0" />
                      Editar
                    </button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors whitespace-nowrap"
                        >
                          <Trash2 className="size-3.5 shrink-0" />
                          Eliminar
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Seguro que quieres eliminar este documento?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Vas a eliminar &quot;{doc.s3_key}&quot; junto con todos sus datos indexados. Esta acción es irreversible: el archivo no se podrá recuperar.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            className={buttonVariants({ variant: 'outline' })}
                            disabled={deleting}
                          >
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className={buttonVariants({ variant: 'destructive' })}
                            onClick={handleDelete}
                            disabled={deleting}
                          >
                            {deleting ? 'Eliminando…' : 'Sí, eliminar'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
