# claude-ember-mods

Dois mods para o Claude Code:

- **token-optimizer**: painel com % de contexto, cache, limites de 5h e semanais e compactações. Corta saídas enormes de comandos antes de entrarem no contexto. O botão **Resumir+Recomeçar** escreve um `HANDOFF.md`, limpa a conversa e deixa a continuação pronta. `/tokens` abre o painel ao lado da conversa.
- **neon-grid**: tema cyberpunk preto e laranja (Ember Grid) para a app desktop e telemóvel, com fundo animado, cartões com cantos cortados e títulos em mono. `/tema` mostra o diagnóstico; `/tema parar` e `/tema animar` param e retomam a animação.

## Instalar

Num terminal com o Claude Code:

```
/plugin install token-optimizer --marketplace LoganxWrath/claude-ember-mods
/plugin install neon-grid --marketplace LoganxWrath/claude-ember-mods
```

Responde `y` para adicionar o marketplace e escolhe o âmbito **user** para ficar ativo em todas as sessões.

Ou, a partir de uma shell:

```
claude plugin install token-optimizer --marketplace LoganxWrath/claude-ember-mods
claude plugin install neon-grid --marketplace LoganxWrath/claude-ember-mods
```

Na app desktop: carrega em **+** ao lado da caixa de escrever → **Plugins** → **Add marketplace** com `LoganxWrath/claude-ember-mods` → **Add plugin**.

Como o repositório é privado, o computador precisa de ter credenciais do GitHub (por exemplo `gh auth login` seguido de `gh auth setup-git`).
