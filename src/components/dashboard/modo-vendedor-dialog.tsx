
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, ArrowLeft, User } from 'lucide-react';
import { useSellerMode } from '@/context/seller-mode-context';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser } from '@/context/user-context';
import { useInventory } from '@/context/inventory-context';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';


type Profile = {
  id: string;
  name: string;
  pin: string;
  avatarId: string;
  isOwner?: boolean;
};


interface ModoVendedorDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isPage?: boolean;
  isSwitchMode?: boolean;
}


export function ModoVendedorDialog({ children, open, onOpenChange, isPage = false, isSwitchMode = false }: ModoVendedorDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [profileForPin, setProfileForPin] = useState<Profile | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();
  const { enterSellerMode, exitSellerMode, ownerPin, setProfileAuthenticated } = useSellerMode();
  const { user } = useUser();
  const { collaborators } = useInventory(); // Get collaborators from inventory context
  const router = useRouter();
  
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;
  const setDialogOpen = isControlled ? onOpenChange : setInternalOpen;
  
  const ownerProfile: Profile = useMemo(() => ({ 
    id: 'owner', 
    name: user?.name || 'Proprietário', 
    pin: ownerPin, 
    avatarId: 'user-avatar-1', 
    isOwner: true 
  }), [user, ownerPin]);

  const handleLogin = async () => {
    setError('');

    if (!profileForPin) {
      setError('Ocorreu um erro. Por favor, selecione um perfil novamente.');
      return;
    }

    // Se for proprietário e o PIN estiver vazio, aceita "1234" como padrão
    const expectedPin = profileForPin.isOwner && !profileForPin.pin ? '1234' : profileForPin.pin;

    if (expectedPin !== pin) {
      setError('PIN incorreto. Tente novamente.');
      setPin('');
      return;
    }
    
    try {
      setProfileAuthenticated(true);

      if (profileForPin.isOwner) {
        toast({
          title: `Bem-vindo(a), ${profileForPin.name}!`,
          description: 'Acessando o painel principal.',
        });
        handleCloseDialog();
        // Small delay to ensure state is updated before navigation
        await new Promise(resolve => setTimeout(resolve, 100));
        router.replace('/dashboard');
      } else {
        const { isOwner, ...collaboratorData } = profileForPin;
        enterSellerMode(collaboratorData as any);
        
        toast({
          title: `Bem-vindo(a), ${profileForPin.name}!`,
          description: 'Entrando no modo vendedor...',
        });

        handleCloseDialog();
        // Small delay to ensure state is updated before navigation
        await new Promise(resolve => setTimeout(resolve, 100));
        router.replace('/dashboard/pdv');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setError('Ocorreu um erro ao fazer login. Tente novamente.');
    }
  };
  
  const handleCloseDialog = () => {
    if (setDialogOpen) {
       setDialogOpen(false);
    }
  }
  
  const handleSelectProfile = (profile: Profile) => {
    setProfileForPin(profile);
  }


  const handleOpenChange = (open: boolean) => {
    if(!open) {
      // Reset state on close
      setTimeout(() => {
        setError('');
        setPin('');
        setProfileForPin(null);
      }, 300); // Delay to allow for fade-out animation
    }
    if (setDialogOpen) {
      setDialogOpen(open);
    }
  }

  const handleBackToSelection = () => {
    setProfileForPin(null);
    setError('');
    setPin('');
  }
  
  const profiles: Profile[] = useMemo(() => {
    const activeCollaborators = collaborators.filter(c => c.status === 'Ativo');
    if (isSwitchMode) {
        return activeCollaborators.map(c => ({
          id: c.id,
          name: c.name,
          pin: c.pin,
          avatarId: c.avatarId,
          isOwner: false,
        }));
    }
    return [ownerProfile, ...activeCollaborators.map(c => ({
          id: c.id,
          name: c.name,
          pin: c.pin,
          avatarId: c.avatarId,
          isOwner: false,
        }))];
  }, [collaborators, ownerProfile, isSwitchMode]);

  const ProfileSelectionGrid = (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(90px,1fr))] justify-center gap-x-4 gap-y-6 p-4">
      {profiles.map(c => {
        const avatarImage = PlaceHolderImages.find(img => img.id === c.avatarId);
        const fallback = c.isOwner ? <User /> : c.name.split(' ').map(n => n[0]).join('');

        return (
            <div key={c.id} className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => handleSelectProfile(c)}>
                <Avatar className="h-20 w-20 border-2 border-transparent group-hover:border-primary transition-all flex items-center justify-center">
                {avatarImage ? <AvatarImage src={avatarImage.imageUrl} alt={c.name} data-ai-hint={avatarImage.imageHint} /> : null}
                <AvatarFallback className="text-3xl">{fallback}</AvatarFallback>
            </Avatar>
            <p className="font-medium text-center text-sm group-hover:text-primary transition-colors">{c.name}</p>
            </div>
        )
        })}
    </div>
  );


  const PageContent = (
     <div className="w-full max-w-lg p-6 bg-card text-card-foreground rounded-lg shadow-lg relative">
        <div className="text-center mb-4">
            {profileForPin && (
            <Button variant="ghost" size="icon" className="absolute left-4 top-4 h-8 w-8" onClick={handleBackToSelection}>
                <ArrowLeft />
            </Button>
            )}
            <h2 className="text-xl font-bold">{profileForPin ? 'Digite seu PIN' : 'Quem está usando?'}</h2>
        </div>
        {collaborators.length === 0 && !profileForPin ? (
            <div className="py-4 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <p className="font-semibold text-lg">Nenhum colaborador encontrado!</p>
            <p className="text-muted-foreground text-sm mb-4">
              Você pode acessar como proprietário ou cadastrar um colaborador.
            </p>
            <Button onClick={() => handleSelectProfile(ownerProfile)}>
                Acessar como Proprietário
            </Button>
          </div>
        ) : !profileForPin ? (
          // Profile Selection Screen
          <ScrollArea className="h-auto">
            {ProfileSelectionGrid}
          </ScrollArea>
        ) : (
          // PIN Entry Screen
          <div className="flex flex-col items-center gap-4 py-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={PlaceHolderImages.find(img => img.id === profileForPin.avatarId)?.imageUrl} alt={profileForPin.name} />
                <AvatarFallback className="text-3xl">
                  {profileForPin.isOwner ? <User /> : profileForPin.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
            </Avatar>
              <p className="font-semibold text-xl">{profileForPin.name}</p>
            <div className="w-full max-w-xs space-y-2">
              <Input
                id="pin"
                type="password"
                maxLength={4}
                placeholder={profileForPin.isOwner && !ownerPin ? "1234" : "••••"}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="text-center text-2xl h-12"
                autoFocus
              />
                {error && (
                <p className="text-sm font-medium text-destructive text-center">{error}</p>
              )}
            </div>
              <Button type="button" onClick={handleLogin} className="w-full max-w-xs">Entrar</Button>
          </div>
        )}
    </div>
  );

  const DialogPopupContent = (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
          {profileForPin && (
          <Button variant="ghost" size="icon" className="absolute left-4 top-4 h-8 w-8" onClick={handleBackToSelection}>
              <ArrowLeft />
          </Button>
          )}
        <DialogTitle className="text-center">{profileForPin ? 'Digite seu PIN' : 'Quem está usando?'}</DialogTitle>
      </DialogHeader>

      {collaborators.length === 0 && !profileForPin && !isSwitchMode ? (
          <div className="py-4 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <p className="font-semibold text-lg">Nenhum colaborador encontrado!</p>
          <p className="text-muted-foreground text-sm mb-4">
            Você pode acessar como proprietário ou cadastrar um colaborador.
          </p>
          <Button onClick={() => handleSelectProfile(ownerProfile)}>
              Acessar como Proprietário
          </Button>
        </div>
      ) : !profileForPin ? (
        // Profile Selection Screen
        <ScrollArea className="h-auto">
          {ProfileSelectionGrid}
        </ScrollArea>
      ) : (
        // PIN Entry Screen
        <div className="flex flex-col items-center gap-4 py-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={PlaceHolderImages.find(img => img.id === profileForPin.avatarId)?.imageUrl} alt={profileForPin.name} />
              <AvatarFallback className="text-3xl">
                {profileForPin.isOwner ? <User /> : profileForPin.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
          </Avatar>
            <p className="font-semibold text-xl">{profileForPin.name}</p>
          <div className="w-full max-w-xs space-y-2">
            <Input
              id="pin"
              type="password"
              maxLength={4}
              placeholder={profileForPin.isOwner && !ownerPin ? "1234" : "••••"}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="text-center text-2xl h-12"
              autoFocus
            />
              {error && (
              <p className="text-sm font-medium text-destructive text-center">{error}</p>
            )}
          </div>
            <Button type="button" onClick={handleLogin} className="w-full max-w-xs">Entrar</Button>
        </div>
      )}
    </DialogContent>
  );

  if (isPage) {
    return PageContent;
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      {DialogPopupContent}
    </Dialog>
  );
}
