'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { FileTypeIcon } from './file-preview';
import { ViewDialog } from './view-dialog';
import {
  getFieldValue,
  type DocumentRow,
  type FieldDef,
} from '@/lib/field-schemas';

const PAGE_SIZE = 5;

export function DocumentsTable({
  projectId,
  schema,
  refreshKey,
}: {
  projectId: string;
  schema: FieldDef[];
  refreshKey: number;
}) {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewingDoc, setViewingDoc] = useState<DocumentRow | null>(null);
  // Debounce the search box so we don't hit the database on every keystroke
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Reset to page 1 and clear search whenever the project changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
    setSearch('');
    setSearchInput('');
  }, [projectId]);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (search) params.set('search', search);

    const res = await fetch(
      `/api/projects/${projectId}/documents?${params.toString()}`,
    );
    const data = await res.json();
    if (data.success) {
      setDocuments(data.indexed);
      setTotal(data.totalIndexed);
    }
    setLoading(false);
  }, [projectId, page, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <Card className="overflow-hidden py-0">
        <div className="border-b p-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading...</p>
          ) : documents.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No documents match.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                    <th className="w-[200px] px-4 py-3 font-medium">
                      Document
                    </th>
                    {schema.map((field) => (
                      <th
                        key={field.key}
                        className="w-[140px] px-4 py-3 font-medium"
                      >
                        {field.label}
                      </th>
                    ))}
                    <th className="w-[100px] px-4 py-3 font-medium">
                      Uploaded
                    </th>
                    <th className="w-[60px] px-4 py-3 text-right font-medium">
                      See
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className="cursor-pointer border-b last:border-0 hover:bg-muted/30"
                      onClick={() => setViewingDoc(doc)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <FileTypeIcon filename={doc.s3_key} />
                          <span
                            className="truncate font-medium"
                            title={doc.s3_key ?? ''}
                          >
                            {doc.s3_key}
                          </span>
                        </div>
                      </td>
                      {schema.map((field) => (
                        <td key={field.key} className="break-words px-4 py-3">
                          {getFieldValue(doc, field)}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={`/api/files/${encodeURIComponent(doc.s3_key ?? '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-md p-2 hover:bg-muted"
                          title="View document"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye className="size-4 text-muted-foreground" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        <div className="flex items-center justify-between border-t p-4">
          <span className="text-sm text-muted-foreground">
            {total === 0
              ? 'No results'
              : `Page ${page} of ${totalPages} · ${total} total`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>
      <ViewDialog
        doc={viewingDoc}
        projectName={undefined}
        schema={schema}
        onClose={() => setViewingDoc(null)}
      />
    </>
  );
}
