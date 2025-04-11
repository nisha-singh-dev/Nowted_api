import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized to get folders' }, { status: 401 });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM folders WHERE userid = $1 AND deletedat IS NULL ORDER BY createdat DESC',
      [userId]
    );

    interface Folder {
            id: string;
            name: string;
            createdat: string | null;
            updatedat: string | null;
            deletedat: string | null;
          }
    const folders = result.rows.map((folder: Folder) => ({
      id: folder.id,
      name: folder.name,
      createdAt: folder.createdat,
      updatedAt: folder.updatedat,
      deletedAt: folder.deletedat,
    }));

    return NextResponse.json({ folders });
  } catch (error) {
    console.error('GET /folders error:', error);
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized to post folder' }, { status: 401 });
  }

  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const result = await pool.query(
      'INSERT INTO folders (folderid, userid, name) VALUES (gen_random_uuid(), $1, $2) RETURNING *',
      [userId, name]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('POST /folders error:', error);
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}
