import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSession } from '@/lib/session';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  // Only admins and employees can delete. Clients are read-only.
  if (
    !session.isLoggedIn ||
    (session.role !== 'admin' && session.role !== 'employee')
  ) {
    return NextResponse.json(
      { success: false, error: 'Not authorized' },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;

    const docResult = await pool.query(
      'SELECT s3_key, project_id FROM documents WHERE id = $1',
      [id],
    );
    const doc = docResult.rows[0];

    if (!doc) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 },
      );
    }

    // Employees can only delete documents that belong to a project they
    // are linked to. Admins are not restricted.
    if (session.role === 'employee') {
      const access = await pool.query(
        'SELECT 1 FROM user_projects WHERE user_id = $1 AND project_id = $2',
        [session.userId, doc.project_id],
      );
      if (access.rowCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Not authorized' },
          { status: 403 },
        );
      }
    }

    if (doc.s3_key) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: doc.s3_key,
        }),
      );
    }

    await pool.query('DELETE FROM documents WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
