import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"
import { db } from "@/lib/db"
import { secureFileService } from "@/lib/secure-file"

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename
    
    // Get file info from database
    const mediaFile = await db.mediaFile.findFirst({
      where: {
        filename,
        isDeleted: false
      }
    })

    if (!mediaFile) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      )
    }

    // Check if file has expired using secure service
    const { expired } = await secureFileService.checkFileExpiration(mediaFile.id)
    if (expired) {
      return NextResponse.json(
        { error: "File has expired" },
        { status: 410 }
      )
    }

    // Read file from disk
    const filePath = path.join(process.cwd(), "uploads", filename)
    const fileBuffer = await readFile(filePath)

    // Set appropriate content type
    const contentType = mediaFile.mimeType || "application/octet-stream"

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${mediaFile.originalName}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    })
  } catch (error) {
    console.error("File serving error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}