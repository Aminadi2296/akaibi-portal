import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, owner, dateRecorded, place, uploadedBy } = body;

    const result = await pool.query(
      `INSERT INTO documents (project_id, owner, date_recorded, place, uploaded_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [projectId, owner, dateRecorded, place, uploadedBy]
    );

    return NextResponse.json({ success: true, document: result.rows[0] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT documents.*, projects.name AS project_name, companies.name AS company_name
       FROM documents
       JOIN projects ON documents.project_id = projects.id
       JOIN companies ON projects.company_id = companies.id
       ORDER BY documents.created_at DESC`
    );
    return NextResponse.json({ success: true, documents: result.rows });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}