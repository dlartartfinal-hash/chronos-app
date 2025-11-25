
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
              <Button variant="outline" className="w-full">
                <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                  <path
                    fill="currentColor"
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.63-4.5 1.63-5.42 0-9.82-4.4-9.82-9.82s4.4-9.82 9.82-9.82c3.04 0 5.2.83 6.62 2.35l-2.32 2.32c-.86-.82-2.1-1.4-3.5-1.4-4.18 0-7.58 3.4-7.58 7.58s3.4 7.58 7.58 7.58c2.48 0 3.98-1.12 4.98-2.18.83-.88 1.32-2.02 1.54-3.66H12.48z"
                  ></path>
                </svg>
                Google
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
