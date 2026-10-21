# Organização da vitrine Maia

A página usa uma campanha escura em tela ampla, com títulos condensados, fotografias assimétricas e três estilos selecionáveis. A composição e o contraste foram repensados a partir da referência visual enviada, mantendo a identidade Maia e as fotos fornecidas para o projeto. Categorias e coleção usam superfícies claras para facilitar a descoberta dos produtos e a leitura dos preços.

## Direção visual e movimento

- Barlow Condensed nos títulos da campanha, Space Grotesk na interface e Instrument Serif em destaques editoriais. As fontes ficam no próprio projeto, carregadas com `next/font/local`, com as licenças SIL Open Font License em `frontend/src/app/fonts/`. O navegador não consulta o Google Fonts.
- A campanha permite trocar estilos pelas setas junto à fotografia, prévia da próxima foto e gestos horizontais no celular. Os controles podem ser acionados pelo teclado. O produto selecionado leva à busca correspondente na coleção.
- As fotos respondem discretamente ao movimento do mouse e recebem uma transição ao trocar de estilo. Não há rotação automática das peças.
- O cabeçalho acompanha a rolagem, destaca a seção atual e respeita o tema escolhido. Uma linha mostra o progresso da página nos navegadores com suporte a animação ligada à rolagem.
- As categorias entram em sequência e os cartões respondem a foco e hover. A rolagem continua nativa, sem interceptação da roda do mouse.
- A preferência por movimento reduzido desativa os efeitos e a rolagem suave. A composição continua funcionando com imagens e controles estáticos.

Fontes oficiais: [Barlow Condensed](https://github.com/google/fonts/tree/main/ofl/barlowcondensed), [Space Grotesk](https://github.com/google/fonts/tree/main/ofl/spacegrotesk) e [Instrument Serif](https://github.com/google/fonts/tree/main/ofl/instrumentserif).

## Como funciona

- O ícone de sol/lua no cabeçalho abre as opções Claro e Escuro. A preferência fica salva em `localStorage` e sincroniza entre abas. Sem escolha salva, a vitrine acompanha a aparência do dispositivo. O tema é restaurado antes da primeira pintura da página; se o armazenamento estiver bloqueado, a troca continua funcionando na página atual.
- O tema ajusta a campanha, o cabeçalho, a coleção, a busca, os filtros e os detalhes dos produtos. As fotografias preservam suas cores originais.
- A coleção fica em `/colecao`, separada da apresentação da marca. `Explorar coleção`, os favoritos e os destaques abrem essa página. Categorias e Universo Maia continuam na página inicial.
- `/colecao?categoria=TENIS` abre a coleção de tênis. Sapatos, Sandálias e Bolsas usam o mesmo padrão. Os links antigos com parâmetros na raiz são redirecionados preservando os filtros.
- Os destaques levam à peça correspondente pelo parâmetro `busca`. Não há rotação automática: o visitante controla os estilos.
- A busca ignora maiúsculas e acentos; a ordenação considera o preço numérico, preservando os valores enviados pela API.
- O painel de filtros reúne marca, limite de preço e ordenação. A prévia de resultados acompanha a escolha, mas a coleção só muda ao aplicar; fechar ou usar Escape descarta o rascunho. No celular, o painel aparece na parte inferior da tela.
- As escolhas aplicadas podem ser removidas individualmente ou limpas de uma vez. Modelos Samba, Campus e Gazelle também aparecem em Adidas. A ordenação Seleção Maia prioriza as peças dos destaques.
- As contagens das categorias vêm da API. O catálogo é consultado uma vez e os dados são reutilizados ao trocar de categoria, evitando recarregar toda a grade. Categorias vazias não exibem controles sem utilidade.
- Favoritos usam `localStorage` com sincronização entre os controles e entre abas. A seleção pertence ao navegador, sem sincronização com contas. Se o armazenamento estiver bloqueado, funciona apenas em memória.
- São exibidas 12 peças por vez. O botão de carregar mais mantém os filtros ativos e uma barra mostra quanto da seleção já foi explorado.
- O detalhe usa o elemento nativo `dialog`: o foco fica na janela, Escape fecha e o foco retorna ao produto. Miniaturas, setas e teclado trocam as fotos. O zoom amplia a imagem selecionada e a peça pode ser salva nos favoritos diretamente nos detalhes.
- No computador, os cartões revelam a segunda foto ao passar o mouse. No celular, as categorias usam rolagem horizontal com encaixe e o menu abre sob o cabeçalho.
- As animações de entrada usam `IntersectionObserver`. A preferência por movimento reduzido desativa animações, deslocamentos e rolagem suave. Sem JavaScript, as seções de conteúdo permanecem visíveis.
- Apenas produtos com foto e categoria definida entram na vitrine. Cadastros incompletos continuam acessíveis no painel, onde podem ser finalizados.
- Em uma falha temporária, a coleção preserva a opção de tentar novamente e faz três tentativas em segundo plano. Também tenta recuperar quando a conexão volta ou o visitante retorna à aba.
- O Universo Maia reúne a apresentação da marca e a comunidade. Avaliações públicas passam por moderação; sugestões são privadas. As regras estão em `docs/comunidade-maia.md`.
- A migração adiciona Sapatos e Sandálias ao enum do PostgreSQL. Não remove nem reclassifica produtos existentes.

## Para aprender com esta mudança

A categoria é compartilhada pela URL; busca, ordenação e quantidade exibida pertencem ao estado da interface. Os dados e preços continuam pertencendo à API e ao banco. O CSS adapta a mesma estrutura para computador e celular, com atenção a foco, contraste e preferência por movimento reduzido.

Categorias sem produtos mostram uma mensagem própria, sem inventar estoque, preços ou disponibilidade. Carrinho e pagamento permanecem no planejamento.

## Linhas e grades de calçados

- A página inicial oferece entradas Feminino e Masculino. As faixas redundantes entre a campanha e as categorias foram removidas.
- A coleção usa `linha=FEMININO` ou `linha=MASCULINO`, preservado na troca de categorias e no atalho de favoritos. Sem esse parâmetro, mostra toda a coleção.
- Todos os modelos de calçados atendem as duas linhas: Feminino 34, 35, 36, 37, 38 e 39; Masculino 37, 38, 39, 40, 41, 42 e 43. Regra confirmada pela loja em 21/10/2026 e centralizada em `frontend/src/lib/product-sizing.ts`.
- Os detalhes abrem a grade da linha escolhida e permitem consultar a outra. As numerações são informativas: não representam contagem de estoque ou reserva. Bolsas e cadastros sem categoria não recebem grade de calçado.
- Os mesmos produtos são reutilizados nas duas linhas, sem duplicar cadastros, fotos ou preços no banco.
