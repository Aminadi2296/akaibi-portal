'use client';

import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  // When true, a "Tipo de documento" dropdown appears at the top of the
  // form (fotos/contratos/cotizaciones, etc.) and the fields below adapt to
  // whichever type is selected, instead of using a single fixed `schema`.
  // Used for projects that hold a mix of document types rather than one
  // fixed type.
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

  const effectiveSchema = allowTypePicker
    ? getSchemaFor(documentType ?? undefined)
    : schema;
  // With the picker on, fields only make sense once a type is chosen.
  const canFillFields = !allowTypePicker || !!documentType;

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

        <div className="flex flex-1 gap-6 overflow-hidden">
          <div className="flex-1 overflow-hidden rounded-lg border bg-muted">
            {doc && <DocumentPreview filename={doc.s3_key} />}
          </div>

          <div className="w-80 shrink-0 space-y-4 overflow-y-auto">
            {allowTypePicker && (
              <div className="space-y-2">
                <Label htmlFor="index-document-type">
                  Tipo de documento
                </Label>
                <Select
                  value={documentType ?? undefined}
                  onValueChange={(value) => {
                    setDocumentType(value as string);
                    setValues({});
                  }}
                >
                  <SelectTrigger id="index-document-type" className="w-full">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {canFillFields &&
              effectiveSchema.map((field) => (
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

        <DialogFooter>
          <DialogClose
            className={buttonVariants({ variant: 'outline' })}
            type="button"
          >
            Cancelar
          </DialogClose>
          <Button onClick={submit} disabled={submitting || !canFillFields}>
            {submitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
