import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSession } from '@/lib/session';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Free-tier cap: total documents (pending + indexed) a company can have
// across all of its projects. Checked before every upload. Once a real
// paid-plan concept exists, this should read from a per-company plan field
// instead of a single hardcoded constant.
const FREE_TIER_DOCUMENT_LIMIT = 50;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role === 'client') {
    return NextResponse.json(
      { success: false, error: 'Not authorized' },
      { status: 403 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const uploadedBy = session.userId;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 },
      );
    }

    // Check the company's total document count before touching S3, so a
    // rejected upload never costs storage or an API call.
    const countResult = await pool.query(
      `SELECT COUNT(d.id)::int AS total
       FROM documents d
       JOIN projects p ON d.project_id = p.id
       WHERE p.company_id = (
         SELECT company_id FROM projects WHERE id = $1
       )`,
      [projectId],
    );
    const currentCount = countResult.rows[0]?.total ?? 0;

    if (currentCount >= FREE_TIER_DOCUMENT_LIMIT) {
      return NextResponse.json(
        {
          success: false,
          error: `Se alcanzó el límite de ${FREE_TIER_DOCUMENT_LIMIT} documentos del plan gratuito.`,
        },
        { status: 403 },
      );
    }

    const timestamp = Date.now();
    const safeFileName = `${timestamp}-${file.name}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: safeFileName,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    const result = await pool.query(
      `INSERT INTO documents (project_id, s3_key, uploaded_by, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [projectId, safeFileName, uploadedBy],
    );

    return NextResponse.json({ success: true, document: result.rows[0] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}

