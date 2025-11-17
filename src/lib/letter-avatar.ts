// Helper to generate avatar with first letter
export function generateLetterAvatar(name: string): string {
  if (!name) return '';
  const letter = name.charAt(0).toUpperCase();
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
  const colorIndex = name.charCodeAt(0) % colors.length;
  return `letter-avatar:${letter}:${colors[colorIndex]}`;
}

export function isLetterAvatar(imageUrl: string): boolean {
  return imageUrl?.startsWith('letter-avatar:') || false;
}

export function parseLetterAvatar(imageUrl: string): { letter: string; color: string } | null {
  if (!isLetterAvatar(imageUrl)) return null;
  const parts = imageUrl.split(':');
  return { letter: parts[1] || '?', color: parts[2] || 'bg-gray-500' };
}
