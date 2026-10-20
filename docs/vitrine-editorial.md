# Organização da vitrine Maia

A página usa uma abertura imersiva com três estilos selecionáveis, categorias visuais e uma coleção interativa. Tipografia sem serifa, navegação flutuante, superfícies translúcidas e transições dão unidade à interface. As fotos continuam sendo as fornecidas para o projeto.

## Como funciona

- `/?categoria=TENIS#colecao` abre a coleção de tênis. Sapatos, Sandálias e Bolsas usam o mesmo padrão. O histórico do navegador acompanha a categoria.
- Os destaques levam à peça correspondente pelo parâmetro `busca`. Não há rotação automática: o visitante controla os estilos.
- A busca ignora maiúsculas e acentos; a ordenação considera o preço numérico, preservando os valores enviados pela API.
- As marcas refinam a busca; os modelos Samba, Campus e Gazelle também são encontrados pelo filtro Adidas. A ordenação Seleção Maia prioriza as peças dos destaques.
- Favoritos usam `localStorage` com sincronização entre os controles e entre abas. A seleção pertence ao navegador, sem sincronização com contas. Se o armazenamento estiver bloqueado, funciona apenas em memória.
- São exibidas 12 peças por vez. O botão de carregar mais mantém os filtros ativos.
- O detalhe usa o elemento nativo `dialog`: o foco fica na janela, Escape fecha e o foco retorna ao produto. Miniaturas, setas e teclado trocam as fotos. O zoom amplia a imagem selecionada.
- No computador, os cartões revelam a segunda foto ao passar o mouse. No celular, as categorias usam rolagem horizontal com encaixe e o menu abre sob o cabeçalho.
- As animações de entrada usam `IntersectionObserver`. A preferência por movimento reduzido desativa animações, deslocamentos e rolagem suave. Sem JavaScript, as seções de conteúdo permanecem visíveis.
- Apenas produtos com foto e categoria definida entram na vitrine. Cadastros incompletos continuam acessíveis no painel, onde podem ser finalizados.
- A migração adiciona Sapatos e Sandálias ao enum do PostgreSQL. Não remove nem reclassifica produtos existentes.

## Para aprender com esta mudança

A categoria é compartilhada pela URL; busca, ordenação e quantidade exibida pertencem ao estado da interface. Os dados e preços continuam pertencendo à API e ao banco. O CSS adapta a mesma estrutura para computador e celular, com atenção a foco, contraste e preferência por movimento reduzido.

Categorias sem produtos mostram uma mensagem própria, sem inventar estoque, preços ou disponibilidade. Carrinho e pagamento permanecem no planejamento.
