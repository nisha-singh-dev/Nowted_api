import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { noteid: string } }  
){
  const noteid = params.noteid;
  const userId = req.headers.get('user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized to get particular notes' }, { status: 401 });
  }
  try {
    const result = await pool.query(
      `SELECT 
         notes.noteid, 
         notes.title, 
         notes.content,
         notes.isfavourite, 
         notes.isarchive,
         notes.createdat AS note_createdat,
         notes.updatedat AS note_updatedat,
         notes.deletedat AS note_deletedat,
         notes.folderid,
         folders.folderid AS folder_id,
         folders.name AS folder_name,
         folders.createdat AS folder_createdat,
         folders.updatedat AS folder_updatedat,
         folders.deletedat AS folder_deletedat
       FROM notes
       JOIN folders ON notes.folderid = folders.folderid
       WHERE notes.noteid = $1 AND notes.userid = $2 AND notes.deletedat IS NULL`,
      [noteid, userId]
    );
  
    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Note not found' }, { status: 404 });
    }
  
    const row = result.rows[0];
  
    const formattedNote = {
      note: {
        id: row.noteid, 
        folderId: row.folderid,
        title: row.title,
        content: row.content,
        isFavorite: row.isfavourite,
        isArchived: row.isarchive,
        createdAt: row.note_createdat, 
        updatedAt: row.note_updatedat,
        deletedAt: row.note_deletedat,
        folder: {
          id: row.folder_id,
          name: row.folder_name,
          createdAt: row.folder_createdat,
          updatedAt: row.folder_updatedat,
          deletedAt: row.folder_deletedat
        }
      }
    };
  
    return NextResponse.json(formattedNote);
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
  const noteid = params.noteid;
  const userId = req.headers.get('user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized to get notes' }, { status: 401 });
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
  const values: (string|boolean)[] = [noteid, userId];
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
  const noteid = params.noteid;
  const userId = req.headers.get('user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized to get notes' }, { status: 401 });
  }

  try {
    const result = await pool.query(
      `UPDATE notes 
       SET deletedat = NOW() 
       WHERE noteid = $1 AND userid = $2 
       RETURNING *`,
      [noteid, userId]
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
