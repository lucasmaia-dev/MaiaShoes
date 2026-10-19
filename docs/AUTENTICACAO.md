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
- O login usa um nome de usuário, normalizado para minúsculas; não exige e-mail nesta etapa.
- Senhas de clientes novos têm de 12 a 128 caracteres. São derivadas com scrypt, salt aleatório e comparação em tempo constante.
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

Ainda não há recuperação ou troca de senha pela interface, verificação de e-mail, autenticação social ou múltiplos fatores. O projeto continua em desenvolvimento local. A publicação em produção precisará de HTTPS, configuração de domínio/proxy e estratégia de limitação distribuída adequadas ao ambiente.
