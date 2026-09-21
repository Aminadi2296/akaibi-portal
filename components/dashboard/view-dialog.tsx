'use client';

import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
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
  const [showFile, setShowFile] = useState(false);

  // Reset back to the clean info view every time a different document opens
  const [lastDocId, setLastDocId] = useState<number | null>(null);
  if (doc && doc.id !== lastDocId) {
    setLastDocId(doc.id);
    setShowFile(false);
  }

  return (
    <Dialog
      open={!!doc}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="flex h-[90vh] max-w-6xl flex-col">
        <DialogHeader>
          <DialogTitle>Detalles del documento</DialogTitle>
          <DialogDescription title={doc?.s3_key ?? ''}>
            {doc?.s3_key} · {projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 gap-6 overflow-hidden">
          {/* File preview panel: width/opacity animate open instead of popping in */}
          <div
            className={`overflow-hidden rounded-lg border bg-muted transition-all duration-300 ease-in-out ${
              showFile ? 'flex-1 opacity-100' : 'w-0 opacity-0'
            }`}
          >
            {doc && showFile && <DocumentPreview filename={doc.s3_key} />}
          </div>

          {/* Info panel: shrinks to a sidebar once the file is shown */}
          <div
            className={`space-y-4 overflow-y-auto transition-all duration-300 ease-in-out ${
              showFile ? 'w-80 shrink-0' : 'mx-auto w-full max-w-md'
            }`}
          >
            <div className="rounded-lg border p-5">
              <div className="grid grid-cols-2 gap-4">
                {doc &&
                  schema.map((field) => (
                    <div key={field.key} className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {field.label}
                      </p>
                      <p className="text-sm">
                        {getFieldValue(doc, field) || '—'}
                      </p>
                    </div>
                  ))}
                {doc && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Subido
                    </p>
                    <p className="text-sm">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={showFile ? 'outline' : 'default'}
                className="flex-1"
                onClick={() => setShowFile((v) => !v)}
              >
                {showFile ? 'Ocultar archivo' : 'Ver archivo'}
              </Button>
              {doc && (
                <a
                  href={`/api/files/${encodeURIComponent(doc.s3_key ?? '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'outline' })}
                >
                  Abrir en pestaña nueva
                </a>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
