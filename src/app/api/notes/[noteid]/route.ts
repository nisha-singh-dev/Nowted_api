// /api/notes/[noteid]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function GET(
  req: NextRequest,
  { params }: { params: { noteid: string } }  
){
  const token = req.cookies.get('token')?.value;
  const noteid = params.noteid;
  if(!token){
    return NextResponse.json({error: "Unauthorized"},{status: 401});
  }
  const payload = await verifyToken(token);
  if(!payload?.userId){
    return NextResponse.json({error: "Invalid token", staus  : 401});
  }
  try{
    const result = await pool.query(
      `SELECT * FROM notes
       WHERE noteid = $1 AND userid = $2 AND deletedat IS NULL`,
      [noteid, payload.userId]
    )
    return NextResponse.json(result.rows[0]);
  }
  catch(err){
    console.error("GET /notes/:noteid error:", err);
    return NextResponse.json({error: "Failed to fetch note"},{status: 500});  
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { noteid: string } }
) {
  const token = req.cookies.get('token')?.value;
  const noteid = params.noteid;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload?.userId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const {
    folderId,
    title,
    content,
    isFavorite,
    isArchived
  }: {
    folderId?: string;
    title?: string;
    content?: string;
    isFavorite?: boolean;
    isArchived?: boolean;
  } = await req.json();

  const fields: string[] = [];
  const values: (string|boolean)[] = [noteid, payload.userId];
  let index = 3;

  if (folderId) {
    fields.push(`folderid = $${index++}`);
    values.push(folderId);
  }
  if (title) {
    fields.push(`title = $${index++}`);
    values.push(title);
  }
  if (content) {
    fields.push(`content = $${index++}`);
    values.push(content);
  }
  if (typeof isFavorite === 'boolean') {
    fields.push(`isfavourite = $${index++}`);
    values.push(isFavorite);
  }
  if (typeof isArchived === 'boolean') {
    fields.push(`isarchive = $${index++}`);
    values.push(isArchived);
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `UPDATE notes
       SET ${fields.join(', ')}, updatedat = NOW()
       WHERE noteid = $1 AND userid = $2
       RETURNING *`,
      values
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('PATCH /notes/:noteid error:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}



export async function DELETE(
  req: NextRequest,
  { params }: { params: { noteid: string } }
) {
  const token = req.cookies.get('token')?.value;
  const noteid = params.noteid;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload?.userId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    const result = await pool.query(
      `UPDATE notes 
       SET deletedat = NOW() 
       WHERE noteid = $1 AND userid = $2 
       RETURNING *`,
      [noteid, payload.userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Note deleted successfully', note: result.rows[0] });
  } catch (error) {
    console.error('DELETE /notes/:noteid error:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
