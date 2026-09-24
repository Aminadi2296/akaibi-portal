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
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Not authorized' },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;

    const docResult = await pool.query(
      'SELECT s3_key FROM documents WHERE id = $1',
      [id],
    );
    const doc = docResult.rows[0];

    if (!doc) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 },
      );
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
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
