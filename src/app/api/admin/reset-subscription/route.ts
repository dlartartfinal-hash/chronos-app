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

    // Se tem subscription cancelada, deletar
    if (user.subscription && user.subscription.status === 'CANCELLED') {
      await prisma.subscription.delete({
        where: { userId: user.id },
      });

      console.log('✅ Subscription cancelada removida para:', userEmail);

      return NextResponse.json({
        success: true,
        message: 'Assinatura cancelada removida com sucesso',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Nenhuma assinatura cancelada para remover',
      currentStatus: user.subscription?.status,
    });
  } catch (error) {
    console.error('❌ Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar' },
      { status: 500 }
    );
  }
}
