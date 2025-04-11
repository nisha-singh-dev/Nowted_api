import { NextRequest, NextResponse } from  "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest){
    const userId = req.headers.get('user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized to get particular notes' }, { status: 401 });
  }

    try {
        const result = await pool.query(
          `
          SELECT 
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
          WHERE notes.userid = $1
            AND notes.deletedat IS NULL
            AND notes.isarchive = FALSE
          ORDER BY notes.updatedat DESC
          LIMIT 3
          `,
          [userId]
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

        const recentNotes = result.rows.map((row: NoteRow) => ({
          id: row.noteid,
          folderId: row.folderid,
          title: row.title,
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
      
        return NextResponse.json({ recentNotes });
      }
   
    catch(err){
        console.error("GET /notes/recent error:", err);
        return NextResponse.json({error: "Failed to fetch notes"},{status: 500});
    }
}