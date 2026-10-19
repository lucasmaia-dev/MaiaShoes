# MaiaShoes API

Primeira etapa do back-end, feita com NestJS e TypeScript.

## Executar

```powershell
npm install
npm run start:dev
```

Abra http://127.0.0.1:3001/api/health para ver a resposta JSON.

- `src/main.ts`: inicia o servidor local na porta 3001 e define o prefixo `/api`.
- `src/app.module.ts`: registra as partes da aplicação.
- `src/app.controller.ts`: recebe a requisição `GET /api/health`.
- `src/app.service.ts`: prepara os dados da resposta.

A rota `/api/health` confirma que a API responde. Para conferir o PostgreSQL e a tabela de produtos, use http://127.0.0.1:3001/api/health/database.

## Banco de dados

A conexão é lida de `.env`, com o formato documentado em `.env.example`. O banco principal é `maiashoes`; `maiashoes_shadow` é exclusivo para as migrações locais. As senhas nunca vão para o front-end.

- `prisma/schema.prisma`: modelo Product, incluindo preço decimal.
- `prisma/migrations/`: histórico SQL de alterações.
- `src/database/prisma.service.ts`: conexão compartilhada e contagem dos produtos.
- `src/database/database.controller.ts`: rota de verificação do banco.

Após instalar as dependências e configurar `.env`, execute:

```powershell
npm run db:migrate
npm run db:generate
```

O comando `npm run db:status` permite consultar as migrações aplicadas. No computador de desenvolvimento original, `npm run db:setup:local` cria o usuário e os bancos usando o arquivo administrativo fora de `backend/`. Ele não é um script para produção.

O código em `src/generated/prisma` é gerado automaticamente e ignorado pelo Git. `npm run build` o gera antes de compilar. Antes de `start:dev` em uma nova instalação, execute `npm run db:generate`.

## Cadastro e listagem de produtos

| Método | Rota | Resultado |
| --- | --- | --- |
| GET | `/api/products` | Lista os produtos salvos, do mais recente para o mais antigo |
| POST | `/api/products` | Valida e salva um produto; retorna HTTP 201 |

Exemplo de corpo JSON para POST:

```json
{ "name": "Tênis Essencial", "description": "Produto de exemplo para estudo.", "price": "189.90" }
```

O preço é texto decimal com ponto, inclusive na resposta. Isso preserva os centavos. Nomes vazios, preços negativos, mais de duas casas decimais e campos desconhecidos recebem HTTP 400, sem gravar no banco. Nome e preço são obrigatórios; descrição é opcional.

O controller recebe a requisição, o DTO descreve os dados permitidos e suas regras, o service organiza a operação e o Prisma salva ou consulta no PostgreSQL. A configuração compartilhada em `src/configure-app.ts` aplica a validação em todas as rotas.

Para cadastrar pelo PowerShell, com a API em execução:

```powershell
$produto = @{
  name = 'Tênis Essencial'
  description = 'Produto de exemplo para estudo.'
  price = '189.90'
} | ConvertTo-Json
Invoke-RestMethod -Uri 'http://127.0.0.1:3001/api/products' -Method Post -ContentType 'application/json; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes($produto))
```

Cada POST válido cria um novo registro. Para apenas consultar, abra http://127.0.0.1:3001/api/products ou use `Invoke-RestMethod` com esse endereço, sem `-Method Post`.

A API continua restrita ao computador local. As rotas de escrita de produtos exigem uma sessão de administrador e o cabeçalho `X-MaiaShoes-Request: 1`. A vitrine e o painel consultam os produtos reais do banco. Os exemplos de escrita pelo terminal exigem também o cookie recebido no login; para praticar o cadastro, use o painel autenticado.

## Foto principal

`POST /api/products` aceita `imageUrl` opcional, por exemplo `/products/foto-001.jpeg`. `PATCH /api/products/:id/image` recebe `{ "imageUrl": "/products/foto-001.jpeg" }` para trocar a foto ou `{ "imageUrl": null }` para remover a associação.

São aceitos apenas os caminhos em `src/products/product-images.ts`, gerados a partir da importação do ZIP. A API rejeita caminhos desconhecidos e devolve 404 para produtos inexistentes. A migração `add_product_image` adiciona o campo opcional sem modificar os registros antigos.

## Categorias

Os valores aceitos são `TENIS`, `BOLSAS` e `SEM_CATEGORIA`. O campo `category` é retornado em GET e pode ser enviado no POST. Se for omitido por um cliente antigo, o banco usa `SEM_CATEGORIA`; `null` e valores fora da lista recebem HTTP 400.

`PATCH /api/products/:id/category` recebe, por exemplo, `{ "category": "TENIS" }` e altera apenas a categoria. O campo é obrigatório nessa rota. Produtos inexistentes recebem 404.

A migração `add_product_category` adiciona um enum e uma coluna com valor padrão. Os produtos anteriores são preservados como `SEM_CATEGORIA`, sem inferência pelo nome ou pela foto.

## Autenticação

As rotas `/api/auth/register`, `/api/auth/login`, `/api/auth/me` e `/api/auth/logout` fazem cadastro de cliente, login, consulta da sessão e logout. O cadastro recebe nome, e-mail e senha; o login recebe `username` (e-mail ou usuário existente) e `password`. Novas senhas exigem 12 a 128 caracteres, maiúscula, número e símbolo. Sessões são armazenadas por hash do token no banco, e senhas usam scrypt com salt individual. As rotas `/api/auth/google/status`, `/start` e `/callback` preparam o login Google; veja [configuração OAuth](../docs/AUTENTICACAO.md#entrar-com-google).

Para criar o primeiro administrador, copie `.env.admin.example` para `.env.admin.local`, preencha os dados locais e execute `npm run build` e `npm run admin:create`. Nenhuma senha padrão é publicada. Os testes HTTP de autenticação usam os guards reais; os de produtos substituem os guards para isolar suas validações.

Mais detalhes e exemplos estão em `docs/AUTENTICACAO.md` na raiz.

## Comandos de verificação

```powershell
npm run build
npm test
npm run test:e2e
```

Para um primeiro exercício, altere `application` em `app.service.ts`, salve e atualize o navegador.
