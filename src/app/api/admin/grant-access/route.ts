import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, ownerPin } = await request.json();

    if (!email || !ownerPin) {
      return NextResponse.json({ error: 'Email e PIN obrigatórios' }, { status: 400 });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar PIN do proprietário
    if (user.ownerPin !== ownerPin) {
      return NextResponse.json({ error: 'PIN incorreto' }, { status: 403 });
    }

    // Tornar admin
    await prisma.user.update({
      where: { email },
      data: { isAdmin: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Permissão de administrador concedida com sucesso',
    });
  } catch (error) {
    console.error('Erro ao conceder admin:', error);
    return NextResponse.json(
      { error: 'Erro ao processar' },
      { status: 500 }
    );
  }
}
