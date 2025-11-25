
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

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
import { useToast } from '@/hooks/use-toast';
import { CustomLogo } from '@/components/ui/custom-logo';
import { useUser } from '@/context/user-context';
import { useSellerMode } from '@/context/seller-mode-context';

const formSchema = z.object({
  email: z
    .string()
    .email({ message: 'Por favor, insira um endereço de e-mail válido.' }),
  password: z
    .string()
    .min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useUser();
  const { setProfileAuthenticated } = useSellerMode();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        // Buscar informações do usuário do Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${response.access_token}`,
          },
        });
        
        const userInfo = await userInfoResponse.json();
        
        // Criar ou fazer login do usuário no backend
        const loginResponse = await fetch('/api/auth/google-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
          }),
        });

        const data = await loginResponse.json();

        if (!loginResponse.ok) {
          throw new Error(data.error || 'Erro ao fazer login com Google');
        }

        // Login successful
        login({ email: data.user.email, name: data.user.name });

        toast({
          title: 'Login com Google bem-sucedido',
          description: 'Redirecionando para o painel...',
        });

        router.push('/dashboard');
      } catch (error) {
        toast({
          title: 'Erro no login com Google',
          description: error instanceof Error ? error.message : 'Erro ao fazer login',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Falha ao fazer login com Google',
        variant: 'destructive',
      });
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Before logging in, ensure previous user's auth state is cleared
      setProfileAuthenticated(false);
      
      // Call login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login');
      }

      // Login successful
      login({ email: data.user.email, name: data.user.name });

      toast({
        title: 'Login bem-sucedido',
        description: 'Redirecionando para o painel...',
      });
      
      // Redirect to the dashboard, which will then handle showing the profile selector
      router.push('/dashboard');
    } catch (error) {
      toast({
        title: 'Erro no login',
        description: error instanceof Error ? error.message : 'Email ou senha incorretos',
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
                Bem-vindo de volta!
              </CardTitle>
              <CardDescription>
                Insira suas credenciais para acessar seu painel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="exemplo@gmail.com"
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
                        <div className="flex items-center justify-between">
                          <FormLabel>Senha</FormLabel>
                          <Link
                            href="#"
                            className="text-sm font-medium hover:underline text-card-foreground"
                          >
                            Esqueceu a senha?
                          </Link>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="pr-10"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              tabIndex={-1}
                            >
                              {showPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Entrar
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Ou continue com
                  </span>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => googleLogin()}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar com Google
              </Button>
              <div className="mt-4 text-center text-sm text-card-foreground">
                  Não tem uma conta?{' '}
                  <Link href="/register" className="underline">
                      Registrar-se
                  </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </>
  );
}
