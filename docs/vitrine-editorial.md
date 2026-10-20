# Organização da vitrine Maia

A página segue três momentos: apresentar a identidade da loja, ajudar a escolher uma categoria e explorar os produtos. As fotos são as fornecidas para o projeto; a paleta mantém tons neutros, com contraste para leitura e ações.

## Como funciona

- `/?categoria=TENIS#colecao` abre a coleção de tênis. Sapatos, Sandálias e Bolsas usam o mesmo padrão. O histórico do navegador acompanha a categoria.
- A busca ignora maiúsculas e acentos; a ordenação considera o preço numérico, preservando os valores enviados pela API.
- São exibidas 12 peças por vez. O botão de carregar mais mantém os filtros ativos.
- O detalhe usa o elemento nativo `dialog`: o foco fica na janela, Escape fecha e o foco retorna ao produto. As miniaturas trocam a foto principal.
- Apenas produtos com foto e categoria definida entram na vitrine. Cadastros incompletos continuam acessíveis no painel, onde podem ser finalizados.
- A migração adiciona Sapatos e Sandálias ao enum do PostgreSQL. Não remove nem reclassifica produtos existentes.

## Para aprender com esta mudança

A categoria é compartilhada pela URL; busca, ordenação e quantidade exibida pertencem ao estado da interface. Os dados e preços continuam pertencendo à API e ao banco. O CSS adapta a mesma estrutura para computador e celular, com atenção a foco, contraste e preferência por movimento reduzido.

Categorias sem produtos mostram uma mensagem própria, sem inventar estoque, preços ou disponibilidade. Carrinho e pagamento permanecem no planejamento.
