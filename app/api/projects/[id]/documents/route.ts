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
    const offset = (page - 1) * pageSize;

    const dataSearchClause = search
      ? `AND (
      s3_key ILIKE $3 OR
      owner ILIKE $3 OR
      place ILIKE $3 OR
      custom_fields::text ILIKE $3
    )`
      : '';

    const countSearchClause = search
      ? `AND (
      s3_key ILIKE $2 OR
      owner ILIKE $2 OR
      place ILIKE $2 OR
      custom_fields::text ILIKE $2
    )`
      : '';

    const searchValue = `%${search}%`;
    const queryParams = search
      ? [id, pageSize, searchValue, offset]
      : [id, pageSize, offset];

    // Cuando hay término de búsqueda, $4 es el offset; de lo contrario es $3.
    const offsetPlaceholder = search ? '$4' : '$3';

    const dataQuery = `
      SELECT * FROM documents
      WHERE project_id = $1 AND status = 'indexed'
      ${dataSearchClause}
      ORDER BY created_at DESC
      LIMIT $2 OFFSET ${offsetPlaceholder}
    `;

    const countQuery = `
      SELECT COUNT(*) FROM documents
      WHERE project_id = $1 AND status = 'indexed'
      ${countSearchClause}
    `;
    const countParams = search ? [id, searchValue] : [id];

    const [dataResult, countResult, pendingResult] = await Promise.all([
      pool.query(dataQuery, queryParams),
      pool.query(countQuery, countParams),
      pool.query(
        `SELECT * FROM documents WHERE project_id = $1 AND status = 'pending' ORDER BY created_at DESC`,
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
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
