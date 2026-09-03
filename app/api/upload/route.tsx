import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const uploadedBy = 'employee-test'; // hardcoded for now, real auth later

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Ensure the uploads folder exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Create a unique filename to avoid collisions
    const timestamp = Date.now();
    const safeFileName = `${timestamp}-${file.name}`;
    const filePath = path.join(uploadsDir, safeFileName);

    // Convert the uploaded file into bytes and save it to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save a "pending" record in the database, pointing to this file
    const result = await pool.query(
      `INSERT INTO documents (project_id, s3_key, uploaded_by, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [projectId, safeFileName, uploadedBy]
    );

    return NextResponse.json({ success: true, document: result.rows[0] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}