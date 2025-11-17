import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userEmail } = await request.json();

    if (!userEmail) {
      return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Se já tem subscription, retornar info
    if (user.subscription) {
      return NextResponse.json({
        message: 'Usuário já tem uma assinatura única',
        subscription: user.subscription,
      });
    }

    return NextResponse.json({
      message: 'Nenhuma assinatura encontrada para este usuário',
    });
  } catch (error) {
    console.error('❌ Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar' },
      { status: 500 }
    );
  }
}
