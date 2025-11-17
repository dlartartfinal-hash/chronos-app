import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const userEmail = req.headers.get('x-user-email');
  
  if (!userEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const transactions = await prisma.financialTransaction.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
  });

  // Transformar para formato esperado pelo frontend (amount em reais, não centavos)
  const formattedTransactions = transactions.map((t: any) => ({
    id: t.id,
    description: t.description,
    amount: t.amount / 100, // Converter centavos para reais
    type: t.type as 'Receita' | 'Despesa',
    date: t.date.toISOString(),
  }));

  return NextResponse.json(formattedTransactions);
}

export async function POST(req: NextRequest) {
  const userEmail = req.headers.get('x-user-email');
  
  if (!userEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const body = await req.json();
  const { description, amount, type } = body;

  // Validação básica
  if (!description || typeof amount !== 'number' || !type) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  // Garantir que despesas sejam negativas e receitas positivas
  const amountInCents = Math.round(Math.abs(amount) * 100);
  const finalAmount = type === 'Despesa' ? -amountInCents : amountInCents;

  const transaction = await prisma.financialTransaction.create({
    data: {
      userId: user.id,
      description,
      amount: finalAmount,
      type,
      date: new Date(),
    },
  });

  // Retornar no formato esperado pelo frontend
  return NextResponse.json({
    id: transaction.id,
    description: transaction.description,
    amount: transaction.amount / 100,
    type: transaction.type as 'Receita' | 'Despesa',
    date: transaction.date.toISOString(),
  });
}

export async function DELETE(req: NextRequest) {
  const userEmail = req.headers.get('x-user-email');
  
  if (!userEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });
  }

  // Verificar se a transação pertence ao usuário
  const transaction = await prisma.financialTransaction.findUnique({
    where: { id },
  });

  if (!transaction || transaction.userId !== user.id) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  await prisma.financialTransaction.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
