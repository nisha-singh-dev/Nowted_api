import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';


export async function GET(req: NextRequest) {
  const userId = req.headers.get('user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized to get notes' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const archived = searchParams.get('archived');
  const favorite = searchParams.get('favorite');
  const deleted = searchParams.get('deleted');
  const folderId = searchParams.get('folderId');
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = (page - 1) * limit;

  
  const conditions = [`notes.userid = $1`];
  const values: (string|number|boolean)[] = [userId];
  let i = values.length + 1;

  if (archived !== null) {
    conditions.push(`notes.isarchive = $${i++}`);
    values.push(archived === 'true');
  }

  if (favorite !== null) {
    conditions.push(`notes.isfavourite = $${i++}`);
    values.push(favorite === 'true');
  }

  if (deleted === 'true') {
    conditions.push(`notes.deletedat IS NOT NULL`);
  } 
  // else {
  //   conditions.push(`notes.deletedat IS NULL`);
  // }

  if (folderId) {
    conditions.push(`notes.folderid = $${i++}`);
    values.push(folderId);
  }

  if (search) {
    conditions.push(`(notes.title ILIKE $${i} OR notes.content ILIKE $${i})`);
    values.push(`%${search}%`);
    i++;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const result = await pool.query(
      `
      SELECT 
        notes.noteid, notes.title, notes.content,
        notes.isfavourite, notes.isarchive,
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
      ${whereClause}
      ORDER BY notes.createdat DESC
      LIMIT $${i++} OFFSET $${i}
      `,
      [...values, limit, offset]
    );

    interface NoteRow {
      noteid: string;
      title: string;
      content: string | null;
      isfavourite: boolean;
      isarchive: boolean;
      note_createdat: string;
      note_updatedat: string;
      note_deletedat: string | null;
      folderid: string;
      folder_id: string;
      folder_name: string;
      folder_createdat: string;
      folder_updatedat: string;
      folder_deletedat: string | null;
    }

    const formatted = result.rows.map((row : NoteRow) => ({
      id: row.noteid,
      folderId: row.folderid,
      title: row.title,
      content: row.content,
      isFavorite: row.isfavourite,
      isArchived: row.isarchive,
      createdAt: row.note_createdat,
      updatedAt: row.note_updatedat,
      deletedAt: row.note_deletedat,
      preview: row.content?.slice(0, 100) || "", 
      folder: {
        id: row.folder_id,
        name: row.folder_name,
        createdAt: row.folder_createdat,
        updatedAt: row.folder_updatedat,
        deletedAt: row.folder_deletedat,
      },
    }));
  
    return NextResponse.json({ notes: formatted });
  }
   
  catch (err) {
    console.error('GET /notes error:', err);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  const userId = req.headers.get('user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized to post notes' }, { status: 401 });
  }

  try {
    const { title, content, folderid } = await req.json();

    if (!title || !folderid) {
      return NextResponse.json({ error: 'Title and folderid are required' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO notes (title, content, folderid, userid)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, content || '', folderid, userId]
    );

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('POST /notes error:', err);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
