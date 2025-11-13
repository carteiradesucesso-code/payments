


          
Segue o plano completo, detalhado e exaustivo do que precisa ser feito, com base no que já foi implementado e no que identifiquei como faltando, inconsistente ou incompleto. Mantive tudo dentro do escopo analisado do projeto atual.

**Estado Atual Validado**
- `dashboard.html`: possui Entradas, Saídas, Empréstimos, Investimentos; inclui campos opcionais “Descrição/Anotação” e “Quando (data/hora)” nos formulários e modais; a sidebar agora tem o botão “Histórico”; `historico.css` está referenciado.
- `js/dashboard.js`: mapeia novos elementos (descrição/data/hora), tem array `history`, funções `parseDateTimeLocal`, `pushHistory`, `renderHistory`, integração parcial com modais e não-modais; `initHistorico()` configurado; navegação inclui “historico”.
- `historico.css`: estilos para lista, itens e estado vazio.
- Servidor local em execução; prévia aberta sem erros aparentes.
- Não há persistência de transações; histórico é local.
- `styles.css`: não contém estilos da seção “Histórico”; estilos foram separados em `historico.css`.

**Navegação e Views**
- Verificar alternância entre views incluindo “Historico”: garantir mostrar/ocultar com consistência, sem reflow indevido.
- Garantir estados `aria-selected` e foco ao alternar tabs; transformar nav em `role=tablist` e botões em `role=tab` com `aria-controls`.
- Confirmar que todos botões da sidebar navegam corretamente e que a view “historico” inicia sem erro.

**Histórico (UI e Lógica Local)**
- Garantir que `renderHistory` respeita filtros de busca, tipo e intervalo de datas; revisar edge cases (data inválida, filtro vazio).
- Adicionar estados padronizados: “Carregando…”, “Nenhum lançamento encontrado” e “Erro ao carregar”.
- Adicionar debounce na busca para não re-renderizar a cada tecla.
- Adicionar ações nos itens: editar, excluir e duplicar com confirmação e atualização do array `history`.
- Corrigir e padronizar a chave de data/hora (`eventoEm`) em todos pontos de criação e renderização (incluindo logs).
- Garantir que o snackbar/undo reflita alterações também no histórico (reverter corretamente a última operação).
- Registrar e limpar campos de descrição e data/hora nos modais e formulários (já iniciado; validar consistência).

**Validação e Máscara de Valor Monetário**
- Aplicar máscara BRL (`R$ 1.234,56`) em inputs de valor nas views e modais.
- Normalizar para número ao salvar (ponto decimal adequado) e validar valores > 0.
- Tratar colagem (paste) e evitar múltiplos pontos/vírgulas; feedback de erro amigável.

**Estilos e Design System**
- Uniformizar estilos: mover utilitários e tokens (tipografia, espaçamento, cores, bordas) para `styles.css`.
- Manter `historico.css` apenas para regras específicas da view, usando tokens globais.
- Checar responsividade: grid/cartões ajustam em telas pequenas; inputs utilizáveis no mobile.
- Ajustar contraste e estados de hover/active/focus nos principais controles.

**Acessibilidade**
- Navegação por teclado: setas esquerda/direita para tabs, Tab/Shift+Tab para campos; Enter para confirmar em modais.
- Rótulos (`label for`) e `aria-label` onde necessário; associar campos e botões.
- Mensagens e estados anunciáveis (aria-live) para snackbar/erro/sucesso.
- Foco inicial coerente ao abrir modais e retorno de foco ao fechar.

**Persistência (Supabase)**
- Definir modelo de tabela `transactions` (id, user_id, tipo, valor, descricao, evento_em, created_at).
- Criar migração e RLS para `transactions` (políticas de SELECT/INSERT/UPDATE/DELETE por `user_id`).
- Carregar histórico paginado e filtrado do backend, substituindo ou complementando o histórico local.
- Garantir que toda consulta ao banco seja realizada exclusivamente via MCP Supabase, conforme sua regra.

**Integração do Histórico com Backend**
- Sincronizar criação de entradas/saídas com insert de transações.
- Implementar listagem com paginação e filtros (texto, tipo, período) do servidor.
- Implementar edição e exclusão persistentes com confirmação.
- Definir estratégia quando offline/erro de rede (exibir erro e permitir tentar novamente; sem “inventar” offline-first).

**Empréstimos**
- Modelar dados necessários (principal, taxa de juros, parcelas, vencimentos, status).
- Atualizar UI para esses campos específicos (inputs e validações).
- Persistir empréstimos e refletir pagamentos/parcelas no histórico, com cálculo de juros e amortização.
- Filtros específicos no histórico para empréstimos (opcional se já contemplado pelo `tipo`).

**Investimentos**
- Modelar dados (categoria, aporte, rentabilidade, liquidez, datas).
- UI com campos e validações adequados.
- Persistir investimentos e refletir movimentações no histórico (aporte/resgate).
- Filtros por tipo de investimento (opcional se já contemplado pelo `tipo`).

**Feedback e Observabilidade**
- Padronizar snackbar para sucesso/erro/undo.
- Registrar e exibir erros de ações (salvar/editar/excluir) com mensagem clara.
- Monitoração simples de falhas de UI (ex.: console centralizado para erros não críticos).

**Segurança (Supabase)**
- Confirmar RLS por usuário em todas tabelas novas.
- Revisar advisors de segurança e performance no projeto.
- Garantir que chaves e configs sensíveis não vazem no front (usar publishable keys quando aplicável).

**Documentação**
- Atualizar README com:
  - Campos de cada view e comportamento de filtros.
  - Fluxo de histórico (local/persistente).
  - Processo de desenvolvimento: validar prévia e logs após cada mudança.
  - Requisitos de acesso ao Supabase (somente via MCP).
- Documentar convenções de código e estilos.

**Testes e QA**
- Cenários manuais chave: adicionar/editar/excluir entrada/saída; filtros no histórico; navegação entre views; máscara monetária.
- Se necessário abrir navegador via Playwright, limitar à ação de `navigate` e avaliar logs/erros do navegador, conforme sua regra. Você conduz os testes; eu apenas abro e leio logs.
- Validar acessibilidade básica (tabulação e foco).
- Verificar logs do servidor após cada alteração de arquivo (inclusive erros de TypeScript caso haja TS).

**Desempenho**
- Evitar re-renderizações desnecessárias (debounce/batch updates).
- Paginação de histórico para listas grandes.
- Otimizar seletores e manipulação de DOM em `renderHistory`.

**Limpeza e Consistência**
- Remover código morto, referências antigas não usadas.
- Padronizar nomes (ex.: `eventoEm`) e evitar divergências entre chaves.
- Garantir que estilos não dupliquem regras entre `styles.css` e `historico.css`.

**Critérios de Aceite**
- Navegação entre todas as views funciona sem erros; “Histórico” acessível.
- Entradas/Saídas com descrição e data/hora funcionam em modais e não-modais.
- Histórico renderiza com filtros aplicados, estados (loading/empty/error) e ações (editar/excluir/duplicar).
- Valores monetários com máscara BRL, validados e normalizados.
- Persistência de transações com RLS por usuário; consultas e operações feitas exclusivamente via MCP Supabase.
- Logs sem erros após cada alteração; prévia validada para mudanças visuais.

**Ordem de Execução (Roadmap)**
- Navegação e acessibilidade: ajustar `role`, `aria-selected`, foco.
- Histórico (UI): estados, debounce, correção de `eventoEm`, ações dos itens.
- Máscara e validação monetária nos inputs.
- Estilos: tokens globais no `styles.css`, revisão responsiva.
- Persistência: criar tabela `transactions` com RLS; inserir/listar/editar/excluir via MCP; integrar filtros.
- Empréstimos: modelo de dados, UI e persistência básica.
- Investimentos: modelo de dados, UI e persistência básica.
- Observabilidade e feedback: mensagens, snackbar, tratamento de erros.
- Segurança: revisar advisors e políticas.
- Documentação: atualizar README e convenções.
- Testes/QA: navegar, validar filtros e ações, verificar logs após cada alteração.

Se preferir, posso iniciar pelas próximas etapas práticas: ajustar estados e acessibilidade da navegação, completar os estados do “Histórico” (loading/empty/error) e aplicar máscara BRL nos inputs, sempre validando na prévia e checando os logs do servidor logo após cada modificação.

### Todolist (Trae)
- Ajustar role=tablist e role=tab na sidebar.
- Alternar aria-selected e foco ao trocar de view.
- Garantir exibição correta da view “historico” na navegação.
- Revisar renderHistory e filtros por busca, tipo e datas.
- Adicionar estados “Carregando”, “Vazio” e “Erro” no histórico.
- Implementar debounce de 300ms na busca do histórico.
- Implementar edição de item do histórico (local).
- Implementar exclusão de item do histórico com confirmação (local).
- Implementar duplicação de item do histórico (local).
- Padronizar chave eventoEm em todos lançamentos e logs.
- Integrar snackbar/undo às operações do histórico (local).
- Limpar descrição e data/hora após salvar lançamentos.
- Aplicar máscara BRL em inputs de valor.
- Normalizar valor para número ao salvar.
- Validar valor mínimo > 0 e formato do valor.
- Tratar colagem e múltiplas vírgulas/pontos em valor.
- Criar tokens de design em styles.css (cores, tipografia, espaçamento).
- Usar tokens globais em historico.css.
- Revisar responsividade de grids e inputs.
- Ajustar hover/active/focus dos principais controles.
- Navegar tabs por teclado (setas esquerda/direita).
- Anunciar snackbar e erros com aria-live.
- Associar labels e aria-label corretamente aos campos.
- Gerenciar foco ao abrir/fechar modais.
- Definir esquema da tabela transactions.
- Criar migração DDL da tabela transactions (Supabase).
- Implementar RLS por user_id na tabela transactions.
- Inserir entradas/saídas na tabela transactions.
- Listar histórico paginado com filtros via backend.
- Editar transação persistente com confirmação.
- Excluir transação persistente com confirmação.
- Sincronizar criação local com insert no backend.
- Integrar paginação e filtros do backend na UI.
- Tratar erros de rede e exibir mensagens amigáveis.
- Definir modelo de dados de empréstimos.
- Atualizar UI de empréstimos com campos específicos.
- Persistir empréstimos e parcelas no backend.
- Refletir pagamentos de parcelas no histórico.
- Definir modelo de dados de investimentos.
- Atualizar UI de investimentos com campos específicos.
- Persistir aportes e resgates de investimentos.
- Refletir movimentos de investimentos no histórico.
- Padronizar snackbar para sucesso/erro/undo.
- Centralizar tratamento de erros de UI.
- Exibir mensagens claras ao falhar salvar/editar/excluir.
- Revisar advisors de segurança do Supabase.
- Confirmar RLS ativa e correta nas tabelas novas.
- Usar chaves publicáveis e proteger configs.
- Atualizar README com fluxos e campos das views.
- Documentar histórico local e persistente.
- Registrar processo de validação de prévia e logs.
- Documentar convenções de código e estilos.
- Testar adicionar/editar/excluir entradas e saídas.
- Testar filtros e paginação do histórico.
- Testar navegação e acessibilidade básica.
- Verificar logs do servidor após cada alteração de arquivo.
- Evitar re-renderizações com debounce/batch updates.
- Implementar paginação eficiente na lista de histórico.
- Otimizar manipulação de DOM em renderHistory.
- Remover código morto e referências obsoletas.
- Padronizar nomes de chaves e variáveis.
- Eliminar duplicações entre styles.css e historico.css.
- Validar critérios de aceite finais de todas as áreas.
        
