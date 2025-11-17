# Credenciais de Teste

## Usuário Admin (criado pelo seed)

- **Email:** admin@localhost
- **Senha:** 123456

## Funcionalidades de Autenticação

### Registro de Novo Usuário

1. Acesse: http://localhost:9002/register
2. Preencha o formulário com:
   - Nome (mínimo 3 caracteres)
   - Email (formato válido)
   - Senha (mínimo 6 caracteres)
   - Confirmar senha
3. A senha será armazenada de forma segura (hash bcrypt)

### Login

1. Acesse: http://localhost:9002/login
2. Use as credenciais acima ou uma conta que você criou
3. A senha é validada com hash bcrypt
4. Após login, você será redirecionado para o dashboard

## Segurança

- ✅ Senhas armazenadas com hash bcrypt (10 rounds)
- ✅ Validação de email único
- ✅ Validação de senha mínima (6 caracteres)
- ✅ Confirmação de senha no registro
- ✅ Mensagens de erro genéricas (não revela se email existe)
- ✅ Senha nunca retornada em respostas da API

## API Endpoints

### POST /api/auth/login

```json
{
  "email": "admin@localhost",
  "password": "123456"
}
```

### POST /api/user (Registro)

```json
{
  "name": "Seu Nome",
  "email": "seu@email.com",
  "password": "suasenha"
}
```
