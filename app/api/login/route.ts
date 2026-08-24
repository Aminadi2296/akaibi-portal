import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const username = formData.get('username');
  const password = formData.get('password');

  // Hardcoded test employee for now — replaced with real auth later
  if (username === 'employee' && password === 'password123') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.redirect(new URL('/login?error=1', request.url));
}