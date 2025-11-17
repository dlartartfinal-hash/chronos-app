import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const email = request.headers.get('x-user-email')
    if (!email) {
      return NextResponse.json({ error: 'User email required' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const collaborators = await prisma.collaborator.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(collaborators)
  } catch (error) {
    console.error('Error fetching collaborators:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const email = request.headers.get('x-user-email')
    if (!email) {
      return NextResponse.json({ error: 'User email required' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const collaborator = await prisma.collaborator.create({
      data: {
        userId: user.id,
        name: body.name,
        pin: body.pin,
        canModifyItems: body.canModifyItems || false,
        avatarId: body.avatarId,
        status: body.status || 'Ativo',
      },
    })

    return NextResponse.json(collaborator, { status: 201 })
  } catch (error) {
    console.error('Error creating collaborator:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const email = request.headers.get('x-user-email')
    if (!email) {
      return NextResponse.json({ error: 'User email required' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    
    // Verify collaborator belongs to user
    const existingCollaborator = await prisma.collaborator.findFirst({
      where: { id: body.id, userId: user.id }
    })
    
    if (!existingCollaborator) {
      return NextResponse.json({ error: 'Collaborator not found or access denied' }, { status: 404 })
    }
    
    const collaborator = await prisma.collaborator.update({
      where: { id: body.id },
      data: {
        name: body.name,
        pin: body.pin,
        canModifyItems: body.canModifyItems,
        avatarId: body.avatarId,
        status: body.status,
      },
    })

    return NextResponse.json(collaborator)
  } catch (error) {
    console.error('Error updating collaborator:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const email = request.headers.get('x-user-email')
    if (!email) {
      return NextResponse.json({ error: 'User email required' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Collaborator ID required' }, { status: 400 })
    }

    // Verify collaborator belongs to user before deleting
    const collaborator = await prisma.collaborator.findFirst({
      where: { id, userId: user.id }
    })
    
    if (!collaborator) {
      return NextResponse.json({ error: 'Collaborator not found or access denied' }, { status: 404 })
    }

    await prisma.collaborator.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting collaborator:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
