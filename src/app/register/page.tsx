'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { useToast } from '@/hooks/use-toast';
import { CustomLogo } from '@/components/ui/custom-logo';
import { useUser } from '@/context/user-context';
import { apiRequest } from '@/lib/api';
import { getReferralCode } from '@/components/referral-tracker';
import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const formSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  email: z
    .string()
    .email({ message: 'Por favor, insira um endereço de e-mail válido.' }),
  password: z
    .string()
    .min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  confirmPassword: z
    .string()
    .min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useUser();
  const [detectedReferralCode, setDetectedReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // Check for referral code on mount
    const code = getReferralCode();
    if (code) {
      setDetectedReferralCode(code);
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Get referral code from cookie if exists
      const referralCode = getReferralCode();

      // Create user in database
      const user = await apiRequest<{ id: string; email: string; name: string }>('user', {
        method: 'POST',
        body: JSON.stringify({
          email: values.email,
          name: values.name,
          password: values.password,
          referredBy: referralCode || undefined,
        }),
      });

      login({ email: user.email, name: user.name });

      toast({
        title: 'Conta criada com sucesso!',
        description: 'Redirecionando para o painel...',
      });

      router.push('/dashboard');
    } catch (error) {
      toast({
        title: 'Erro ao criar conta',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      });
    }
  }

  return (
    <>
      <main 
          className="bg-login-background flex flex-1 items-center justify-center p-4 sm:p-6"
      >
        <div className="absolute inset-0 bg-black/50 -z-10" />
        <div className="w-full max-w-sm">
          <Card className="shadow-lg sm:shadow-2xl">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-6 h-10 text-primary">
                <CustomLogo />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                Criar nova conta
              </CardTitle>
              <CardDescription>
                Preencha os dados abaixo para começar
              </CardDescription>
              {detectedReferralCode && (
                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Código de indicação detectado: <strong>{detectedReferralCode}</strong>
                  </AlertDescription>
                </Alert>
              )}
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="seu@email.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar senha</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Criar conta
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Fazer login
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </>
  );
}
