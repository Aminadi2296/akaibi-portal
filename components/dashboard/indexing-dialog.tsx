'use client';

import { useState } from 'react';
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
import { DocumentPreview } from './file-preview';
import {
  DOCUMENT_TYPES,
  getSchemaFor,
  type DocumentRow,
  type FieldDef,
} from '@/lib/field-schemas';

export function IndexingDialog({
  doc,
  projectName,
  schema,
  allowTypePicker = false,
  onClose,
  onIndexed,
}: {
  doc: DocumentRow | null;
  projectName: string | undefined;
  schema: FieldDef[];
  // When true, the user first picks which kind of document this is
  // (fotos/contratos/cotizaciones, etc.) and the form below adapts to that
  // choice instead of using a single fixed `schema`. Used for projects that
  // hold a mix of document types rather than one fixed type.
  allowTypePicker?: boolean;
  onClose: () => void;
  onIndexed: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [documentType, setDocumentType] = useState<string | null>(null);

  // Reset the form fields (and type selection) whenever a different
  // document is opened
  const [lastDocId, setLastDocId] = useState<number | null>(null);
  if (doc && doc.id !== lastDocId) {
    setLastDocId(doc.id);
    setValues({});
    setDocumentType(null);
  }

  const needsTypeSelection = allowTypePicker && !documentType;
  const effectiveSchema = allowTypePicker
    ? getSchemaFor(documentType ?? undefined)
    : schema;

  async function submit() {
    if (!doc) return;
    setSubmitting(true);

    let owner: string | null = null;
    let dateRecorded: string | null = null;
    let place: string | null = null;
    const customFields: Record<string, string> = {};

    for (const field of effectiveSchema) {
      const value = values[field.key] ?? '';
      if (field.mapsTo === 'owner') owner = value;
      else if (field.mapsTo === 'date_recorded') dateRecorded = value;
      else if (field.mapsTo === 'place') place = value;
      else customFields[field.key] = value;
    }

    const res = await fetch(`/api/documents/${doc.id}/index`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner,
        dateRecorded,
        place,
        customFields,
        documentType: allowTypePicker ? documentType : undefined,
      }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (data.success) {
      onIndexed();
    }
  }

  return (
    <Dialog
      open={!!doc}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="!fixed !inset-0 !top-0 !left-0 flex h-screen w-screen max-w-none !translate-x-0 !translate-y-0 flex-col rounded-none">
        <DialogHeader>
          <DialogTitle>Indexar documento</DialogTitle>
          <DialogDescription title={doc?.s3_key ?? ''}>
            {doc?.s3_key} · {projectName}
          </DialogDescription>
        </DialogHeader>

        {needsTypeSelection ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <p className="text-sm font-medium text-muted-foreground">
              ¿Qué tipo de documento es?
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {DOCUMENT_TYPES.map((t) => (
                <Button
                  key={t.value}
                  variant="outline"
                  className="h-20 w-40 text-base"
                  onClick={() => setDocumentType(t.value)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 gap-6 overflow-hidden">
            <div className="flex-1 overflow-hidden rounded-lg border bg-muted">
              {doc && <DocumentPreview filename={doc.s3_key} />}
            </div>

            <div className="w-80 shrink-0 space-y-4 overflow-y-auto">
              {allowTypePicker && documentType && (
                <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">
                    Tipo:{' '}
                    <span className="font-medium text-foreground">
                      {DOCUMENT_TYPES.find((t) => t.value === documentType)
                        ?.label ?? documentType}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline hover:text-foreground"
                    onClick={() => setDocumentType(null)}
                  >
                    Cambiar
                  </button>
                </div>
              )}
              {effectiveSchema.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={`index-${field.key}`}>{field.label}</Label>
                  <Input
                    id={`index-${field.key}`}
                    type={field.type}
                    value={values[field.key] ?? ''}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <DialogClose
            className={buttonVariants({ variant: 'outline' })}
            type="button"
          >
            Cancelar
          </DialogClose>
          {!needsTypeSelection && (
            <Button onClick={submit} disabled={submitting}>
              {submitting ? 'Guardando...' : 'Guardar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
