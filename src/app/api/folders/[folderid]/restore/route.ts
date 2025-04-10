import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { folderid: string } }
) {
  const token = req.cookies.get('token')?.value;
  const folderid = params.folderid;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload?.userId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    const result = await pool.query(
      `UPDATE folders 
       SET deletedat = NULL 
       WHERE folderid = $1 AND userid = $2 
       RETURNING *`,
      [folderid, payload.userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Folder not found or not deleted' }, { status: 404 });
    }

    return NextResponse.json({ message: 'folder restored successfully', folder: result.rows[0] });
  } catch (error) {
    console.error('PATCH /notes/:noteid/restore error:', error);
    return NextResponse.json({ error: 'Failed to restore folder' }, { status: 500 });
  }
}
