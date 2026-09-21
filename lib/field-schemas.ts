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
// This same schema drives BOTH the indexing form fields AND the "All" tab table
// columns, so a project's document list always matches the fields it was indexed with.
export type FieldDef = {
  key: string;
  label: string;
  type: 'text' | 'date';
  mapsTo?: 'owner' | 'date_recorded' | 'place';
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
