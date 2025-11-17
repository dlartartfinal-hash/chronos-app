'use client';

import { cn } from '@/lib/utils';
import { isLetterAvatar, parseLetterAvatar } from '@/lib/letter-avatar';
import Image from 'next/image';

interface ProductImageProps {
  imageUrl: string;
  name: string;
  className?: string;
  size?: number;
}

export function ProductImage({ imageUrl, name, className, size = 40 }: ProductImageProps) {
  // Se não tem imagem, gera avatar automaticamente
  if (!imageUrl || imageUrl.trim() === '') {
    const letter = name ? name.charAt(0).toUpperCase() : '?';
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;
    const color = colors[colorIndex];
    
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-md text-white font-bold',
          color,
          className
        )}
        style={{ width: size, height: size, fontSize: size * 0.5 }}
      >
        {letter}
      </div>
    );
  }
  
  if (isLetterAvatar(imageUrl)) {
    const avatar = parseLetterAvatar(imageUrl);
    if (avatar) {
      return (
        <div
          className={cn(
            'flex items-center justify-center rounded-md text-white font-bold',
            avatar.color,
            className
          )}
          style={{ width: size, height: size, fontSize: size * 0.5 }}
        >
          {avatar.letter}
        </div>
      );
    }
  }

  return (
    <Image
      src={imageUrl}
      alt={name}
      width={size}
      height={size}
      className={cn('rounded-md object-cover', className)}
    />
  );
}
