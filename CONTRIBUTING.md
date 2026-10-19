# Desenvolvimento do MaiaShoes

O projeto é desenvolvido em etapas, com foco em aprendizado e organização profissional.

## Fluxo de trabalho

1. Abra uma issue descrevendo a funcionalidade ou o problema.
2. Atualize a branch principal: `git switch main` e `git pull --ff-only`.
3. Crie uma branch para a mudança, por exemplo `git switch -c codex/categorias-produtos`.
4. Faça uma alteração com escopo pequeno e atualize a documentação quando necessário.
5. Execute as verificações correspondentes.
6. Crie um commit com uma descrição objetiva e envie a branch ao GitHub.
7. Abra um pull request com o comportamento alterado e o resultado das verificações.
8. Depois da revisão e dos checks, integre à branch principal.

## Verificações

No back-end, com `.env` configurado:

```powershell
npm run build
npm test
npm run test:e2e
```

No front-end:

```powershell
npm run build
```

Ao modificar o banco, inclua a migração SQL e mantenha os registros existentes. Não versione `.env`, senhas, tokens, dependências ou arquivos de build.

## Commits

Use mensagens que expliquem a mudança, por exemplo:

- `feat: adiciona categorias ao cadastro de produtos`
- `fix: preserva centavos ao salvar preços`
- `docs: explica a configuração do PostgreSQL`

As fotos e a identidade visual fazem parte do material fornecido para o projeto. A publicação do código não concede licença de uso desses materiais.
