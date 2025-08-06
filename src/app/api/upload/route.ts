import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const conversationId = data.get('conversationId') as string

    if (!file || !conversationId) {
      return NextResponse.json({ 
        error: 'File and conversation ID are required' 
      }, { status: 400 })
    }

    // Verify user is part of the conversation
    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id }
        ],
        status: 'active'
      }
    })

    if (!conversation) {
      return NextResponse.json({ 
        error: 'Conversation not found or access denied' 
      }, { status: 404 })
    }

    // Check file size (limit to 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File size exceeds 50MB limit' 
      }, { status: 400 })
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const filename = `${nanoid()}.${fileExtension}`
    
    // Save file to uploads directory
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const uploadsDir = join(process.cwd(), 'uploads')
    const filePath = join(uploadsDir, filename)
    
    await writeFile(filePath, buffer)

    // Create file record in database with auto-delete after 30 days
    const deleteAfter = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    
    const mediaFile = await db.mediaFile.create({
      data: {
        id: nanoid(),
        filename,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        filePath: `/uploads/${filename}`,
        conversationId,
        uploadedById: session.user.id,
        deleteAfter
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json(mediaFile)

  } catch (error) {
    console.error('Upload file error:', error)
    return NextResponse.json({ 
      error: 'Failed to upload file' 
    }, { status: 500 })
  }
}