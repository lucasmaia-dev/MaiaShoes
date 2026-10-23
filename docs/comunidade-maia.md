# Comunidade Maia

A página inicial mantém Categorias e Universo Maia. A coleção fica em `/colecao`, com filtros na URL. Dentro do Universo, o link **Participe do universo Maia** leva à área de avaliações e sugestões.

## Participação do cliente

É necessário entrar com uma conta de cliente. Em Minha conta existe o link para participar.

- Avaliação: nota inteira de 1 a 5, relato de 20 a 1.000 caracteres e autorização para publicar primeiro nome, nota e texto depois da análise.
- Sugestão: mensagem privada para o administrador. Não recebe nota, autorização de publicação nem entra na lista pública.
- Existe uma participação de cada tipo por conta. Um novo envio substitui o texto anterior desse tipo e volta para análise; uma avaliação editada deixa de aparecer publicamente até nova aprovação.
- A interface renderiza mensagens como texto, sem interpretar HTML. E-mails, identificadores da conta e dados de sessão não fazem parte da resposta pública.
- O envio exige sessão, cabeçalho de proteção e respeita limite de requisições. Contas administrativas acessam a moderação e não enviam depoimentos como se fossem clientes.

O estado vazio é real: nenhuma avaliação ou nota é inventada. A nota representa a experiência relatada com a loja; a interface não usa selo de compra verificada, pois pedidos ainda não estão implementados.

## Moderação

O administrador abre `/admin/feedbacks` pelo painel. Pode filtrar as últimas 100 participações entre pendentes, publicadas, arquivadas ou todas.

Aprovar publica somente uma avaliação com consentimento. Arquivar retira a avaliação da lista pública; sugestões só podem ser lidas/arquivadas. É possível devolver uma participação arquivada para análise. A API registra responsável e horário da moderação.

Cada ação envia a data da versão conferida. Se o cliente editar o texto antes da conclusão, a API retorna conflito e exige recarregar a participação. Isso evita aprovar um conteúdo diferente do que o administrador leu.

## Banco e verificação

A migração `20261021150000_customer_feedback` adiciona tabela, enums, relações e restrição de consistência entre tipo, nota e consentimento. Ela preserva usuários e produtos existentes. Rode `npx prisma migrate deploy` em `backend/` após atualizar o código.

Os testes HTTP usam as proteções reais de sessão, papel e cabeçalho, com banco substituído por mocks isolados. Cobrem publicação indevida, campos forjados, dados inválidos, privacidade das sugestões, edição e conflito durante a moderação. O CI aplica as migrações no PostgreSQL de teste; não grava avaliações fictícias na loja.

Em desenvolvimento, `npm run start:dev` usa `.dev-dist`, enquanto `npm run build` usa `dist`, evitando a perda de módulos da API durante a compilação de produção. A vitrine também recupera falhas temporárias com tentativas limitadas e ao retornar à aba.
