'use client';

import { buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { DocumentPreview } from './file-preview';
import {
  getFieldValue,
  type DocumentRow,
  type FieldDef,
} from '@/lib/field-schemas';

export function ViewDialog({
  doc,
  projectName,
  schema,
  onClose,
}: {
  doc: DocumentRow | null;
  projectName: string | undefined;
  schema: FieldDef[];
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!doc}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="!fixed !inset-0 !top-0 !left-0 flex h-screen w-screen max-w-none !translate-x-0 !translate-y-0 flex-col rounded-none">
        <DialogHeader>
          <DialogTitle>Document Details</DialogTitle>
          <DialogDescription title={doc?.s3_key ?? ''}>
            {doc?.s3_key} · {projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 gap-6 overflow-hidden">
          <div className="flex-1 overflow-hidden rounded-lg border bg-muted">
            {doc && <DocumentPreview filename={doc.s3_key} />}
          </div>

          <div className="w-80 shrink-0 space-y-4 overflow-y-auto">
            {doc &&
              schema.map((field) => (
                <div key={field.key} className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {field.label}
                  </p>
                  <p className="text-sm">{getFieldValue(doc, field) || '—'}</p>
                </div>
              ))}

            {doc && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Uploaded
                </p>
                <p className="text-sm">
                  {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
            )}

            {doc && (
              <a
                href={`/api/files/${encodeURIComponent(doc.s3_key ?? '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Open in new tab
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
