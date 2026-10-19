# MaiaShoes

Projeto de estudo e portfólio: loja virtual e painel administrativo de calçados e bolsas.

**Estado atual:** painel e vitrine consultam os produtos reais do PostgreSQL por meio da API NestJS. O painel permite cadastrar nome, descrição, preço e escolher uma das 76 fotos importadas. Também é possível alterar a foto de um produto existente. Categorias e login ainda serão implementados. As etapas abaixo registram a evolução do projeto.

## Etapa 1 — a interface

O front-end usa Next.js, React, TypeScript e CSS. No terminal da pasta MaiaShoes:

```powershell
cd frontend
npm run dev
```

Abra http://localhost:3000. Para parar, pressione Ctrl+C no terminal.

### Primeiros arquivos

- `frontend/src/app/page.tsx`: página inicial, produtos de exemplo e filtro por categoria.
- `frontend/src/app/globals.css`: cores, fontes, espaçamentos e adaptação para celular.
- `frontend/src/app/layout.tsx`: estrutura compartilhada, idioma e título.
- `frontend/public/logo-maia.jpg`: logo enviada, ainda em baixa resolução.

React monta a interface com componentes. TypeScript ajuda a verificar os tipos dos dados. Next.js organiza e executa a aplicação. CSS define a aparência.

O filtro usa `useState` para guardar a categoria selecionada e `filter` para selecionar os produtos. Ainda não existem carrinho, login, pagamentos, API ou conexão ao banco. As ilustrações e os preços são exemplos.

### Exercício inicial

Mude o nome de um produto em `page.tsx`, salve e observe a atualização. Depois altere `--background` em `globals.css` e veja onde a variável é usada.

### Próximas etapas

1. Separar componentes e adicionar fotos reais.
2. Criar a API NestJS e conectar ao PostgreSQL com Prisma.
3. Cadastrar produtos no painel e exibi-los na loja.
4. Adicionar estoque, autenticação, carrinho e pedidos.

## Etapa 2 — primeiro servidor

O back-end fica em `backend/`, usando NestJS e TypeScript. Ele receberá pedidos do front-end, aplicará as regras da loja e, em uma próxima etapa, consultará o PostgreSQL.

Abra um segundo terminal na pasta MaiaShoes:

```powershell
cd backend
npm run start:dev
```

Com o servidor rodando, abra http://localhost:3001/api/health. A resposta JSON esperada é:

```json
{
  "status": "ok",
  "application": "MaiaShoes API"
}
```

O front-end usa a porta 3000 e o back-end usa a 3001. Uma porta identifica qual aplicação deve receber a conexão no computador.

### Como a primeira rota funciona

1. O navegador envia uma requisição `GET /api/health`. GET pede uma informação.
2. `main.ts` inicia o servidor e configura o prefixo `/api`.
3. `app.controller.ts` relaciona `/health` à função responsável por responder.
4. `app.service.ts` prepara o objeto de resposta, que o NestJS transforma em JSON.
5. `app.module.ts` registra o controller e o service para que o NestJS consiga conectá-los.

Essa rota confirma que o servidor responde. Ela ainda não verifica nem acessa o banco de dados.

### Exercício

Em `backend/src/app.service.ts`, altere o valor de `application`, salve e atualize o endereço no navegador. Observe como a resposta muda sem editar a página da loja.

Para verificar a compilação, execute `npm run build` dentro de `backend/`. O teste HTTP da rota é executado com `npm run test:e2e`.

## Etapa 3 — PostgreSQL e Prisma

O banco local `maiashoes` agora possui a tabela `products`. O usuário `maiashoes_app` pertence ao projeto, sem privilégios de administrador do PostgreSQL. As senhas ficam em `backend/.env`, ignorado pelo Git.

### Estrutura de um produto

| Campo | Significado |
| --- | --- |
| `id` | Número único gerado pelo banco |
| `name` | Nome de até 150 caracteres |
| `description` | Descrição opcional |
| `price` | Preço decimal com duas casas, por exemplo `189.90` |
| `createdAt` | Data e hora de criação |
| `updatedAt` | Data e hora da última alteração pelo Prisma |

`backend/prisma/schema.prisma` descreve os dados. A pasta `backend/prisma/migrations` contém o SQL que criou a tabela. Uma migração registra uma alteração na estrutura do banco para ser reproduzida em outro ambiente.

`backend/src/database/prisma.service.ts` mantém uma conexão compartilhada pela API. O driver `pg` faz a comunicação com o PostgreSQL, conforme a [configuração do Prisma 7](https://www.prisma.io/docs/orm/v7/prisma-client/setup-and-configuration/introduction).

Com a API iniciada, abra http://127.0.0.1:3001/api/health/database. O campo `products` informa quantos produtos estão salvos. Inicialmente será zero; o catálogo do front-end ainda usa os dados de exemplo.

```json
{ "status": "ok", "database": "postgresql", "products": 0 }
```

### Comandos do banco (dentro de backend)

```powershell
npm run db:generate
npm run db:status
```

O primeiro gera o código de acesso ao banco; o segundo informa as migrações aplicadas. Após alterar a estrutura em `schema.prisma`, use `npm run db:migrate -- --name nome_da_alteracao` e depois `npm run db:generate`.

O banco auxiliar `maiashoes_shadow` é usado apenas na preparação das migrações locais. Nunca deve receber os dados reais da loja nem apontar para o mesmo banco da aplicação.

Em uma nova instalação local, copie `backend/.env.example` para `backend/.env`, configure os bancos e a senha e aplique as migrações. Neste computador, `npm run db:setup:local` prepara os bancos usando o arquivo administrativo `.env.postgres.local` na raiz; esse script é apenas para desenvolvimento e não altera senhas de usuários existentes.

### Exercício de leitura

Abra `schema.prisma` e identifique o campo opcional, o identificador e o preço. Compare com `migration.sql`: `model Product` virou a tabela `products` por causa de `@@map("products")`. Não é preciso alterar os arquivos para este exercício.

Os testes HTTP usam um substituto do banco para verificar as respostas de sucesso e falha sem depender do PostgreSQL. A rota `/api/health/database` acessa o banco real. O próximo passo será criar as rotas para cadastrar e listar produtos.

## Etapa 4 — cadastrar e listar produtos

Agora `GET /api/products` lista o banco real e `POST /api/products` cadastra produtos. O [guia do back-end](backend/README.md) traz o exemplo de cadastro pelo PowerShell.

Em `backend/src/products/`, acompanhe o caminho dos dados:

1. `products.controller.ts` recebe GET e POST.
2. `dto/create-product.dto.ts` define os campos e as regras. DTO significa objeto de transferência de dados.
3. `products.service.ts` solicita ao Prisma a gravação ou consulta.
4. PostgreSQL mantém o produto salvo mesmo quando o servidor é reiniciado.

O preço é enviado como texto decimal, por exemplo `"189.90"`. Dados inválidos recebem HTTP 400; um cadastro válido recebe HTTP 201. A validação é configurada em `backend/src/configure-app.ts`, compartilhada com os testes.

### Exercício

Com a API rodando, abra http://127.0.0.1:3001/api/products. Identifique na resposta o ID, o nome e o preço do produto. A barra de endereço faz uma consulta GET; para cadastrar, é necessário enviar POST com o corpo JSON, como no guia do back-end. Cada POST válido cria um registro novo.

Os testes HTTP verificam a validação e a resposta usando um substituto do Prisma. O cadastro e a consulta ao banco real também foram conferidos separadamente. O catálogo da loja ainda usa os exemplos; a conexão com as telas será feita na próxima etapa.

## Etapa 5 — formulário do painel

Abra http://127.0.0.1:3000/admin. O painel permite cadastrar nome, descrição opcional e preço, além de consultar os produtos salvos. Login, fotos e categorias serão acrescentados depois. Esta versão é para estudo no computador local.

Mantenha os dois servidores rodando em terminais separados:

```powershell
# Terminal 1, na raiz do projeto
cd backend
npm run start:dev
```

```powershell
# Terminal 2, na raiz do projeto
cd frontend
npm run dev
```

### Caminho do cadastro

Formulário → `fetch` → Next.js → API NestJS → Prisma → PostgreSQL.

- `frontend/src/app/admin/page.tsx`: estrutura e cabeçalho do painel.
- `frontend/src/app/admin/products-panel.tsx`: formulário, estados de carregamento, mensagens e lista.
- `frontend/src/app/admin/admin.module.css`: estilos exclusivos do painel.
- `frontend/src/lib/products-api.ts`: requisições GET e POST e tratamento das respostas.
- `frontend/next.config.ts`: encaminha `/api/products` do front-end para o back-end na porta 3001. Não contém senhas.

O preço `189,90` preenchido na tela é convertido para `"189.90"` antes de ser enviado. O navegador faz verificações básicas e o servidor valida novamente antes de gravar. Após salvar, a lista recebe o produto devolvido pela API. Recarregar a página faz uma nova consulta ao banco.

### Exercício

Cadastre um produto de exemplo pelo painel, confira a mensagem de sucesso e recarregue a página. O produto deve continuar na lista. Compare o nome e o preço com http://127.0.0.1:3001/api/products. Cada cadastro cria um novo registro, mesmo quando o nome é igual.

A loja em `/` continua usando os exemplos visuais. A próxima etapa será conectar a vitrine aos produtos reais.

## Etapa 6 — vitrine com produtos reais

A loja em http://127.0.0.1:3000 agora consulta `GET /api/products`, a mesma rota usada pelo painel. Os produtos fixos do código foram removidos. Nome, descrição e preço dos cartões vêm do PostgreSQL; o preço é formatado como moeda brasileira apenas para exibição.

O componente `frontend/src/app/components/product-catalog.tsx` usa `useEffect` para consultar os dados ao abrir a página e `useState` para guardar produtos, carregamento e erro. O arquivo `frontend/src/lib/products-api.ts` continua concentrando a consulta com `fetch` e sem cache.

A vitrine mostra um aviso enquanto carrega, uma mensagem quando não há produtos e um botão para tentar novamente se a API estiver indisponível. As imagens dos cartões são provisórias, identificadas como “Foto em breve”. Os filtros de categoria retornam quando esse campo for criado no cadastro; não deduzimos categorias a partir do nome.

### Exercício do fluxo completo

1. Abra o painel em `/admin` e cadastre um produto.
2. Clique em “Ver loja” e encontre o produto na coleção.
3. Se a loja já estiver aberta em outra aba, recarregue-a para buscar os dados atuais.
4. Compare com http://127.0.0.1:3001/api/products: a API retorna `"189.90"`, enquanto a tela exibe `R$ 189,90`.

O cadastro fica no banco; não é necessário editar `page.tsx` para adicionar produtos à vitrine. Os dois servidores precisam estar rodando. O painel ainda é uma versão local sem autenticação.

## Etapa 7 — fotos enviadas em ZIP

Foram importadas 76 fotos de `Produtos.zip`, sem edição, em `frontend/public/products/`. Os 20 vídeos continuam no arquivo ZIP original. O arquivo `frontend/src/data/product-images.json` relaciona cada número de foto ao nome original, às dimensões e ao caminho público.

No cadastro de `/admin`, abra “Ver as 76 fotos disponíveis”, selecione uma miniatura e salve o produto. Para um produto existente, abra “Alterar foto de …”, escolha a imagem e clique em “Salvar foto”. Remover a seleção e salvar remove apenas a associação da foto; o produto e o arquivo original continuam preservados.

Como os nomes dos arquivos são do WhatsApp, a associação entre foto e produto é feita visualmente por você. Não atribuímos modelos ou preços às imagens por suposição. Nesta etapa há uma foto principal por produto.

### Como funciona

- O banco recebeu `imageUrl String?`: o ponto de interrogação significa que o produto pode continuar sem foto.
- `POST /api/products` aceita `imageUrl` opcional.
- `PATCH /api/products/:id/image` altera somente a foto. `null` remove a associação.
- A API aceita apenas caminhos da lista importada. URLs externas e caminhos desconhecidos são rejeitados.
- `photo-picker.tsx` mostra a galeria; `product-photo-editor.tsx` salva a troca no produto existente.
- A vitrine usa `next/image` e preserva a proporção, sem cortar a foto. Produtos sem imagem continuam com “Foto em breve”.

O script `scripts/import-product-photos.ps1` gerou a pasta de imagens, o manifesto e a lista permitida da API. Ele recusa sobrescrever imagens existentes; não é um upload genérico. Novos envios e múltiplas fotos por produto ficam para outra etapa.

### Exercício

Escolha a foto que corresponde ao seu Tênis Nike, salve e recarregue a loja. Veja como o campo `imageUrl` da resposta de `/api/products` aponta para o arquivo e não contém a própria imagem.

A etapa de categorias foi interrompida para receber as fotos e ainda será retomada.

## Credenciais

Arquivos `.env*` são ignorados pelo Git, exceto `.env.example`. Não publique senhas nem use o administrador do PostgreSQL no navegador. Criaremos um usuário próprio para o back-end.
