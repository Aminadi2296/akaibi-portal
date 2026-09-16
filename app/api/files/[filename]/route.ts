import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const safeName = decodeURIComponent(filename);

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: safeName,
    });

    // Generates a temporary, secure link (expires in 5 minutes) instead of
    // exposing the file publicly or streaming it through our own server.
    const url = await getSignedUrl(s3, command, { expiresIn: 300 });

    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}