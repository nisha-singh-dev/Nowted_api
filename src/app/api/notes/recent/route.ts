import { NextRequest, NextResponse } from  "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest){
    const token = req.cookies.get("token")?.value;

    if(!token){
        return NextResponse.json({error: "Unauthorized"},{status: 401});
    }
    
    const payload = await verifyToken(token);
    if(!payload?.userId){
        return NextResponse.json({error: "Invalid token"},{status: 401});
    }
    try{
        const result = await pool.query(
            `SELECT 
              *
                FROM notes
                WHERE notes.deletedat IS NULL AND notes.userid = $1 
                AND notes.isarchive = false
                ORDER BY notes.updatedat DESC
                LIMIT 3`,
            [payload.userId]
        );
        return NextResponse.json(result.rows);
    }catch(err){
        console.error("GET /notes/recent error:", err);
        return NextResponse.json({error: "Failed to fetch notes"},{status: 500});
    }
}