import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { noteid: string } }
) {
  const noteid = params.noteid;
  const userId = req.headers.get('user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized to get particular notes' }, { status: 401 });
  }

  try {
    const result = await pool.query(
      `UPDATE notes 
       SET deletedat = NULL 
       WHERE noteid = $1 AND userid = $2 
       RETURNING *`,
      [noteid, userId]
    );
    await pool.query(
      `UPDATE folders 
       SET  deletedat = NULL 
       WHERE folderid = (SELECT folderid FROM notes WHERE noteid = $1) AND userid = $2`,
      [noteid, userId]  
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Note not found or not deleted' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Note restored successfully', note: result.rows[0] });
  } catch (error) {
    console.error('PATCH /notes/:noteid/restore error:', error);
    return NextResponse.json({ error: 'Failed to restore note' }, { status: 500 });
  }
}
