import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role === 'client') {
    return NextResponse.json(
      { success: false, error: 'Not authorized' },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { owner, dateRecorded, place, customFields, documentType } = body;

    const result = await pool.query(
      `UPDATE documents
       SET owner = $1,
           date_recorded = $2,
           place = $3,
           custom_fields = $4,
           status = 'indexed',
           indexed_by = $5,
           indexed_at = NOW(),
           document_type = $6
       WHERE id = $7
       RETURNING *`,
      [
        owner ?? null,
        dateRecorded ?? null,
        place ?? null,
        JSON.stringify(customFields ?? {}),
        session.userId,
        documentType ?? null,
        id,
      ],
    );

    return NextResponse.json({ success: true, document: result.rows[0] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
