import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { ownerPin } = await req.json();
    
    // Get user email from headers (set by middleware or auth)
    const userEmail = req.headers.get('x-user-email');
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (!ownerPin || ownerPin.length < 4) {
      return NextResponse.json({ error: 'PIN inválido' }, { status: 400 });
    }

    // Update user's owner PIN
    const user = await prisma.user.update({
      where: { email: userEmail },
      data: { ownerPin },
      select: { id: true, email: true, name: true, ownerPin: true },
    });

    return NextResponse.json({ 
      success: true,
      user: {
        email: user.email,
        name: user.name,
        ownerPin: user.ownerPin,
      }
    });
  } catch (error) {
    console.error('Error updating owner PIN:', error);
    return NextResponse.json({ error: 'Erro ao atualizar PIN' }, { status: 500 });
  }
}
