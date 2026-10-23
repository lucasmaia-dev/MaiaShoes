# Pedidos, Pix e recebimento pelo WhatsApp

A loja aceita Pix por chave, com QR estático e copia e cola gerados localmente. Não há integração bancária nem confirmação automática. O payload segue o [padrão do Banco Central](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf).

## Fluxo atual

1. Os produtos publicados na coleção são considerados disponíveis pela loja. O cliente pode comprar diretamente ou adicionar várias peças ao carrinho **sem escolher numeração**. O tamanho nos detalhes é opcional. Na seção de finalização de `/carrinho`, a linha e a numeração de cada calçado são obrigatórias antes de gerar o Pix. Escolhas já salvas continuam preenchidas e podem ser alteradas. Bolsas não exigem numeração. O cliente ajusta quantidades, remove peças e escolhe **retirada gratuita** ou **entrega em casa de R$ 15,00** antes de pagar. É necessário entrar na conta para finalizar; o login por e-mail e senha retorna ao carrinho.
2. A API calcula o total pelo preço do banco e soma **uma única taxa de R$ 15,00 por pedido** somente para entrega. O pedido já é criado com status `AGUARDANDO_PAGAMENTO`, total fixado, Pix copia e cola e recebedor. Não há aprovação manual de disponibilidade. Exemplo: produto de R$ 160,00 custa R$ 175,00 com entrega ou R$ 160,00 para retirada.
3. O QR Code aparece imediatamente. Depois de pagar, o cliente toca em **Já fiz o Pix · continuar no WhatsApp** para combinar endereço e horário. A forma de recebimento já está registrada e não pode ser alterada depois de emitir o Pix pelo site, para preservar a cobrança.
4. O link abre uma mensagem pronta com pedido, produto, quantidade, tamanho, total do Pix e recebimento escolhido. Para entrega, informa a taxa já incluída no total. O cliente envia a mensagem; o site não envia mensagens automaticamente. O formato segue a [documentação do WhatsApp](https://faq.whatsapp.com/425247423114725/).
5. A loja combina endereço e horário na conversa. O endereço residencial de retirada não aparece publicamente. A região de entrega deve ser confirmada na conversa.
6. O administrador consulta o extrato e registra o identificador bancário único da transação para confirmar o recebimento **do total do Pix**, incluindo a entrega quando escolhida.

**Já fiz o Pix** ou abrir o WhatsApp não marca o pedido como pago. Alterações depois da emissão do Pix devem ser tratadas com a Maia pelo atendimento. O site não confirma envio da mensagem nem agendamento.

Pedidos antigos **sem Pix emitido**, que ficaram aguardando disponibilidade, agora oferecem a escolha de retirada ou entrega na própria página do pedido e geram o Pix imediatamente com o total correto. Pedidos que já possuem Pix emitido ou pagamento confirmado mantêm seus valores. Se a cobrança antiga foi emitida apenas pelos produtos, a interface e a mensagem identificam esse fluxo anterior. Não há alteração retroativa de cobranças, nem cobrança duplicada de entrega.

## Configuração local

Em `backend/.env`, sem incluir os valores reais no Git:

```dotenv
PIX_KEY="SUA_CHAVE_PIX"
PIX_RECEIVER="NOME DO TITULAR"
PIX_CITY="CIDADE"
STORE_WHATSAPP="55DDDNUMERO"
```

Os dados reais fornecidos ficam somente no `.env` local. O WhatsApp inclui país, DDD e número em dígitos. Sem WhatsApp válido, a API não cria pedidos do novo fluxo. O titular da chave Pix deve ser conferido no aplicativo bancário; não há consulta ao DICT.

Depois de atualizar o código:

```powershell
cd backend
npx prisma migrate deploy
npm run build
```

Reinicie a API para carregar a configuração. A taxa de entrega própria é definida no servidor, em `order-contact.ts`, e registrada no pedido para preservar o valor informado. Mudanças na chave, no preço do produto ou na taxa não alteram os dados já registrados.

## API e proteção

As rotas exigem sessão. Escritas exigem `X-MaiaShoes-Request: 1`. Cada cliente acessa somente seus pedidos. O preço vem do banco; valores e tamanhos são validados pelo servidor.

| Método | Rota | Ação |
| --- | --- | --- |
| POST | `/api/orders` | Solicitar pedido; UUID evita duplicação em reenvios |
| POST | `/api/orders/cart` | Criar um pedido com várias peças e um único Pix; preço e taxa calculados pelo servidor |
| GET | `/api/orders` | Últimos cem pedidos próprios |
| GET | `/api/orders/:id` | Detalhe próprio, QR liberado e telefone de atendimento |
| PATCH | `/api/orders/:id/fulfillment` | Cliente escolhe recebimento de pedido antigo sem Pix e gera a cobrança com o total |
| GET | `/api/orders/moderation` | Administrador consulta últimos cem pedidos |
| PATCH | `/api/orders/:id/approve` | Compatibilidade administrativa para pedidos antigos; exige forma escolhida e taxa fixa correta |
| PATCH | `/api/orders/:id/payment` | Administrador registra recebimento do total do Pix e referência bancária única |
| PATCH | `/api/orders/:id/progress` | Administrador avança a preparação, entrega ou retirada de um pedido pago |

O carrinho guarda somente produto, linha, tamanho e quantidade no navegador. Os preços são consultados no catálogo; o servidor recalcula todos os valores e salva os itens do pedido em uma única gravação. É possível comprar até vinte opções de produto, com até dez unidades de cada combinação de produto, linha e tamanho. A entrega é cobrada uma vez para todo o pedido. Itens repetidos são agrupados pelo carrinho; a API rejeita combinações duplicadas e preços enviados pelo navegador.

Os itens são registrados com nome, foto, preço e numeração da compra. A migração converte os pedidos antigos em pedidos com um item, sem recalcular cobranças ou remover dados. Cliente, administrador e mensagem do WhatsApp mostram todas as peças. Após criar o pedido, o carrinho retira somente as unidades solicitadas. Se a conexão falhar, repetir a mesma tentativa recupera o pedido pelo UUID, sem emitir outra cobrança.

## Acompanhamento após o pagamento

Confirmar o Pix coloca o pedido em **Em preparação**. Para entrega, o administrador marca **Saiu para entrega** e depois **Entregue**. Para retirada, marca **Pronto para retirada** e depois **Retirado**. O cliente vê uma linha de etapas com datas, atualizada a cada trinta segundos enquanto a página estiver aberta e o pedido não estiver concluído. Também pode usar Atualizar situação. Não há rastreamento por GPS ou envio de notificações externas.

O painel permite buscar por pedido, cliente, telefone ou produto e filtrar pagamentos pendentes, pedidos em andamento e concluídos. Os filtros operam sobre os últimos cem pedidos carregados, como indicado na tela.

Cada avanço guarda etapa anterior, etapa nova, data e administrador responsável. A alteração e o histórico são gravados na mesma transação. Pedidos sem pagamento confirmado não avançam; etapas incompatíveis com entrega/retirada, regressões e atualizações concorrentes são rejeitadas. Valores, Pix e itens não são alterados. Dados de auditoria do administrador não são expostos ao cliente.

Pedidos já pagos antes dessa atualização começam em preparação, sem inventar datas de saída ou conclusão. Pedidos antigos pagos com recebimento ainda a combinar podem ser concluídos pelo administrador após confirmar o recebimento do cliente.

O sistema registra quem confirmou o recebimento e quando. Não reutiliza a mesma referência bancária em dois pedidos. Não existe expiração fictícia: um QR estático não pode ser revogado pelo site. Não há cancelamento ou estorno nesta etapa.

## Retomar uma tentativa após falha de conexão

Na compra direta e no carrinho, uma falha de rede mantém a referência e os dados enviados. Os campos ficam bloqueados e o botão **Recuperar pedido desta tentativa** reenvia a mesma solicitação. Se o servidor já gravou o pedido, retorna seu identificador, sem emitir outra cobrança. Uma resposta de validação na primeira tentativa permite corrigir os campos. Depois de uma falha de conexão, até erros posteriores preservam a referência, pois o pedido original pode já existir.

A recuperação vale enquanto a página permanece aberta. Se ela for fechada ou recarregada após uma falha, consulte **Meus pedidos** antes de comprar novamente: o pedido anterior pode já ter sido criado.
