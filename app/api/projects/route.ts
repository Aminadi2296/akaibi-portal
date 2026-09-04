import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT projects.*, companies.name AS company_name
       FROM projects
       JOIN companies ON projects.company_id = companies.id
       ORDER BY projects.name`
    );
    return NextResponse.json({ success: true, projects: result.rows });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
