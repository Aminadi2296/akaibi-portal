import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      return NextResponse.json(
        { success: false, error: 'Not logged in' },
        { status: 401 },
      );
    }

    let result;
    if (session.role === 'admin') {
      result = await pool.query(
        `SELECT projects.*, companies.name AS company_name
         FROM projects
         JOIN companies ON projects.company_id = companies.id
         ORDER BY projects.name`,
      );
    } else {
      result = await pool.query(
        `SELECT projects.*, companies.name AS company_name
         FROM projects
         JOIN companies ON projects.company_id = companies.id
         JOIN user_projects ON user_projects.project_id = projects.id
         WHERE user_projects.user_id = $1
         ORDER BY projects.name`,
        [session.userId],
      );
    }

    return NextResponse.json({ success: true, projects: result.rows });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
