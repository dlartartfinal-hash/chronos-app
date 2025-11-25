# Rodando o projeto localmente (guia rápido)

Siga estes passos para preparar e executar a aplicação localmente no Windows (PowerShell):

1. Instale Node.js LTS

- Baixe e instale a versão LTS em https://nodejs.org/ e garanta que `node` e `npm` estejam disponíveis no PATH.
  Verifique:
  ```powershell
  node -v
  npm -v
  ```

2. Copie as variáveis de ambiente

- Copie o arquivo de exemplo `.env.example` para `.env.local` e preencha com suas credenciais (DATABASE_URL, STRIPE keys, NEXTAUTH_SECRET etc.).
  ```powershell
  copy .\.env.example .\.env.local
  # editar .env.local no editor e preencher valores
  ```

3. Banco de dados

- Se usar Postgres local, crie o banco e ajuste `DATABASE_URL` no `.env.local`.
- Alternativamente, use o `docker-compose.yml` existente para subir um container Postgres:
  ```powershell
  docker-compose up -d
  ```

4. Executar script de setup local (automatiza npm install, prisma generate, migrations e seed)

- Abra PowerShell na raiz do projeto e execute (recomendado executar como Administrador):
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\setup-local.ps1
  ```

5. Com o servidor em execução

- Acesse `http://localhost:3000` (ou a porta configurada).

6. Comandos úteis

- Rodar somente instalação de dependências:
  ```powershell
  npm install
  ```
- Gerar Prisma Client:
  ```powershell
  npx prisma generate
  ```
- Aplicar migrations:
  ```powershell
  npx prisma migrate dev --name init
  ```
- Seed (se existir):
  ```powershell
  npm run prisma:seed
  ```
- Rodar dev:
  ```powershell
  npm run dev
  ```

7. Segurança

- Não comite `.env.local` com segredos. Caso algum segredo tenha vazado, regenere/rotacione as chaves (Stripe, tokens, etc.).

8. Se algo falhar

- Cole a saída do terminal aqui (ou salve em arquivo) e eu te ajudo a depurar.
