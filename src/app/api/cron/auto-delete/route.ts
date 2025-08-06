import { NextResponse } from 'next/server'
import { deleteExpiredMessages } from '@/lib/cron/autoDelete'

export async function POST() {
  try {
    const result = await deleteExpiredMessages()
    
    return NextResponse.json({
      success: true,
      message: 'Auto-delete completed successfully',
      ...result
    })
  } catch (error) {
    console.error('Auto-delete API error:', error)
    return NextResponse.json({ 
      error: 'Failed to run auto-delete' 
    }, { status: 500 })
  }
}