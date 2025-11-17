const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testPassword() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@localhost.com' }
  });
  
  console.log('User found:', user.email);
  console.log('Password hash:', user.password);
  
  const isValid = await bcrypt.compare('123456', user.password);
  console.log('Password "123456" is valid:', isValid);
  
  await prisma.$disconnect();
}

testPassword();
