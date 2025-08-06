import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, username, name, password } = await request.json()

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 400 }
      )
    }

    // Hash password (in production, use proper hashing)
    // For demo purposes, we'll store plain text
    const hashedPassword = password // In production: await bcrypt.hash(password, 12)
    
    // Create user
    const user = await db.user.create({
      data: {
        email,
        username,
        name,
        password: hashedPassword
      }
    })

    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name
      }
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}