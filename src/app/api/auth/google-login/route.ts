import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, name, picture } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar ou criar usuário
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Criar novo usuário
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          password: '', // Sem senha para login OAuth
          image: picture || null,
          emailVerified: new Date(),
        },
      });
    } else {
      // Atualizar informações do usuário
      user = await prisma.user.update({
        where: { email },
        data: {
          name: name || user.name,
          image: picture || user.image,
          emailVerified: new Date(),
        },
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Erro no login com Google:', error);
    return NextResponse.json(
      { error: 'Erro ao processar login com Google' },
      { status: 500 }
    );
  }
}
