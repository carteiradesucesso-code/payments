import { supabase } from './supabaseClient.js'

const els = {
  signupForm: document.getElementById('signup-form'),
  signupName: document.getElementById('signup-name'),
  signupEmail: document.getElementById('signup-email'),
  signupPassword: document.getElementById('signup-password'),
  signupPasswordConfirm: document.getElementById('signup-password-confirm'),
  signupCaps: document.getElementById('caps-signup'),
  pwMeter: document.getElementById('pw-meter'),
  pwMeterFill: document.getElementById('pw-meter-fill'),
  pwRules: document.getElementById('pw-rules'),

  signinForm: document.getElementById('signin-form'),
  signinEmail: document.getElementById('signin-email'),
  signinPassword: document.getElementById('signin-password'),
  signinCaps: document.getElementById('caps-signin'),
  forgotBtn: document.getElementById('forgot-btn'),
  signupToggleBtn: document.getElementById('signup-toggle-btn'),

  terms: document.getElementById('terms'),

  signupSubmit: document.getElementById('signup-submit'),
  signinSubmit: document.getElementById('signin-submit'),
  signupEmailSuggestion: document.getElementById('signup-email-suggestion'),
  signinEmailSuggestion: document.getElementById('signin-email-suggestion'),

  toggles: document.querySelectorAll('.toggle'),
  authMsg: document.getElementById('auth-msg'),
  sessionSection: document.getElementById('session-section'),
  userEmail: document.getElementById('user-email'),
  signoutBtn: document.getElementById('signout-btn'),
  accountPanel: document.getElementById('account-panel'),
  fetchUserBtn: document.getElementById('fetch-user-btn'),
  copyUserBtn: document.getElementById('copy-user-btn'),
  userJson: document.getElementById('user-json'),
}

function setMsg(text, type = 'success') {
  els.authMsg.textContent = text
  els.authMsg.className = `msg ${type}`
}

function setLoading(which, loading) {
  const btn = which === 'signup' ? els.signupSubmit : els.signinSubmit
  if (!btn) return
  btn.disabled = loading
  btn.textContent = loading ? 'Aguarde…' : (which === 'signup' ? 'Cadastrar' : 'Entrar')
}

function scorePassword(pw, email) {
  let score = 0
  const rules = {
    len: pw.length >= 8,
    mix: /[A-Za-z]/.test(pw) && /\d/.test(pw),
    spec: /[^A-Za-z0-9]/.test(pw),
    email: pw && email && pw.toLowerCase() !== email.toLowerCase()
  }
  score += rules.len ? 1 : 0
  score += rules.mix ? 1 : 0
  score += rules.spec ? 1 : 0
  score += rules.email ? 1 : 0
  return { score, rules }
}

function updateRulesUI(rules) {
  if (!els.pwRules) return
  Array.from(els.pwRules.querySelectorAll('li')).forEach((li) => {
    const key = li.getAttribute('data-rule')
    if (key && rules[key]) li.classList.add('ok')
    else li.classList.remove('ok')
  })
}

function updateMeter(score) {
  if (!els.pwMeterFill) return
  const pct = (score / 4) * 100
  els.pwMeterFill.style.width = `${pct}%`
  els.pwMeterFill.style.background = score <= 1 ? '#ff6b6b' : score === 2 ? '#f7b267' : score === 3 ? '#ffd166' : '#7bffa9'
  const meter = els.pwMeter
  if (meter) meter.setAttribute('aria-valuenow', String(score))
}

function passwordsMatch() {
  return els.signupPassword.value === els.signupPasswordConfirm.value
}

function validateSignup() {
  const email = els.signupEmail.value.trim()
  const pw = els.signupPassword.value
  const { score, rules } = scorePassword(pw, email)
  updateRulesUI(rules)
  updateMeter(score)
  const ok = rules.len && rules.mix && rules.email && passwordsMatch() && els.terms.checked
  els.signupPasswordConfirm.setCustomValidity(passwordsMatch() ? '' : 'Senhas não coincidem')
  // Email inválido apenas quando vazio (não culpar o email pelo fato da senha ser igual)
  els.signupEmail.setAttribute('aria-invalid', String(!email))
  // Apontar a regra "senha ≠ email" no campo de senha
  els.signupPassword.setCustomValidity(rules.email ? '' : 'Senha não pode ser igual ao email do cadastro')
  els.signupPassword.setAttribute('aria-invalid', String(!(rules.len && rules.mix && rules.email)))
  els.signupPasswordConfirm.setAttribute('aria-invalid', String(!passwordsMatch()))
  return ok
}

function handleCapsHint(e, hintEl) {
  const caps = e.getModifierState && e.getModifierState('CapsLock')
  hintEl.hidden = !caps
}

function hideCapsHint(hintEl) { hintEl.hidden = true }

// Mostrar/ocultar senha
els.toggles.forEach((btn) => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-target')
    const input = document.getElementById(targetId)
    if (!input) return
    input.type = input.type === 'password' ? 'text' : 'password'
    btn.textContent = input.type === 'password' ? 'Mostrar' : 'Ocultar'
  })
})

// Caps Lock hints
els.signupPassword?.addEventListener('keydown', (e) => handleCapsHint(e, els.signupCaps))
els.signupPassword?.addEventListener('keyup', (e) => handleCapsHint(e, els.signupCaps))
els.signupPassword?.addEventListener('blur', () => hideCapsHint(els.signupCaps))
els.signinPassword?.addEventListener('keydown', (e) => handleCapsHint(e, els.signinCaps))
els.signinPassword?.addEventListener('keyup', (e) => handleCapsHint(e, els.signinCaps))
els.signinPassword?.addEventListener('blur', () => hideCapsHint(els.signinCaps))

// Atualização dinâmica de força/validação
els.signupEmail?.addEventListener('input', validateSignup)
els.signupPassword?.addEventListener('input', validateSignup)
els.signupPasswordConfirm?.addEventListener('input', validateSignup)
els.terms?.addEventListener('change', validateSignup)

function getEmailSuggestion(email) {
  const parts = email.split('@')
  if (parts.length !== 2) return ''
  const domain = parts[1].toLowerCase()
  const map = {
    'gmal.com': 'gmail.com',
    'gmail.con': 'gmail.com',
    'gmial.com': 'gmail.com',
    'hotamil.com': 'hotmail.com',
    'hotmal.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'yahoo.con': 'yahoo.com',
    'icloud.con': 'icloud.com'
  }
  return map[domain] ? `${parts[0]}@${map[domain]}` : ''
}

function updateEmailSuggestion(inputEl, sugEl) {
  if (!inputEl || !sugEl) return
  const suggestion = getEmailSuggestion(inputEl.value.trim())
  sugEl.textContent = suggestion ? `Você quis dizer: ${suggestion}?` : ''
}

els.signupEmail?.addEventListener('input', () => updateEmailSuggestion(els.signupEmail, els.signupEmailSuggestion))
els.signinEmail?.addEventListener('input', () => updateEmailSuggestion(els.signinEmail, els.signinEmailSuggestion))

async function refreshSessionUI() {
  try {
    const { data: { session } } = await withTimeout(supabase.auth.getSession(), 8000)
    if (session?.user) {
      // Em páginas de login, redireciona imediatamente se houver sessão
      if (!navInProgress) navigateToDashboardOnce('refreshSessionUI')
      return
    } else {
      // Somente manipula UI se os elementos existirem na página
      if (els.sessionSection) els.sessionSection.hidden = true
      if (els.userEmail) els.userEmail.textContent = ''
      if (els.accountPanel) els.accountPanel.hidden = true
      if (els.userJson) els.userJson.textContent = ''
    }
  } catch (e) {
    console.warn('[auth] refreshSessionUI timeout/erro', e?.message || e)
  }
}

async function renderUserInfo() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!els.userJson) return
    els.userJson.textContent = user
      ? JSON.stringify(user, null, 2)
      : 'Nenhum usuário logado.'
  } catch (e) {
    if (els.userJson) els.userJson.textContent = `Erro ao carregar dados: ${e?.message || e}`
  }
}

els.fetchUserBtn?.addEventListener('click', async () => {
  await renderUserInfo()
  setMsg('Dados atualizados.', 'success')
})

els.copyUserBtn?.addEventListener('click', async () => {
  const txt = els.userJson?.textContent || ''
  try {
    await navigator.clipboard.writeText(txt)
    setMsg('JSON copiado para a área de transferência.', 'success')
  } catch {
    setMsg('Não foi possível copiar automaticamente. Copie manualmente.', 'error')
  }
})

function mapError(error) {
  const msg = error?.message || 'Erro desconhecido'
  if (/already registered|exists/i.test(msg)) return 'Este email já está cadastrado.'
  if (/Invalid login credentials/i.test(msg)) return 'Email ou senha inválidos.'
  if (/rate limit|too many/i.test(msg)) return 'Muitas tentativas. Tente novamente em instantes.'
  return msg
}

function withTimeout(promise, ms = 10000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Tempo esgotado ao tentar autenticar. Verifique sua conexão.')), ms)
    promise.then((v) => { clearTimeout(t); resolve(v) }).catch((e) => { clearTimeout(t); reject(e) })
  })
}

let navInProgress = false
function navigateToDashboardOnce(source = 'unknown') {
  if (navInProgress) {
    console.log('[auth] navigation already in progress', source)
    return
  }
  navInProgress = true
  setMsg('Login realizado com sucesso! Redirecionando...', 'success')
  window.location.assign('dashboard.html')
}

els.signupForm?.addEventListener('submit', async (e) => {
  e.preventDefault()
  if (!validateSignup()) {
    return setMsg('Verifique os requisitos de senha, a confirmação e os termos.', 'error')
  }
  const email = els.signupEmail.value.trim()
  const password = els.signupPassword.value
  const fullName = els.signupName.value.trim()
  setMsg('Cadastrando...', 'success')
  setLoading('signup', true)
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: fullName ? { full_name: fullName } : undefined }
  })
  setLoading('signup', false)
  if (error) return setMsg(`Erro ao cadastrar: ${mapError(error)}`, 'error')
  if (data.user) setMsg('Cadastro realizado. Se o projeto exigir verificação, confira seu email.', 'success')
  await refreshSessionUI()
})

els.signinForm?.addEventListener('submit', async (e) => {
  e.preventDefault()
  const email = els.signinEmail.value.trim()
  const password = els.signinPassword.value
  console.log('[auth] signin submit', { email_present: !!email })
  setMsg('Entrando...', 'success')
  setLoading('signin', true)
  try {
    const { data, error } = await withTimeout(supabase.auth.signInWithPassword({ email, password }), 12000)
    console.log('[auth] signInWithPassword resolved', { hasSession: !!data?.session, error: error?.message })
    if (error) throw error

    if (data?.session?.user) {
      navigateToDashboardOnce('signin')
      return
    }

    const { data: { session } } = await withTimeout(supabase.auth.getSession(), 8000)
    if (session?.user) {
      navigateToDashboardOnce('signin-session')
      return
    } else {
      setMsg('Sessão não foi criada. Verifique a confirmação de email ou tente novamente.', 'error')
    }
  } catch (err) {
    console.error('[auth] signIn error', err)
    setMsg(`Erro ao entrar: ${mapError(err)}`, 'error')
  } finally {
    setLoading('signin', false)
    if (!navInProgress) await refreshSessionUI()
  }
})

els.forgotBtn?.addEventListener('click', async () => {
  const email = els.signinEmail.value.trim()
  if (!email) return setMsg('Informe seu email para recuperar a senha.', 'error')
  setMsg('Enviando link de recuperação...', 'success')
  const { data, error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) return setMsg(`Erro ao enviar recuperação: ${mapError(error)}`, 'error')
  setMsg('Se existir conta, você receberá um link para redefinir a senha.', 'success')
})

// Alternar exibição do formulário de cadastro
els.signupToggleBtn?.addEventListener('click', () => {
  if (!els.signupForm) return
  const willShow = !!els.signupForm.hidden
  els.signupForm.hidden = !willShow
  els.signupToggleBtn.textContent = willShow ? 'Cancelar cadastro' : 'Cadastrar'
  if (willShow) {
    // Foca no primeiro campo do formulário
    els.signupName?.focus()
    // Ajusta mensagem informativa
    setMsg('Preencha os campos para criar sua conta.', 'success')
    // Opcionalmente rola para o form
    els.signupForm.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
})

els.signoutBtn?.addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut()
  if (error) return setMsg(`Erro ao sair: ${mapError(error)}`, 'error')
  setMsg('Você saiu da sessão.', 'success')
  await refreshSessionUI()
})

supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('[auth] onAuthStateChange', event, { hasUser: !!session?.user })
  if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
    navigateToDashboardOnce('onAuthStateChange')
    return
  }
  if (!navInProgress) await refreshSessionUI()
})

refreshSessionUI()
