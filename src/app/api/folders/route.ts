import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(token);

  if (!payload?.userId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM folders WHERE userid = $1 AND deletedat IS NULL ORDER BY createdat DESC',
      [payload.userId]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('GET /folders error:', error);
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(token);

  if (!payload?.userId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const result = await pool.query(
      'INSERT INTO folders (folderid, userid, name) VALUES (gen_random_uuid(), $1, $2) RETURNING *',
      [payload.userId, name]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('POST /folders error:', error);
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}
