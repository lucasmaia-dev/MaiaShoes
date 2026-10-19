# MaiaShoes — front-end

Next.js, React, TypeScript e CSS.

## Executar

```powershell
npm install
npm run dev
```

Loja: http://127.0.0.1:3000
Painel: http://127.0.0.1:3000/admin

O back-end deve estar rodando na porta 3001. O Next.js encaminha `/api/products` para essa API por meio de `rewrites` em `next.config.ts`. As credenciais do banco ficam apenas no back-end.

## Como os produtos aparecem

1. O formulário de `/admin` envia POST para `/api/products`.
2. A API valida e grava no PostgreSQL.
3. O painel e a vitrine fazem GET para consultar a mesma lista.
4. Os cartões exibem nome, descrição e preço reais. As fotos são provisórias.

O catálogo é consultado ao abrir a página. Para conferir um cadastro com a loja aberta em outra aba, recarregue-a.

## Arquivos para estudar

- `src/app/page.tsx`: estrutura da loja.
- `src/app/components/product-catalog.tsx`: busca e exibição dos produtos; carregamento, erro e lista vazia.
- `src/app/admin/products-panel.tsx`: formulário e lista administrativa.
- `src/lib/products-api.ts`: tipos e chamadas GET/POST com fetch.
- `src/app/globals.css`: identidade visual da vitrine.
- `src/app/admin/admin.module.css`: estilos exclusivos do painel.

Para verificar a compilação e o TypeScript, execute `npm run build`.

## Fotos

As 76 fotos do ZIP estão em `public/products/`. No painel, escolha uma foto no cadastro ou abra “Alterar foto de …” em um produto existente e salve. A vitrine mostra a foto após abrir ou atualizar a página.

`src/data/product-images.json` registra os nomes originais e os caminhos. Os componentes `photo-picker.tsx` e `product-photo-editor.tsx` ficam em `src/app/admin/`. Há uma foto principal por produto; não existe upload genérico nesta etapa. Os vídeos do ZIP não foram importados.

## Categorias

Escolha Tênis, Bolsas ou Sem categoria no cadastro. Para classificar os produtos antigos, abra “Alterar categoria de …” no painel e salve. Atualize a vitrine e use os filtros para conferir o resultado. Os filtros funcionam sobre os produtos reais recebidos da API e exibem uma mensagem quando não há resultados.

Os rótulos e tipos ficam em `src/lib/product-categories.ts`. No banco, o enum usa os valores `TENIS`, `BOLSAS` e `SEM_CATEGORIA`.

## Login

`/login` permite entrar com e-mail e senha ou com o usuário administrativo existente. `/cadastro` cria somente clientes com e-mail único e senha de 12 a 128 caracteres, incluindo maiúscula, número e símbolo. O botão Google depende das credenciais OAuth locais descritas em [AUTENTICACAO.md](../docs/AUTENTICACAO.md). `/conta` é a área da própria conta; `/admin` exige administrador.

O cookie de sessão é HttpOnly e validado pelo servidor em `src/lib/current-user.ts`. As páginas privadas usam Suspense e não compartilham cache de usuário. As permissões de escrita são verificadas novamente pela API. Para sair, use o botão Sair.

Esta versão continua em desenvolvimento local. Veja `docs/AUTENTICACAO.md` na raiz para configurar o primeiro administrador e conferir os limites desta etapa.
