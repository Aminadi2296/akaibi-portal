'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UploadDialog } from '@/components/dashboard/upload-dialog';
import { IndexingDialog } from '@/components/dashboard/indexing-dialog';
import { DocumentsTable } from '@/components/dashboard/documents-table';
import { PendingList } from '@/components/dashboard/pending-list';
import { getSchemaFor, type ProjectRow, type DocumentRow } from '@/lib/field-schemas';

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [indexingDoc, setIndexingDoc] = useState<DocumentRow | null>(null);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setRole(data.role);
      });

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

  const selectedProject = projects.find(
    (p) => String(p.id) === selectedProjectId,
  );
  const activeSchema = getSchemaFor(selectedProject?.project_type);
  const canManage = role === 'admin' || role === 'employee';

  function refresh() {
    setRefreshKey((k) => k + 1);
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

            {canManage && (
              <UploadDialog projectId={selectedProjectId} onUploaded={refresh} />
            )}
          </div>
        </div>

        {selectedProject && (
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              {canManage && <TabsTrigger value="pending">Pending</TabsTrigger>}
            </TabsList>

            <TabsContent value="all">
              <DocumentsTable
                projectId={selectedProjectId}
                schema={activeSchema}
                refreshKey={refreshKey}
              />
            </TabsContent>

            {canManage && (
              <TabsContent value="pending">
                <PendingList
                  projectId={selectedProjectId}
                  refreshKey={refreshKey}
                  canIndex={canManage}
                  onIndexClick={setIndexingDoc}
                />
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>

      <IndexingDialog
        doc={indexingDoc}
        projectName={selectedProject?.name}
        schema={activeSchema}
        onClose={() => setIndexingDoc(null)}
        onIndexed={() => {
          setIndexingDoc(null);
          refresh();
        }}
      />
    </main>
  );
}
