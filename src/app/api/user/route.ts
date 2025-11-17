import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const email = request.headers.get('x-user-email')
    if (!email) {
      return NextResponse.json({ error: 'User email required' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        customers: true,
        products: {
          include: {
            category: true,
            variations: true,
          },
        },
        services: true,
        categories: true,
        collaborators: true,
        promotions: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, password, referredBy } = body

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, nome e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      )
    }

    // Validar código de indicação se fornecido
    if (referredBy) {
      const referralExists = await prisma.referral.findUnique({
        where: { referralCode: referredBy },
      })

      if (!referralExists) {
        return NextResponse.json(
          { error: 'Código de indicação inválido' },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Calculate trial end date (1 day from now)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 1)

    // Create user with referral code and trial period
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        referredBy: referredBy || null,
        // @ts-expect-error - Campo existe no schema Prisma, mas TS language server pode estar com cache desatualizado
        trialEndsAt,
      },
    })

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
