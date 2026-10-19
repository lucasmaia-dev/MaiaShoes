# Etapa 8 — categorias e filtros

Esta etapa acrescenta uma informação ao produto e acompanha seu caminho pelo sistema inteiro.

1. `backend/prisma/schema.prisma` define `ProductCategory`, uma lista fechada de valores permitidos. O banco impede categorias fora dessa lista.
2. A migração adiciona a coluna `category` com padrão `SEM_CATEGORIA`. Assim os registros antigos continuam válidos.
3. O DTO valida a categoria recebida e o service entrega o valor ao Prisma. GET passa a devolver o campo junto dos outros dados.
4. O formulário de cadastro envia a categoria selecionada. O formulário de edição usa PATCH para alterar somente esse campo.
5. A vitrine usa `useState` para guardar o filtro escolhido e `filter` para selecionar os produtos correspondentes. “Todos” mostra a lista completa.

## Exercício

Abra `/admin`, localize um produto que você sabe ser um tênis e escolha Tênis em “Alterar categoria”. Salve, abra ou atualize a loja e clique em Tênis. O produto deve aparecer. Em Bolsas, ele não deve aparecer.

Depois volte ao painel e recarregue a página: a categoria deve continuar salva. Compare com `/api/products`, onde o valor aparece como `TENIS`. Na tela usamos o rótulo “Tênis”.

## Git e GitHub

A mudança fica na branch `codex/categorias-produtos`. Ela será revisada em um pull request, com migração, validações, interface e verificações do CI no mesmo contexto.
