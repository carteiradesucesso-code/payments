import { supabase } from './supabaseClient.js'
import { parseToCents, formatBRL, somarCents, subtrairCents } from './finance.js'

const els = {
  userEmail: document.getElementById('user-email'),
  signoutBtn: document.getElementById('signout-btn'),
  shareInviteBtn: document.getElementById('share-invite-btn'),
  shareAcceptBtn: document.getElementById('share-accept-btn'),
  shareInviteArea: document.getElementById('share-invite-area'),
  shareInviteInput: document.getElementById('share-invite-input'),
  shareAcceptConfirmBtn: document.getElementById('share-accept-confirm-btn'),
  navToggle: document.getElementById('nav-toggle'),
  appSidebar: document.getElementById('app-sidebar'),
  sidebarBackdrop: document.querySelector('.sidebar-backdrop'),
  userJson: document.getElementById('user-json'),
  userJsonStatus: document.getElementById('user-json-status'),
  // Financeiro
  viewPainel: document.getElementById('view-painel'),
  chartSaldo: document.getElementById('chart-saldo'),
  chartES: document.getElementById('chart-es'),
  entradaValor: document.getElementById('entrada-valor'),
  entradaDesc: document.getElementById('entrada-desc'),
  entradaQuando: document.getElementById('entrada-quando'),
  entradaBtn: document.getElementById('entrada-btn'),
  entradaOut: document.getElementById('entrada-out'),
  saidaValor: document.getElementById('saida-valor'),
  saidaDesc: document.getElementById('saida-desc'),
  saidaQuando: document.getElementById('saida-quando'),
  saidaBtn: document.getElementById('saida-btn'),
  saidaOut: document.getElementById('saida-out'),
  empPrincipal: document.getElementById('emp-principal'),
  empTaxa: document.getElementById('emp-taxa'),
  empBtn: document.getElementById('emp-btn'),
  empOut: document.getElementById('emp-out'),
  empBar: document.getElementById('emp-bar'),
  empAmort: document.getElementById('emp-amort'),
  empPayBtn: document.getElementById('emp-pay-btn'),
  empPayInterestBtn: document.getElementById('emp-pay-interest-btn'),
  empSchedule: document.getElementById('emp-schedule'),
  empManageOpen: document.getElementById('emp-manage-open'),
  debtCircles: document.getElementById('debt-circles'),
  // Modal de empréstimo
  empModal: document.getElementById('modal-emp'),
  empModalPrincipal: document.getElementById('modal-emp-principal'),
  empModalTaxa: document.getElementById('modal-emp-taxa'),
  empModalConfirm: document.getElementById('modal-emp-confirm'),
  empModalPass: document.getElementById('modal-emp-pass'),
  empModalSetPass: document.getElementById('modal-emp-set-pass'),
  empModalSave: document.getElementById('modal-emp-save'),
  empModalClose: document.getElementById('modal-emp-close'),
  empModalDeleteConfirm: document.getElementById('modal-emp-delete-confirm'),
  empModalDeletePass: document.getElementById('modal-emp-delete-pass'),
  empModalDelete: document.getElementById('modal-emp-delete'),
  empModalOut: document.getElementById('modal-emp-out'),
  invPrincipal: document.getElementById('inv-principal'),
  invTaxa: document.getElementById('inv-taxa'),
  invMeses: document.getElementById('inv-meses'),
  invBtn: document.getElementById('inv-btn'),
  invOut: document.getElementById('inv-out'),
  invBar: document.getElementById('inv-bar'),
  // Navegação rápida
  quickPlus: document.getElementById('quick-plus'),
  quickMinus: document.getElementById('quick-minus'),
  quickClear: document.getElementById('quick-clear'),
  quickClearMenuBtn: document.getElementById('quick-clear-menu-btn'),
    clearMenu: document.getElementById('clear-menu'),
    snackbar: document.getElementById('snackbar'),
    // Histórico
    viewHistorico: document.getElementById('view-historico'),
    histBusca: document.getElementById('hist-busca'),
    histInicio: document.getElementById('hist-inicio'),
    histFim: document.getElementById('hist-fim'),
    histTipo: document.getElementById('hist-tipo'),
    histAplicar: document.getElementById('hist-aplicar'),
    histList: document.getElementById('hist-list'),
  // Modais
  entradaModal: document.getElementById('modal-entrada'),
    modalEntradaValor: document.getElementById('modal-entrada-valor'),
    modalEntradaDesc: document.getElementById('modal-entrada-desc'),
    modalEntradaQuando: document.getElementById('modal-entrada-quando'),
  modalEntradaAdd: document.getElementById('modal-entrada-add'),
  modalEntradaOut: document.getElementById('modal-entrada-out'),
  modalEntradaClose: document.getElementById('modal-entrada-close'),
  saidaModal: document.getElementById('modal-saida'),
    modalSaidaValor: document.getElementById('modal-saida-valor'),
    modalSaidaDesc: document.getElementById('modal-saida-desc'),
    modalSaidaQuando: document.getElementById('modal-saida-quando'),
  modalSaidaAdd: document.getElementById('modal-saida-add'),
  modalSaidaOut: document.getElementById('modal-saida-out'),
  modalSaidaClose: document.getElementById('modal-saida-close'),
}

function setUserEmail(email) {
  if (els.userEmail) els.userEmail.textContent = email ? `Logado como: ${email}` : ''
}

function setLoadingSignout(loading) {
  const btn = els.signoutBtn
  if (!btn) return
  if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent || 'Sair'
  btn.disabled = !!loading
  btn.setAttribute('aria-busy', loading ? 'true' : 'false')
  btn.classList.toggle('loading', !!loading)
  btn.textContent = loading ? 'Saindo…' : btn.dataset.originalText
  document.body.classList.toggle('app-busy', !!loading)
}

function setUserJsonStatus(text) {
  if (els.userJsonStatus) els.userJsonStatus.textContent = text || ''
}

// =========================
// Máscara BRL (entrada de valor)
// =========================
function formatCentsForInput(cents) {
  const n = Math.max(0, Number(cents) || 0)
  const inteiro = Math.floor(n / 100)
  const dec = String(n % 100).padStart(2, '0')
  const inteiroStr = String(inteiro).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${inteiroStr},${dec}`
}

function attachBRLMask(input) {
  if (!input) return
  try {
    if (window.Cleave) {
      new Cleave(input, {
        numeral: true,
        numeralDecimalMark: ',',
        delimiter: '.',
        numeralDecimalScale: 2,
        numeralIntegerScale: 15,
        numeralPositiveOnly: false
      })
      input.classList.remove('input-error')
      input.setAttribute('aria-invalid', 'false')
      return
    }
  } catch {}
  const update = () => {
    const digits = String(input.value || '').replace(/\D+/g, '')
    const cents = Math.max(0, Number(digits || '0'))
    input.value = formatCentsForInput(cents)
    input.classList.remove('input-error')
    input.setAttribute('aria-invalid', 'false')
  }
  input.addEventListener('input', update)
  input.addEventListener('focus', () => {
    update()
    try { input.select() } catch {}
  })
  input.addEventListener('blur', () => { update() })
  update()
}

async function renderUserInfo() {
  try {
    if (!els.userJson) return
    // Primeiro: usa a sessão atual para mostrar algo imediatamente
    const { data: { session } } = await supabase.auth.getSession()
    const userFromSession = session?.user || null
    const initial = userFromSession ? JSON.stringify(userFromSession, null, 2) : 'Nenhum usuário logado.'
    els.userJson.textContent = initial
    setUserJsonStatus(userFromSession ? 'Carregado da sessão.' : 'Nenhum usuário em sessão.')
    console.log('[dashboard] renderUserInfo', { hasUser: !!userFromSession })
    console.log('[dashboard] user-json rendered (session)', {
      length: initial?.length || 0,
      startsWith: initial?.slice(0, 30) || ''
    })

    // Depois: tenta obter o usuário completo via getUser() e atualiza se disponível
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const refreshed = JSON.stringify(user, null, 2)
      els.userJson.textContent = refreshed
      setUserJsonStatus('Atualizado via getUser().')
      console.log('[dashboard] user-json updated (getUser)', {
        length: refreshed.length,
        startsWith: refreshed.slice(0, 30)
      })
    }
  } catch (e) {
    if (els.userJson) els.userJson.textContent = `Erro ao carregar dados: ${e?.message || e}`
    setUserJsonStatus(`Erro ao carregar dados: ${e?.message || e}`)
    console.error('[dashboard] renderUserInfo error', e)
  }
}

async function requireAuth() {
  // Primeiro, tenta obter a sessão atual
  const { data: { session: now } } = await supabase.auth.getSession()
  if (now?.user) {
    console.log('[dashboard] requireAuth ok (imediato)', { email: now.user.email })
    return now
  }

  // Aguarda INITIAL_SESSION/SIGNED_IN com timeout curto para evitar redirecionar cedo demais
  const session = await waitForInitialSession(3000)
  if (session?.user) {
    console.log('[dashboard] requireAuth ok (após INITIAL_SESSION)', { email: session.user.email })
    return session
  }

  navigateToLoginOnce('requireAuth')
  return null
}

async function initDashboard() {
  console.log('[dashboard] init')
  const session = await requireAuth()
  if (!session) return
  setUserEmail(session.user.email)
  await renderUserInfo()

  // Inicializa área financeira
  initFinance()
  // Inicializa navegação do menu lateral e ações rápidas
  initNavigation()
  // Inicializa modais
  initModals()
  // Aplica máscara BRL aos campos de valor (views e modais)
  attachBRLMask(els.entradaValor)
  attachBRLMask(els.saidaValor)
  attachBRLMask(els.modalEntradaValor)
  attachBRLMask(els.modalSaidaValor)
  attachBRLMask(els.empModalPrincipal)
  attachBRLMask(els.empAmort)
  attachBRLMask(els.invPrincipal)
  // Inicializa histórico
  initHistorico()
  // Carrega empréstimo persistido e seus pagamentos
  await loadPersistedLoanIntoUI()
  // Renderiza resumo de dívidas com círculos
  await renderDebtSummary()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard)
} else {
  initDashboard()
}

els.signoutBtn?.addEventListener('click', async (e) => {
  e.preventDefault()
  setLoadingSignout(true)
  console.log('[dashboard] signout clicked')
  try {
    // Garante progresso mesmo em redes instáveis
    await Promise.race([
      supabase.auth.signOut(),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ])
    console.log('[dashboard] signout resolved (or timed out)')
  } catch (err) {
    console.error('[dashboard] signout error', err)
  } finally {
    // Mantém feedback até o redirect ocorrer
    navigateToLoginOnce('signout')
  }
})

// Toggle da sidebar no mobile (drawer) com acessibilidade
function setSidebarOpen(open) {
  try {
    document.body.classList.toggle('sidebar-open', !!open)
    if (els.sidebarBackdrop) els.sidebarBackdrop.hidden = !open
    if (els.appSidebar) els.appSidebar.setAttribute('aria-hidden', String(!open))
    if (els.navToggle) els.navToggle.setAttribute('aria-expanded', String(!!open))
  } catch {}
}
els.navToggle?.addEventListener('click', (e) => {
  e.preventDefault()
  const open = !document.body.classList.contains('sidebar-open')
  setSidebarOpen(open)
})
els.sidebarBackdrop?.addEventListener('click', () => setSidebarOpen(false))
// Fecha ao selecionar uma opção
document.addEventListener('click', (e) => {
  const t = e.target
  if (t instanceof HTMLElement && t.classList.contains('nav-link')) setSidebarOpen(false)
})
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setSidebarOpen(false) })

// Evita redirects agressivos: só reage quando de fato foi SIGNED_OUT
supabase.auth.onAuthStateChange((_event, session) => {
  console.log('[dashboard] onAuthStateChange', _event, { hasUser: !!session?.user })
  if (_event === 'SIGNED_OUT') {
    navigateToLoginOnce('signed_out_event')
  }
})

// Compartilhamento (somente leitura): gerar e aceitar convites (top-level)
els.shareInviteBtn?.addEventListener('click', async (e) => {
  e.preventDefault()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      showSnackbar('Sessão não encontrada. Faça login novamente.', null, null, 4000)
      return
    }
    const code = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
    const { data, error } = await supabase
      .from('debt_shares')
      .insert({ owner_user_id: user.id, code })
      .select('code')
      .single()
    if (error) {
      console.error('[share] gerar convite error', error)
      showSnackbar('Falha ao gerar convite.', null, null, 4000)
      return
    }
    const inviteCode = data?.code || code
    try {
      await navigator.clipboard.writeText(inviteCode)
      showSnackbar(`Convite gerado e copiado: ${inviteCode}`, null, null, 6000)
    } catch {
      showSnackbar(`Convite gerado: ${inviteCode}`, null, null, 6000)
    }
  } catch (err) {
    console.error('[share] gerar convite unexpected', err)
    showSnackbar('Erro inesperado ao gerar convite.', null, null, 4000)
  }
})
els.shareAcceptBtn?.addEventListener('click', (e) => {
  e.preventDefault()
  try {
    console.log('[share] click usar convite button')
    if (!els.shareInviteArea) return
    const hidden = !els.shareInviteArea.style.display || els.shareInviteArea.style.display === 'none'
    els.shareInviteArea.style.display = hidden ? 'inline-flex' : 'none'
    els.shareAcceptBtn?.setAttribute('aria-expanded', hidden ? 'true' : 'false')
    console.log('[share] invite area display =', els.shareInviteArea.style.display)
    if (!hidden) {
      if (els.shareInviteInput) els.shareInviteInput.value = ''
    } else {
      els.shareInviteInput?.focus()
    }
  } catch (err) {
    console.error('[share] toggle invite input unexpected', err)
    showSnackbar('Erro ao abrir área de convite.', null, null, 4000)
  }
})
console.log('[share] accept button listener attached:', !!els.shareAcceptBtn)
els.shareAcceptConfirmBtn?.addEventListener('click', async (e) => {
  e.preventDefault()
  try {
    const code = els.shareInviteInput?.value || ''
    const trimmed = code.trim()
    console.log('[share] confirm invite code length =', trimmed.length)
    if (!trimmed) {
      showSnackbar('Informe o código de convite.', null, null, 4000)
      els.shareInviteInput?.focus()
      return
    }
    const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidLike.test(trimmed)) {
      console.log('[share] invalid invite code format')
      showSnackbar('Código inválido. Verifique e tente novamente.', null, null, 5000)
      els.shareInviteInput?.focus()
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      console.log('[share] no session to accept invite')
      showSnackbar('Sessão não encontrada. Faça login para aceitar convite.', null, null, 5000)
      return
    }
    console.log('[share] calling RPC accept_debt_share')
    const { data, error } = await supabase.rpc('accept_debt_share', { p_code: trimmed })
    if (error) {
      console.error('[share] aceitar convite error', error)
      showSnackbar('Falha ao aceitar convite.', null, null, 5000)
      return
    }
    if (data === true) {
      showSnackbar('Convite aceito. Empréstimos compartilhados visíveis em modo leitura.', null, null, 6000)
      if (els.shareInviteArea) els.shareInviteArea.style.display = 'none'
      if (els.shareInviteInput) els.shareInviteInput.value = ''
      console.log('[share] invite accepted; refreshing debt summary')
      await renderDebtSummary()
    } else {
      console.log('[share] invite code invalid or already used')
      showSnackbar('Convite inválido ou já utilizado.', null, null, 5000)
    }
  } catch (err) {
    console.error('[share] aceitar convite unexpected', err)
    showSnackbar('Erro inesperado ao aceitar convite.', null, null, 5000)
  }
})
console.log('[share] confirm button listener attached:', !!els.shareAcceptConfirmBtn)
els.shareInviteInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    console.log('[share] invite input Enter pressed')
    els.shareAcceptConfirmBtn?.click()
  }
})
console.log('[share] invite input keydown listener attached:', !!els.shareInviteInput)

// Aguarda INITIAL_SESSION com timeout curto
function waitForInitialSession(timeoutMs = 3000) {
  return new Promise(async (resolve) => {
    let resolved = false
    const finish = (sess) => { if (!resolved) { resolved = true; resolve(sess || null) } }

    // Tenta obter imediatamente
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) return finish(session)
    } catch {}

    const t = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        finish(session)
      } catch {
        finish(null)
      }
    }, timeoutMs)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && sess?.user) {
        clearTimeout(t)
        subscription.unsubscribe()
        finish(sess)
      }
    })
  })
}

// Guard de navegação única para evitar ping-pong
let dashNavInProgress = false
function navigateToLoginOnce(source = 'unknown') {
  if (dashNavInProgress) {
    console.log('[dashboard] navigation already in progress', source)
    return
  }
  dashNavInProgress = true
  window.location.replace('index.html?from=dashboard')
}

// =========================
// Financeiro (MVP)
// =========================

let totalEntradasCents = 0
let totalSaidasCents = 0
const history = []

// Estado do empréstimo com juros mensais
const loan = {
  principalCents: 0,
  residualCents: 0,
  monthlyRatePct: 5,
  schedule: [],
  debtId: null
}

function toDecimal(cents) {
  return Number(((cents || 0) / 100).toFixed(2))
}

function toISODateOnly(date = new Date()) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function getActiveUserId() {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

async function persistDivida(principalCents, taxaMensalPct) {
  const userId = await getActiveUserId()
  if (!userId) return { ok: false, error: 'no_user' }
  const payload = {
    user_id: userId,
    titulo: 'Empréstimo',
    descricao: null,
    valor_principal: toDecimal(principalCents),
    taxa_juros: Number(taxaMensalPct || 0),
    periodo_juros: 'mensal',
    data_inicio: toISODateOnly(new Date()),
    status: 'ativa'
  }
  const { data, error } = await supabase.from('dividas').insert(payload).select('id').single()
  if (error) return { ok: false, error }
  return { ok: true, id: data?.id || null }
}
// Versão segura que inclui hash da senha de exclusão
async function persistDividaSecure(principalCents, taxaMensalPct, deletePassHash) {
  const userId = await getActiveUserId()
  if (!userId) return { ok: false, error: 'no_user' }
  const payload = {
    user_id: userId,
    titulo: 'Empréstimo',
    descricao: null,
    valor_principal: toDecimal(principalCents),
    taxa_juros: Number(taxaMensalPct || 0),
    periodo_juros: 'mensal',
    data_inicio: toISODateOnly(new Date()),
    status: 'ativa',
    delete_password_hash: deletePassHash || null
  }
  const { data, error } = await supabase.from('dividas').insert(payload).select('id').single()
  if (error) return { ok: false, error }
  return { ok: true, id: data?.id || null }
}
// Hash SHA-256 (hex) para senha
async function sha256Hex(text) {
  const enc = new TextEncoder()
  const data = enc.encode(text)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const bytes = Array.from(new Uint8Array(digest))
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function persistPagamento(jurosCents, amortCents, eventoEm) {
  const userId = await getActiveUserId()
  if (!userId || !loan.debtId) return { ok: false, error: 'missing_ids' }
  const total = (jurosCents || 0) + (amortCents || 0)
  const payload = {
    debt_id: loan.debtId,
    user_id: userId,
    valor_pago: toDecimal(total),
    juros_pago: toDecimal(jurosCents || 0),
    principal_amortizado: toDecimal(amortCents || 0),
    data_pagamento: toISODateOnly(eventoEm || new Date())
  }
  const { error } = await supabase.from('pagamentos').insert(payload)
  if (error) return { ok: false, error }
  return { ok: true }
}

async function fetchLatestDividaForUser() {
  const userId = await getActiveUserId()
  if (!userId) return null
  const { data, error } = await supabase
    .from('dividas')
    .select('id, valor_principal, taxa_juros, periodo_juros, data_inicio, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
  if (error) {
    console.error('[emp] fetchLatestDividaForUser error', error)
    return null
  }
  return (Array.isArray(data) && data[0]) ? data[0] : null
}

async function fetchAllDividasForUser() {
  const userId = await getActiveUserId()
  if (!userId) return []
  const { data, error } = await supabase
    .from('dividas')
    .select('id, user_id, titulo, valor_principal, taxa_juros, periodo_juros, data_inicio, status, created_at')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[emp] fetchAllDividasForUser error', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

async function fetchPagamentosForDebt(debtId) {
  if (!debtId) return []
  const { data, error } = await supabase
    .from('pagamentos')
    .select('id, valor_pago, juros_pago, principal_amortizado, data_pagamento, created_at')
    .eq('debt_id', debtId)
    .order('data_pagamento', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) {
    console.error('[emp] fetchPagamentosForDebt error', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

async function loadPersistedLoanIntoUI() {
  try {
    const divida = await fetchLatestDividaForUser()
    if (!divida) {
      // Sem dívida persistida, mantém UI padrão
      return
    }
    // Atualiza estado local
    loan.debtId = divida.id
    loan.principalCents = Math.round(Number(divida.valor_principal || 0) * 100)
    loan.monthlyRatePct = Number(divida.taxa_juros || loan.monthlyRatePct)
    loan.startDateIso = divida.data_inicio
    // Calcula residual a partir dos pagamentos persistidos
    const pays = await fetchPagamentosForDebt(divida.id)
    loan.pays = pays
    const principalAmortizadoTotal = pays.reduce((acc, p) => acc + Math.round(Number(p.principal_amortizado || 0) * 100), 0)
    loan.residualCents = Math.max(0, subtrairCents(loan.principalCents, principalAmortizadoTotal))
    // Reconstrói schedule a partir dos pagamentos
    loan.schedule = pays.map((p, idx) => ({
      mes: idx + 1,
      jurosCents: Math.round(Number(p.juros_pago || 0) * 100),
      amortCents: Math.round(Number(p.principal_amortizado || 0) * 100),
      residualCents: 0 // ajustado abaixo
    }))
    // Ajusta residual progressivo para cada item da schedule
    let runningResidual = loan.principalCents
    loan.schedule = loan.schedule.map((it) => {
      runningResidual = Math.max(0, subtrairCents(runningResidual, it.amortCents))
      return { ...it, residualCents: runningResidual }
    })

    // Aplica capitalização automática de juros não pagos se o dia 05 já passou (TZ Fortaleza)
    applyMonthlyCapitalizationIfDue()

    // Atualiza UI
    if (els.empOut) {
      const principalBRL = formatBRL(loan.principalCents)
      const residualBase = Number.isFinite(loan.residualCentsDisplay) ? loan.residualCentsDisplay : loan.residualCents
      const residualBRL = formatBRL(residualBase)
      const taxa = Number(loan.monthlyRatePct || 0).toFixed(2)
      els.empOut.textContent = `Empréstimo ativo: Principal ${principalBRL} | Juros mensais ${taxa}%\nSaldo devedor: ${residualBRL}`
      pulse(els.empOut, 'good')
    }
    updatePaymentBar(0, 0)
    renderLoanSchedule()
  } catch (err) {
    console.error('[emp] loadPersistedLoanIntoUI unexpected', err)
  }
}

function createDebtCircleSVG({ principalCents, amortizedCents, size = 140, stroke = 12 }) {
  const pAmort = principalCents > 0 ? Math.min(1, Math.max(0, amortizedCents / principalCents)) : 0
  const pSaldo = 1 - pAmort
  const half = size / 2
  const r = half - stroke / 2 - 2
  const C = 2 * Math.PI * r
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`)
  svg.setAttribute('width', `${size}`)
  svg.setAttribute('height', `${size}`)
  svg.style.display = 'block'
  svg.style.margin = '8px auto'

  const makeCircle = (cls, color, width, dasharray, dashoffset) => {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    c.setAttribute('cx', `${half}`)
    c.setAttribute('cy', `${half}`)
    c.setAttribute('r', `${r}`)
    c.setAttribute('fill', 'none')
    c.setAttribute('stroke', color)
    c.setAttribute('stroke-width', `${width}`)
    c.setAttribute('class', cls)
    c.style.transform = 'rotate(-90deg)'
    c.style.transformOrigin = '50% 50%'
    if (dasharray !== undefined) c.setAttribute('stroke-dasharray', `${dasharray}`)
    if (dashoffset !== undefined) c.setAttribute('stroke-dashoffset', `${dashoffset}`)
    c.style.transition = 'stroke-dasharray 600ms ease, stroke-dashoffset 600ms ease'
    return c
  }
  // Trilho
  svg.appendChild(makeCircle('trail', 'rgba(255,255,255,0.18)', stroke, C, 0))
  // Amortizado (verde da paleta)
  const amortLen = C * pAmort
  const amort = makeCircle('amort', 'var(--accent)', stroke, `${amortLen} ${C}`, 0)
  amort.setAttribute('stroke-linecap', 'round')
  svg.appendChild(amort)
  // Saldo devedor (vermelho, consistente com layout)
  const saldoLen = C * pSaldo
  const saldo = makeCircle('saldo', 'var(--danger)', stroke, `${saldoLen} ${C}`, C * pAmort)
  saldo.setAttribute('stroke-linecap', 'round')
  svg.appendChild(saldo)
  // Texto central (duas casas decimais, pt-BR)
  const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  txt.setAttribute('x', `${half}`)
  txt.setAttribute('y', `${half}`)
  txt.setAttribute('text-anchor', 'middle')
  txt.setAttribute('dominant-baseline', 'central')
  txt.setAttribute('font-size', `${Math.round(size * 0.18)}`)
  txt.setAttribute('fill', 'var(--fg)')
  const pct = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(pAmort * 100)
  txt.textContent = `${pct}%`
  svg.appendChild(txt)
  return svg
}

async function renderDebtSummary() {
  const container = els.debtCircles
  if (!container) return
  container.innerHTML = ''
  const dividas = await fetchAllDividasForUser()
  const activeUserId = await getActiveUserId()
  if (!dividas.length) {
    const p = document.createElement('p')
    p.className = 'sub'
    p.textContent = 'Nenhuma dívida registrada.'
    container.appendChild(p)
    return
  }
  for (const d of dividas) {
    const isOwner = d.user_id === activeUserId
    const pays = await fetchPagamentosForDebt(d.id)
    const amortTotalCents = pays.reduce((acc, p) => acc + Math.round(Number(p.principal_amortizado || 0) * 100), 0)
    const principalCents = Math.round(Number(d.valor_principal || 0) * 100)
    const residualBaseCents = Math.max(0, subtrairCents(principalCents, amortTotalCents))
    const taxa = Number(d.taxa_juros || 0)
    const cap = computeCapitalizationForDebt({ residualBaseCents, ratePct: taxa, pays, debtId: d.id, startDateIso: d.data_inicio })
    const baseCents = Number.isFinite(cap.residualCentsDisplay) ? cap.residualCentsDisplay : residualBaseCents
  const card = document.createElement('div')
  card.className = 'panel'
  card.style.alignItems = 'center'
  card.style.textAlign = 'center'
  card.style.position = 'relative'
  const title = document.createElement('h4')
  title.textContent = d.titulo || 'Empréstimo'
  title.style.marginTop = '0'
  card.appendChild(title)
  if (!isOwner) {
    const ro = document.createElement('p')
    ro.className = 'sub'
    ro.textContent = 'Somente leitura (compartilhado)'
    ro.style.marginTop = '-6px'
    card.appendChild(ro)
  }
  const svg = createDebtCircleSVG({ principalCents, amortizedCents: amortTotalCents, size: 140, stroke: 12 })
  card.appendChild(svg)
  // Saldo devedor em destaque
  const saldoHighlight = document.createElement('div')
  saldoHighlight.className = 'saldo-highlight'
  saldoHighlight.textContent = `Saldo devedor: ${formatBRL(baseCents)}`
  card.appendChild(saldoHighlight)
  const nextInterestCents = Math.round(baseCents * (taxa / 100))
    // Botão Excluir no canto superior direito
    const delBtn = document.createElement('button')
    delBtn.className = 'btn danger'
    delBtn.textContent = 'Excluir'
    delBtn.setAttribute('aria-label', 'Excluir empréstimo')
    delBtn.title = 'Excluir empréstimo'
    delBtn.style.position = 'absolute'
    delBtn.style.top = '8px'
    delBtn.style.right = '8px'
    delBtn.style.padding = '4px 10px'
    delBtn.style.fontSize = '12px'
    if (!isOwner) {
      delBtn.disabled = true
      delBtn.title = 'Ação desabilitada em modo somente leitura'
    }
    delBtn.addEventListener('click', async () => {
      const promptRes = await promptDeleteCredentials()
      if (!promptRes?.ok || !promptRes.pwd) return
      const res = await deleteDebtById(d.id, promptRes.pwd)
      if (res?.ok) {
        showSnackbar('Empréstimo excluído.', null, null, 4000)
        await renderDebtSummary()
      } else {
        const msg = (res?.error === 'invalid_password') ? 'Senha incorreta. Não foi possível excluir.' : 'Erro ao excluir. Tente novamente.'
        showSnackbar(msg, null, null, 4000)
        console.error('[emp] deleteDebtById error', res?.error)
      }
    })
    card.appendChild(delBtn)
    // Tornar o card inteiro clicável para abrir o cronograma
    card.setAttribute('role', 'button')
    card.setAttribute('tabindex', '0')
    card.setAttribute('aria-label', 'Abrir cronograma desta dívida')
    card.title = 'Abrir cronograma desta dívida'
    card.style.cursor = 'pointer'
    card.addEventListener('click', (e) => {
      const t = e.target
      // Evitar abrir cronograma quando clicar em controles internos
      if (t.closest('button') || t.closest('input') || t.closest('label') || t.closest('.form-row') || t.closest('.actions')) {
        return
      }
      e.preventDefault()
      openDebtScheduleModal(d)
    })
    card.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === card) {
        e.preventDefault()
        openDebtScheduleModal(d)
      }
    })
    // Pagamento do mês (embutido por empréstimo)
    const payLabel = document.createElement('label')
    payLabel.setAttribute('for', `pay-${d.id}`)
    payLabel.textContent = 'Pagamento do mês (R$)'
    card.appendChild(payLabel)
    const payInput = document.createElement('input')
    payInput.id = `pay-${d.id}`
    payInput.type = 'text'
    payInput.inputMode = 'decimal'
    payInput.placeholder = '0,00'
    payInput.className = 'form-control'
    attachBRLMask(payInput)
    // Linha de formulário: input + botão lado a lado
    const formRow = document.createElement('div')
    formRow.className = 'form-row'
    formRow.style.marginTop = '8px'
    const payBtn = document.createElement('button')
    payBtn.className = 'btn-primary'
    payBtn.setAttribute('aria-label', 'Registrar pagamento do mês')
    payBtn.textContent = 'Registrar pagamento'
    if (!isOwner) {
      payInput.disabled = true
      payBtn.disabled = true
      payBtn.title = 'Ação desabilitada em modo somente leitura'
    }
    payBtn.addEventListener('click', async (e) => {
      e.preventDefault()
      const totalPagoCents = parseToCents(payInput.value)
      // Ativar este empréstimo no estado local
      loan.debtId = d.id
      loan.principalCents = principalCents
      loan.residualCents = baseCents
      loan.monthlyRatePct = taxa
      // Reconstruir cronograma a partir dos pagamentos existentes
      let residualTracker = principalCents
      const sched = []
      for (let i = 0; i < pays.length; i++) {
        const juros = Math.round(Number(pays[i].juros_pago || 0) * 100)
        const amort = Math.round(Number(pays[i].principal_amortizado || 0) * 100)
        residualTracker = Math.max(0, subtrairCents(residualTracker, amort))
        sched.push({ mes: i + 1, jurosCents: juros, amortCents: amort, residualCents: residualTracker })
      }
      loan.schedule = sched
      await registrarPagamentoMes(totalPagoCents)
      payInput.value = ''
      await renderDebtSummary()
    })
    formRow.appendChild(payInput)
    formRow.appendChild(payBtn)
    card.appendChild(formRow)

    // Ação: desfazer último pagamento persistido
    const undoActions = document.createElement('div')
    undoActions.className = 'actions'
    undoActions.style.marginTop = '8px'
    const undoBtn = document.createElement('button')
    undoBtn.className = 'outline'
    undoBtn.textContent = 'Desfazer último pagamento'
    undoBtn.title = 'Remove o último pagamento persistido desta dívida'
    undoBtn.setAttribute('aria-label', 'Desfazer último pagamento desta dívida')
    if (!pays.length) {
      undoBtn.disabled = true
      undoBtn.title = 'Não há pagamentos para desfazer'
    }
    if (!isOwner) {
      undoBtn.disabled = true
      undoBtn.title = 'Ação desabilitada em modo somente leitura'
    }
    undoBtn.addEventListener('click', async () => {
      const ok = window.confirm('Remover o último pagamento desta dívida?')
      if (!ok) return
      const res = await deleteLastPagamentoForDebt(d.id)
      if (res?.ok) {
        showSnackbar('Último pagamento removido.', null, null, 4000)
        await loadPersistedLoanIntoUI()
        renderLoanSchedule()
        await renderDebtSummary()
      } else {
        console.error('[emp] deleteLastPagamentoForDebt error', res?.error)
        showSnackbar('Erro ao desfazer pagamento. Tente novamente.', null, null, 5000)
      }
})

    undoActions.appendChild(undoBtn)
    card.appendChild(undoActions)
    container.appendChild(card)
  }
}

// Remover o último pagamento persistido para uma dívida
async function deleteLastPagamentoForDebt(debtId) {
  try {
    if (!debtId) return { ok: false, error: 'missing_debt_id' }
    const { data, error } = await supabase
      .from('pagamentos')
      .select('id')
      .eq('debt_id', debtId)
      .order('data_pagamento', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) {
      return { ok: false, error }
    }
    const row = Array.isArray(data) && data[0]
    if (!row?.id) {
      return { ok: false, error: 'no_payment' }
    }
    const { error: delErr } = await supabase
      .from('pagamentos')
      .delete()
      .eq('id', row.id)
    if (delErr) {
      return { ok: false, error: delErr }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err }
  }
}

// Excluir dívida e seus pagamentos
async function deleteDebtById(debtId, providedPassword = '') {
  try {
    if (!debtId) return { ok: false, error: 'missing_debt_id' }
    // Verificar senha
    const { data: drow, error: derr } = await supabase
      .from('dividas')
      .select('id, delete_password_hash')
      .eq('id', debtId)
      .single()
    if (derr) {
      console.error('[emp] deleteDebtById fetch error', derr)
      return { ok: false, error: derr }
    }
    const storedHash = drow?.delete_password_hash || null
    const passOk = storedHash ? (await sha256Hex(providedPassword || '')) === storedHash : false
    if (!passOk) {
      return { ok: false, error: 'invalid_password' }
    }
    // Remove pagamentos vinculados
    const { error: payErr } = await supabase
      .from('pagamentos')
      .delete()
      .eq('debt_id', debtId)
    if (payErr) {
      console.error('[emp] deleteDebtById pagamentos error', payErr)
      return { ok: false, error: payErr }
    }
    // Remove a dívida
    const { error: debtErr } = await supabase
      .from('dividas')
      .delete()
      .eq('id', debtId)
    if (debtErr) {
      console.error('[emp] deleteDebtById dividas error', debtErr)
      return { ok: false, error: debtErr }
    }
    // Se era a dívida ativa no estado local, limpar UI
    if (loan.debtId === debtId) {
      loan.debtId = null
      loan.principalCents = 0
      loan.residualCents = 0
      loan.schedule = []
      renderLoanSchedule()
      updatePaymentBar(0, 0)
      if (els.empOut) {
        els.empOut.textContent = 'Nenhum empréstimo ativo.'
      }
    }
    return { ok: true }
  } catch (err) {
    console.error('[emp] deleteDebtById unexpected', err)
    return { ok: false, error: err }
  }
}

// Render auxiliar para textos de saída com base nos totais
function renderTotals(pulseKind = null) {
  const saldoParcial = subtrairCents(totalEntradasCents, totalSaidasCents)
  const msgEntrada = `Total de entradas: ${formatBRL(totalEntradasCents)} | Saldo parcial: ${formatBRL(saldoParcial)}`
  const msgSaida = `Total de saídas: ${formatBRL(totalSaidasCents)} | Saldo parcial: ${formatBRL(saldoParcial)}`
  if (els.entradaOut) els.entradaOut.textContent = msgEntrada
  if (els.saidaOut) els.saidaOut.textContent = msgSaida
  if (pulseKind === 'good') { pulse(els.entradaOut, 'good'); pulse(els.saidaOut, 'good') }
  if (pulseKind === 'bad') { pulse(els.entradaOut, 'bad'); pulse(els.saidaOut, 'bad') }
}

// Snapshot visual para barras e textos de modais
function getVisualSnapshot() {
  try {
    const interestBar = els.empBar?.querySelector('.bar.interest')
    const amortBar = els.empBar?.querySelector('.bar.amort')
    const gainBar = els.invBar?.querySelector('.bar.gain')
    return {
      empInterest: interestBar?.style.width || '',
      empAmort: amortBar?.style.width || '',
      invGain: gainBar?.style.width || '',
      modalEntradaOut: els.modalEntradaOut?.textContent || '',
      modalSaidaOut: els.modalSaidaOut?.textContent || ''
    }
  } catch { return {} }
}
function applyVisualSnapshot(snap) {
  try {
    const interestBar = els.empBar?.querySelector('.bar.interest')
    const amortBar = els.empBar?.querySelector('.bar.amort')
    const gainBar = els.invBar?.querySelector('.bar.gain')
    if (interestBar && typeof snap.empInterest === 'string') interestBar.style.width = snap.empInterest
    if (amortBar && typeof snap.empAmort === 'string') amortBar.style.width = snap.empAmort
    if (gainBar && typeof snap.invGain === 'string') gainBar.style.width = snap.invGain
  } catch {}
  if (els.modalEntradaOut && typeof snap.modalEntradaOut === 'string') els.modalEntradaOut.textContent = snap.modalEntradaOut
  if (els.modalSaidaOut && typeof snap.modalSaidaOut === 'string') els.modalSaidaOut.textContent = snap.modalSaidaOut
}

// Pilha de undo simples
const undoStack = []
function pushUndoSnapshot(kind = 'generic') {
  undoStack.push({
    kind,
    totals: { entradas: totalEntradasCents, saidas: totalSaidasCents },
    visuals: getVisualSnapshot(),
    ts: Date.now()
  })
}
function undoLast() {
  const snap = undoStack.pop()
  if (!snap) return false
  totalEntradasCents = Number(snap.totals.entradas) || 0
  totalSaidasCents = Number(snap.totals.saidas) || 0
  renderTotals('good')
  applyVisualSnapshot(snap.visuals)
  return true
}

// Snackbar com ação (ex.: Desfazer)
let snackbarTimer = null
function showSnackbar(message, actionLabel = 'Desfazer', onAction = null, ttlMs = 6000) {
  try {
    if (window.Toastify) {
      const node = document.createElement('div')
      const span = document.createElement('span')
      span.textContent = message
      node.appendChild(span)
      if (onAction) {
        const btn = document.createElement('button')
        btn.textContent = actionLabel || 'Desfazer'
        btn.style.marginLeft = '12px'
        btn.onclick = () => { try { onAction() } finally { toast.hideToast() } }
        node.appendChild(btn)
      }
      const toast = window.Toastify({
        node,
        duration: ttlMs,
        close: true,
        gravity: 'top',
        position: 'right',
        stopOnFocus: true
      })
      toast.showToast()
      return
    }
  } catch {}
  const root = els.snackbar
  if (!root) return
  if (snackbarTimer) { clearTimeout(snackbarTimer); snackbarTimer = null }
  root.innerHTML = ''
  const msgEl = document.createElement('span')
  msgEl.className = 'msg'
  msgEl.textContent = message
  const actionBtn = document.createElement('button')
  actionBtn.className = 'action'
  actionBtn.textContent = actionLabel
  const closeBtn = document.createElement('button')
  closeBtn.className = 'close'
  closeBtn.textContent = 'Fechar'
  root.appendChild(msgEl)
  if (onAction) root.appendChild(actionBtn)
  root.appendChild(closeBtn)
  root.hidden = false
  actionBtn.onclick = () => {
    try { onAction?.() } finally { hideSnackbar() }
  }
  closeBtn.onclick = hideSnackbar
  snackbarTimer = setTimeout(hideSnackbar, ttlMs)
}
function hideSnackbar() {
  const root = els.snackbar
  if (!root) return
  root.hidden = true
  root.innerHTML = ''
  if (snackbarTimer) { clearTimeout(snackbarTimer); snackbarTimer = null }
}

// Game feel helpers (necessário, suficiente e proporcional)
function addTransientClass(el, className, ms = 300) {
  if (!el) return
  el.classList.add(className)
  setTimeout(() => el.classList.remove(className), ms)
}
function ripple(btn, danger = false) {
  if (!btn) return
  if (danger) btn.classList.add('danger')
  btn.classList.add('clicked')
  setTimeout(() => {
    btn.classList.remove('clicked')
    btn.classList.remove('danger')
  }, 420)
}
function pulse(el, type = 'good') { addTransientClass(el, type === 'good' ? 'pulse-good' : 'pulse-bad', 280) }

function animateFinanceFeedback(kind) {
  if (kind === 'entrada') {
    ripple(els.quickPlus, false)
    pulse(els.entradaOut, 'good')
  } else if (kind === 'saida') {
    ripple(els.quickMinus, true)
    pulse(els.saidaOut, 'bad')
  }
}

function initFinance() {
  // Abrir modal de gerenciamento
  els.empManageOpen?.addEventListener('click', (e) => {
    e.preventDefault()
    openEmpManageModal()
  })

  // Senha forte + CONFIRMAR para habilitar salvar
  const isStrongPassword = (p) => {
    if (!p || p.length < 8) return false
    const hasUpper = /[A-Z]/.test(p)
    const hasLower = /[a-z]/.test(p)
    const hasDigit = /\d/.test(p)
    return hasUpper && hasLower && hasDigit
  }
  const updateSaveEnabled = () => {
    const confirmed = (els.empModalConfirm?.value || '').trim().toUpperCase() === 'CONFIRMAR'
    const strong = isStrongPassword((els.empModalPass?.value || '').trim())
    if (els.empModalSave) els.empModalSave.disabled = !(confirmed && strong)
  }
  els.empModalConfirm?.addEventListener('input', updateSaveEnabled)
  els.empModalPass?.addEventListener('input', updateSaveEnabled)
  // Habilitar botão de definir/atualizar senha para dívida existente
  const updateSetPassEnabled = () => {
    const strong = isStrongPassword((els.empModalPass?.value || '').trim())
    if (els.empModalSetPass) els.empModalSetPass.disabled = !(loan.debtId && strong)
  }
  els.empModalPass?.addEventListener('input', updateSetPassEnabled)
  // Confirmação de excluir
  const updateDeleteEnabled = () => {
    const confirmed = (els.empModalDeleteConfirm?.value || '').trim().toUpperCase() === 'APAGAR'
    const hasPass = ((els.empModalDeletePass?.value || '').trim().length >= 1)
    if (els.empModalDelete) els.empModalDelete.disabled = !(confirmed && hasPass)
  }
  els.empModalDeleteConfirm?.addEventListener('input', updateDeleteEnabled)
  els.empModalDeletePass?.addEventListener('input', updateDeleteEnabled)
  // Salvar/Registrar empréstimo
  els.empModalSave?.addEventListener('click', async (e) => {
    e.preventDefault()
    const principalCents = parseToCents(els.empModalPrincipal?.value)
    const taxaMensalPct = Number(els.empModalTaxa?.value || loan.monthlyRatePct)
    const rawPass = (els.empModalPass?.value || '').trim()
    if (!principalCents || principalCents <= 0 || taxaMensalPct <= 0) {
      if (els.empModalOut) els.empModalOut.textContent = 'Informe principal (>0) e taxa mensal (>0).'
      return
    }
    loan.principalCents = principalCents
    loan.residualCents = principalCents
    loan.monthlyRatePct = taxaMensalPct
    loan.schedule = []
    if (els.empOut) {
      els.empOut.textContent = `Empréstimo ativo: Principal ${formatBRL(principalCents)} | Juros mensais ${taxaMensalPct.toFixed(2)}%\nSaldo devedor: ${formatBRL(loan.residualCents)}`
      pulse(els.empOut, 'good')
    }
    updatePaymentBar(0, 0)
    renderLoanSchedule()
    let persistedMsg = 'Empréstimo registrado.'
    try {
      const deletePassHash = await sha256Hex(rawPass)
      const res = await persistDividaSecure(principalCents, taxaMensalPct, deletePassHash)
      if (res?.ok && res?.id) {
        loan.debtId = res.id
        persistedMsg = 'Empréstimo registrado e salvo no Supabase.'
      } else if (res?.error === 'no_user') {
        persistedMsg = 'Empréstimo registrado (faça login para salvar).'
      } else if (res?.error) {
        persistedMsg = 'Empréstimo registrado (falha ao salvar).'
        console.error('[emp] persistDivida error', res.error)
      }
    } catch (err) {
      console.error('[emp] persistDivida unexpected', err)
      persistedMsg = 'Empréstimo registrado (erro ao salvar).'
    }
    closeEmpManageModal()
    showSnackbar(persistedMsg, null, null, 3000)
  })
  // Excluir empréstimo
  els.empModalDelete?.addEventListener('click', async (e) => {
    e.preventDefault()
    const pwd = (els.empModalDeletePass?.value || '').trim()
    if (!loan.debtId) {
      showSnackbar('Nenhum empréstimo ativo para excluir.', null, null, 3000)
      return
    }
    const res = await deleteDebtById(loan.debtId, pwd)
    if (res?.ok) {
      closeEmpManageModal()
      showSnackbar('Empréstimo excluído.', null, null, 3000)
      await renderDebtSummary()
    } else {
      const msg = (res?.error === 'invalid_password') ? 'Senha incorreta. Não foi possível excluir.' : 'Erro ao excluir. Tente novamente.'
      showSnackbar(msg, null, null, 4000)
    }
  })

  // Definir/Atualizar senha de exclusão para empréstimo já salvo
  els.empModalSetPass?.addEventListener('click', async (e) => {
    e.preventDefault()
    const raw = (els.empModalPass?.value || '').trim()
    if (!loan.debtId) {
      showSnackbar('Salve o empréstimo antes de definir a senha.', null, null, 3500)
      return
    }
    if (!isStrongPassword(raw)) {
      showSnackbar('Senha fraca. Use 8+ chars, maiúsculas, minúsculas e números.', null, null, 4500)
      return
    }
    try {
      const hash = await sha256Hex(raw)
      const { error } = await supabase
        .from('dividas')
        .update({ delete_password_hash: hash })
        .eq('id', loan.debtId)
      if (error) {
        console.error('[emp] set delete_password_hash error', error)
        showSnackbar('Falha ao definir a senha. Tente novamente.', null, null, 4000)
        return
      }
      showSnackbar('Senha de exclusão definida/atualizada.', null, null, 3500)
      pulse(els.empModalOut, 'good')
      updateSetPassEnabled()
    } catch (err) {
      console.error('[emp] set delete_password_hash unexpected', err)
      showSnackbar('Erro ao definir a senha.', null, null, 4000)
    }
  })

  // Registrar pagamento do mês: juros sempre + amortização opcional
  els.empPayBtn?.addEventListener('click', (e) => {
    e.preventDefault()
    registrarPagamentoMes(parseToCents(els.empAmort?.value))
  })
}

async function registrarPagamentoMes(totalPagoCentsRaw = 0) {
  if (!loan.residualCents || loan.residualCents <= 0) {
    showSnackbar('Registre o empréstimo primeiro.', null, null, 3500)
    pulse(els.empOut, 'bad')
    return
  }
  // Normaliza valor pago e aplica mínimo de R$ 10,00
  const totalPagoCents = Math.max(0, totalPagoCentsRaw || 0)
  if (totalPagoCents < 1000) {
    showSnackbar('O pagamento mínimo é R$ 10,00.', null, null, 5000)
    try { els.empAmort?.focus() } catch {}
    pulse(els.empOut, 'bad')
    return
  }

  // Cálculo de teto de juros do mês corrente: tudo que exceder vira amortização
  const todayParts = getFortalezaParts(new Date())
  const ym = ymStr(todayParts)
  let jurosEsperadoMesCents = Math.round((Number.isFinite(loan.residualCentsDisplay) ? loan.residualCentsDisplay : loan.residualCents) * (loan.monthlyRatePct / 100))
  let jurosPagoAteAgoraCents = 0
  try {
    if (loan.debtId) {
      const pays = await fetchPagamentosForDebt(loan.debtId)
      loan.pays = pays
      jurosPagoAteAgoraCents = sumInterestPaidForMonth(pays, ym)
    }
  } catch {}
  const jurosRestanteCents = Math.max(0, subtrairCents(jurosEsperadoMesCents, jurosPagoAteAgoraCents))
  const jurosPagoCents = Math.min(totalPagoCents, jurosRestanteCents)
  const amortCents = Math.min(Math.max(0, subtrairCents(totalPagoCents, jurosPagoCents)), loan.residualCents)

  // Atualiza saldo apenas com a amortização realizada
  const novoResidual = subtrairCents(loan.residualCents, amortCents)
  loan.residualCents = novoResidual
  const mes = loan.schedule.length + 1
  loan.schedule.push({ mes, jurosCents: jurosPagoCents, amortCents, residualCents: loan.residualCents })

  // Feedback no painel: reflete exatamente o que foi pago
  if (els.empOut) {
    const msg = `Mês ${mes}: Juros ${formatBRL(jurosPagoCents)} | Amortização ${formatBRL(amortCents)} | Saldo devedor: ${formatBRL(loan.residualCents)}`
    els.empOut.textContent = msg
    pulse(els.empOut, 'good')
  }
  renderLoanSchedule()
  updatePaymentBar(jurosPagoCents, amortCents)
  if (els.empAmort) els.empAmort.value = ''
  const eventoEm = new Date()
  pushHistory({ tipo: amortCents > 0 ? 'emprestimo_pagamento' : 'emprestimo_juros', valorCents: somarCents(jurosPagoCents, amortCents), titulo: `Pagamento mês ${mes}`, eventoEm })
  let payMsg = 'Pagamento registrado.'
  try {
    if (loan.debtId) {
      const res = await persistPagamento(jurosPagoCents, amortCents, eventoEm)
      if (res?.ok) payMsg = 'Pagamento registrado e salvo.'
      else payMsg = 'Pagamento registrado (falha ao salvar).'
      try {
        const refreshedPays = await fetchPagamentosForDebt(loan.debtId)
        loan.pays = refreshedPays
      } catch {}
    } else {
      payMsg = 'Pagamento registrado (salve o empréstimo para persistir).'
    }
  } catch (err) {
    console.error('[emp] persistPagamento unexpected', err)
    payMsg = 'Pagamento registrado (erro ao salvar).'
  }
  showSnackbar(payMsg, 'Desfazer', () => { undoLastLoanPayment() }, 6000)
}

function openEmpManageModal() {
  const modal = els.empModal
  if (!modal) return
  modal.hidden = false
  modal.setAttribute('aria-hidden', 'false')
  modal.classList.add('open')
  try { document.body.classList.add('modal-open') } catch {}
  try { lastFocusEl = document.activeElement instanceof HTMLElement ? document.activeElement : null } catch { lastFocusEl = null }
  // Prefill
  if (els.empModalPrincipal) els.empModalPrincipal.value = formatCentsForInput(loan.principalCents || 0)
  if (els.empModalTaxa) els.empModalTaxa.value = String(loan.monthlyRatePct || 5)
  if (els.empModalConfirm) els.empModalConfirm.value = ''
  if (els.empModalPass) els.empModalPass.value = ''
  if (els.empModalDeleteConfirm) els.empModalDeleteConfirm.value = ''
  if (els.empModalDeletePass) els.empModalDeletePass.value = ''
  if (els.empModalSave) els.empModalSave.disabled = true
  if (els.empModalDelete) els.empModalDelete.disabled = true
  if (els.empModalSetPass) els.empModalSetPass.disabled = true
  const dlg = modal.querySelector('.modal-dialog')
  if (dlg) fitModalDialogToViewport(dlg)
  els.empModalPrincipal?.focus()
}

function closeEmpManageModal() {
  const modal = els.empModal
  if (!modal) return
  modal.hidden = true
  modal.setAttribute('aria-hidden', 'true')
  modal.classList.remove('open')
  try { document.body.classList.remove('modal-open') } catch {}
  const dlg = modal.querySelector('.modal-dialog')
  if (dlg) clearModalDialogFit(dlg)
  try { lastFocusEl?.focus() } catch {}
}

function updatePaymentBar(jurosCents, amortCents) {
  try {
    const interestBar = els.empBar?.querySelector('.bar.interest')
    const amortBar = els.empBar?.querySelector('.bar.amort')
    const total = Math.max(1, (jurosCents || 0) + (amortCents || 0))
    const pctJ = Math.min(100, Math.max(0, ((jurosCents || 0) / total) * 100))
    const pctA = Math.min(100, Math.max(0, ((amortCents || 0) / total) * 100))
    if (interestBar) interestBar.style.width = pctJ.toFixed(2) + '%'
    if (amortBar) amortBar.style.width = pctA.toFixed(2) + '%'
    els.empBar?.setAttribute('aria-hidden', 'false')
  } catch {}
}

function renderLoanSchedule() {
  if (!els.empSchedule) return
  const baseCents = Number.isFinite(loan.residualCentsDisplay) ? loan.residualCentsDisplay : (loan.residualCents || 0)
  const nextInterestCents = Math.round(baseCents * (loan.monthlyRatePct / 100))

  // Cabeçalho resumido com saldo/juros próximos
  const headerHtml = `
    <div class="loan-schedule">
      <div class="schedule-head" role="region" aria-label="Resumo do empréstimo">
        <div class="summary">
          <span class="label">Saldo devedor</span>
          <span class="value">${formatBRL(baseCents)}</span>
          <span class="spacer" aria-hidden="true"></span>
          <span class="label">Taxa mensal</span>
          <span class="value">${Number(loan.monthlyRatePct || 0).toFixed(2)}%</span>
        </div>
        <div class="next">
          <span class="label">Próximo juros</span>
          <span class="chip chip-interest">${formatBRL(nextInterestCents)}</span>
        </div>
        <div class="trend" aria-label="Tendência do saldo">${renderBalanceSparklineSVG(loan.residualTrend || [])}</div>
        <div class="waterfall-wrap" aria-label="Capitalização do mês">${renderWaterfallSVG(loan.capitalizationBreakdown || [])}</div>
      </div>
  `

  // Corpo da tabela
  if (!loan.schedule.length) {
    const bodyHtml = `
      <div class="schedule-scroll scroll-lock" aria-label="Cronograma de pagamentos">
        <table class="schedule-table">
          <thead>
            <tr>
              <th class="col-mes">Mês</th>
              <th class="col-juros">Juros</th>
              <th class="col-amort">Amortização</th>
              <th class="col-saldo">Saldo devedor</th>
            </tr>
          </thead>
          <tbody>
            <tr class="schedule-empty">
              <td colspan="4" class="schedule-empty-msg">Nenhum pagamento registrado ainda.</td>
            </tr>
          </tbody>
        </table>
      </div>
    `
    els.empSchedule.innerHTML = headerHtml + bodyHtml + '</div>'
    attachScrollLockToSchedule()
    return
  }

  const rowsHtml = loan.schedule.map((it) => `
    <tr>
      <td class="col-mes">${it.mes}</td>
      <td class="col-juros"><span class="chip chip-interest">${formatBRL(it.jurosCents || 0)}</span></td>
      <td class="col-amort"><span class="chip chip-amort">${formatBRL(it.amortCents || 0)}</span></td>
      <td class="col-saldo">${formatBRL(it.residualCents || 0)}</td>
    </tr>
  `).join('')

  const tableHtml = `
    <div class="schedule-scroll scroll-lock" aria-label="Cronograma de pagamentos">
      <table class="schedule-table">
        <thead>
          <tr>
            <th class="col-mes">Mês</th>
            <th class="col-juros">Juros</th>
            <th class="col-amort">Amortização</th>
            <th class="col-saldo">Saldo devedor</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `

  els.empSchedule.innerHTML = headerHtml + tableHtml + '</div>'
  attachScrollLockToSchedule()
}

function ensureScrollLock(el) {
  try {
    if (!el || el.dataset.scrollLockAttached === 'true') return
    el.dataset.scrollLockAttached = 'true'
    // CSS já resolve em browsers modernos; abaixo um fallback leve
    el.style.overscrollBehavior = 'contain'
    const onWheel = (e) => {
      const delta = e.deltaY
      const maxScroll = el.scrollHeight - el.clientHeight
      if (maxScroll <= 0) return // nada a rolar
      // Evita propagação para a página enquanto o cursor estiver na região
      e.stopPropagation()
      const atTop = el.scrollTop <= 0
      const atBottom = el.scrollTop >= maxScroll
      if ((delta < 0 && atTop) || (delta > 0 && atBottom)) {
        // Bloqueia o scroll da página ao atingir as bordas
        e.preventDefault()
        // Faz clamp nas bordas para evitar "pulo"
        el.scrollTop = delta < 0 ? 0 : maxScroll
      }
      // Caso contrário, deixa o browser rolar normalmente dentro do container
    }
    el.addEventListener('wheel', onWheel, { passive: false })
  } catch {}
}

function attachScrollLockToSchedule() {
  try {
    const container = els.empSchedule?.querySelector('.schedule-scroll')
      || els.empSchedule?.querySelector('.schedule-table')
    if (container) ensureScrollLock(container)
  } catch {}
}

// Utilidades de data para America/Fortaleza
function getFortalezaParts(date = new Date()) {
  try {
    if (window.luxon && window.luxon.DateTime) {
      const dt = window.luxon.DateTime.fromJSDate(date).setZone('America/Fortaleza')
      return { year: dt.year, month: dt.month, day: dt.day }
    }
  } catch {}
  try {
    const parts = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date)
    const map = Object.fromEntries(parts.map(p => [p.type, p.value]))
    return { year: Number(map.year), month: Number(map.month), day: Number(map.day) }
  } catch {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }
  }
}
function ymStr({ year, month }) {
  return `${year}-${String(month).padStart(2, '0')}`
}
function monthIndex(ym) {
  const [y, m] = ym.split('-').map(Number)
  return y * 12 + (m - 1)
}
function listMonthsBetween(fromYm, toYm) {
  if (!fromYm || !toYm) return []
  const res = []
  let i = monthIndex(fromYm) + 1
  const end = monthIndex(toYm)
  while (i <= end) {
    const y = Math.floor(i / 12)
    const m = (i % 12) + 1
    res.push(`${y}-${String(m).padStart(2, '0')}`)
    i++
  }
  return res
}
function sumInterestPaidForMonth(pays, ym) {
  if (!Array.isArray(pays) || !ym) return 0
  let total = 0
  for (const p of pays) {
    try {
      let d = null
      if (window.luxon && window.luxon.DateTime) {
        const src = p.data_pagamento || p.created_at
        if (!src) continue
        const dt = window.luxon.DateTime.fromISO(String(src), { setZone: true }).setZone('America/Fortaleza')
        d = { year: dt.year, month: dt.month }
      } else {
        const raw = p.data_pagamento ? new Date(p.data_pagamento) : (p.created_at ? new Date(p.created_at) : null)
        if (!raw) continue
        const parts = getFortalezaParts(raw)
        d = { year: parts.year, month: parts.month }
      }
      const currYm = ymStr(d)
      if (currYm === ym) {
        total += Math.round(Number(p.juros_pago || 0) * 100)
      }
    } catch {}
  }
  return total
}
function computeCapitalizationForDebt({ residualBaseCents, ratePct, pays, debtId, startDateIso }) {
  try {
    const today = getFortalezaParts()
    const currentYm = ymStr(today)
    const day = Number(today.day || 1)
    let base = Number(residualBaseCents || 0)
    const rate = Number(ratePct || 0)
    const key = `loan:lastCapYm:${debtId || 'local'}`
    const lastCapYm = localStorage.getItem(key) || null
    const startYm = (() => {
      try {
        if (!startDateIso) return null
        const d = new Date(startDateIso)
        const p = getFortalezaParts(d)
        return ymStr(p)
      } catch { return null }
    })()
    let monthsToProcess = lastCapYm ? listMonthsBetween(lastCapYm, currentYm) : ((startYm && startYm === currentYm) ? [] : [currentYm])
    const trend = []
    const breakdown = []
    for (const ym of monthsToProcess) {
      const isCurrent = ym === currentYm
      const baseBefore = base
      const expected = Math.round(baseBefore * (rate / 100))
      const paid = sumInterestPaidForMonth(pays, ym)
      const unpaid = Math.max(0, expected - paid)
      if (!isCurrent || day > 5) {
        base = baseBefore + unpaid
      } else {
        base = baseBefore // antes do dia 05 do mês corrente, apenas projetamos
      }
      const baseAfter = base
      trend.push({ ym, residualCents: baseAfter })
      breakdown.push({ ym, baseBefore, expected, paid, capitalized: (!isCurrent || day > 5) ? unpaid : 0, baseAfter })
    }
    if (monthsToProcess.length) localStorage.setItem(key, currentYm)
    return { residualCentsDisplay: base, residualTrend: trend, capitalizationBreakdown: breakdown }
  } catch (err) {
    console.error('[emp] computeCapitalizationForDebt error', err)
    return { residualCentsDisplay: residualBaseCents, residualTrend: [], capitalizationBreakdown: [] }
  }
}
function renderBalanceSparklineSVG(trend = []) {
  try {
    const pts = Array.isArray(trend) ? trend : []
    if (pts.length < 1) return ''
    if (pts.length === 1) {
      const w = 260, h = 56
      const x = Math.round(w / 2), y = Math.round(h / 2)
      return `
        <svg class="sparkline" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">
          <circle cx="${x}" cy="${y}" r="3" fill="var(--accent)" />
        </svg>
      `
    }
    const w = 260, h = 56, pad = 6
    const values = pts.map(p => Number(p.residualCents || 0))
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = Math.max(1, max - min)
    const stepX = (w - pad * 2) / (pts.length - 1)
    const toX = (i) => pad + i * stepX
    const toY = (v) => pad + (h - pad * 2) - ((v - min) / range) * (h - pad * 2)
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(Number(p.residualCents || 0))}`).join(' ')
    const last = { x: toX(pts.length - 1), y: toY(values[values.length - 1]) }
    return `
      <svg class="sparkline" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">
        <path d="${d}" fill="none" stroke="var(--accent)" stroke-width="2" />
        <circle cx="${last.x}" cy="${last.y}" r="3" fill="var(--accent)" />
      </svg>
    `
  } catch {
    return ''
  }
}
function renderWaterfallSVG(breakdown = []) {
  try {
    const rows = Array.isArray(breakdown) ? breakdown.slice(-12) : [] // até 12 meses
    if (!rows.length) return ''
    const w = Math.max(320, 24 * rows.length + 40), h = 100, pad = 8
    const values = rows.map(r => Number(r.baseAfter || r.baseBefore || 0))
    const max = Math.max(...values, 1)
    const toX = (i) => pad + i * 24
    const toH = (v) => Math.round(((v) / max) * (h - pad * 2))
    let svg = `<svg class="waterfall" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-label="Juros somados ao saldo (mensal)">`
    svg += `<line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="var(--border)" stroke-width="1" />`
    rows.forEach((r, i) => {
      const x = toX(i)
      const hb = toH(Number(r.baseBefore || 0))
      const ha = toH(Number(r.baseAfter || 0))
      const inc = Math.max(0, ha - hb)
      const yBase = h - pad - hb
      const yInc = h - pad - ha
      // barra base (saldo antes)
      svg += `<rect x="${x}" y="${yBase}" width="16" height="${hb}" fill="rgba(0,0,0,.16)" />`
      // incremento (juros capitalizado)
      if (inc > 0) {
        svg += `<rect x="${x}" y="${yInc}" width="16" height="${inc}" fill="rgba(245,158,11,.65)" />`
      }
      const capBRL = formatBRL(Number(r.capitalized || 0))
      const ym = r.ym || ''
      svg += `<title>${ym}: Juros somados ao saldo ${capBRL}</title>`
    })
    svg += '</svg>'
    return svg
  } catch {
    return ''
  }
}
function applyMonthlyCapitalizationIfDue() {
  try {
    const pays = Array.isArray(loan.pays) ? loan.pays : []
    const today = getFortalezaParts()
    const currentYm = ymStr(today)
    const day = Number(today.day || 1)
    // Base inicial (apenas amortização retira do principal)
    let base = Number(loan.residualCents || 0)
    const rate = Number(loan.monthlyRatePct || 0)
    const key = `loan:lastCapYm:${loan.debtId || 'local'}`
    const lastCapYm = localStorage.getItem(key) || null
    const startYm = (() => {
      try {
        if (!loan.startDateIso) return null
        const d = new Date(loan.startDateIso)
        const p = getFortalezaParts(d)
        return ymStr(p)
      } catch { return null }
    })()
    const monthsToProcess = lastCapYm ? listMonthsBetween(lastCapYm, currentYm) : ((startYm && startYm === currentYm) ? [] : [currentYm])
    const trend = []
    const breakdown = []
    for (const ym of monthsToProcess) {
      const isCurrent = ym === currentYm
      const baseBefore = base
      let expected = 0, paid = 0, unpaid = 0
      if (!isCurrent || day > 5) {
        expected = Math.round(baseBefore * (rate / 100))
        paid = sumInterestPaidForMonth(pays, ym)
        unpaid = Math.max(0, expected - paid)
        base = baseBefore + unpaid
      } else {
        expected = Math.round(baseBefore * (rate / 100))
        paid = sumInterestPaidForMonth(pays, ym)
        unpaid = Math.max(0, expected - paid)
        base = baseBefore
      }
      const baseAfter = base
      trend.push({ ym, residualCents: baseAfter })
      breakdown.push({ ym, baseBefore, expected, paid, capitalized: unpaid, baseAfter })
    }
    loan.residualCentsDisplay = base
    loan.residualTrend = trend
    loan.capitalizationBreakdown = breakdown
    if (monthsToProcess.length) localStorage.setItem(key, currentYm)
  } catch (err) {
    console.error('[emp] applyMonthlyCapitalizationIfDue error', err)
  }
}

async function openDebtScheduleModal(d) {
  try {
    const pays = await fetchPagamentosForDebt(d.id)
    const principalCents = Math.round(Number(d.valor_principal || 0) * 100)
    const ratePct = Number(d.taxa_juros || 0)
    
    // Reconstruir schedule (residual após amortização)
    let residualTracker = principalCents
    const sched = pays.map((p, idx) => {
      const juros = Math.round(Number(p.juros_pago || 0) * 100)
      const amort = Math.round(Number(p.principal_amortizado || 0) * 100)
      residualTracker = Math.max(0, subtrairCents(residualTracker, amort))
      return { 
        mes: idx + 1, 
        jurosCents: juros, 
        amortCents: amort, 
        residualCents: residualTracker,
        dataPagamento: p.data_pagamento,
        createdAt: p.created_at
      }
    })
    
    const amortTotalCents = sched.reduce((acc, it) => acc + it.amortCents, 0)
    const residualBaseCents = Math.max(0, subtrairCents(principalCents, amortTotalCents))
    
    // Capitalização específica desta dívida
    const cap = computeCapitalizationForDebt({ residualBaseCents, ratePct, pays, debtId: d.id, startDateIso: d.data_inicio })
    const baseCents = Number.isFinite(cap.residualCentsDisplay) ? cap.residualCentsDisplay : residualBaseCents
    const nextInterestCents = Math.round(baseCents * (ratePct / 100))

    // Identificar meses com capitalização
    const mesesComCapitalizacao = new Set()
    if (cap.capitalizationBreakdown) {
      cap.capitalizationBreakdown.forEach(item => {
        if (item.capitalized > 0) {
          mesesComCapitalizacao.add(item.ym)
        }
      })
    }

    // Criar modal com visualização de capitalização - DESIGN PROFISSIONAL
    const modal = document.createElement('div')
    modal.className = 'modal open'
    modal.setAttribute('role', 'dialog')
    modal.setAttribute('aria-modal', 'true')
    
    const backdrop = document.createElement('div')
    backdrop.className = 'modal-backdrop'
    backdrop.dataset.close = 'schedule'
    
    const dlg = document.createElement('div')
    dlg.className = 'modal-dialog schedule-dialog'
    
    // Header do modal com design profissional
    const modalHeader = document.createElement('div')
    modalHeader.className = 'modal-header'
    
    const titleContainer = document.createElement('div')
    titleContainer.style.display = 'flex'
    titleContainer.style.alignItems = 'center'
    titleContainer.style.gap = '12px'
    
    const title = document.createElement('h3')
    title.textContent = 'Cronograma do Empréstimo'
    title.style.margin = '0'
    title.style.fontSize = 'var(--text-xl)'
    title.style.fontWeight = '700'
    title.style.color = 'var(--primary-300)'
    
    if (mesesComCapitalizacao.size > 0) {
      const capBadge = document.createElement('span')
      capBadge.className = 'chip chip-warning'
      capBadge.textContent = `${mesesComCapitalizacao.size} capitalização${mesesComCapitalizacao.size > 1 ? 'ões' : 'ão'}`
      titleContainer.appendChild(title)
      titleContainer.appendChild(capBadge)
    } else {
      titleContainer.appendChild(title)
    }
    
    const closeBtn = document.createElement('button')
    closeBtn.className = 'modal-close'
    closeBtn.innerHTML = '✕'
    closeBtn.addEventListener('click', () => {
      document.body.classList.remove('modal-open')
      modal.remove()
    })
    
    modalHeader.appendChild(titleContainer)
    modalHeader.appendChild(closeBtn)
    dlg.appendChild(modalHeader)

    // Conteúdo do modal com design profissional
    const modalContent = document.createElement('div')
    modalContent.className = 'modal-content'

    // Header com informações de capitalização - DESIGN PROFISSIONAL
    const headerHtml = `
      <div class="schedule-head" role="region" aria-label="Resumo do empréstimo">
        <div class="summary">
          <div class="summary-item">
            <span class="label">Saldo devedor</span>
            <span class="value">${formatBRL(baseCents)}</span>
          </div>
          <div class="summary-item">
            <span class="label">Taxa mensal</span>
            <span class="value">${Number(ratePct || 0).toFixed(2)}%</span>
          </div>
          <div class="summary-item">
            <span class="label">Próximo juros</span>
            <span class="chip chip-interest">${formatBRL(nextInterestCents)}</span>
          </div>
        </div>
        <div class="trend" aria-label="Tendência do saldo">${renderBalanceSparklineSVG(cap.residualTrend || [])}</div>
        <div class="waterfall-wrap" aria-label="Capitalização do mês">${renderWaterfallSVG(cap.capitalizationBreakdown || [])}</div>
      </div>
    `

    modalContent.innerHTML = headerHtml
    dlg.appendChild(modalContent)

    // Footer do modal
    const modalFooter = document.createElement('div')
    modalFooter.className = 'modal-footer'
    
    const closeBtnFooter = document.createElement('button')
    closeBtnFooter.className = 'outline'
    closeBtnFooter.textContent = 'Fechar'
    closeBtnFooter.addEventListener('click', () => {
      document.body.classList.remove('modal-open')
      modal.remove()
    })
    
    modalFooter.appendChild(closeBtnFooter)
    dlg.appendChild(modalFooter)

    // Tabela com indicadores de capitalização - DESIGN PROFISSIONAL
    const rowsHtml = sched.map((it, idx) => {
      const mesYm = ymStr(getFortalezaParts(it.dataPagamento ? new Date(it.dataPagamento) : new Date(it.createdAt)))
      const teveCapitalizacao = mesesComCapitalizacao.has(mesYm)
      const capitalizadoCents = cap.capitalizationBreakdown?.find(item => item.ym === mesYm)?.capitalized || 0
      
      return `
        <tr class="${teveCapitalizacao ? 'row-capitalization' : ''}">
          <td class="col-mes">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 600;">${it.mes}</span>
              ${teveCapitalizacao ? '<span style="color: #F59E0B;">📈</span>' : ''}
            </div>
          </td>
          <td class="col-juros">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <span class="chip chip-interest">${formatBRL(it.jurosCents || 0)}</span>
              ${capitalizadoCents > 0 ? `<small style="color: #F59E0B; font-size: 11px; font-weight: 500;">+${formatBRL(capitalizadoCents)} no saldo</small>` : ''}
            </div>
          </td>
          <td class="col-amort">
            <span class="chip chip-amort">${formatBRL(it.amortCents || 0)}</span>
          </td>
          <td class="col-saldo">
            <span style="font-weight: 600; color: var(--primary-300);">${formatBRL(it.residualCents || 0)}</span>
          </td>
        </tr>
      `
    }).join('')

    const tableSection = document.createElement('div')
    tableSection.innerHTML = `
      <div class="schedule-scroll" aria-label="Cronograma de pagamentos" style="margin-top: var(--spacing-lg);">
        <table class="schedule-table">
          <thead>
            <tr>
              <th class="col-mes">Mês</th>
              <th class="col-juros">Juros</th>
              <th class="col-amort">Amortização</th>
              <th class="col-saldo">Saldo devedor</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr class="schedule-empty"><td colspan="4" class="schedule-empty-msg">Nenhum pagamento registrado ainda.</td></tr>'}
          </tbody>
        </table>
      </div>
    `
    modalContent.appendChild(tableSection)

    
    // Event listeners para fechar
    backdrop.addEventListener('click', () => {
      document.body.classList.remove('modal-open')
      modal.remove()
    })
    
    // Scroll lock para elementos
    const sd = modalContent.querySelector('.schedule-scroll')
    if (sd) ensureScrollLock(sd)
    modal.appendChild(backdrop)
    modal.appendChild(dlg)
    document.body.appendChild(modal)
    try { document.body.classList.add('modal-open') } catch {}
    
  } catch (err) {
    console.error('[emp] openDebtScheduleModal error', err)
  }
}
// Diálogo inline para confirmar exclusão sem usar window.prompt
async function promptDeleteCredentials() {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.style.position = 'fixed'
    overlay.style.inset = '0'
    overlay.style.background = 'rgba(0,0,0,.35)'
    overlay.style.display = 'flex'
    overlay.style.alignItems = 'center'
    overlay.style.justifyContent = 'center'
    overlay.style.zIndex = '1000'
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-modal', 'true')

    const modal = document.createElement('div')
    modal.style.background = 'var(--panel)'
    modal.style.border = '1px solid var(--border)'
    modal.style.borderRadius = '10px'
    modal.style.padding = '16px'
    modal.style.boxShadow = '0 10px 24px -8px rgba(0,0,0,.45)'
    modal.style.width = 'min(420px, 92vw)'

    const title = document.createElement('h4')
    title.textContent = 'Confirmar exclusão'
    title.style.margin = '0 0 8px 0'
    modal.appendChild(title)

    const info = document.createElement('p')
    info.textContent = 'Digite APAGAR para confirmar e informe a senha de exclusão.'
    info.style.margin = '0 0 10px 0'
    info.style.opacity = '.85'
    modal.appendChild(info)

    const inputConfirm = document.createElement('input')
    inputConfirm.type = 'text'
    inputConfirm.placeholder = 'APAGAR'
    inputConfirm.className = 'form-control'
    inputConfirm.style.marginBottom = '8px'
    modal.appendChild(inputConfirm)

    const inputPwd = document.createElement('input')
    inputPwd.type = 'password'
    inputPwd.placeholder = 'Senha de exclusão'
    inputPwd.className = 'form-control'
    inputPwd.style.marginBottom = '12px'
    modal.appendChild(inputPwd)

    const error = document.createElement('div')
    error.style.color = '#B91C1C'
    error.style.fontSize = '12px'
    error.style.minHeight = '18px'
    error.style.marginBottom = '8px'
    modal.appendChild(error)

    const actions = document.createElement('div')
    actions.style.display = 'flex'
    actions.style.gap = '8px'
    actions.style.justifyContent = 'flex-end'

    const cancelBtn = document.createElement('button')
    cancelBtn.className = 'btn'
    cancelBtn.textContent = 'Cancelar'
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(overlay)
      resolve({ ok: false })
    })

    const okBtn = document.createElement('button')
    okBtn.className = 'btn-primary'
    okBtn.textContent = 'Confirmar'
    const submit = () => {
      const text = (inputConfirm.value || '').trim().toUpperCase()
      if (text !== 'APAGAR') {
        error.textContent = 'Digite exatamente APAGAR para confirmar.'
        inputConfirm.focus()
        return
      }
      const pwd = (inputPwd.value || '').trim()
      if (!pwd) {
        error.textContent = 'Informe a senha de exclusão.'
        inputPwd.focus()
        return
      }
      document.body.removeChild(overlay)
      resolve({ ok: true, pwd })
    }
    okBtn.addEventListener('click', submit)

    actions.appendChild(cancelBtn)
    actions.appendChild(okBtn)
    modal.appendChild(actions)

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay)
        resolve({ ok: false })
      }
    })
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(overlay)
        resolve({ ok: false })
      }
      if (e.key === 'Enter') submit()
    })

    overlay.appendChild(modal)
    document.body.appendChild(overlay)
    inputConfirm.focus()
  })
}

function undoLastLoanPayment() {
  if (!loan.schedule.length) return
  const last = loan.schedule.pop()
  loan.residualCents = somarCents(loan.residualCents, last.amortCents)
  renderLoanSchedule()
  if (els.empOut) {
    els.empOut.textContent = `Desfeito pagamento do mês ${last.mes}. Saldo devedor: ${formatBRL(loan.residualCents)}`
    pulse(els.empOut, 'bad')
  }
  updatePaymentBar(0, 0)
}

// =========================
// Navegação
// =========================
function initNavigation() {
  const links = Array.from(document.querySelectorAll('.nav-link'))
  const showView = (name) => {
    // Toggle nav ativo
    links.forEach((l) => {
      const isActive = l.dataset.view === name
      l.classList.toggle('active', isActive)
      l.setAttribute('aria-selected', isActive ? 'true' : 'false')
      l.setAttribute('tabindex', isActive ? '0' : '-1')
    })
    // Toggle views
    const views = ['emprestimo']
    views.forEach((v) => {
      const el = document.getElementById(`view-${v}`)
      if (!el) return
      if (v === name) {
        el.hidden = false
        el.classList.add('active')
      } else {
        el.hidden = true
        el.classList.remove('active')
      }
    })
    // Foco no tab ativo para acessibilidade
    const activeTab = links.find((l) => l.dataset.view === name)
    activeTab?.focus()

    // Navegação simplificada sem Painel: nada a re-renderizar
  }

  // Ações rápidas
  els.quickPlus?.addEventListener('click', () => { ripple(els.quickPlus, false); openModal('entrada') })
  els.quickMinus?.addEventListener('click', () => { ripple(els.quickMinus, true); openModal('saida') })
  els.quickClear?.addEventListener('click', () => {
    // Snapshot para desfazer
    pushUndoSnapshot('clear-totals')
    // Reset de totais
    totalEntradasCents = 0
    totalSaidasCents = 0
    renderTotals('good')
    // Limpa outputs dos modais
    if (els.modalEntradaOut) els.modalEntradaOut.textContent = ''
    if (els.modalSaidaOut) els.modalSaidaOut.textContent = ''
    // Limpa barras visuais
    try {
      const interestBar = els.empBar?.querySelector('.bar.interest')
      const amortBar = els.empBar?.querySelector('.bar.amort')
      if (interestBar) interestBar.style.width = '0%'
      if (amortBar) amortBar.style.width = '0%'
    } catch {}
    try {
      const gainBar = els.invBar?.querySelector('.bar.gain')
      if (gainBar) gainBar.style.width = '0%'
    } catch {}
    // Snackbar de confirmação com desfazer
    showSnackbar('Limpeza realizada.', 'Desfazer', () => { undoLast() }, 6000)
  })

  // Toggle do menu de limpeza
  els.quickClearMenuBtn?.addEventListener('click', (e) => {
    e.preventDefault()
    const menu = els.clearMenu
    if (!menu) return
    menu.hidden = !menu.hidden
  })
  // Fechar menu ao clicar fora
  document.addEventListener('click', (ev) => {
    const menu = els.clearMenu
    const split = document.getElementById('quick-clear-split')
    if (!menu || !split) return
    if (menu.hidden) return
    if (!split.contains(ev.target)) {
      menu.hidden = true
    }
  })
  // Ações do menu
  els.clearMenu?.addEventListener('click', (ev) => {
    const target = ev.target
    if (!(target instanceof HTMLElement)) return
    const act = target.getAttribute('data-act')
    if (!act) return
    ev.preventDefault()
    // Sempre fechar o menu ao escolher
    els.clearMenu.hidden = true
    if (act === 'clear-totals') {
      els.quickClear?.click()
    } else if (act === 'undo-last') {
      const ok = undoLast()
      if (ok) {
        showSnackbar('Ação desfeita.', null, null, 3000)
      }
    }
  })

  // Menu lateral
  links.forEach((l) => l.addEventListener('click', () => showView(l.dataset.view)))

  // Navegação por teclado entre tabs
  links.forEach((l, idx) => {
    l.addEventListener('keydown', (ev) => {
      let nextIdx
      if (ev.key === 'ArrowRight') nextIdx = (idx + 1) % links.length
      else if (ev.key === 'ArrowLeft') nextIdx = (idx - 1 + links.length) % links.length
      else if (ev.key === 'Home') nextIdx = 0
      else if (ev.key === 'End') nextIdx = links.length - 1
      if (nextIdx !== undefined) {
        ev.preventDefault()
        const next = links[nextIdx]
        showView(next.dataset.view)
      }
    })
  })

  // Estado inicial apenas com Empréstimo
  showView('emprestimo')
}

// =========================
// Modais
// =========================
let currentModal = null
let lastFocusEl = null
function openModal(name) {
  const modal = name === 'entrada' ? els.entradaModal : name === 'saida' ? els.saidaModal : null
  if (!modal) return
  modal.hidden = false
  modal.setAttribute('aria-hidden', 'false')
  modal.classList.add('open')
  try { document.body.classList.add('modal-open') } catch {}
  currentModal = name
  // Memoriza foco anterior para acessibilidade
  try { lastFocusEl = document.activeElement instanceof HTMLElement ? document.activeElement : null } catch { lastFocusEl = null }
  const input = name === 'entrada' ? els.modalEntradaValor : els.modalSaidaValor
  // Prefill automático de data/hora, se vazio
  const quandoInput = name === 'entrada' ? els.modalEntradaQuando : els.modalSaidaQuando
  if (quandoInput && !quandoInput.value) {
    quandoInput.value = toDateTimeLocalValue(new Date())
  }
  const dlg = modal.querySelector('.modal-dialog')
  if (dlg) fitModalDialogToViewport(dlg)
  input?.focus()
}

function closeModal(name) {
  const modal = name === 'entrada' ? els.entradaModal : name === 'saida' ? els.saidaModal : null
  if (!modal) return
  modal.hidden = true
  modal.setAttribute('aria-hidden', 'true')
  modal.classList.remove('open')
  try { document.body.classList.remove('modal-open') } catch {}
  if (currentModal === name) currentModal = null
  // Restaura foco ao elemento anterior
  const dlg = modal.querySelector('.modal-dialog')
  if (dlg) clearModalDialogFit(dlg)
  try { lastFocusEl?.focus() } catch {}
}

function initModals() {
  // Backdrop fecha
  document.querySelectorAll('.modal-backdrop').forEach((bd) => {
    const target = bd.getAttribute('data-close')
    bd.addEventListener('click', () => {
      if (target === 'emp') closeEmpManageModal()
      else closeModal(target)
    })
  })

  // Botões fechar
  els.modalEntradaClose?.addEventListener('click', (e) => { e.preventDefault(); closeModal('entrada') })
  els.modalSaidaClose?.addEventListener('click', (e) => { e.preventDefault(); closeModal('saida') })
  els.empModalClose?.addEventListener('click', (e) => { e.preventDefault(); closeEmpManageModal() })

  window.addEventListener('resize', () => {
    const empDlg = els.empModal?.querySelector('.modal-dialog')
    if (empDlg && !els.empModal.hidden) fitModalDialogToViewport(empDlg)
    if (currentModal) {
      const curr = currentModal === 'entrada' ? els.entradaModal : els.saidaModal
      const dlg = curr?.querySelector('.modal-dialog')
      if (dlg && !curr.hidden) fitModalDialogToViewport(dlg)
    }
  })

  // Adicionar via modal: Entrada
  els.modalEntradaAdd?.addEventListener('click', (e) => {
    e.preventDefault()
    pushUndoSnapshot('entrada(modal)')
    const titulo = (els.modalEntradaDesc?.value || '').trim()
    const eventoEm = parseDateTimeLocal(els.modalEntradaQuando?.value || '')
    const valCents = parseToCents(els.modalEntradaValor?.value)
    if (!valCents || valCents <= 0) {
      els.modalEntradaValor?.classList.add('input-error')
      els.modalEntradaValor?.setAttribute('aria-invalid', 'true')
      showSnackbar('Informe um valor válido em BRL (ex: 10,50).', null, null, 4000)
      return
    }
    totalEntradasCents = somarCents(totalEntradasCents, valCents)
    const saldoParcial = subtrairCents(totalEntradasCents, totalSaidasCents)
    const msg = `Total de entradas: ${formatBRL(totalEntradasCents)} | Saldo parcial: ${formatBRL(saldoParcial)}`
    if (els.modalEntradaOut) els.modalEntradaOut.textContent = msg
    if (els.entradaOut) els.entradaOut.textContent = msg
    animateFinanceFeedback('entrada')
    pushHistory({ tipo: 'entrada', valorCents: valCents, titulo, eventoEm })
    console.log('[finance] entrada(modal)', { valCents, totalEntradasCents, saldoParcial, titulo, eventoEm })
    closeModal('entrada')
    els.modalEntradaValor.value = ''
    if (els.modalEntradaDesc) els.modalEntradaDesc.value = ''
    if (els.modalEntradaQuando) els.modalEntradaQuando.value = ''
    showSnackbar('Entrada adicionada.', 'Desfazer', () => { undoLast() })
    // Atualiza gráficos do painel
    renderCharts()
  })

  // Adicionar via modal: Saída
  els.modalSaidaAdd?.addEventListener('click', (e) => {
    e.preventDefault()
    pushUndoSnapshot('saida(modal)')
    const titulo = (els.modalSaidaDesc?.value || '').trim()
    const eventoEm = parseDateTimeLocal(els.modalSaidaQuando?.value || '')
    const valCents = parseToCents(els.modalSaidaValor?.value)
    if (!valCents || valCents <= 0) {
      els.modalSaidaValor?.classList.add('input-error')
      els.modalSaidaValor?.setAttribute('aria-invalid', 'true')
      showSnackbar('Informe um valor válido em BRL (ex: 10,50).', null, null, 4000)
      return
    }
    totalSaidasCents = somarCents(totalSaidasCents, valCents)
    const saldoParcial = subtrairCents(totalEntradasCents, totalSaidasCents)
    const msg = `Total de saídas: ${formatBRL(totalSaidasCents)} | Saldo parcial: ${formatBRL(saldoParcial)}`
    if (els.modalSaidaOut) els.modalSaidaOut.textContent = msg
    if (els.saidaOut) els.saidaOut.textContent = msg
    animateFinanceFeedback('saida')
    pushHistory({ tipo: 'saida', valorCents: valCents, titulo, eventoEm })
    console.log('[finance] saida(modal)', { valCents, totalSaidasCents, saldoParcial, titulo, eventoEm })
    closeModal('saida')
    els.modalSaidaValor.value = ''
    if (els.modalSaidaDesc) els.modalSaidaDesc.value = ''
    if (els.modalSaidaQuando) els.modalSaidaQuando.value = ''
    showSnackbar('Saída adicionada.', 'Desfazer', () => { undoLast() })
    // Atualiza gráficos do painel
    renderCharts()
  })

  // Teclado: Enter confirma, Esc fecha
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && currentModal) {
      closeModal(currentModal)
    }
    if (ev.key === 'Enter' && currentModal) {
      if (currentModal === 'entrada') {
        els.modalEntradaAdd?.click()
      } else if (currentModal === 'saida') {
        els.modalSaidaAdd?.click()
      }
    }
  })
}

function fitModalDialogToViewport(dlg) {
  const margin = 24
  const availH = Math.max(100, window.innerHeight - margin * 2)
  const contentH = dlg.scrollHeight
  const scale = Math.min(1, availH / contentH)
  dlg.style.transformOrigin = 'top center'
  dlg.style.transform = `scale(${scale})`
}

function clearModalDialogFit(dlg) {
  dlg.style.transformOrigin = ''
  dlg.style.transform = ''
}

// Converte Date para valor compatível com input datetime-local (YYYY-MM-DDTHH:mm)
function toDateTimeLocalValue(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mi = pad(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}
// ===== Histórico (local) =====
function parseDateTimeLocal(value) {
  if (!value) return new Date()
  const d = new Date(value)
  return isNaN(d.getTime()) ? new Date() : d
}

function pushHistory(entry) {
  const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  history.push({ id, ...entry })
}

function setHistoryState(state) {
  const list = els.histList
  if (!list) return
  if (state === 'loading') {
    list.innerHTML = `<div class="hist-loading">Carregando…</div>`
  } else if (state === 'error') {
    list.innerHTML = `<div class="hist-error">Erro ao carregar.</div>`
  } else if (state === 'empty') {
    list.innerHTML = `<div class="hist-empty">Nenhum lançamento encontrado.</div>`
  }
}

function renderHistory(options = {}) {
  const { showLoading = false } = options
  const list = els.histList
  if (!list) return
  if (showLoading) setHistoryState('loading')
  try {
  const busca = (els.histBusca?.value || '').trim().toLowerCase()
  const tipoFiltro = els.histTipo?.value || 'todos'
  const inicio = els.histInicio?.value ? new Date(`${els.histInicio.value}T00:00:00`) : null
  const fim = els.histFim?.value ? new Date(`${els.histFim.value}T23:59:59`) : null

  const filtered = history.filter((h) => {
    if (tipoFiltro !== 'todos' && h.tipo !== tipoFiltro) return false
    if (inicio && h.eventoEm < inicio) return false
    if (fim && h.eventoEm > fim) return false
    if (busca) {
      const text = `${h.titulo || ''} ${h.anotacao || ''}`.toLowerCase()
      if (!text.includes(busca)) return false
    }
    return true
  }).sort((a, b) => b.eventoEm - a.eventoEm)

  if (!filtered.length) {
    setHistoryState('empty')
    return
  }
  const rows = filtered.map((h) => {
    const valorFmt = formatBRL((h.valorCents || 0) / 100)
    const quando = h.eventoEm.toLocaleString()
    const tipoTxt = h.tipo === 'entrada' ? 'Entrada' : 'Saída'
    const desc = (h.titulo || h.anotacao || '').trim()
    return `<div class="hist-item">
      <div class="tipo">${tipoTxt}</div>
      <div class="desc">${desc || '-'}</div>
      <div class="quando">${quando}</div>
      <div class="valor">${valorFmt}</div>
    </div>`
  }).join('')
  list.innerHTML = rows
  } catch (err) {
    console.error('[historico] render error:', err)
    setHistoryState('error')
  }
}
function initHistorico() {
  // Aplicar filtros manualmente
  els.histAplicar?.addEventListener('click', () => {
    renderHistory({ showLoading: true })
  })
  // Debounce na busca
  const debounce = (fn, delay = 300) => {
    let t
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay) }
  }
  const debouncedRender = debounce(() => renderHistory(), 300)
  els.histBusca?.addEventListener('input', debouncedRender)
  renderHistory()
}

// =========================
// Gráficos (Painel) - D3
// =========================
function initCharts() {
  try {
    if (!window.d3) {
      console.warn('[charts] D3 não carregado, initCharts ignorado')
      return
    }
    renderCharts()
    // Re-render simples ao redimensionar para responsividade
    window.addEventListener('resize', () => { try { renderCharts() } catch {} })
  } catch (err) {
    console.error('[charts] initCharts error', err)
  }
}

function renderCharts() {
  const d3 = window.d3
  if (!d3) return
  if (!els.chartSaldo || !els.chartES) return
  // Limpa antes de redesenhar
  try { els.chartSaldo.innerHTML = '' } catch {}
  try { els.chartES.innerHTML = '' } catch {}
  // Série de saldo acumulado ao longo do tempo
  const series = computeBalanceSeries(history)
  drawLineChart(els.chartSaldo, series)
  // Entradas x Saídas por dia
  const daily = computeDailyAggregates(history)
  drawBarChart(els.chartES, daily)
}

function computeBalanceSeries(hist) {
  const sorted = [...hist].sort((a, b) => a.eventoEm - b.eventoEm)
  let saldoCents = 0
  const points = sorted.map((h) => {
    const delta = (h.tipo === 'entrada' ? (h.valorCents || 0) : -(h.valorCents || 0))
    saldoCents = somarCents(saldoCents, delta)
    return { date: h.eventoEm, value: (saldoCents || 0) / 100 }
  })
  if (!points.length) points.push({ date: new Date(), value: 0 })
  return points
}

function computeDailyAggregates(hist) {
  const byDay = new Map()
  const pad = (n) => String(n).padStart(2, '0')
  const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  for (const h of hist) {
    const key = toKey(h.eventoEm)
    const cur = byDay.get(key) || { date: new Date(`${key}T00:00:00`), entrada: 0, saida: 0 }
    if (h.tipo === 'entrada') cur.entrada += (h.valorCents || 0) / 100
    else cur.saida += (h.valorCents || 0) / 100
    byDay.set(key, cur)
  }
  const arr = Array.from(byDay.values()).sort((a, b) => a.date - b.date)
  if (!arr.length) arr.push({ date: new Date(), entrada: 0, saida: 0 })
  return arr
}

function drawLineChart(containerEl, data) {
  const d3 = window.d3
  const width = Math.max(320, containerEl.clientWidth || 320)
  const height = Math.max(220, containerEl.clientHeight || 240)
  const margin = { top: 12, right: 16, bottom: 28, left: 44 }
  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom

  const svg = d3.select(containerEl).append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('width', '100%')
    .style('height', '100%')
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const x = d3.scaleTime()
    .domain(d3.extent(data, (d) => d.date))
    .range([0, innerW])
  const y = d3.scaleLinear()
    .domain([d3.min(data, (d) => d.value) ?? 0, d3.max(data, (d) => d.value) ?? 0]).nice()
    .range([innerH, 0])

  const line = d3.line()
    .x((d) => x(d.date))
    .y((d) => y(d.value))

  g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#7c93ff')
    .attr('stroke-width', 2)
    .attr('d', line)

  const xAxis = d3.axisBottom(x).ticks(5)
  const yAxis = d3.axisLeft(y).ticks(5).tickFormat((v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
  g.append('g').attr('transform', `translate(0,${innerH})`).call(xAxis)
  g.append('g').call(yAxis)
  svg.selectAll('.domain, .tick line').attr('stroke', '#a8b0c3')
  svg.selectAll('.tick text').attr('fill', '#a8b0c3')
}

function drawBarChart(containerEl, data) {
  const d3 = window.d3
  const width = Math.max(320, containerEl.clientWidth || 320)
  const height = Math.max(220, containerEl.clientHeight || 240)
  const margin = { top: 12, right: 16, bottom: 28, left: 44 }
  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom

  const svg = d3.select(containerEl).append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('width', '100%')
    .style('height', '100%')
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const x = d3.scaleBand()
    .domain(data.map((d) => d.date))
    .range([0, innerW])
    .padding(0.2)
  const x1 = d3.scaleBand().domain(['entrada', 'saida']).range([0, x.bandwidth()]).padding(0.1)
  const maxY = Math.max(0, ...data.flatMap((d) => [d.entrada, d.saida]))
  const y = d3.scaleLinear().domain([0, maxY]).nice().range([innerH, 0])

  const color = d3.scaleOrdinal().domain(['entrada', 'saida']).range(['#7c93ff', '#ff6b6b'])

  g.append('g')
    .selectAll('g')
    .data(data)
    .join('g')
      .attr('transform', (d) => `translate(${x(d.date)},0)`) 
      .selectAll('rect')
      .data((d) => [{ key: 'entrada', value: d.entrada }, { key: 'saida', value: d.saida }])
      .join('rect')
        .attr('x', (d) => x1(d.key))
        .attr('y', (d) => y(d.value))
        .attr('width', x1.bandwidth())
        .attr('height', (d) => innerH - y(d.value))
        .attr('fill', (d) => color(d.key))

  const xAxis = d3.axisBottom(x).tickFormat((d) => {
    const dt = d
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}`
  })
  const yAxis = d3.axisLeft(y).ticks(5).tickFormat((v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
  g.append('g').attr('transform', `translate(0,${innerH})`).call(xAxis)
  g.append('g').call(yAxis)
  svg.selectAll('.domain, .tick line').attr('stroke', '#a8b0c3')
  svg.selectAll('.tick text').attr('fill', '#a8b0c3')
}
/* Override modal fit functions: CSS handles responsiveness now */
try { fitModalDialogToViewport = function(dialog) {}; } catch (e) {}
try { clearModalDialogFit = function(dialog) {}; } catch (e) {}
