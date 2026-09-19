import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [
    email,
  ]);
  const user = result.rows[0];

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return NextResponse.redirect(new URL('/login?error=1', request.url), 303);
  }

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.role = user.role;
  session.name = user.name;
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.redirect(new URL('/dashboard', request.url), 303);
}
