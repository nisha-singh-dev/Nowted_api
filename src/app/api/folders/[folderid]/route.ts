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
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const result = await pool.query(
      'UPDATE folders SET name = $1, updatedat = NOW() WHERE folderid = $2 AND userid = $3 RETURNING *',
      [name, folderid, payload.userId]
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
    const folderResult = await pool.query(
      `UPDATE folders SET deletedat = NOW()
      WHERE folderid = $1 AND userid = $2
      RETURNING *`,
      [folderid, payload.userId]
    )
    await pool.query(
      `UPDATE notes SET deletedat = NOW()
      WHERE folderid = $1 AND userid = $2`,
      [folderid, payload.userId]  
    )
  

    return NextResponse.json({ message: 'folder deleted successfully', folder: folderResult.rows[0] });
  } catch (error) {
   
    console.error('DELETE /folders/:folderid error:', error);
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }


}
