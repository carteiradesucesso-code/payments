# Aplicativo Financeiro — Cobrança (Login com Supabase)

Este projeto inicia com um login simples usando Supabase Auth e já cria as tabelas básicas no banco (dividas e pagamentos) com RLS por usuário.

## Pré-requisitos
- Conta e projeto no Supabase.
- Habilitar cadastro por email/senha em `Auth > Settings`.

## Configuração
- O arquivo `js/config.js` já está preenchido com seu `SUPABASE_URL` e `SUPABASE_ANON_KEY`.
- Se precisar gerar/rotacionar a chave, use o painel `Settings > API Keys` e atualize `js/config.js`.

## Executando localmente
Guia rápido (recomendado):
- Abra um terminal na pasta `c:\Users\BLITZ\Desktop\cobranca`.
- Rode: `py -m http.server 5500` (ou `python -m http.server 5500`).
- Acesse: `http://localhost:5500/`.
- Mantenha o terminal aberto; para parar use `Ctrl + C`.

Observações:
- Não use `npm run dev`.
- Se a porta 5500 estiver ocupada, use outra, por exemplo: `py -m http.server 5501` e acesse `http://localhost:5501/`.
- O 404 para `/@vite/client` é esperado em um servidor estático e não impacta a aplicação.
- Para abrir pelo Playwright ou pela prévia do Trae, garanta que o servidor esteja ativo e use `http://localhost:5500/`.

## Estrutura de banco (já aplicada)
- Tabelas: `public.dividas`, `public.pagamentos`.
- RLS habilitada em ambas, com políticas por `auth.uid()`.
- Campos principais:
  - dividas: `valor_principal`, `taxa_juros`, `periodo_juros` (mensal/anual), `data_inicio`, `status`.
  - pagamentos: `valor_pago`, `juros_pago`, `principal_amortizado`, `data_pagamento`.

## Plano técnico do Dashboard Financeiro (MVP)
- Base monetária: centavos (inteiro) com formatação `pt-BR` via `Intl.NumberFormat`.
- Módulo `js/finance.js` com funções puras para:
  - `parseToCents(valor)`: converte string/number para centavos (aceita vírgula e ponto).
  - `formatBRL(cents)`: formata centavos em `R$`.
  - `calcularPMT(principalCents, taxaAnualPct, meses)`: parcela fixa mensal (sistema PRICE).
  - `calcularJurosCompostos(principalCents, taxaAnualPct, meses)`: futuro e rendimento composto mensal.
- UI simples em `dashboard.html` com cartões para: Entradas, Saídas, Empréstimos, Investimentos.
- Handlers em `js/dashboard.js` conectam os formulários às funções do módulo e exibem resultado textual.

Observação: O módulo foi desenhado para futura troca por Dinero.js sem alteração da UI. Caso optemos por Dinero.js, basta injetar as operações no `finance.js` sem tocar no `dashboard.js`.

## Passo a passo para testar
1) Inicie o servidor estático: `py -m http.server 5500`.
2) Abra `http://localhost:5500/index.html` e faça login.
3) Ao entrar em `dashboard.html`, use os cartões:
   - Entradas: informe um valor e clique em "Adicionar" para ver o total formatado.
   - Saídas: informe um valor e clique em "Adicionar" para ver o total formatado.
   - Empréstimo (PMT): preencha principal (R$), taxa anual (%) e meses; clique em "Calcular".
   - Investimento: preencha principal (R$), taxa anual (%) e meses; clique em "Simular".
4) Verifique o resultado abaixo de cada botão. Em caso de erro, veja o console do navegador e o terminal.

## Critérios de integridade
- Não executar `npm run dev`.
- Não consultar banco fora do MCP Supabase (front apenas).
- Após qualquer modificação, sempre conferir o terminal e o console do navegador por erros.

## Próximos passos
- Persistir lançamentos no Supabase (via MCP quando aplicável).
- Cronograma de amortização e sumários.
- Validações adicionais de entrada (formas, limites, campos obrigatórios).
