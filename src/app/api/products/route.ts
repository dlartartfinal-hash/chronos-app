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

    const products = await prisma.product.findMany({
      where: { userId: user.id },
      include: {
        category: true,
        variations: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
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
    
    const product = await prisma.product.create({
      data: {
        userId: user.id,
        categoryId: body.categoryId,
        name: body.name,
        imageUrl: body.imageUrl || null,
        imageId: body.imageId || null,
        sku: body.sku || null,
        stock: body.stock || null,
        priceCents: body.priceCents !== undefined ? body.priceCents : (body.price ? Math.round(body.price * 100) : null),
        costCents: body.costCents !== undefined ? body.costCents : (body.cost ? Math.round(body.cost * 100) : null),
        hasVariations: body.hasVariations || false,
        variations: body.variations && body.variations.length > 0 ? {
          create: body.variations.map((v: any) => ({
            name: v.name,
            sku: v.sku || null,
            stock: v.stock,
            priceCents: v.priceCents !== undefined ? v.priceCents : Math.round(v.price * 100),
            costCents: v.costCents !== undefined ? v.costCents : (v.cost ? Math.round(v.cost * 100) : null),
          })),
        } : undefined,
      },
      include: {
        category: true,
        variations: true,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
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
    
    // Verify product belongs to user
    const existingProduct = await prisma.product.findFirst({
      where: { id: body.id, userId: user.id }
    })
    
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 })
    }
    
    // Delete old variations if product has variations
    if (body.hasVariations && body.variations) {
      await prisma.productVariation.deleteMany({
        where: { productId: body.id },
      })
    }
    
    const product = await prisma.product.update({
      where: { id: body.id },
      data: {
        categoryId: body.categoryId,
        name: body.name,
        imageUrl: body.imageUrl || null,
        imageId: body.imageId || null,
        sku: body.sku || null,
        stock: body.stock || null,
        priceCents: body.priceCents !== undefined ? body.priceCents : (body.price ? Math.round(body.price * 100) : null),
        costCents: body.costCents !== undefined ? body.costCents : (body.cost ? Math.round(body.cost * 100) : null),
        hasVariations: body.hasVariations || false,
        variations: body.variations ? {
          create: body.variations.map((v: any) => ({
            name: v.name,
            sku: v.sku || null,
            stock: v.stock,
            priceCents: v.priceCents !== undefined ? v.priceCents : Math.round(v.price * 100),
            costCents: v.costCents !== undefined ? v.costCents : (v.cost ? Math.round(v.cost * 100) : null),
          })),
        } : undefined,
      },
      include: {
        category: true,
        variations: true,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
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
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    // Verify product belongs to user before deleting
    const product = await prisma.product.findFirst({
      where: { id, userId: user.id }
    })
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 })
    }

    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
