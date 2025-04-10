import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

// ✅ GET Notes for logged-in user
// export async function GET(req: NextRequest) {
//   const token = req.cookies.get('token')?.value;

//   if (!token) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }

//   const payload = await verifyToken(token);
//   if (!payload?.userId) {
//     return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
//   }

//   try {
//     const result = await pool.query(
//       `SELECT 
//         notes.noteid, notes.title, notes.content, notes.isfavourite, notes.isarchive,
//         notes.createdat, notes.updatedat, folders.name AS folder_name, folders.folderid
//       FROM notes
//       JOIN folders ON notes.folderid = folders.folderid
//       WHERE notes.userid = $1 AND notes.deletedat IS NULL
//       ORDER BY notes.createdat DESC`,
//       [payload.userId]
//     );

//     return NextResponse.json(result.rows);
//   } catch (err) {
//     console.error('GET /notes error:', err);
//     return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
//   }
// }


export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload?.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  // Get query params
  const { searchParams } = new URL(req.url);
  const archived = searchParams.get('archived');
  const favorite = searchParams.get('favorite');
  const deleted = searchParams.get('deleted');
  const folderId = searchParams.get('folderId');
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions = [`notes.userid = $1`];
  const values: (string|number|boolean)[] = [payload.userId];
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
  else {
    conditions.push(`notes.deletedat IS NULL`);
  }

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
        notes.createdat, notes.deletedat,notes.updatedat,
        folders.name AS folder_name, folders.folderid
      FROM notes
      JOIN folders ON notes.folderid = folders.folderid
      ${whereClause}
      ORDER BY notes.createdat DESC
      LIMIT $${i++} OFFSET $${i}
      `,
      [...values, limit, offset]
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('GET /notes error:', err);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}


// ✅ POST: Create a new note
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
    const { title, content, folderid } = await req.json();

    if (!title || !folderid) {
      return NextResponse.json({ error: 'Title and folderid are required' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO notes (title, content, folderid, userid)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, content || '', folderid, payload.userId]
    );

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('POST /notes error:', err);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
