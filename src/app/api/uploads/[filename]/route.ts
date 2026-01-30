import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"
import { auth } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const { filename } = await params
    const filePath = path.join(process.cwd(), "uploads", filename)

    const fileBuffer = await readFile(filePath)

    // Determine content type based on extension
    const ext = path.extname(filename).toLowerCase()
    let contentType = "application/octet-stream"
    if (ext === ".jpg" || ext === ".jpeg") {
      contentType = "image/jpeg"
    } else if (ext === ".png") {
      contentType = "image/png"
    } else if (ext === ".pdf") {
      contentType = "application/pdf"
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }
}
