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

    const services = await prisma.service.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('Error fetching services:', error)
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
    const service = await prisma.service.create({
      data: {
        userId: user.id,
        name: body.name,
        code: body.code,
        priceCents: Math.round(body.price * 100),
        costCents: body.cost ? Math.round(body.cost * 100) : null,
        imageUrl: body.imageUrl || null,
        imageId: body.imageId || null,
      },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)
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
    
    // Verify service belongs to user
    const existingService = await prisma.service.findFirst({
      where: { id: body.id, userId: user.id }
    })
    
    if (!existingService) {
      return NextResponse.json({ error: 'Service not found or access denied' }, { status: 404 })
    }
    
    const service = await prisma.service.update({
      where: { id: body.id },
      data: {
        name: body.name,
        code: body.code,
        priceCents: Math.round(body.price * 100),
        costCents: body.cost ? Math.round(body.cost * 100) : null,
        imageUrl: body.imageUrl || null,
        imageId: body.imageId || null,
      },
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error('Error updating service:', error)
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
      return NextResponse.json({ error: 'Service ID required' }, { status: 400 })
    }

    // Verify service belongs to user before deleting
    const service = await prisma.service.findFirst({
      where: { id, userId: user.id }
    })
    
    if (!service) {
      return NextResponse.json({ error: 'Service not found or access denied' }, { status: 404 })
    }

    await prisma.service.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
