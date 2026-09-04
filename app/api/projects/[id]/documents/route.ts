import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `SELECT * FROM documents WHERE project_id = $1 ORDER BY created_at DESC`,
      [id]
    );

    const indexed = result.rows.filter((doc) => doc.status === 'indexed');
    const pending = result.rows.filter((doc) => doc.status === 'pending');

    return NextResponse.json({ success: true, indexed, pending });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
