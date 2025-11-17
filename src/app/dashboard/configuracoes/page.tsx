

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTheme } from 'next-themes';
import { useEffect, useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { ColorPicker } from '@/components/ui/color-picker';
import { Button } from '@/components/ui/button';
import { Check, Eye, EyeOff, Percent, Save, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useSellerMode } from '@/context/seller-mode-context';
import { PaymentMethod, paymentMethods as allPaymentMethods } from '@/lib/payment-methods';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { CustomLogo } from '@/components/ui/custom-logo';
import { useUser } from '@/context/user-context';
import { apiRequest } from '@/lib/api';
import { useTour } from '@/context/tour-context';
import { HelpCircle, RotateCcw, Play, Pause } from 'lucide-react';


// --- Helper Functions ---
function hexToHsl(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  let r = parseInt(result[1], 16), g = parseInt(result[2], 16), b = parseInt(result[3], 16);
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  return `${h} ${s}% ${l}%`;
}

function hslToHex(hsl: string): string {
  if (!hsl) return '#000000';
  const hslMatch = hsl.match(/(\d+(\.\d+)?)/g);
  if (!hslMatch || hslMatch.length < 3) return '#000000';

  const [h, s, l] = hslMatch.map(Number);
  const sPercentage = s / 100;
  const lPercentage = l / 100;
  const a = sPercentage * Math.min(lPercentage, 1 - lPercentage);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lPercentage - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function getCssVariable(variable: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}

function getContrastingTextColor(hex: string): string {
  if (!hex) return '0 0% 10%';
  if (hex.startsWith('#')) hex = hex.slice(1);
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '0 0% 10%' : '0 0% 100%';
}

// --- Theme Definitions ---
const themes = [
  {
    name: 'Padrão',
    colors: {
      light: { primary: '#30475E', accent: '#F05454', background: '#F2F4F7', card: '#ffffff', header: '#ffffff' },
      dark: { primary: '#e9ecef', accent: '#F05454', background: '#101113', card: '#1a1b1e', header: '#1a1b1e' }
    }
  },
  {
    name: 'Oceano',
    colors: {
      light: { primary: '#007A7A', accent: '#FF7F50', background: '#E6F4F1', card: '#FFFFFF', header: '#FFFFFF' },
      dark: { primary: '#00B2B2', accent: '#FF7F50', background: '#002B2B', card: '#003F3F', header: '#003F3F' }
    }
  },
  {
    name: 'Floresta',
    colors: {
      light: { primary: '#4A6A4F', accent: '#C8A2C8', background: '#F4F4F0', card: '#FFFFFF', header: '#FFFFFF' },
      dark: { primary: '#8FBC8F', accent: '#C8A2C8', background: '#2E3D32', card: '#3C5242', header: '#3C5242' }
    }
  },
  {
    name: 'Vibrante',
    colors: {
      light: { primary: '#6A0DAD', accent: '#FFD700', background: '#F3E5F5', card: '#FFFFFF', header: '#FFFFFF' },
      dark: { primary: '#9B59B6', accent: '#F1C40F', background: '#312C32', card: '#4A3F4E', header: '#4A3F4E' }
    }
  },
  {
    name: 'Crepúsculo',
    colors: {
      light: { primary: '#483D8B', accent: '#FFA07A', background: '#EAE8FF', card: '#FFFFFF', header: '#FFFFFF' },
      dark: { primary: '#9370DB', accent: '#FFA07A', background: '#191937', card: '#2D2D57', header: '#2D2D57' }
    }
  },
  {
    name: 'Minimalista',
    colors: {
      light: { primary: '#333333', accent: '#333333', background: '#F5F5F5', card: '#FFFFFF', header: '#FFFFFF' },
      dark: { primary: '#FFFFFF', accent: '#FFFFFF', background: '#121212', card: '#1E1E1E', header: '#1E1E1E' }
    }
  }
];

const defaultExampleRates: PaymentRates = {
  'Débito': '1.99',
  'Pix': '0.99',
  'Crédito': [
    '2.99', '4.59', '5.99', '7.89', '9.29', '10.99',
    '12.59', '14.09', '15.89', '17.49', '19.99', '21.99'
  ],
};


export default function ConfiguracoesPage() {
  const { resolvedTheme } = useTheme();
  const { toast } = useToast();
  const { ownerPin, setOwnerPin } = useSellerMode();
  const { user } = useUser();
  const { isTourActive, startTour, stopTour, resetTour } = useTour();
  const [mounted, setMounted] = useState(false);

  const isDark = useMemo(() => resolvedTheme?.includes('dark'), [resolvedTheme]);

  const [activeTheme, setActiveTheme] = useState('Padrão');
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [accentColor, setAccentColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [cardColor, setCardColor] = useState('#000000');
  const [headerColor, setHeaderColor] = useState('#000000');

  const [currentPin, setCurrentPin] = useState(ownerPin);
  const [showPin, setShowPin] = useState(false);
  
  const [paymentRates, setPaymentRates] = useState<PaymentRates>({});
  
  const [customLogoSvg, setCustomLogoSvg] = useState<string>('');
  const [logoPreviewKey, setLogoPreviewKey] = useState(0);
  
  // Receipt information states
  const [companyName, setCompanyName] = useState('');
  const [companyCnpj, setCompanyCnpj] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');

  // Load settings from database
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (!mounted || !user) return;
    
    const loadSettings = async () => {
      try {
        const settings = await apiRequest<any>('settings');
        
        // Load payment rates
        if (settings.paymentRates) {
          setPaymentRates(JSON.parse(settings.paymentRates));
        } else {
          setPaymentRates(defaultExampleRates);
        }
        
        // Load custom logo
        if (settings.customLogoSvg) {
          setCustomLogoSvg(settings.customLogoSvg);
        }
        
        // Load receipt information
        if (settings.companyName) setCompanyName(settings.companyName);
        if (settings.companyCnpj) setCompanyCnpj(settings.companyCnpj);
        if (settings.companyPhone) setCompanyPhone(settings.companyPhone);
        if (settings.companyAddress) setCompanyAddress(settings.companyAddress);
        
        // Load theme colors based on mode
        if (isDark) {
          setActiveTheme(settings.themeNameDark || 'Padrão');
          
          if (settings.themeNameDark === 'Personalizado') {
            if (settings.primaryColorDark) setPrimaryColor(settings.primaryColorDark);
            if (settings.accentColorDark) setAccentColor(settings.accentColorDark);
            if (settings.backgroundColorDark) setBackgroundColor(settings.backgroundColorDark);
            if (settings.cardColorDark) setCardColor(settings.cardColorDark);
            if (settings.headerColorDark) setHeaderColor(settings.headerColorDark);
          } else {
            const theme = themes.find(t => t.name === settings.themeNameDark);
            if (theme) {
              const themeColors = theme.colors.dark;
              setPrimaryColor(themeColors.primary);
              setAccentColor(themeColors.accent);
              setBackgroundColor(themeColors.background);
              setCardColor(themeColors.card);
              setHeaderColor(themeColors.header);
            }
          }
        } else {
          setActiveTheme(settings.themeNameLight || 'Padrão');
          
          if (settings.themeNameLight === 'Personalizado') {
            if (settings.primaryColorLight) setPrimaryColor(settings.primaryColorLight);
            if (settings.accentColorLight) setAccentColor(settings.accentColorLight);
            if (settings.backgroundColorLight) setBackgroundColor(settings.backgroundColorLight);
            if (settings.cardColorLight) setCardColor(settings.cardColorLight);
            if (settings.headerColorLight) setHeaderColor(settings.headerColorLight);
          } else {
            const theme = themes.find(t => t.name === settings.themeNameLight);
            if (theme) {
              const themeColors = theme.colors.light;
              setPrimaryColor(themeColors.primary);
              setAccentColor(themeColors.accent);
              setBackgroundColor(themeColors.background);
              setCardColor(themeColors.card);
              setHeaderColor(themeColors.header);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        setPaymentRates(defaultExampleRates);
      }
    };
    
    loadSettings();
  }, [mounted, user, isDark]);

  // Apply colors to CSS variables and save to database
  useEffect(() => {
    if (!mounted || !user) return;

    const root = document.documentElement;
    
    const applyColor = (cssVar: string, color: string) => {
      const hslColor = hexToHsl(color);
      if (hslColor) {
        root.style.setProperty(cssVar, hslColor);
        
        const foregroundHsl = getContrastingTextColor(color);
        if (cssVar === '--primary') {
            root.style.setProperty('--primary-foreground', foregroundHsl);
            root.style.setProperty('--sidebar', hslColor);
            root.style.setProperty('--sidebar-foreground', foregroundHsl);
            root.style.setProperty('--sidebar-accent', hslColor);
            root.style.setProperty('--sidebar-accent-foreground', foregroundHsl);
            root.style.setProperty('--sidebar-border', hslColor);
            root.style.setProperty('--sidebar-ring', hslColor);
        } else if (cssVar === '--accent') {
            root.style.setProperty('--accent-foreground', foregroundHsl);
            root.style.setProperty('--chart-1', hslColor);
        } else if (cssVar === '--background') {
            root.style.setProperty('--foreground', foregroundHsl);
        } else if (cssVar === '--card') {
            root.style.setProperty('--card-foreground', foregroundHsl);
        } else if (cssVar === '--header') {
            root.style.setProperty('--header-foreground', foregroundHsl);
        }
      }
    };
    
    applyColor('--primary', primaryColor);
    applyColor('--accent', accentColor);
    applyColor('--background', backgroundColor);
    applyColor('--card', cardColor);
    applyColor('--header', headerColor);

    // Save to database
    const saveColors = async () => {
      try {
        const updateData = isDark ? {
          themeNameDark: activeTheme,
          primaryColorDark: primaryColor,
          accentColorDark: accentColor,
          backgroundColorDark: backgroundColor,
          cardColorDark: cardColor,
          headerColorDark: headerColor,
        } : {
          themeNameLight: activeTheme,
          primaryColorLight: primaryColor,
          accentColorLight: accentColor,
          backgroundColorLight: backgroundColor,
          cardColorLight: cardColor,
          headerColorLight: headerColor,
        };
        
        await apiRequest('settings', {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
      } catch (error) {
        console.error("Failed to save colors:", error);
      }
    };

    saveColors();
  }, [primaryColor, accentColor, backgroundColor, cardColor, headerColor, mounted, isDark, activeTheme, user]);

  const handleColorChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (color: string) => {
    setter(color);
    setActiveTheme('Personalizado');
  };

  const handleThemeSelect = (themeName: string) => {
    setActiveTheme(themeName);
    if (themeName !== 'Personalizado') {
      const theme = themes.find(t => t.name === themeName);
      if (theme) {
        const themeColors = theme.colors[isDark ? 'dark' : 'light'];
        setPrimaryColor(themeColors.primary);
        setAccentColor(themeColors.accent);
        setBackgroundColor(themeColors.background);
        setCardColor(themeColors.card);
        setHeaderColor(themeColors.header);
      }
    }
  };

  const handleSavePin = () => {
    if (currentPin.length === 4 && /^\d{4}$/.test(currentPin)) {
      setOwnerPin(currentPin);
      toast({
        title: 'PIN do Proprietário Salvo!',
        description: 'Seu novo PIN foi salvo com sucesso.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'PIN Inválido',
        description: 'O PIN deve conter exatamente 4 dígitos numéricos.',
      });
    }
  };
  
  const handleSaveLogo = async () => {
    try {
      await apiRequest('settings', {
        method: 'PUT',
        body: JSON.stringify({ customLogoSvg }),
      });
      
      setLogoPreviewKey(prev => prev + 1);
      window.dispatchEvent(new CustomEvent('logo-updated'));

      toast({
        title: 'Logo Salva!',
        description: 'A nova logo foi salva e aplicada.',
      });
    } catch (error) {
      console.error("Failed to save logo:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar a logo. Verifique se o código é válido.',
      });
    }
  };
  
  const handleDeleteLogo = async () => {
    try {
      await apiRequest('settings', {
        method: 'PUT',
        body: JSON.stringify({ customLogoSvg: null }),
      });
      
      setCustomLogoSvg('');
      setLogoPreviewKey(prev => prev + 1);
      window.dispatchEvent(new CustomEvent('logo-updated'));
      
      toast({
        title: 'Logo Removida!',
        description: 'A logo personalizada foi removida.',
      });
    } catch (error) {
      console.error("Failed to delete logo:", error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível remover a logo.',
      });
    }
  };


  const sanitizeValue = (value: string) => {
    return value.replace(/[^0-9.,]/g, '').replace(',', '.').replace(/(\..*)\./g, '$1');
  }

  const handleRateChange = (method: string, value: string) => {
    const sanitizedValue = sanitizeValue(value);
    setPaymentRates(prev => ({ ...prev, [method]: sanitizedValue }));
  };

  const handleCreditRateChange = (index: number, value: string) => {
    const sanitizedValue = sanitizeValue(value);
    setPaymentRates(prev => {
      const newRates = { ...prev };
      const creditRates = Array.isArray(newRates['Crédito']) ? [...newRates['Crédito']] : Array(12).fill('0');
      creditRates[index] = sanitizedValue;
      newRates['Crédito'] = creditRates;
      return newRates;
    });
  };

  const handleSaveRates = async () => {
    try {
      await apiRequest('settings', {
        method: 'PUT',
        body: JSON.stringify({ paymentRates: JSON.stringify(paymentRates) }),
      });
      
      toast({
        title: 'Taxas Salvas!',
        description: 'As taxas dos meios de pagamento foram atualizadas.',
      });
    } catch (error) {
      console.error("Failed to save payment rates:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar as taxas. Tente novamente.',
      });
    }
  };
  
  const handleSaveReceipt = async () => {
    try {
      await apiRequest('settings', {
        method: 'PUT',
        body: JSON.stringify({
          companyName,
          companyCnpj,
          companyPhone,
          companyAddress,
        }),
      });
      
      toast({
        title: 'Informações Salvas!',
        description: 'As informações do recibo foram atualizadas.',
      });
    } catch (error) {
      console.error("Failed to save receipt info:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar as informações. Tente novamente.',
      });
    }
  };
  
  if (!mounted || !user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Personalize a aparência e a segurança da sua aplicação.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Accordion type="single" collapsible className="w-full">
            
            <AccordionItem value="logo">
              <AccordionTrigger className="px-6 hover:no-underline">
                <div>
                  <h3 className="text-lg font-semibold">Identidade Visual</h3>
                  <p className="text-sm text-muted-foreground">Personalize a logo da aplicação</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="custom-logo-svg">Código SVG da Logo</Label>
                        <Textarea
                          id="custom-logo-svg"
                          placeholder='<svg>...</svg>'
                          value={customLogoSvg}
                          onChange={(e) => setCustomLogoSvg(e.target.value)}
                          className="h-48 font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Pré-visualização da Logo</Label>
                      <div className="flex h-48 w-full items-center justify-center rounded-md border border-dashed bg-muted p-4">
                        <div className="h-10 text-primary">
                          <CustomLogo key={logoPreviewKey} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button onClick={handleDeleteLogo} variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remover Logo
                    </Button>
                    <Button onClick={handleSaveLogo}>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Logo
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="theme">
              <AccordionTrigger className="px-6 hover:no-underline">
                <div>
                  <h3 className="text-lg font-semibold">Aparência do Tema</h3>
                  <p className="text-sm text-muted-foreground">Escolha cores e tema personalizado</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-8">
           <div className="space-y-4">
              <h3 className="text-lg font-medium">Temas Predefinidos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {[...themes, { name: 'Personalizado' }].map((theme) => {
                  const currentTheme = themes.find(t => t.name === theme.name);
                  const colors = currentTheme ? currentTheme.colors[isDark ? 'dark' : 'light'] : null;

                  return (
                    <Button
                      key={theme.name}
                      variant={activeTheme === theme.name ? 'default' : 'outline'}
                      className="h-20 flex-col gap-2"
                      onClick={() => handleThemeSelect(theme.name)}
                    >
                      <div className="flex items-center gap-2">
                         {activeTheme === theme.name && <Check className="h-4 w-4" />}
                         <span>{theme.name}</span>
                      </div>
                      {colors && (
                        <div className="flex gap-1">
                          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: colors.primary, border: '1px solid hsl(var(--border))' }} />
                          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: colors.accent }} />
                          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: colors.background, border: '1px solid hsl(var(--border))' }} />
                        </div>
                      )}
                      {theme.name === 'Personalizado' && !colors && (
                        <div className="flex gap-1">
                           <div className="h-4 w-4 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500" />
                           <p className='text-xs'>Suas cores</p>
                        </div>
                      )}
                    </Button>
                  );
                })}
              </div>
           </div>

           <div className="space-y-4">
            <h3 className="text-lg font-medium">Cores Personalizadas</h3>
            <div className={cn("grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5", activeTheme !== 'Personalizado' && 'opacity-50 pointer-events-none')}>
              <div className="space-y-2">
                <Label>Cor Primária</Label>
                <ColorPicker color={primaryColor} onColorChange={handleColorChange(setPrimaryColor)} />
                <p className="text-xs text-muted-foreground">Botões e elementos principais.</p>
              </div>
              <div className="space-y-2">
                <Label>Cor de Destaque</Label>
                <ColorPicker color={accentColor} onColorChange={handleColorChange(setAccentColor)} />
                 <p className="text-xs text-muted-foreground">Alertas, foco e ênfase.</p>
              </div>
              <div className="space-y-2">
                <Label>Cor de Fundo</Label>
                <ColorPicker color={backgroundColor} onColorChange={handleColorChange(setBackgroundColor)} />
                 <p className="text-xs text-muted-foreground">Fundo principal da aplicação.</p>
              </div>
               <div className="space-y-2">
                <Label>Cor do Cartão</Label>
                <ColorPicker color={cardColor} onColorChange={handleColorChange(setCardColor)} />
                 <p className="text-xs text-muted-foreground">Fundo para cartões e painéis.</p>
              </div>
              <div className="space-y-2">
                <Label>Cor do Cabeçalho</Label>
                <ColorPicker color={headerColor} onColorChange={handleColorChange(setHeaderColor)} />
                 <p className="text-xs text-muted-foreground">Fundo do cabeçalho superior.</p>
              </div>
            </div>
          </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="security">
              <AccordionTrigger className="px-6 hover:no-underline">
                <div>
                  <h3 className="text-lg font-semibold">Operacional e Segurança</h3>
                  <p className="text-sm text-muted-foreground">PIN e configurações de segurança</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-8">
           <div className="space-y-2 max-w-sm">
             <Label htmlFor="owner-pin">PIN do Proprietário</Label>
             <div className="flex gap-2">
                <div className="relative flex-grow">
                    <Input 
                        id="owner-pin"
                        type={showPin ? 'text' : 'password'}
                        maxLength={4}
                        placeholder="••••"
                        value={currentPin}
                        onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                    />
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPin(!showPin)}
                    >
                        {showPin ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                    </Button>
                </div>
                <Button onClick={handleSavePin}>Salvar PIN</Button>
             </div>
             <p className="text-xs text-muted-foreground">
                Este PIN de 4 dígitos é necessário para sair do Modo Vendedor.
             </p>
           </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="receipt">
              <AccordionTrigger className="px-6 hover:no-underline">
                <div>
                  <h3 className="text-lg font-semibold">Informações do Recibo</h3>
                  <p className="text-sm text-muted-foreground">Dados da empresa para impressão</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Minha Empresa Ltda"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyCnpj">CNPJ</Label>
                  <Input
                    id="companyCnpj"
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={companyCnpj}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      const formatted = value
                        .replace(/(\d{2})(\d)/, '$1.$2')
                        .replace(/(\d{3})(\d)/, '$1.$2')
                        .replace(/(\d{3})(\d)/, '$1/$2')
                        .replace(/(\d{4})(\d)/, '$1-$2')
                        .slice(0, 18);
                      setCompanyCnpj(formatted);
                    }}
                    maxLength={18}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Telefone</Label>
                  <Input
                    id="companyPhone"
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={companyPhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      const formatted = value
                        .replace(/(\d{2})(\d)/, '($1) $2')
                        .replace(/(\d{5})(\d)/, '$1-$2')
                        .slice(0, 15);
                      setCompanyPhone(formatted);
                    }}
                    maxLength={15}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Endereço</Label>
                  <Textarea
                    id="companyAddress"
                    placeholder="Rua Exemplo, 123 - Bairro - Cidade/UF"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveReceipt}>Salvar Informações</Button>
              </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="payment-rates">
              <AccordionTrigger className="px-6 hover:no-underline">
                <div>
                  <h3 className="text-lg font-semibold">Taxas dos Meios de Pagamento</h3>
                  <p className="text-sm text-muted-foreground">Configure taxas e custos operacionais</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Insira as taxas percentuais cobradas por cada meio de pagamento. Elas serão consideradas como custo.
              </p>
              <Accordion type="single" collapsible className="w-full">
                {allPaymentMethods
                  .filter(method => method.value !== 'Dinheiro' && method.value !== 'Fiado')
                  .map(method => (
                  <AccordionItem value={method.value} key={method.value}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                         <method.icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold">{method.label}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {method.value === 'Crédito' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2">
                           {[...Array(12)].map((_, i) => {
                            const creditRates = Array.isArray(paymentRates['Crédito']) ? paymentRates['Crédito'] : Array(12).fill('0');
                             return (
                              <div key={i} className="space-y-1">
                                <Label htmlFor={`rate-credit-${i+1}`} className="text-sm font-normal">
                                  {i + 1}x
                                </Label>
                                <div className="relative">
                                  <Input
                                    id={`rate-credit-${i+1}`}
                                    type="text"
                                    value={creditRates[i] || ''}
                                    onChange={(e) => handleCreditRateChange(i, e.target.value)}
                                    placeholder="0,00"
                                    className="pl-3 pr-8"
                                  />
                                  <Percent className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="max-w-xs p-2">
                           <div className="relative">
                            <Input
                              id={`rate-${method.value}`}
                              type="text"
                              value={(paymentRates[method.value] as string) || ''}
                              onChange={(e) => handleRateChange(method.value, e.target.value)}
                              placeholder="0,00"
                              className="pl-3 pr-8"
                            />
                            <Percent className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveRates}>Salvar Taxas</Button>
              </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="tour">
              <AccordionTrigger className="px-6 hover:no-underline">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Guia Interativo
                  </h3>
                  <p className="text-sm text-muted-foreground">Controle o tour guiado do sistema</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    O guia interativo ajuda você a conhecer todas as funcionalidades do sistema. 
                    Você pode iniciar, pausar ou reiniciar o tour a qualquer momento.
                  </p>
                  
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      onClick={startTour} 
                      disabled={isTourActive}
                      variant="default"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Iniciar Guia
                    </Button>
                    
                    <Button 
                      onClick={stopTour} 
                      disabled={!isTourActive}
                      variant="outline"
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      Pausar Guia
                    </Button>
                    
                    <Button 
                      onClick={resetTour}
                      variant="secondary"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reiniciar do Início
                    </Button>
                  </div>

                  {isTourActive && (
                    <div className="rounded-md bg-primary/10 p-3 text-sm">
                      <p className="font-medium text-primary">
                        ℹ️ O guia está ativo no momento
                      </p>
                      <p className="text-muted-foreground mt-1">
                        Siga as instruções na tela ou clique em "Pausar Guia" para interromper.
                      </p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
