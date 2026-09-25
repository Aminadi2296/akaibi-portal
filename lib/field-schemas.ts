export type ProjectRow = {
  id: number;
  name: string;
  company_name: string;
  project_type: string;
};

export type DocumentRow = {
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

// ---- Per-project-type field schemas ----
// Each field either maps to a real documents table column (owner/date_recorded/place)
// or, if it has no mapsTo, lives inside the flexible custom_fields JSONB column.
// This schema drives the indexing form fields AND the detail view (ViewDialog).
export type FieldDef = {
  key: string;
  label: string;
  type: 'text' | 'date';
  mapsTo?: 'owner' | 'date_recorded' | 'place';
  fullWidth?: boolean;
};

export const FIELD_SCHEMAS: Record<string, FieldDef[]> = {
  medical: [
    { key: 'owner', label: 'Propietario', type: 'text', mapsTo: 'owner' },
    {
      key: 'date_recorded',
      label: 'Fecha',
      type: 'date',
      mapsTo: 'date_recorded',
    },
    { key: 'place', label: 'Lugar', type: 'text', mapsTo: 'place' },
  ],
  contract: [
    { key: 'owner', label: 'Propietario', type: 'text', mapsTo: 'owner' },
    {
      key: 'date_recorded',
      label: 'Fecha',
      type: 'date',
      mapsTo: 'date_recorded',
    },
    { key: 'place', label: 'Lugar', type: 'text', mapsTo: 'place' },
  ],
  invoice: [
    { key: 'invoiceNumber', label: 'Número de factura', type: 'text' },
    { key: 'controlNumber', label: 'Número de control', type: 'text' },
    { key: 'rif', label: 'RIF', type: 'text' },
    {
      key: 'clientName',
      label: 'Nombre del cliente',
      type: 'text',
      mapsTo: 'owner',
      fullWidth: true,
    },
    {
      key: 'date_recorded',
      label: 'Fecha',
      type: 'date',
      mapsTo: 'date_recorded',
    },
    { key: 'totalAmount', label: 'Total (Bs.)', type: 'text' },
  ],
};

export const DEFAULT_SCHEMA = FIELD_SCHEMAS.medical;

export function getSchemaFor(projectType: string | undefined): FieldDef[] {
  if (!projectType) return DEFAULT_SCHEMA;
  return FIELD_SCHEMAS[projectType] ?? DEFAULT_SCHEMA;
}

// Reads a field's value off a document row, regardless of whether it lives in
// a real column (owner/date_recorded/place) or inside custom_fields.
// Used by the detail view (ViewDialog), which is driven by FieldDef[].
export function getFieldValue(doc: DocumentRow, field: FieldDef): string {
  let raw: string | null;
  if (field.mapsTo) {
    raw = doc[field.mapsTo];
  } else {
    raw = doc.custom_fields?.[field.key] ?? null;
  }
  if (!raw) return '';
  if (field.type === 'date') {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? raw : d.toLocaleDateString();
  }
  return raw;
}

// ---- Table column configs ----
// Each project type defines its own list of table columns for the "All"
// tab / dashboard list, independent from the full FieldDef[] schema used in
// the detail view. A column either shows one field, or stacks two fields
// (main on top, sub below) in a single cell — e.g. a name over a filename.
//
// To customize a project's table columns, only edit TABLE_COLUMNS below.
// No component changes needed, and one project type's columns can't break
// another's since they're fully independent entries in this map.
export type TableColumn =
  | {
      type: 'field';
      key: string;
      label: string;
      width?: string;
      icon?: boolean;
    }
  | {
      type: 'stacked';
      label: string;
      mainKey: string; // a FieldDef key, or 's3_key' / 'created_at'
      subKey: string; // a FieldDef key, or 's3_key' / 'created_at'
      width?: string;
      icon?: boolean; // show the FileTypeIcon next to the main value
    };

export const TABLE_COLUMNS: Record<string, TableColumn[]> = {
  medical: [
    {
      type: 'field',
      key: 's3_key',
      label: 'Documento',
      width: 'w-[200px]',
      icon: true,
    },
    { type: 'field', key: 'owner', label: 'Propietario', width: 'w-[140px]' },
    {
      type: 'field',
      key: 'date_recorded',
      label: 'Fecha',
      width: 'w-[140px]',
    },
    { type: 'field', key: 'place', label: 'Lugar', width: 'w-[140px]' },
  ],
  contract: [
    {
      type: 'field',
      key: 's3_key',
      label: 'Documento',
      width: 'w-[200px]',
      icon: true,
    },
    { type: 'field', key: 'owner', label: 'Propietario', width: 'w-[140px]' },
    {
      type: 'field',
      key: 'date_recorded',
      label: 'Fecha',
      width: 'w-[140px]',
    },
    { type: 'field', key: 'place', label: 'Lugar', width: 'w-[140px]' },
  ],
  invoice: [
    {
      type: 'stacked',
      label: 'Proveedor',
      mainKey: 'clientName',
      subKey: 'rif',
      width: 'w-[220px]',
    },
    {
      type: 'field',
      key: 'invoiceNumber',
      label: 'Número de factura',
      width: 'w-[160px]',
    },
    {
      type: 'field',
      key: 'date_recorded',
      label: 'Fecha',
      width: 'w-[120px]',
    },
    {
      type: 'field',
      key: 'totalAmount',
      label: 'Monto',
      width: 'w-[120px]',
    },
  ],
};

export const DEFAULT_TABLE_COLUMNS = TABLE_COLUMNS.medical;

export function getTableColumnsFor(
  projectType: string | undefined,
): TableColumn[] {
  if (!projectType) return DEFAULT_TABLE_COLUMNS;
  return TABLE_COLUMNS[projectType] ?? DEFAULT_TABLE_COLUMNS;
}

// Reads a value by key off a document row for table columns. Checks real
// columns first (including s3_key, created_at), then — if a schema is
// passed and the key matches a FieldDef with mapsTo (e.g. 'clientName' ->
// 'owner') — reads that real column, then finally falls back to
// custom_fields. The schema param is optional so this still works for
// plain column keys ('s3_key', 'owner', etc.) with no schema at hand.
export function getValueByKey(
  doc: DocumentRow,
  key: string,
  schema?: FieldDef[],
): string {
  if (key === 's3_key') return doc.s3_key ?? '';
  if (key === 'created_at') {
    return doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '';
  }
  if (key === 'owner' || key === 'date_recorded' || key === 'place') {
    const raw = doc[key];
    if (!raw) return '';
    if (key === 'date_recorded') {
      const d = new Date(raw);
      return isNaN(d.getTime()) ? raw : d.toLocaleDateString();
    }
    return raw;
  }

  // Not a real column name directly — check if the schema says this key
  // maps to one (e.g. 'clientName' -> mapsTo: 'owner').
  const field = schema?.find((f) => f.key === key);
  if (field?.mapsTo) {
    const raw = doc[field.mapsTo];
    if (!raw) return '';
    if (field.mapsTo === 'date_recorded') {
      const d = new Date(raw);
      return isNaN(d.getTime()) ? raw : d.toLocaleDateString();
    }
    return raw;
  }
  if (field?.type === 'date') {
    const raw = doc.custom_fields?.[key];
    if (!raw) return '';
    const d = new Date(raw);
    return isNaN(d.getTime()) ? raw : d.toLocaleDateString();
  }

  return doc.custom_fields?.[key] ?? '';
}
