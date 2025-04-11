import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { folderid: string } }
) {
  const folderid = params.folderid;

  const userId = req.headers.get('user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized to edit folder' }, { status: 401 });
  }
  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const result = await pool.query(
      'UPDATE folders SET name = $1, updatedat = NOW() WHERE folderid = $2 AND userid = $3 RETURNING *',
      [name, folderid, userId]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('PATCH /folders/:folderid error:', error);
    return NextResponse.json({ error: 'Failed to rename folder' }, { status: 500 });
  }
}


export async function DELETE(
  req: NextRequest,
  { params }: { params: { folderid: string } }
) {
  const folderid = params.folderid;

const userId = req.headers.get('user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized to delete folders' }, { status: 401 });
  }

 try {
    const folderResult = await pool.query(
      `UPDATE folders SET deletedat = NOW()
      WHERE folderid = $1 AND userid = $2
      RETURNING *`,
      [folderid, userId]
    )
    await pool.query(
      `UPDATE notes SET deletedat = NOW()
      WHERE folderid = $1 AND userid = $2`,
      [folderid, userId]  
    )
  

    return NextResponse.json({ message: 'folder deleted successfully', folder: folderResult.rows[0] });
  } catch (error) {
   
    console.error('DELETE /folders/:folderid error:', error);
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }


}
