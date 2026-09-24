import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File as FileIcon,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function FileTypeIcon({ filename }: { filename: string | null }) {
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

export function DocumentPreview({ filename }: { filename: string | null }) {
  if (!filename) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No hay archivo
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
    return (
      <iframe
        src={`${fileUrl}#toolbar=0`}
        className="h-full w-full"
        title={filename}
      />
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
      <span>La vista previa no está disponible para este tipo de archivo.</span>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({ variant: 'outline', size: 'sm' })}
      >
        Abrir en pestaña nueva
      </a>
    </div>
  );
}
