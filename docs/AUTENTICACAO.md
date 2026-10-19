# Etapa 9 — login e permissões

## Conceitos

**Autenticação** responde quem entrou. **Autorização** decide o que essa pessoa pode fazer. Ter uma página chamada `/admin` não protege os dados: por isso a API também verifica a sessão e o perfil antes de gravar.

| Acesso | Visitante | Cliente | Administrador |
| --- | --- | --- | --- |
| Ver catálogo | Sim | Sim | Sim |
| Abrir a própria conta | Não | Sim | Sim |
| Abrir painel | Não | Não | Sim |
| Cadastrar produto, alterar foto ou categoria | Não | Não | Sim |

## Cadastro e login

- `/cadastro` cria somente `CLIENTE`. O corpo não aceita `role`.
- Clientes novos se cadastram com nome, e-mail e senha. O e-mail é normalizado para minúsculas e é único no banco. O login aceita e-mail ou usuário; os usuários anteriores, incluindo o administrador, continuam funcionando.
- Senhas novas têm de 12 a 128 caracteres, ao menos uma maiúscula de A a Z, um número e um símbolo (espaço não conta como símbolo). A regra é conferida na tela e na API. Senhas existentes não são alteradas automaticamente. São derivadas com scrypt, salt aleatório e comparação em tempo constante.
- Usuário inexistente e senha incorreta recebem a mesma mensagem.
- Login e cadastro têm limite de 10 tentativas por minuto por rota/IP, com armazenamento de limitação em memória. Na configuração local, a API recebe as chamadas pelo proxy do Next.js; uma implantação deve configurar corretamente os proxies antes de adotar limites por IP dos clientes.

## Sessões

O servidor gera um token aleatório e envia um cookie `maiashoes_session` com HttpOnly, SameSite=Lax e duração de oito horas. Em produção, o cookie também exige HTTPS. O token não vai para localStorage nem para a resposta JSON. No banco fica apenas o SHA-256 do token, vinculado ao usuário e à data de expiração.

Cada requisição protegida consulta o usuário da sessão no banco, incluindo seu perfil atual. No logout, a sessão é removida e o cookie é limpo. Reutilizar aquele cookie deixa de funcionar. Sessões de outros dispositivos continuam válidas até expirarem ou saírem.

Chamadas de escrita exigem `X-MaiaShoes-Request: 1`. Como não habilitamos CORS, um site externo não consegue fazer uma chamada com esse cabeçalho pelo navegador. Os formulários do projeto já o enviam.

## Primeira conta administrativa

1. Configure o banco, aplique as migrações e execute `npm run build` no back-end.
2. Copie `.env.admin.example` para `.env.admin.local`.
3. Preencha `ADMIN_NAME`, `ADMIN_USERNAME` e `ADMIN_PASSWORD` apenas no arquivo local.
4. Execute `npm run admin:create`.

O arquivo local de configuração contém a senha de preparação, é ignorado pelo Git e não deve ser compartilhado. No banco, a senha fica somente como hash. O comando não altera a senha de um administrador existente nem transforma um cliente em administrador. Não existe rota pública de promoção de usuários.

## Telas protegidas

O Next.js lê o cookie no servidor e confirma a sessão na API, sem cache compartilhado de usuário. As leituras ficam em Suspense por causa dos Cache Components. Visitantes em `/admin` ou `/conta` são enviados ao login. Clientes que tentam `/admin` são enviados a `/conta`.

As rotas POST/PATCH de produtos usam SessionGuard e AdminGuard. A resposta é 401 sem sessão válida e 403 para cliente autenticado. GET de produtos continua público. Essas verificações são independentes da interface.

## Exercício

1. Entre como administrador em `/login`, confira o painel e saia.
2. Crie uma conta de cliente em `/cadastro` e confira o perfil em `/conta`.
3. Tente abrir `/admin`: você deve continuar na área de cliente.
4. Saia e tente acessar `/conta`: o login será solicitado.

Os testes automatizados exercitam senha, cookie, cadastro sem elevação de privilégio, expiração, logout, limite de tentativas e permissões. O script opcional `node scripts/check-auth-local.mjs`, executado de `backend/` com os dois servidores ativos, verifica o banco real; ele cria e remove apenas seu cliente temporário de teste e não exibe credenciais.

## Limites desta etapa

Ainda não há recuperação ou troca de senha pela interface, envio de verificação de e-mail ou múltiplos fatores. O e-mail informado no cadastro com senha não prova a posse da caixa postal. O projeto continua em desenvolvimento local. A publicação em produção precisará de HTTPS, configuração de domínio/proxy e estratégia de limitação distribuída adequadas ao ambiente.

## Entrar com Google

O botão nas páginas de login e cadastro fica disponível quando a API possui a configuração abaixo. O fluxo segue o [OpenID Connect do Google](https://developers.google.com/identity/openid-connect/openid-connect) e usa a biblioteca oficial `google-auth-library`.

1. No [Google Cloud Console](https://console.cloud.google.com/), crie ou selecione seu projeto e configure a tela de consentimento no Google Auth Platform. Em modo de testes, inclua os e-mails de teste permitidos.
2. Crie um cliente OAuth do tipo **Aplicativo da Web**. Cadastre exatamente a URI de redirecionamento `http://localhost:3000/api/auth/google/callback` para desenvolvimento.
3. No arquivo **local** `backend/.env`, preencha `APP_ORIGIN="http://localhost:3000"`, `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`. Há campos vazios em `.env.example`. Não envie o segredo pelo chat, não o coloque no front-end e não o versione.
4. Reinicie a API. Acesse `http://localhost:3000/login` e escolha **Entrar com Google**. O link sempre começa na origem configurada para que o cookie e a callback usem o mesmo host. `localhost` e `127.0.0.1` são hosts diferentes.
5. Em produção, use sua origem HTTPS em `APP_ORIGIN` (sem barra final ou caminho) e registre no Google a callback correspondente. `NODE_ENV=production` recusa origem HTTP.

Rotas: `GET /api/auth/google/status` informa disponibilidade e URL de início; `/start` redireciona ao Google; `/callback` confirma a identidade e cria a mesma sessão HttpOnly usada no login com senha. O segredo nunca é exposto pelo endpoint de status.

A tentativa dura dez minutos, com state e cookie aleatórios vinculados por hashes no banco, nonce, PKCE S256 e consumo único por exclusão condicional. A biblioteca troca o código e verifica assinatura, emissor, expiração e destinatário do ID token. A aplicação também verifica nonce e e-mail confirmado. Os escopos são apenas openid, email e profile. Tokens do Google não são persistidos.

O identificador estável `sub` reconhece quem retorna, mesmo se o e-mail mudar. O primeiro acesso cria apenas `CLIENTE`, sem senha artificial. Se já existir uma conta local com o mesmo e-mail, o usuário recebe orientação para entrar com sua senha; não há vinculação automática nem promoção para administrador. Uma futura tela de vinculação deverá exigir autenticação da conta local e confirmação do Google.

Os testes simulam o provedor para cobrir fluxo válido, PKCE, state, navegador, nonce, expiração, replay, falha de verificação e colisão de contas. Um teste real com o Google exige credenciais válidas e consentimento no navegador; enquanto elas não forem configuradas, essa verificação permanece pendente.
