const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Hash default password
  const hashedPassword = await bcrypt.hash('123456', 10)

  // Create user
  const user = await prisma.user.upsert({
    where: { email: 'admin@localhost.com' },
    update: {
      password: hashedPassword,
    },
    create: {
      email: 'admin@localhost.com',
      name: 'Admin User',
      password: hashedPassword,
      ownerPin: '1234',
    }
  })

  // Create categories
  const cat1 = await prisma.category.upsert({
    where: { userId_name: { userId: user.id, name: 'Eletrônicos' } },
    update: {},
    create: { userId: user.id, name: 'Eletrônicos' }
  })

  const cat2 = await prisma.category.upsert({
    where: { userId_name: { userId: user.id, name: 'Roupas' } },
    update: {},
    create: { userId: user.id, name: 'Roupas' }
  })

  // Create customers
  const customer1 = await prisma.customer.upsert({
    where: { userId_email: { userId: user.id, email: 'cliente1@exemplo.com' } },
    update: {},
    create: {
      userId: user.id,
      name: 'João Silva',
      email: 'cliente1@exemplo.com',
      phone: '11999999999',
      avatarId: 'user-1',
      status: 'Ativo'
    }
  })

  const customer2 = await prisma.customer.upsert({
    where: { userId_email: { userId: user.id, email: 'cliente2@exemplo.com' } },
    update: {},
    create: {
      userId: user.id,
      name: 'Maria Santos',
      email: 'cliente2@exemplo.com',
      phone: '11988888888',
      avatarId: 'user-2',
      status: 'Ativo'
    }
  })

  // Create products
  const product1 = await prisma.product.upsert({
    where: { userId_sku: { userId: user.id, sku: 'PROD-001' } },
    update: {},
    create: {
      userId: user.id,
      categoryId: cat1.id,
      name: 'Notebook Dell',
      sku: 'PROD-001',
      stock: 10,
      priceCents: 350000, // R$ 3500
      costCents: 280000,  // R$ 2800
      hasVariations: false,
    }
  })

  const product2 = await prisma.product.create({
    data: {
      userId: user.id,
      categoryId: cat2.id,
      name: 'Camiseta',
      hasVariations: true,
      variations: {
        create: [
          { name: 'P - Azul', sku: 'CAM-P-AZUL', stock: 20, priceCents: 4900, costCents: 2500 },
          { name: 'M - Azul', sku: 'CAM-M-AZUL', stock: 15, priceCents: 4900, costCents: 2500 },
          { name: 'G - Azul', sku: 'CAM-G-AZUL', stock: 10, priceCents: 4900, costCents: 2500 },
        ],
      },
    },
  })

  // Create services
  const service1 = await prisma.service.upsert({
    where: { userId_code: { userId: user.id, code: 'SRV-001' } },
    update: {},
    create: {
      userId: user.id,
      name: 'Consultoria em TI',
      code: 'SRV-001',
      priceCents: 15000, // R$ 150
      costCents: 8000,
    }
  })

  // Create collaborators
  const collab1 = await prisma.collaborator.create({
    data: {
      userId: user.id,
      name: 'Vendedor 1',
      pin: '1111',
      canModifyItems: true,
      avatarId: 'user-3',
      status: 'Ativo',
    }
  })

  // Create sample sale
  const sale1 = await prisma.sale.create({
    data: {
      userId: user.id,
      customerId: customer1.id,
      vendedor: 'Proprietário',
      status: 'Concluída',
      paymentMethod: 'Dinheiro',
      totalCents: 355000, // R$ 3550
      subtotalCents: 355000,
      feesCents: 0,
      items: {
        create: [
          {
            productId: product1.id,
            name: 'Notebook Dell',
            quantity: 1,
            priceCents: 350000,
            originalPriceCents: 350000,
            imageUrl: null,
          },
        ],
      },
    },
    include: {
      items: true,
    },
  })

  // Create default settings
  const settings = await prisma.settings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      themeNameLight: 'Padrão',
      themeNameDark: 'Padrão',
      paymentRates: JSON.stringify({
        'Débito': '1.99',
        'Pix': '0.99',
        'Crédito': [
          '2.99', '4.59', '5.99', '7.89', '9.29', '10.99',
          '12.59', '14.09', '15.89', '17.49', '19.99', '21.99'
        ],
      }),
    }
  })

  console.log('Seeding finished.')
  console.log({
    user,
    categories: [cat1, cat2],
    customers: [customer1, customer2],
    products: [product1, product2],
    services: [service1],
    collaborators: [collab1],
    sales: [sale1],
    settings,
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
