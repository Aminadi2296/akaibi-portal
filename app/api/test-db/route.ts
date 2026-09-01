import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
  try {
    const result = await pool.query('SELECT NOW()');
    return NextResponse.json({ success: true, time: result.rows[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

