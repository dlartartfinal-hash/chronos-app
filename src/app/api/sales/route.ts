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

    const sales = await prisma.sale.findMany({
      where: { userId: user.id },
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(sales)
  } catch (error) {
    console.error('Error fetching sales:', error)
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
    const {
      customerId,
      vendedor,
      status,
      paymentMethod,
      installments,
      totalCents,
      subtotalCents,
      feesCents,
      items,
    } = body

    // Create sale with items
    const sale = await prisma.sale.create({
      data: {
        userId: user.id,
        customerId,
        vendedor,
        status,
        paymentMethod,
        installments: installments || null,
        totalCents,
        subtotalCents,
        feesCents,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId || null,
            productVariationId: item.productVariationId || null,
            serviceId: item.serviceId || null,
            name: item.name,
            quantity: item.quantity,
            priceCents: item.priceCents,
            originalPriceCents: item.originalPriceCents,
            costCents: item.costCents || null,
            imageUrl: item.imageUrl,
            promotionId: item.promotionId || null,
          })),
        },
      },
      include: {
        customer: true,
        items: true,
      },
    })

    // Update stock for products and variations
    for (const item of items) {
      if (item.productVariationId) {
        // Update product variation stock
        await prisma.productVariation.update({
          where: { id: item.productVariationId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })
      } else if (item.productId) {
        // Update product stock (if not variation)
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        })
        
        if (product && product.stock !== null && !product.hasVariations) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          })
        }
      }
    }

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    console.error('Error creating sale:', error)
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
    const { id, status } = body

    // Verify sale belongs to user
    const existingSale = await prisma.sale.findFirst({
      where: { id, userId: user.id }
    })
    
    if (!existingSale) {
      return NextResponse.json({ error: 'Sale not found or access denied' }, { status: 404 })
    }

    const sale = await prisma.sale.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        items: true,
      },
    })

    return NextResponse.json(sale)
  } catch (error) {
    console.error('Error updating sale:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
