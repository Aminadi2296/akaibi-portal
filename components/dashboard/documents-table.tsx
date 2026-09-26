'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileTypeIcon } from './file-preview';
import { ViewDialog } from './view-dialog';
import {
  getValueByKey,
  getTableColumnsFor,
  getTableColumnsForType,
  getDocumentTypeLabel,
  type DocumentRow,
  type FieldDef,
} from '@/lib/field-schemas';

const PAGE_SIZE = 5;

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

function isImageFile(filename: string | null): boolean {
  const ext = filename?.split('.').pop()?.toLowerCase() ?? '';
  return IMAGE_EXTENSIONS.includes(ext);
}

// Shows a small square thumbnail for image files (photos), falling back to
// the generic FileTypeIcon for everything else (PDFs, docs, etc.).
function FileThumbnail({ filename }: { filename: string | null }) {
  if (filename && isImageFile(filename)) {
    return (
      <img
        src={`/api/files/${encodeURIComponent(filename)}`}
        alt=""
        className="size-9 shrink-0 rounded object-cover"
      />
    );
  }
  return <FileTypeIcon filename={filename} />;
}

export function DocumentsTable({
  projectId,
  projectType,
  schema,
  refreshKey,
  userRole,
}: {
  projectId: string;
  projectType: string | undefined;
  schema: FieldDef[];
  refreshKey: number;
  userRole: string | undefined;
}) {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewingDoc, setViewingDoc] = useState<DocumentRow | null>(null);

  // Type filter: only meaningful for projects that hold a mix of document
  // types (project_type === 'mixed'). 'all' means no filter applied.
  const [typeFilter, setTypeFilter] = useState('all');
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const isMixed = projectType === 'mixed';

  // Debounce the search box so we don't hit the database on every keystroke
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Reset to page 1 and clear search/filter whenever the project changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
    setSearch('');
    setSearchInput('');
    setTypeFilter('all');
  }, [projectId]);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (search) params.set('search', search);
    if (isMixed && typeFilter !== 'all') {
      params.set('documentType', typeFilter);
    }

    const res = await fetch(
      `/api/projects/${projectId}/documents?${params.toString()}`,
    );
    const data = await res.json();
    if (data.success) {
      setDocuments(data.indexed);
      setTotal(data.totalIndexed);
      if (Array.isArray(data.availableDocumentTypes)) {
        setAvailableTypes(data.availableDocumentTypes);
      }
    }
    setLoading(false);
  }, [projectId, page, search, isMixed, typeFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // For mixed projects, columns follow the selected type filter (falling
  // back to a generic default when "Todos" is selected, since documents of
  // different types don't share one column layout). For single-type
  // projects, columns come from the project's own type as before.
  const columns = isMixed
    ? getTableColumnsForType(typeFilter !== 'all' ? typeFilter : undefined)
    : getTableColumnsFor(projectType);

  return (
    <>
      <Card className="overflow-hidden py-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {isMixed && (
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value as string);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {availableTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {getDocumentTypeLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
          ) : documents.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No hay documentos que coincidan.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                    {columns.map((col, i) => (
                      <th
                        key={i}
                        className={`${col.width ?? 'w-[140px]'} px-4 py-3 font-medium`}
                      >
                        {col.label}
                      </th>
                    ))}
                    <th className="w-[60px] px-4 py-3 text-right font-medium">
                      Ver
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
                      {columns.map((col, i) => {
                        const mainValue =
                          col.type === 'stacked'
                            ? getValueByKey(doc, col.mainKey, schema)
                            : getValueByKey(doc, col.key, schema);

                        return (
                          <td key={i} className="break-words px-4 py-3">
                            {col.type === 'stacked' ? (
                              <div className="flex items-center gap-3">
                                {col.icon && (
                                  <FileThumbnail filename={doc.s3_key} />
                                )}
                                <div className="flex min-w-0 flex-col">
                                  <span
                                    className="truncate font-medium"
                                    title={mainValue}
                                  >
                                    {mainValue || '—'}
                                  </span>
                                  <span
                                    className="truncate text-xs text-muted-foreground"
                                    title={getValueByKey(doc, col.subKey, schema)}
                                  >
                                    {getValueByKey(doc, col.subKey, schema)}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                {col.icon && (
                                  <FileThumbnail filename={doc.s3_key} />
                                )}
                                <span
                                  className="truncate"
                                  title={mainValue}
                                >
                                  {mainValue || '—'}
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}
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
              ? 'Sin resultados'
              : `Página ${page} de ${totalPages} · ${total} en total`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Siguiente
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>
      <ViewDialog
        doc={viewingDoc}
        projectName={undefined}
        schema={schema}
        userRole={userRole}
        onClose={() => setViewingDoc(null)}
        onDeleted={load}
      />
    </>
  );
}
