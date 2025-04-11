import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';


export async function PATCH(
  req: NextRequest,
  { params }: { params: { folderid: string } }
) {
    const folderid = params.folderid;
    const userId = req.headers.get('user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized to restore folders' }, { status: 401 });
    }

  try {
    const result = await pool.query(
      `UPDATE folders 
       SET deletedat = NULL 
       WHERE folderid = $1 AND userid = $2 
       RETURNING *`,
      [folderid, userId]
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
