
'use client';

import { LogOut, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/user-context';
import { apiRequest } from '@/lib/api';

const defaultAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar-1');

export function UserNav() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, logout } = useUser();
  const [avatarUrl, setAvatarUrl] = useState<string>(defaultAvatar?.imageUrl || '');

  // Load avatar from settings
  useEffect(() => {
    const loadAvatar = async () => {
      try {
        const settings = await apiRequest<any>('settings');
        if (settings.profileAvatar) {
          setAvatarUrl(settings.profileAvatar);
        }
      } catch (error) {
        console.error("Failed to load avatar:", error);
      }
    };
    
    if (user) {
      loadAvatar();
    }
    
    // Listen for avatar updates
    const handleAvatarUpdate = (event: CustomEvent) => {
      if (event.detail) {
        setAvatarUrl(event.detail);
      }
    };
    
    window.addEventListener('avatar-updated', handleAvatarUpdate as EventListener);
    
    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdate as EventListener);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    toast({
      title: 'Você saiu da sua conta.',
      description: 'Redirecionando para a tela de login...',
    });
    router.push('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={avatarUrl}
              alt="User Avatar"
            />
            <AvatarFallback>{user?.name.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name || 'Usuário'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || 'email@exemplo.com'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/configuracoes">
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
