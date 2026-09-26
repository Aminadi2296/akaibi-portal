import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const pageSize = Math.min(
      50,
      Math.max(1, Number(searchParams.get('pageSize') ?? '10')),
    );
    const search = searchParams.get('search')?.trim() ?? '';
    const documentType = searchParams.get('documentType')?.trim() ?? '';
    const offset = (page - 1) * pageSize;

    // Build the shared WHERE clause + params dynamically so extra optional
    // filters (search, documentType, more later) don't require manually
    // renumbering $N placeholders by hand.
    const conditions: string[] = ['project_id = $1', `status = 'indexed'`];
    const baseParams: (string | number)[] = [id];

    if (search) {
      baseParams.push(`%${search}%`);
      const idx = baseParams.length;
      conditions.push(`(
        s3_key ILIKE $${idx} OR
        owner ILIKE $${idx} OR
        place ILIKE $${idx} OR
        custom_fields::text ILIKE $${idx}
      )`);
    }

    if (documentType) {
      baseParams.push(documentType);
      conditions.push(`document_type = $${baseParams.length}`);
    }

    const whereClause = conditions.join(' AND ');

    const dataParams = [...baseParams, pageSize, offset];
    const dataQuery = `
      SELECT * FROM documents
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${baseParams.length + 1} OFFSET $${baseParams.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*) FROM documents
      WHERE ${whereClause}
    `;

    const [dataResult, countResult, pendingResult, typesResult] =
      await Promise.all([
        pool.query(dataQuery, dataParams),
        pool.query(countQuery, baseParams),
        pool.query(
          `SELECT * FROM documents WHERE project_id = $1 AND status = 'pending' ORDER BY created_at DESC`,
          [id],
        ),
        // Distinct document types actually present in this project's
        // indexed documents, to populate the type filter dropdown.
        pool.query(
          `SELECT DISTINCT document_type FROM documents
           WHERE project_id = $1 AND status = 'indexed' AND document_type IS NOT NULL
           ORDER BY document_type`,
          [id],
        ),
      ]);

    return NextResponse.json({
      success: true,
      indexed: dataResult.rows,
      totalIndexed: Number(countResult.rows[0].count),
      page,
      pageSize,
      pending: pendingResult.rows,
      availableDocumentTypes: typesResult.rows.map((r) => r.document_type),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}

