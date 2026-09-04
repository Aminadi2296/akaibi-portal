import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { owner, dateRecorded, place } = body;

    const result = await pool.query(
      `UPDATE documents
       SET owner = $1, date_recorded = $2, place = $3, status = 'indexed'
       WHERE id = $4
       RETURNING *`,
      [owner, dateRecorded, place, id]
    );

    return NextResponse.json({ success: true, document: result.rows[0] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
