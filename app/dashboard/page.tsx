'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File as FileIcon,
  Search,
  Upload as UploadIcon,
  Eye,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

type ProjectRow = {
  id: number;
  name: string;
  company_name: string;
  project_type: string;
};

type DocumentRow = {
  id: number;
  project_id: number;
  owner: string | null;
  date_recorded: string | null;
  place: string | null;
  s3_key: string | null;
  status: string;
  uploaded_by: string;
  custom_fields: Record<string, string> | null;
  created_at: string;
};

// ---- Per-project-type indexing field schemas ----
// Each field either maps to a real documents table column (owner/date_recorded/place)
// or, if it has no mapsTo, gets stored inside the flexible custom_fields JSONB column.
// This is how different companies/projects can have completely different document
// structures (e.g. an invoice vs a medical bill) without changing the database schema.
type FieldDef = {
  key: string;
  label: string;
  type: 'text' | 'date';
  mapsTo?: 'owner' | 'date_recorded' | 'place';
};

const FIELD_SCHEMAS: Record<string, FieldDef[]> = {
  medical: [
    { key: 'owner', label: 'Owner', type: 'text', mapsTo: 'owner' },
    {
      key: 'date_recorded',
      label: 'Date',
      type: 'date',
      mapsTo: 'date_recorded',
    },
    { key: 'place', label: 'Place', type: 'text', mapsTo: 'place' },
  ],
  contract: [
    { key: 'owner', label: 'Owner', type: 'text', mapsTo: 'owner' },
    {
      key: 'date_recorded',
      label: 'Date',
      type: 'date',
      mapsTo: 'date_recorded',
    },
    { key: 'place', label: 'Place', type: 'text', mapsTo: 'place' },
  ],
  invoice: [
    { key: 'invoiceNumber', label: 'Invoice #', type: 'text' },
    { key: 'controlNumber', label: 'Control #', type: 'text' },
    { key: 'rif', label: 'RIF', type: 'text' },
    { key: 'clientName', label: 'Client Name', type: 'text', mapsTo: 'owner' },
    {
      key: 'date_recorded',
      label: 'Date',
      type: 'date',
      mapsTo: 'date_recorded',
    },
    { key: 'totalAmount', label: 'Total (Bs.)', type: 'text' },
  ],
};

const DEFAULT_SCHEMA = FIELD_SCHEMAS.medical;

function getSchemaFor(projectType: string | undefined): FieldDef[] {
  if (!projectType) return DEFAULT_SCHEMA;
  return FIELD_SCHEMAS[projectType] ?? DEFAULT_SCHEMA;
}

function FileTypeIcon({ filename }: { filename: string | null }) {
  const ext = filename?.split('.').pop()?.toLowerCase() ?? '';
  const commonClass = 'size-5 shrink-0';

  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return <FileSpreadsheet className={cn(commonClass, 'text-emerald-600')} />;
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
    return <ImageIcon className={cn(commonClass, 'text-violet-600')} />;
  }
  if (['pdf', 'doc', 'docx'].includes(ext)) {
    return <FileText className={cn(commonClass, 'text-red-600')} />;
  }
  return <FileIcon className={cn(commonClass, 'text-muted-foreground')} />;
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

function DocumentPreview({ filename }: { filename: string | null }) {
  if (!filename) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No file
      </div>
    );
  }

  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const fileUrl = `/api/files/${encodeURIComponent(filename)}`;

  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
    return (
      <img
        src={fileUrl}
        alt={filename}
        className="h-full w-full object-contain"
      />
    );
  }

  if (ext === 'pdf') {
    return <iframe src={fileUrl} className="h-full w-full" title={filename} />;
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
      <span>Preview not available for this file type.</span>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({ variant: 'outline', size: 'sm' })}
      >
        Open in new tab
      </a>
    </div>
  );
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const [indexed, setIndexed] = useState<DocumentRow[]>([]);
  const [pending, setPending] = useState<DocumentRow[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [search, setSearch] = useState('');

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);

  const [indexingDoc, setIndexingDoc] = useState<DocumentRow | null>(null);
  // Generic bag of field values, keyed by each schema field's `key`.
  // Which keys exist depends entirely on the selected project's type.
  const [indexValues, setIndexValues] = useState<Record<string, string>>({});
  const [indexSubmitting, setIndexSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProjects(data.projects);
          if (data.projects.length > 0) {
            setSelectedProjectId(String(data.projects[0].id));
          }
        }
      });
  }, []);

  const loadDocuments = useCallback(async () => {
    if (!selectedProjectId) return;
    setLoadingDocs(true);
    const res = await fetch(`/api/projects/${selectedProjectId}/documents`);
    const data = await res.json();
    if (data.success) {
      setIndexed(data.indexed);
      setPending(data.pending);
    }
    setLoadingDocs(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [selectedProjectId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDocuments();
  }, [loadDocuments]);

  const filteredIndexed = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return indexed;
    return indexed.filter((doc) =>
      [doc.s3_key, doc.owner, doc.place]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q)),
    );
  }, [indexed, search]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!uploadFile || !selectedProjectId) return;

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('projectId', selectedProjectId);

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    setUploading(false);

    if (data.success) {
      setUploadFile(null);
      (e.target as HTMLFormElement).reset();
      setUploadOpen(false);
      loadDocuments();
    } else {
      setUploadError(data.error);
    }
  }

  function openIndexDialog(doc: DocumentRow) {
    setIndexingDoc(doc);
    setIndexValues({});
  }

  const selectedProject = projects.find(
    (p) => String(p.id) === selectedProjectId,
  );

  const activeSchema = getSchemaFor(selectedProject?.project_type);

  async function submitIndexing() {
    if (!indexingDoc) return;
    setIndexSubmitting(true);

    // Split the generic indexValues bag into real columns (owner/date/place)
    // vs. everything else, which goes into custom_fields.
    let owner: string | null = null;
    let dateRecorded: string | null = null;
    let place: string | null = null;
    const customFields: Record<string, string> = {};

    for (const field of activeSchema) {
      const value = indexValues[field.key] ?? '';
      if (field.mapsTo === 'owner') owner = value;
      else if (field.mapsTo === 'date_recorded') dateRecorded = value;
      else if (field.mapsTo === 'place') place = value;
      else customFields[field.key] = value;
    }

    const res = await fetch(`/api/documents/${indexingDoc.id}/index`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner, dateRecorded, place, customFields }),
    });
    const data = await res.json();
    setIndexSubmitting(false);

    if (data.success) {
      setIndexingDoc(null);
      loadDocuments();
    }
  }

  return (
    <main className="min-h-screen bg-muted p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Documents</h1>
            <p className="text-sm text-muted-foreground">
              {selectedProject
                ? `${selectedProject.name} · ${selectedProject.company_name}`
                : 'Select a project to get started'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={selectedProjectId}
              onValueChange={(value) => setSelectedProjectId(value as string)}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name} ({p.company_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <Button onClick={() => setUploadOpen(true)}>
                <UploadIcon className="size-4" />
                Upload
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload a New File</DialogTitle>
                  <DialogDescription>
                    It will appear under &quot;Pending&quot; until indexed.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file">File</Label>
                    <Input
                      id="file"
                      type="file"
                      required
                      onChange={(e) =>
                        setUploadFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </div>
                  {uploadError && (
                    <p className="text-sm text-red-500">{uploadError}</p>
                  )}
                  <DialogFooter>
                    <DialogClose
                      className={buttonVariants({ variant: 'outline' })}
                      type="button"
                    >
                      Cancel
                    </DialogClose>
                    <Button type="submit" disabled={uploading}>
                      {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {selectedProject && (
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All ({indexed.length})</TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pending.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <Card className="overflow-hidden py-0">
                <div className="border-b p-4">
                  <div className="relative">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by file, owner, or place..."
                      className="pl-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                <CardContent className="p-0">
                  {loadingDocs ? (
                    <p className="p-6 text-sm text-muted-foreground">
                      Loading...
                    </p>
                  ) : filteredIndexed.length === 0 ? (
                    <p className="p-6 text-sm text-muted-foreground">
                      No documents match.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                            <th className="px-4 py-3 font-medium">Document</th>
                            <th className="px-4 py-3 font-medium">Owner</th>
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Place</th>
                            <th className="px-4 py-3 font-medium">Uploaded</th>
                            <th className="px-4 py-3 text-right font-medium">
                              See
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredIndexed.map((doc) => (
                            <tr
                              key={doc.id}
                              className="border-b last:border-0 hover:bg-muted/30"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <FileTypeIcon filename={doc.s3_key} />
                                  <span className="max-w-[220px] truncate font-medium">
                                    {doc.s3_key}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">{doc.owner}</td>
                              <td className="px-4 py-3">
                                {doc.date_recorded
                                  ? new Date(
                                      doc.date_recorded,
                                    ).toLocaleDateString()
                                  : ''}
                              </td>
                              <td className="px-4 py-3">{doc.place}</td>
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
              </Card>
            </TabsContent>

            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Indexing</CardTitle>
                  <CardDescription>
                    Any employee can pick one up and index it.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pending.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nothing waiting to be indexed.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {pending.map((doc) => (
                        <li
                          key={doc.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <FileTypeIcon filename={doc.s3_key} />
                            <span className="max-w-[280px] truncate text-sm">
                              {doc.s3_key}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openIndexDialog(doc)}
                          >
                            Index this document
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Indexing dialog: near-full-screen, split panel, dynamic fields */}
      <Dialog
        open={!!indexingDoc}
        onOpenChange={(open) => {
          if (!open) setIndexingDoc(null);
        }}
      >
        <DialogContent className="flex h-[90vh] max-w-6xl flex-col">
          <DialogHeader>
            <DialogTitle>Index Document</DialogTitle>
            <DialogDescription>
              {indexingDoc?.s3_key} · {selectedProject?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-1 gap-6 overflow-hidden">
            <div className="flex-1 overflow-hidden rounded-lg border bg-muted">
              {indexingDoc && <DocumentPreview filename={indexingDoc.s3_key} />}
            </div>

            <div className="w-80 shrink-0 space-y-4 overflow-y-auto">
              {activeSchema.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={`index-${field.key}`}>{field.label}</Label>
                  <Input
                    id={`index-${field.key}`}
                    type={field.type}
                    value={indexValues[field.key] ?? ''}
                    onChange={(e) =>
                      setIndexValues((prev) => ({
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
              Cancel
            </DialogClose>
            <Button onClick={submitIndexing} disabled={indexSubmitting}>
              {indexSubmitting ? 'Saving...' : 'Save & Mark Indexed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
