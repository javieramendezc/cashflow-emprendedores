const STORAGE_KEY = "cashflow-emprendedores-data-v2";
const REMEMBERED_EMAIL_KEY = "cashflow-emprendedores-remembered-email";
const SUPABASE_URL = "https://pmrbxgnpdxqkeihcinvj.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_-sACG1yR0TURwqX70-XwTA_1Q9QPJ0w";
const SUPABASE_STATE_TABLE = "cashflow_user_data";

const categoryMap = {
  income: ["Ventas", "Servicios", "Inversión", "Otros ingresos"],
  expense: [
    "Insumos",
    "Marketing",
    "Envíos",
    "Sueldo honorario",
    "Sueldo contrato",
    "Previred",
    "Arriendo",
    "Servicios básicos",
    "Impuestos",
    "Otros gastos",
  ],
};

const seedState = {
  companyLogo: "",
  cashFloor: 0,
  transactions: [],
  receivables: [],
  payables: [],
};

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

const state = {
  data: cloneSeedState(),
  filterMonth: currentMonth(),
  session: null,
  authMode: "signIn",
};

const authScreen = document.querySelector("#authScreen");
const appShell = document.querySelector("#appShell");
const authTitle = document.querySelector("#authTitle");
const authCopy = document.querySelector("#authCopy");
const authForm = document.querySelector("#authForm");
const authEmailField = document.querySelector("#authEmailField");
const authPasswordField = document.querySelector("#authPasswordField");
const authPasswordLabel = document.querySelector("#authPasswordLabel");
const authEmailInput = authForm.querySelector('[name="email"]');
const authPasswordInput = authForm.querySelector('[name="password"]');
const authRememberField = document.querySelector("#authRememberField");
const rememberAccessInput = document.querySelector("#rememberAccessInput");
const authMessage = document.querySelector("#authMessage");
const authSubmitBtn = document.querySelector("#authSubmitBtn");
const toggleAuthModeBtn = document.querySelector("#toggleAuthModeBtn");
const recoverPasswordBtn = document.querySelector("#recoverPasswordBtn");
const userEmailLabel = document.querySelector("#userEmailLabel");
const logoutBtn = document.querySelector("#logoutBtn");
const dynamicFavicon = document.querySelector("#dynamicFavicon");
const logoSettingsToggle = document.querySelector("#logoSettingsToggle");
const logoSettingsPanel = document.querySelector("#logoSettingsPanel");
const brandLogoPreview = document.querySelector("#brandLogoPreview");
const brandLogoFallback = document.querySelector("#brandLogoFallback");
const companyLogoInput = document.querySelector("#companyLogoInput");
const removeLogoBtn = document.querySelector("#removeLogoBtn");
const cashFloorInput = document.querySelector("#cashFloorInput");
const cashFloorAlert = document.querySelector("#cashFloorAlert");
const transactionForm = document.querySelector("#transactionForm");
const receivableForm = document.querySelector("#receivableForm");
const payableForm = document.querySelector("#payableForm");
const transactionFields = getNamedFields(transactionForm, [
  "transactionId",
  "type",
  "description",
  "note",
  "amount",
  "date",
  "category",
  "channel",
  "recurring",
]);
const receivableFields = getNamedFields(receivableForm, [
  "receivableId",
  "client",
  "document",
  "amount",
  "issueDate",
  "dueDate",
  "status",
  "pendingAmount",
  "note",
]);
const payableFields = getNamedFields(payableForm, [
  "payableId",
  "vendor",
  "document",
  "amount",
  "issueDate",
  "dueDate",
  "status",
  "pendingAmount",
  "note",
]);
const categorySelect = transactionForm.querySelector('[name="category"]');
const monthFilter = document.querySelector("#monthFilter");
const transactionTableBody = document.querySelector("#transactionTableBody");
const receivableTableBody = document.querySelector("#receivableTableBody");
const payableTableBody = document.querySelector("#payableTableBody");
const monthlyFlowChart = document.querySelector("#monthlyFlowChart");
const monthlySummaryTableBody = document.querySelector("#monthlySummaryTableBody");
const expenseBreakdown = document.querySelector("#expenseBreakdown");
const forecastList = document.querySelector("#forecastList");
const tipsList = document.querySelector("#tipsList");
const exportExcelBtn = document.querySelector("#exportExcelBtn");
const exportPdfBtn = document.querySelector("#exportPdfBtn");
const exportBackupBtn = document.querySelector("#exportBackupBtn");
const saveTransactionBtn = document.querySelector("#saveTransactionBtn");
const cancelTransactionEditBtn = document.querySelector("#cancelTransactionEditBtn");
const saveReceivableBtn = document.querySelector("#saveReceivableBtn");
const cancelReceivableEditBtn = document.querySelector("#cancelReceivableEditBtn");
const savePayableBtn = document.querySelector("#savePayableBtn");
const cancelPayableEditBtn = document.querySelector("#cancelPayableEditBtn");
const receivablePartialField = document.querySelector("#receivablePartialField");
const payablePartialField = document.querySelector("#payablePartialField");
const resetDataBtn = document.querySelector("#resetDataBtn");

transactionFields.date.value = today();
receivableFields.issueDate.value = today();
receivableFields.dueDate.value = addDays(10);
payableFields.issueDate.value = today();
payableFields.dueDate.value = addDays(7);
monthFilter.value = state.filterMonth;

renderCategoryOptions(transactionFields.type.value);
togglePartialAmountField(receivableFields, receivablePartialField);
togglePartialAmountField(payableFields, payablePartialField);
setAuthMode("signIn");
restoreRememberedAccess();

transactionFields.type.addEventListener("change", (event) => {
  renderCategoryOptions(event.target.value);
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await handleAuthSubmit();
});

toggleAuthModeBtn.addEventListener("click", () => {
  const nextMode = state.authMode === "signIn" ? "signUp" : "signIn";
  setAuthMode(nextMode);
});

recoverPasswordBtn.addEventListener("click", () => {
  setAuthMode("recoverPassword");
});

logoutBtn.addEventListener("click", async () => {
  await handleLogout();
});

logoSettingsToggle.addEventListener("click", () => {
  logoSettingsPanel.hidden = !logoSettingsPanel.hidden;
});

companyLogoInput.addEventListener("change", async () => {
  const file = companyLogoInput.files?.[0];
  if (!file) {
    return;
  }

  if (file.size > 500 * 1024) {
    alert("El logo no puede superar 500 KB.");
    companyLogoInput.value = "";
    return;
  }

  state.data.companyLogo = await readFileAsDataUrl(file);
  companyLogoInput.value = "";
  await saveData();
  applyCompanyLogo();
});

removeLogoBtn.addEventListener("click", async () => {
  state.data.companyLogo = "";
  await saveData();
  applyCompanyLogo();
});

cashFloorInput.addEventListener("change", async (event) => {
  state.data.cashFloor = Math.max(0, Number(event.target.value) || 0);
  cashFloorInput.value = state.data.cashFloor || "";
  await saveData();
  render();
});

receivableFields.status.addEventListener("change", () => {
  togglePartialAmountField(receivableFields, receivablePartialField);
});

payableFields.status.addEventListener("change", () => {
  togglePartialAmountField(payableFields, payablePartialField);
});

transactionForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(transactionForm);
  const transaction = {
    id: formData.get("transactionId") || crypto.randomUUID(),
    type: formData.get("type"),
    description: String(formData.get("description")).trim(),
    note: String(formData.get("note") || "").trim(),
    amount: Number(formData.get("amount")),
    date: formData.get("date"),
    category: formData.get("category"),
    channel: formData.get("channel"),
    recurring: formData.get("recurring") === "on",
  };

  if (!transaction.description || !transaction.amount || !transaction.date) {
    return;
  }

  const isEditing = Boolean(formData.get("transactionId"));

  state.data.transactions = isEditing
    ? state.data.transactions
        .map((item) => (item.id === transaction.id ? transaction : item))
        .sort(sortByDateDesc)
    : [transaction, ...state.data.transactions].sort(sortByDateDesc);

  await saveData();
  state.filterMonth = transaction.date.slice(0, 7);
  monthFilter.value = state.filterMonth;
  resetTransactionForm();
  render();
});

receivableForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(receivableForm);
  const amount = Number(formData.get("amount"));
  const partialAmount = Number(formData.get("pendingAmount"));
  const status = formData.get("status");

  if (status === "partial" && (partialAmount <= 0 || partialAmount >= amount)) {
    alert("Si el estado es Abono parcial, el Abono debe ser mayor a 0 y menor que el monto total.");
    return;
  }

  const receivable = {
    id: formData.get("receivableId") || crypto.randomUUID(),
    client: String(formData.get("client")).trim(),
    document: String(formData.get("document")).trim(),
    amount,
    pendingAmount: resolvePendingAmount(amount, partialAmount, status),
    issueDate: formData.get("issueDate"),
    dueDate: formData.get("dueDate"),
    status,
    note: String(formData.get("note") || "").trim(),
  };

  if (!receivable.client || !receivable.document || !receivable.amount || !receivable.dueDate) {
    return;
  }

  const isEditing = Boolean(formData.get("receivableId"));

  state.data.receivables = isEditing
    ? state.data.receivables
        .map((item) => (item.id === receivable.id ? receivable : item))
        .sort(sortByDueDateAsc)
    : [receivable, ...state.data.receivables].sort(sortByDueDateAsc);

  await saveData();
  state.filterMonth = receivable.dueDate.slice(0, 7);
  monthFilter.value = state.filterMonth;
  resetReceivableForm();
  render();
});

payableForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(payableForm);
  const amount = Number(formData.get("amount"));
  const partialAmount = Number(formData.get("pendingAmount"));
  const status = formData.get("status");

  if (status === "partial" && (partialAmount <= 0 || partialAmount >= amount)) {
    alert("Si el estado es Abono parcial, el Abono debe ser mayor a 0 y menor que el monto total.");
    return;
  }

  const payable = {
    id: formData.get("payableId") || crypto.randomUUID(),
    vendor: String(formData.get("vendor")).trim(),
    document: String(formData.get("document")).trim(),
    amount,
    pendingAmount: resolvePendingAmount(amount, partialAmount, status),
    issueDate: formData.get("issueDate"),
    dueDate: formData.get("dueDate"),
    status,
    note: String(formData.get("note") || "").trim(),
  };

  if (!payable.vendor || !payable.document || !payable.amount || !payable.dueDate) {
    return;
  }

  const isEditing = Boolean(formData.get("payableId"));

  state.data.payables = isEditing
    ? state.data.payables
        .map((item) => (item.id === payable.id ? payable : item))
        .sort(sortByDueDateAsc)
    : [payable, ...state.data.payables].sort(sortByDueDateAsc);

  await saveData();
  state.filterMonth = payable.dueDate.slice(0, 7);
  monthFilter.value = state.filterMonth;
  resetPayableForm();
  render();
});

monthFilter.addEventListener("change", (event) => {
  state.filterMonth = event.target.value || currentMonth();
  render();
});

transactionTableBody.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit-transaction]");
  if (editButton) {
    const transaction = state.data.transactions.find(
      (item) => item.id === editButton.dataset.editTransaction
    );

    if (transaction) {
      fillTransactionForm(transaction);
    }

    return;
  }

  const button = event.target.closest("[data-delete-transaction]");
  if (!button) {
    return;
  }

  state.data.transactions = state.data.transactions.filter(
    (item) => item.id !== button.dataset.deleteTransaction
  );
  await saveData();
  resetTransactionForm();
  render();
});

receivableTableBody.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit-receivable]");
  if (editButton) {
    const receivable = state.data.receivables.find(
      (item) => item.id === editButton.dataset.editReceivable
    );

    if (receivable) {
      fillReceivableForm(receivable);
    }

    return;
  }

  const button = event.target.closest("[data-delete-receivable]");
  if (!button) {
    return;
  }

  state.data.receivables = state.data.receivables.filter(
    (item) => item.id !== button.dataset.deleteReceivable
  );
  await saveData();
  resetReceivableForm();
  render();
});

payableTableBody.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit-payable]");
  if (editButton) {
    const payable = state.data.payables.find(
      (item) => item.id === editButton.dataset.editPayable
    );

    if (payable) {
      fillPayableForm(payable);
    }

    return;
  }

  const button = event.target.closest("[data-delete-payable]");
  if (!button) {
    return;
  }

  state.data.payables = state.data.payables.filter(
    (item) => item.id !== button.dataset.deletePayable
  );
  await saveData();
  resetPayableForm();
  render();
});

exportExcelBtn.addEventListener("click", () => {
  exportToExcel();
});

exportPdfBtn.addEventListener("click", () => {
  exportToPdf();
});

exportBackupBtn.addEventListener("click", () => {
  exportAccountBackup();
});

cancelTransactionEditBtn.addEventListener("click", () => {
  resetTransactionForm();
});

cancelReceivableEditBtn.addEventListener("click", () => {
  resetReceivableForm();
});

cancelPayableEditBtn.addEventListener("click", () => {
  resetPayableForm();
});

resetDataBtn.addEventListener("click", async () => {
  state.data = cloneSeedState();
  state.filterMonth = currentMonth();
  monthFilter.value = state.filterMonth;
  cashFloorInput.value = "";
  await saveData();
  resetTransactionForm();
  resetReceivableForm();
  resetPayableForm();
  render();
});

startApp();

async function startApp() {
  try {
    await initializeAuth();
  } catch (error) {
    console.error("No se pudo iniciar la aplicación:", error);
    authScreen.hidden = false;
    appShell.hidden = true;
    authMessage.classList.remove("success");
    authMessage.textContent =
      "No se pudo iniciar la aplicación. Recarga la página e intenta de nuevo.";
  }
}

async function initializeAuth() {
  try {
    if (hasPasswordRecoveryParams()) {
      setAuthMode("updatePassword", {
        message: "Ingresa tu nueva contraseña para completar la recuperación.",
        tone: "success",
      });
    }

    supabaseClient.auth.onAuthStateChange(async (event, sessionState) => {
      if (event === "PASSWORD_RECOVERY") {
        setAuthMode("updatePassword", {
          message: "Ingresa tu nueva contraseña para completar la recuperación.",
          tone: "success",
        });
      }

      state.session = sessionState;
      await syncSessionView();
      document.body.classList.remove("auth-loading");
    });

    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    state.session = session;
    await syncSessionView();
  } catch {
    state.session = null;
    await syncSessionView();
  } finally {
    document.body.classList.remove("auth-loading");
  }
}

async function handleAuthSubmit() {
  const formData = new FormData(authForm);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  authSubmitBtn.disabled = true;
  authMessage.classList.remove("success");
  authMessage.textContent = "Procesando...";

  try {
    let authResponse;

    if (state.authMode === "recoverPassword") {
      authResponse = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
    } else if (state.authMode === "updatePassword") {
      authResponse = await supabaseClient.auth.updateUser({ password });
    } else {
      authResponse =
        state.authMode === "signIn"
          ? await supabaseClient.auth.signInWithPassword({ email, password })
          : await supabaseClient.auth.signUp({ email, password });
    }

    if (authResponse.error) {
      authMessage.textContent = authResponse.error.message;
      return;
    }

    if (state.authMode === "recoverPassword") {
      setAuthMode("signIn", {
        message: "Te enviamos un correo para recuperar tu contraseña.",
        tone: "success",
      });
      authForm.reset();
      restoreRememberedAccess();
      return;
    }

    if (state.authMode === "updatePassword") {
      await supabaseClient.auth.signOut();
      setAuthMode("signIn", {
        message: "Contraseña actualizada. Ya puedes iniciar sesión.",
        tone: "success",
      });
      authForm.reset();
      restoreRememberedAccess();
      return;
    }

    if (state.authMode === "signUp" && !authResponse.data.session) {
      setAuthMode("signIn", {
        message:
          "Cuenta creada. Revisa tu correo si Supabase pide confirmación y luego inicia sesión.",
        tone: "success",
      });
      authForm.reset();
      restoreRememberedAccess();
      return;
    }

    if (state.authMode === "signIn") {
      persistRememberedAccess(email);
    }

    authMessage.textContent = "";
    authForm.reset();
    restoreRememberedAccess();
  } catch (error) {
    authMessage.classList.remove("success");
    authMessage.textContent =
      error?.message || "No se pudo procesar el acceso. Intenta nuevamente.";
  } finally {
    authSubmitBtn.disabled = false;
  }
}

async function handleLogout() {
  if (!state.session?.user) {
    setAuthMode("signIn");
    restoreRememberedAccess();
    await syncSessionView();
    return;
  }

  logoutBtn.disabled = true;
  logoutBtn.textContent = "Respaldando...";

  try {
    const sessionBackup = normalizeStatePayload(state.data);
    safeSetLocalStorage(getUserStorageKey(), JSON.stringify(sessionBackup));
    await saveDataToSupabase(sessionBackup);
  } catch (error) {
    console.warn("No se pudo respaldar antes de cerrar sesión:", error?.message || error);
    logoutBtn.disabled = false;
    logoutBtn.textContent = "Cerrar sesión";
    alert("No se pudo respaldar tu información. No cerré sesión para evitar pérdida de datos.");
    return;
  }

  logoutBtn.textContent = "Cerrando...";

  state.session = null;
  setAuthMode("signIn");
  restoreRememberedAccess();
  await syncSessionView();

  logoutBtn.disabled = false;
  logoutBtn.textContent = "Cerrar sesión";

  try {
    const { error } = await withTimeout(
      supabaseClient.auth.signOut({ scope: "local" }),
      2500
    );

    if (error) {
      throw error;
    }
  } catch (error) {
    console.warn("No se pudo cerrar sesión en Supabase:", error?.message || error);
  }
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error("timeout")), timeoutMs);
    }),
  ]);
}

async function syncSessionView() {
  logoutBtn.disabled = false;
  logoutBtn.textContent = "Cerrar sesión";

  if (state.authMode === "updatePassword") {
    appShell.hidden = true;
    authScreen.hidden = false;
    return;
  }

  if (!state.session?.user) {
    appShell.hidden = true;
    authScreen.hidden = false;
    userEmailLabel.textContent = "-";
    state.data = cloneSeedState();
    state.filterMonth = currentMonth();
    monthFilter.value = state.filterMonth;
    cashFloorInput.value = "";
    resetTransactionForm();
    resetReceivableForm();
    resetPayableForm();
    render();
    return;
  }

  userEmailLabel.textContent = state.session.user.email || "-";
  authScreen.hidden = true;
  appShell.hidden = false;
  state.data = await loadData();
  state.filterMonth = currentMonth();
  monthFilter.value = state.filterMonth;
  cashFloorInput.value = state.data.cashFloor || "";
  resetTransactionForm();
  resetReceivableForm();
  resetPayableForm();
  render();
}

function setAuthMode(mode, feedback = {}) {
  state.authMode = mode;
  authTitle.textContent = {
    signIn: "Entra a Flujo Claro",
    signUp: "Crea tu cuenta",
    recoverPassword: "Recupera tu contraseña",
    updatePassword: "Define una nueva contraseña",
  }[mode];
  authCopy.textContent = {
    signIn:
      "Crea tu cuenta o inicia sesión para guardar tu flujo de caja en la nube y ver solo tu información.",
    signUp:
      "Registra un correo y una contraseña para activar tu espacio privado de flujo de caja.",
    recoverPassword:
      "Escribe tu correo y te enviaremos un enlace para crear una nueva contraseña.",
    updatePassword: "Escribe tu nueva contraseña para volver a ingresar a tu cuenta.",
  }[mode];

  authEmailField.hidden = mode === "updatePassword";
  authPasswordField.hidden = mode === "recoverPassword";
  authRememberField.hidden = mode !== "signIn";
  authEmailInput.required = mode !== "updatePassword";
  authPasswordInput.required = mode !== "recoverPassword";
  authPasswordInput.autocomplete = mode === "signUp" || mode === "updatePassword"
    ? "new-password"
    : "current-password";
  authPasswordLabel.textContent =
    mode === "updatePassword" ? "Nueva contraseña" : "Contraseña";

  authSubmitBtn.textContent = {
    signIn: "Iniciar sesión",
    signUp: "Crear cuenta",
    recoverPassword: "Enviar correo de recuperación",
    updatePassword: "Guardar nueva contraseña",
  }[mode];
  toggleAuthModeBtn.textContent = {
    signIn: "Crear cuenta",
    signUp: "Ya tengo cuenta",
    recoverPassword: "Volver al login",
    updatePassword: "Volver al login",
  }[mode];
  toggleAuthModeBtn.hidden = false;
  recoverPasswordBtn.hidden = mode !== "signIn";

  authMessage.classList.toggle("success", feedback.tone === "success");
  authMessage.textContent = feedback.message || "";

  if (mode !== "updatePassword") {
    authEmailInput.focus();
  } else {
    authPasswordInput.focus();
  }
}

function restoreRememberedAccess() {
  try {
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY) || "";
    authEmailInput.value = rememberedEmail;
    rememberAccessInput.checked = Boolean(rememberedEmail);
  } catch {
    authEmailInput.value = "";
    rememberAccessInput.checked = false;
  }
}

function persistRememberedAccess(email) {
  try {
    if (rememberAccessInput.checked && email) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      return;
    }

    localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  } catch {
    // Si el navegador bloquea localStorage, solo se omite el recuerdo del correo.
  }
}

function hasPasswordRecoveryParams() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const queryParams = new URLSearchParams(window.location.search);
  return hashParams.get("type") === "recovery" || queryParams.get("type") === "recovery";
}

function render() {
  const transactions = state.data.transactions.filter((item) =>
    item.date.startsWith(state.filterMonth)
  );
  const receivables = state.data.receivables.filter((item) =>
    item.dueDate.startsWith(state.filterMonth)
  );
  const payables = state.data.payables.filter((item) =>
    item.dueDate.startsWith(state.filterMonth)
  );
  const cashFloor = Number(state.data.cashFloor) || 0;

  const incomes = transactions.filter((item) => item.type === "income");
  const salesIncomes = incomes.filter((item) => item.category === "Ventas");
  const expenses = transactions.filter((item) => item.type === "expense");
  const openReceivables = receivables.filter((item) => item.status !== "paid");
  const openPayables = payables.filter((item) => item.status !== "paid");

  const incomeTotal = sum(incomes);
  const monthlyVatTotal = calculateIncludedVat(sum(salesIncomes));
  const monthlyVatCreditTotal = calculateIncludedVat(
    payables.reduce((total, item) => total + Number(item.amount || 0), 0)
  );
  const expenseTotal = sum(expenses);
  const receivableTotal = sum(openReceivables);
  const payableTotal = sum(openPayables);
  const netTotal = incomeTotal - expenseTotal;
  const currentBalance = sum(
    state.data.transactions.map((item) => (item.type === "income" ? item.amount : -item.amount))
  );
  const projectedBalance = currentBalance + receivableTotal - payableTotal;
  const recurring = transactions.filter((item) => item.recurring);
  const averageIncome = incomes.length ? Math.round(incomeTotal / incomes.length) : 0;
  const topCategory = findTopExpenseCategory(expenses);
  const hasAnyData =
    state.data.transactions.length > 0 ||
    state.data.receivables.length > 0 ||
    state.data.payables.length > 0;
  const nextCommitment = sum(
    state.data.payables.filter((item) => item.status !== "paid" && daysUntil(item.dueDate) <= 30)
  );
  const forecastWeeks = createForecastWeeks(
    projectedBalance,
    recurring,
    incomes,
    expenses,
    receivableTotal,
    payableTotal,
    cashFloor
  );
  const lowCashWeek = cashFloor
    ? forecastWeeks.find((week) => week.amount < cashFloor)
    : null;
  const health = getHealth(incomeTotal, expenseTotal, projectedBalance, cashFloor);

  text("#incomeTotal", formatCurrency(incomeTotal));
  text("#expenseTotal", formatCurrency(expenseTotal));
  text("#receivableTotal", formatCurrency(receivableTotal));
  text("#payableTotal", formatCurrency(payableTotal));
  text("#monthlyVatTotal", formatCurrency(monthlyVatTotal));
  text("#monthlyVatCreditTotal", formatCurrency(monthlyVatCreditTotal));
  text("#netTotal", formatCurrency(netTotal));
  text("#sidebarBalance", formatCurrency(projectedBalance));
  text("#sidebarHealth", health.description);
  text("#recurringCount", `${recurring.length} movimientos`);
  text("#avgIncome", formatCurrency(averageIncome));
  text("#topCategory", topCategory);
  text("#nextCommitment", formatCurrency(nextCommitment));
  text(
    "#adviceText",
    createAdvice(netTotal, recurring.length, topCategory, receivableTotal, payableTotal, hasAnyData)
  );
  text("#receivablePill", `${openReceivables.length} pendientes`);
  text("#payablePill", `${openPayables.length} pendientes`);

  const healthPill = document.querySelector("#healthPill");
  healthPill.textContent = health.label;
  healthPill.className = `pill ${health.tone}`;

  applyCompanyLogo();

  renderTable(transactions);
  renderReceivables(receivables);
  renderPayables(payables);
  renderMonthlySummary();
  renderBreakdown(expenses);
  renderForecast(forecastWeeks, cashFloor);
  renderCashFloorStatus(projectedBalance, cashFloor, lowCashWeek, hasAnyData);
  renderTips(
    incomeTotal,
    expenseTotal,
    recurring,
    projectedBalance,
    openReceivables,
    openPayables,
    hasAnyData,
    cashFloor,
    lowCashWeek
  );
}

function renderCategoryOptions(type) {
  categorySelect.innerHTML = categoryMap[type]
    .map((category) => `<option value="${category}">${category}</option>`)
    .join("");
}

function renderTable(transactions) {
  if (!transactions.length) {
    transactionTableBody.innerHTML =
      '<tr><td colspan="8">No hay movimientos para este mes aún.</td></tr>';
    return;
  }

  transactionTableBody.innerHTML = transactions
    .map(
      (item) => `
        <tr>
          <td>${formatDate(item.date)}</td>
          <td>${escapeHtml(item.description)}</td>
          <td>${item.category}</td>
          <td>${item.channel}</td>
          <td>${escapeHtml(item.note || "-")}</td>
          <td><span class="type-badge ${item.type}">${item.type === "income" ? "Ingreso" : "Egreso"}</span></td>
          <td class="${item.type === "income" ? "amount-positive" : "amount-negative"}">${item.type === "income" ? "+" : "-"}${formatCurrency(item.amount)}</td>
          <td class="action-cell">
            <button type="button" class="edit-btn" data-edit-transaction="${item.id}">Modificar</button>
            <button type="button" class="delete-btn" data-delete-transaction="${item.id}">Eliminar</button>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderReceivables(receivables) {
  if (!receivables.length) {
    receivableTableBody.innerHTML =
      '<tr><td colspan="8">No hay cuentas por cobrar registradas.</td></tr>';
    return;
  }

  receivableTableBody.innerHTML = receivables
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.client)}</td>
          <td>${escapeHtml(item.document)}</td>
          <td>${formatDate(item.dueDate)}</td>
          <td><span class="type-badge ${item.status}">${labelStatus(item.status)}</span></td>
          <td class="amount-positive">${formatCurrency(item.amount)}</td>
          <td class="amount-positive">${formatCurrency(getPartialAmount(item))}</td>
          <td>${escapeHtml(item.note || "-")}</td>
          <td class="action-cell">
            <button type="button" class="edit-btn" data-edit-receivable="${item.id}">Modificar</button>
            <button type="button" class="delete-btn" data-delete-receivable="${item.id}">Eliminar</button>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderPayables(payables) {
  if (!payables.length) {
    payableTableBody.innerHTML =
      '<tr><td colspan="8">No hay facturas por pagar registradas.</td></tr>';
    return;
  }

  payableTableBody.innerHTML = payables
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.vendor)}</td>
          <td>${escapeHtml(item.document)}</td>
          <td>${formatDate(item.dueDate)}</td>
          <td><span class="type-badge ${item.status}">${labelStatus(item.status)}</span></td>
          <td class="amount-negative">${formatCurrency(item.amount)}</td>
          <td class="amount-negative">${formatCurrency(getPartialAmount(item))}</td>
          <td>${escapeHtml(item.note || "-")}</td>
          <td class="action-cell">
            <button type="button" class="edit-btn" data-edit-payable="${item.id}">Modificar</button>
            <button type="button" class="delete-btn" data-delete-payable="${item.id}">Eliminar</button>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderMonthlySummary() {
  const monthlyData = getMonthlySummaryData();

  const rows = Object.entries(monthlyData).sort(([monthA], [monthB]) =>
    monthB.localeCompare(monthA)
  );

  renderMonthlyFlowChart(rows.slice().reverse());

  if (!rows.length) {
    monthlySummaryTableBody.innerHTML =
      '<tr><td colspan="6">Aún no hay información mensual para mostrar.</td></tr>';
    return;
  }

  monthlySummaryTableBody.innerHTML = rows
    .map(([month, values]) => {
      const projected = values.income - values.expense + values.receivable - values.payable;
      return `
        <tr>
          <td><strong>${formatMonthLabel(month)}</strong></td>
          <td class="amount-positive">${formatCurrency(values.income)}</td>
          <td class="amount-negative">${formatCurrency(values.expense)}</td>
          <td class="amount-positive">${formatCurrency(values.receivable)}</td>
          <td class="amount-negative">${formatCurrency(values.payable)}</td>
          <td class="${projected >= 0 ? "amount-positive" : "amount-negative"}">${formatCurrency(projected)}</td>
        </tr>
      `;
    })
    .join("");
}

function getMonthlySummaryData() {
  const monthlyData = {};

  state.data.transactions.forEach((item) => {
    const month = item.date.slice(0, 7);
    if (!monthlyData[month]) {
      monthlyData[month] = { income: 0, expense: 0, receivable: 0, payable: 0 };
    }
    monthlyData[month][item.type] += item.amount;
  });

  state.data.receivables
    .filter((item) => item.status !== "paid")
    .forEach((item) => {
      const month = item.dueDate.slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0, receivable: 0, payable: 0 };
      }
      monthlyData[month].receivable += getOutstandingAmount(item);
    });

  state.data.payables
    .filter((item) => item.status !== "paid")
    .forEach((item) => {
      const month = item.dueDate.slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0, receivable: 0, payable: 0 };
      }
      monthlyData[month].payable += getOutstandingAmount(item);
    });

  return monthlyData;
}

function renderMonthlyFlowChart(rows) {
  if (!rows.length) {
    monthlyFlowChart.innerHTML =
      '<div class="monthly-flow-empty">Aún no hay datos suficientes para graficar el flujo mensual.</div>';
    return;
  }

  const chartRows = rows.slice(-6).map(([month, values]) => ({
    month,
    income: values.income,
    expense: values.expense,
    net: values.income - values.expense,
  }));

  const maxAmount =
    Math.max(
      ...chartRows.flatMap((item) => [item.income, item.expense, Math.abs(item.net)]),
      1
    ) || 1;

  monthlyFlowChart.innerHTML = chartRows
    .map((item) => {
      const incomeHeight = Math.max((item.income / maxAmount) * 100, item.income ? 8 : 0);
      const expenseHeight = Math.max((item.expense / maxAmount) * 100, item.expense ? 8 : 0);
      const netHeight = Math.max((Math.abs(item.net) / maxAmount) * 100, item.net ? 8 : 0);
      const netTone = item.net >= 0 ? "positive" : "negative";

      return `
        <article class="monthly-flow-bar">
          <div class="monthly-flow-stack">
            <div class="flow-column income" style="height:${incomeHeight}%">
              <span>${formatCompactCurrency(item.income)}</span>
            </div>
            <div class="flow-column expense" style="height:${expenseHeight}%">
              <span>${formatCompactCurrency(item.expense)}</span>
            </div>
            <div class="flow-column net ${netTone}" style="height:${netHeight}%">
              <span>${formatCompactCurrency(item.net)}</span>
            </div>
          </div>
          <div class="monthly-flow-label">
            <strong>${formatMonthLabel(item.month)}</strong>
            <div class="flow-legend">
              <span class="flow-legend-item"><i class="flow-dot income"></i>Ingresos</span>
              <span class="flow-legend-item"><i class="flow-dot expense"></i>Egresos</span>
              <span class="flow-legend-item"><i class="flow-dot net"></i>Neto</span>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderBreakdown(expenses) {
  if (!expenses.length) {
    expenseBreakdown.innerHTML = '<div class="breakdown-row">Aún no hay egresos para analizar.</div>';
    return;
  }

  const totalsByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const highest = Math.max(...Object.values(totalsByCategory));

  expenseBreakdown.innerHTML = Object.entries(totalsByCategory)
    .sort(([, a], [, b]) => b - a)
    .map(
      ([category, amount]) => `
        <div class="breakdown-row">
          <div class="mini-chart-header">
            <strong>${category}</strong>
            <span>${formatCurrency(amount)}</span>
          </div>
          <div class="breakdown-line">
            <span style="width: ${(amount / highest) * 100}%"></span>
          </div>
        </div>
      `
    )
    .join("");
}

function createForecastWeeks(
  balance,
  recurring,
  incomes,
  expenses,
  receivableTotal,
  payableTotal,
  cashFloor
) {
  const weeklyRecurring = recurring.reduce((total, item) => total + item.amount / 4, 0);
  const weeklyIncome = incomes.length ? sum(incomes) / 4 : 0;
  const weeklyExpense = expenses.length ? sum(expenses) / 4 : 0;

  let rollingBalance = balance;
  const weeks = Array.from({ length: 8 }, (_, index) => {
    if (index === 0) {
      rollingBalance += receivableTotal * 0.35 - payableTotal * 0.45;
    }

    rollingBalance += weeklyIncome - Math.max(weeklyExpense, weeklyRecurring);

    const amount = Math.round(rollingBalance);

    return {
      label: `Semana ${index + 1}`,
      amount,
      tone: getForecastTone(amount, cashFloor),
    };
  });

  return weeks;
}

function renderForecast(weeks, cashFloor) {
  forecastList.innerHTML = weeks
    .map(
      (week) => `
        <div class="forecast-row ${cashFloor > 0 && week.amount < cashFloor ? "alert" : ""}">
          <span class="forecast-dot ${week.tone}"></span>
          <strong>${week.label}</strong>
          <span>${formatCurrency(week.amount)}</span>
        </div>
      `
    )
    .join("");
}

function renderCashFloorStatus(balance, cashFloor, lowCashWeek, hasAnyData) {
  if (!cashFloor) {
    cashFloorAlert.className = "cash-floor-alert";
    cashFloorAlert.textContent = "Define tu caja mínima para activar alertas.";
    return;
  }

  if (!hasAnyData) {
    cashFloorAlert.className = "cash-floor-alert warn";
    cashFloorAlert.textContent = "Cuando cargues movimientos, te avisaré si bajas de tu caja mínima.";
    return;
  }

  if (balance < cashFloor) {
    cashFloorAlert.className = "cash-floor-alert risk";
    cashFloorAlert.textContent = `Alerta: tu saldo proyectado está bajo tu caja mínima de ${formatCurrency(cashFloor)}.`;
    return;
  }

  if (lowCashWeek) {
    cashFloorAlert.className = "cash-floor-alert warn";
    cashFloorAlert.textContent = `Alerta: ${lowCashWeek.label} baja a ${formatCurrency(lowCashWeek.amount)}, bajo tu mínimo.`;
    return;
  }

  cashFloorAlert.className = "cash-floor-alert ok";
  cashFloorAlert.textContent = `Tu proyección se mantiene sobre tu caja mínima de ${formatCurrency(cashFloor)}.`;
}

function renderTips(
  incomeTotal,
  expenseTotal,
  recurring,
  balance,
  openReceivables,
  openPayables,
  hasAnyData,
  cashFloor,
  lowCashWeek
) {
  if (!hasAnyData) {
    tipsList.innerHTML = "";
    return;
  }

  const tips = [];

  if (cashFloor > 0 && balance < cashFloor) {
    tips.push(
      `Tu saldo proyectado está bajo tu caja mínima de ${formatCurrency(cashFloor)}. Prioriza cobrar pendientes o postergar pagos no urgentes.`
    );
  } else if (lowCashWeek) {
    tips.push(
      `${lowCashWeek.label} caería a ${formatCurrency(lowCashWeek.amount)}, bajo tu caja mínima de ${formatCurrency(cashFloor)}. Ajusta vencimientos o refuerza cobranza antes de esa semana.`
    );
  }

  if (expenseTotal > incomeTotal) {
    tips.push(
      "Tus egresos del mes superan los ingresos. Revisa precios, frecuencia de compra o gastos que puedas postergar."
    );
  }

  if (recurring.length >= 3) {
    tips.push(
      "Ya tienes varios movimientos recurrentes. Conviene separar costos fijos de variables para anticipar semanas más estrechas."
    );
  }

  if (balance < 150000) {
    tips.push(
      "El saldo proyectado está bajo para operar con holgura. Considera resguardar una reserva mínima para compras y despachos."
    );
  }

  const receivablesDueTomorrow = openReceivables.filter(
    (item) => daysUntil(item.dueDate) === 1
  );
  const payablesDueTomorrow = openPayables.filter((item) => daysUntil(item.dueDate) === 1);

  if (openReceivables.some((item) => daysUntil(item.dueDate) < 0)) {
    tips.push(
      "Tienes cuentas por cobrar vencidas. Prioriza seguimiento de clientes antes de comprometer nuevas compras."
    );
  }

  if (receivablesDueTomorrow.length) {
    receivablesDueTomorrow.forEach((item) => {
      tips.push(`Mañana vence ${item.document} de ${item.client}.`);
    });
  }

  if (payablesDueTomorrow.length) {
    payablesDueTomorrow.forEach((item) => {
      tips.push(`Mañana vence ${item.document} de ${item.vendor}.`);
    });
  }

  if (openPayables.some((item) => daysUntil(item.dueDate) <= 7)) {
    tips.push(
      "Hay facturas por pagar con vencimiento cercano. Programa esos pagos para evitar recargos o tensión con proveedores."
    );
  }

  if (incomeTotal > expenseTotal && balance >= 150000) {
    tips.push(
      "Tu caja se ve estable este mes. Puede ser buen momento para definir un porcentaje fijo de reinversión."
    );
  }

  if (!tips.length) {
    tips.push(
      "Carga más movimientos y vencimientos para que la aplicación pueda detectar patrones y darte recomendaciones más precisas."
    );
  }

  tipsList.innerHTML = tips.map((tip) => `<li>${tip}</li>`).join("");
}

async function loadData() {
  if (!state.session?.user) {
    return cloneSeedState();
  }

  const storageKey = getUserStorageKey();
  const localBackup = safeGetLocalStorage(storageKey);
  const parsedLocal = parseStoredPayload(localBackup);

  try {
    const { data, error } = await supabaseClient
      .from(SUPABASE_STATE_TABLE)
      .select("payload")
      .eq("user_id", state.session.user.id)
      .limit(1);

    if (error) {
      throw error;
    }

    if (parsedLocal) {
      await saveDataToSupabase(parsedLocal);
      return parsedLocal;
    }

    if (data?.[0]?.payload) {
      const parsedRemote = normalizeStatePayload(data[0].payload);
      safeSetLocalStorage(storageKey, JSON.stringify(parsedRemote));
      return parsedRemote;
    }

    const seed = cloneSeedState();
    await saveDataToSupabase(seed);
    safeSetLocalStorage(storageKey, JSON.stringify(seed));
    return seed;
  } catch {
    if (parsedLocal) {
      return parsedLocal;
    }

    return cloneSeedState();
  }
}

async function saveData() {
  if (!state.session?.user) {
    return;
  }

  const normalizedData = normalizeStatePayload(state.data);
  state.data = normalizedData;
  safeSetLocalStorage(getUserStorageKey(), JSON.stringify(normalizedData));

  try {
    await saveDataToSupabase(normalizedData);
  } catch (error) {
    console.warn("No se pudo sincronizar con Supabase:", error.message);
  }
}

function safeGetLocalStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn("No se pudo leer localStorage:", error?.message || error);
    return null;
  }
}

function safeSetLocalStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn("No se pudo guardar respaldo local:", error?.message || error);
  }
}

function parseStoredPayload(rawValue) {
  if (!rawValue) {
    return null;
  }

  try {
    return normalizeStatePayload(JSON.parse(rawValue));
  } catch (error) {
    console.warn("No se pudo interpretar respaldo local:", error?.message || error);
    return null;
  }
}


function getHealth(incomeTotal, expenseTotal, balance, cashFloor = 0) {
  const minimumBalance = cashFloor > 0 ? cashFloor : 100000;
  const cautionBalance = cashFloor > 0 ? cashFloor * 1.35 : 350000;

  if (balance <= minimumBalance || expenseTotal > incomeTotal) {
    return {
      label: "Atención inmediata",
      tone: "risk",
      description: "La caja proyectada está bajo presión y requiere ajustes pronto.",
    };
  }

  if (balance <= cautionBalance || expenseTotal > incomeTotal * 0.8) {
    return {
      label: "Zona de cuidado",
      tone: "warn",
      description: "La operación sigue viva, pero con margen más estrecho.",
    };
  }

  return {
    label: "Caja saludable",
    tone: "ok",
    description: "Tu flujo aguanta mejor compras, pagos y semanas lentas.",
  };
}

function getForecastTone(amount, cashFloor) {
  if (cashFloor > 0) {
    if (amount < cashFloor) {
      return "risk";
    }

    if (amount < cashFloor * 1.35) {
      return "warn";
    }

    return "ok";
  }

  return amount > 300000 ? "ok" : amount > 100000 ? "warn" : "risk";
}

function findTopExpenseCategory(expenses) {
  if (!expenses.length) {
    return "Sin movimientos";
  }

  const totals = expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {});

  const [category, amount] = Object.entries(totals).sort(([, a], [, b]) => b - a)[0];
  return `${category} · ${formatCurrency(amount)}`;
}

function createAdvice(
  netTotal,
  recurringCount,
  topCategory,
  receivableTotal,
  payableTotal,
  hasAnyData
) {
  if (!hasAnyData) {
    return "";
  }

  if (netTotal < 0) {
    return `Este mes cerraría en rojo. Parte revisando la categoría más pesada: ${topCategory}.`;
  }

  if (payableTotal > receivableTotal) {
    return "Tus salidas comprometidas superan lo que tienes por cobrar. Cuida compras nuevas y ordena vencimientos.";
  }

  if (recurringCount > 0) {
    return "Tus cargos recurrentes ya están visibles. Usa esa base para definir un piso mínimo de ventas cada mes.";
  }

  return "Tu flujo mensual va positivo. Ahora conviene registrar también tus costos fijos para no sobreestimar margen.";
}

function sum(items) {
  if (!items.length) {
    return 0;
  }

  if (typeof items[0] === "number") {
    return items.reduce((total, item) => total + item, 0);
  }

  return items.reduce((total, item) => total + getOutstandingAmount(item), 0);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value) {
  const absoluteValue = Math.abs(Number(value) || 0);
  const sign = Number(value) < 0 ? "-" : "";

  if (absoluteValue >= 1000000) {
    return `${sign}$${(absoluteValue / 1000000).toFixed(1).replace(".0", "")}M`;
  }

  if (absoluteValue >= 1000) {
    return `${sign}$${Math.round(absoluteValue / 1000)}K`;
  }

  return `${sign}$${absoluteValue}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatMonthLabel(value) {
  const [year, month] = value.split("-");
  return new Intl.DateTimeFormat("es-CL", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${year}-${month}-01T12:00:00`));
}

function currentMonth() {
  return today().slice(0, 7);
}

function today() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(days) {
  const base = new Date(`${today()}T12:00:00`);
  base.setDate(base.getDate() + days);
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, "0");
  const day = String(base.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysUntil(dateValue) {
  const target = new Date(`${dateValue}T12:00:00`);
  const base = new Date(`${today()}T12:00:00`);
  return Math.floor((target - base) / 86400000);
}

function sortByDateDesc(a, b) {
  return b.date.localeCompare(a.date);
}

function sortByDueDateAsc(a, b) {
  return a.dueDate.localeCompare(b.dueDate);
}

function labelStatus(status) {
  const labels = {
    pending: "Pendiente",
    partial: "Abono parcial",
    scheduled: "Programada",
    paid: "Pagada",
  };

  return labels[status] || status;
}

function cloneSeedState() {
  return {
    companyLogo: seedState.companyLogo,
    cashFloor: seedState.cashFloor,
    transactions: [...seedState.transactions].sort(sortByDateDesc),
    receivables: normalizeLedgerItems([...seedState.receivables]).sort(sortByDueDateAsc),
    payables: normalizeLedgerItems([...seedState.payables]).sort(sortByDueDateAsc),
  };
}

function normalizeStatePayload(payload) {
  return {
    companyLogo: typeof payload?.companyLogo === "string" ? payload.companyLogo : "",
    cashFloor: Math.max(0, Number(payload?.cashFloor) || 0),
    transactions: (payload?.transactions || []).sort(sortByDateDesc),
    receivables: normalizeLedgerItems(payload?.receivables || []).sort(sortByDueDateAsc),
    payables: normalizeLedgerItems(payload?.payables || []).sort(sortByDueDateAsc),
  };
}

function getUserStorageKey() {
  return `${STORAGE_KEY}-${state.session.user.id}`;
}

async function saveDataToSupabase(payload) {
  const { error } = await supabaseClient.from(SUPABASE_STATE_TABLE).upsert(
    {
      user_id: state.session.user.id,
      payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw error;
  }
}

function text(selector, value) {
  document.querySelector(selector).textContent = value;
}

function fillTransactionForm(transaction) {
  transactionFields.transactionId.value = transaction.id;
  transactionFields.type.value = transaction.type;
  renderCategoryOptions(transaction.type);
  transactionFields.description.value = transaction.description;
  transactionFields.note.value = transaction.note || "";
  transactionFields.amount.value = transaction.amount;
  transactionFields.date.value = transaction.date;
  transactionFields.category.value = transaction.category;
  transactionFields.channel.value = transaction.channel;
  transactionFields.recurring.checked = Boolean(transaction.recurring);
  saveTransactionBtn.textContent = "Guardar cambios";
  cancelTransactionEditBtn.hidden = false;
  document.querySelector("#transactionForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetTransactionForm() {
  transactionForm.reset();
  transactionFields.transactionId.value = "";
  transactionFields.date.value = today();
  transactionFields.type.value = "income";
  renderCategoryOptions("income");
  saveTransactionBtn.textContent = "Guardar movimiento";
  cancelTransactionEditBtn.hidden = true;
}

function fillReceivableForm(receivable) {
  receivableFields.receivableId.value = receivable.id;
  receivableFields.client.value = receivable.client;
  receivableFields.document.value = receivable.document;
  receivableFields.amount.value = receivable.amount;
  receivableFields.issueDate.value = receivable.issueDate;
  receivableFields.dueDate.value = receivable.dueDate;
  receivableFields.status.value = receivable.status;
  receivableFields.pendingAmount.value = getPartialAmount(receivable) || "";
  receivableFields.note.value = receivable.note || "";
  togglePartialAmountField(receivableFields, receivablePartialField);
  saveReceivableBtn.textContent = "Guardar cambios";
  cancelReceivableEditBtn.hidden = false;
  receivableForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetReceivableForm() {
  receivableForm.reset();
  receivableFields.receivableId.value = "";
  receivableFields.issueDate.value = today();
  receivableFields.dueDate.value = addDays(10);
  togglePartialAmountField(receivableFields, receivablePartialField);
  saveReceivableBtn.textContent = "Registrar cuenta por cobrar";
  cancelReceivableEditBtn.hidden = true;
}

function fillPayableForm(payable) {
  payableFields.payableId.value = payable.id;
  payableFields.vendor.value = payable.vendor;
  payableFields.document.value = payable.document;
  payableFields.amount.value = payable.amount;
  payableFields.issueDate.value = payable.issueDate;
  payableFields.dueDate.value = payable.dueDate;
  payableFields.status.value = payable.status;
  payableFields.pendingAmount.value = getPartialAmount(payable) || "";
  payableFields.note.value = payable.note || "";
  togglePartialAmountField(payableFields, payablePartialField);
  savePayableBtn.textContent = "Guardar cambios";
  cancelPayableEditBtn.hidden = false;
  payableForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetPayableForm() {
  payableForm.reset();
  payableFields.payableId.value = "";
  payableFields.issueDate.value = today();
  payableFields.dueDate.value = addDays(7);
  togglePartialAmountField(payableFields, payablePartialField);
  savePayableBtn.textContent = "Registrar factura por pagar";
  cancelPayableEditBtn.hidden = true;
}

function resolvePendingAmount(totalAmount, partialAmount, status) {
  if (status === "paid") {
    return 0;
  }

  if (status === "partial") {
    if (partialAmount > 0 && partialAmount < totalAmount) {
      return totalAmount - partialAmount;
    }
    return totalAmount;
  }

  return totalAmount;
}

function normalizeLedgerItems(items) {
  return items.map((item) => ({
    ...item,
    pendingAmount: normalizeOutstandingAmount(item),
  }));
}

function normalizeOutstandingAmount(item) {
  const amount = Number(item.amount) || 0;

  if (item.status === "paid") {
    return 0;
  }

  if (item.status === "partial") {
    const pendingAmount = Number(item.pendingAmount);
    if (pendingAmount >= 0 && pendingAmount < amount) {
      return pendingAmount;
    }
    return amount;
  }

  return amount;
}

function getOutstandingAmount(item) {
  if (typeof item !== "object" || item === null) {
    return Number(item) || 0;
  }

  if (!("status" in item) && !("pendingAmount" in item)) {
    return Number(item.amount) || 0;
  }

  return Number(item.status === "paid" ? 0 : item.pendingAmount ?? item.amount) || 0;
}

function getPartialAmount(item) {
  if (typeof item !== "object" || item === null || item.status !== "partial") {
    return 0;
  }

  return Math.max(Number(item.amount || 0) - getOutstandingAmount(item), 0);
}

function togglePartialAmountField(fields, field) {
  const showField = fields.status.value === "partial";
  field.hidden = !showField;
  if (!showField) {
    fields.pendingAmount.value = "";
  }
}

function getNamedFields(form, names) {
  return names.reduce((fields, name) => {
    const field = form.querySelector(`[name="${name}"]`);

    if (!field) {
      throw new Error(`No se encontró el campo ${name} en ${form.id}.`);
    }

    fields[name] = field;
    return fields;
  }, {});
}

function calculateIncludedVat(amount) {
  return Math.round((Number(amount || 0) * 19) / 119);
}

function applyCompanyLogo() {
  const logoData = state.data.companyLogo;
  const faviconHref = logoData || generateFallbackFavicon();

  dynamicFavicon.href = faviconHref;
  brandLogoPreview.hidden = !logoData;
  brandLogoFallback.hidden = Boolean(logoData);

  if (logoData) {
    brandLogoPreview.src = logoData;
  } else {
    brandLogoPreview.removeAttribute("src");
  }
}

function generateFallbackFavicon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="16" fill="#18261f"/>
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        fill="#fff7eb" font-family="Arial, sans-serif" font-size="24" font-weight="700">FC</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function exportAccountBackup() {
  const backupPayload = {
    app: "Flujo Claro",
    version: 1,
    exportedAt: new Date().toISOString(),
    userEmail: state.session?.user?.email || "",
    data: normalizeStatePayload(state.data),
  };

  const safeEmail = (backupPayload.userEmail || "cuenta")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const filename = `respaldo-flujo-claro-${safeEmail}-${today()}.json`;
  const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
    type: "application/json;charset=utf-8",
  });

  downloadBlob(blob, filename);
}

function downloadBlob(blob, filename) {
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
}

function exportToExcel() {
  const monthlyRows = buildMonthlySummaryRows();
  const workbookHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8" /></head>
      <body>
        <h2>Movimientos</h2>
        ${buildExportTable(
          ["Fecha", "Concepto", "Categoría", "Método", "Nota", "Tipo", "Monto"],
          state.data.transactions.map((item) => [
            formatDate(item.date),
            item.description,
            item.category,
            item.channel,
            item.note || "",
            item.type === "income" ? "Ingreso" : "Egreso",
            item.amount,
          ])
        )}
        <h2>Cuentas por cobrar</h2>
        ${buildExportTable(
          [
            "Cliente",
            "Documento",
            "Emisión",
            "Vencimiento",
            "Estado",
            "Monto total",
            "Abono",
            "Nota",
          ],
          state.data.receivables.map((item) => [
            item.client,
            item.document,
            formatDate(item.issueDate),
            formatDate(item.dueDate),
            labelStatus(item.status),
            item.amount,
            getPartialAmount(item),
            item.note || "",
          ])
        )}
        <h2>Facturas por pagar</h2>
        ${buildExportTable(
          [
            "Proveedor",
            "Factura",
            "Emisión",
            "Vencimiento",
            "Estado",
            "Monto total",
            "Abono",
            "Nota",
          ],
          state.data.payables.map((item) => [
            item.vendor,
            item.document,
            formatDate(item.issueDate),
            formatDate(item.dueDate),
            labelStatus(item.status),
            item.amount,
            getPartialAmount(item),
            item.note || "",
          ])
        )}
        <h2>Resumen por mes</h2>
        ${buildExportTable(
          ["Mes", "Ingresos", "Egresos", "Por cobrar", "Por pagar", "Saldo proyectado"],
          monthlyRows.map(([month, values]) => [
            formatMonthLabel(month),
            values.income,
            values.expense,
            values.receivable,
            values.payable,
            values.income - values.expense + values.receivable - values.payable,
          ])
        )}
      </body>
    </html>
  `;

  downloadFile(
    `flujo-caja-${today()}.xls`,
    "application/vnd.ms-excel;charset=utf-8;",
    workbookHtml
  );
}

function exportToPdf() {
  const monthlyRows = buildMonthlySummaryRows();
  const reportWindow = window.open("", "_blank");

  if (!reportWindow) {
    alert("Permite ventanas emergentes para generar el PDF.");
    return;
  }

  reportWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Reporte Flujo de Caja</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 32px;
            color: #18261f;
          }
          h1, h2 {
            margin: 0 0 12px;
          }
          h2 {
            margin-top: 28px;
            font-size: 18px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18px;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #ccd5cf;
            padding: 8px;
            text-align: left;
          }
          th {
            background: #f3efe7;
          }
        </style>
      </head>
      <body>
        <h1>Reporte Flujo Claro</h1>
        <p>Generado el ${formatDate(today())}</p>

        <h2>Resumen por mes</h2>
        ${buildExportTable(
          ["Mes", "Ingresos", "Egresos", "Por cobrar", "Por pagar", "Saldo proyectado"],
          monthlyRows.map(([month, values]) => [
            formatMonthLabel(month),
            formatCurrency(values.income),
            formatCurrency(values.expense),
            formatCurrency(values.receivable),
            formatCurrency(values.payable),
            formatCurrency(values.income - values.expense + values.receivable - values.payable),
          ])
        )}

        <h2>Movimientos</h2>
        ${buildExportTable(
          ["Fecha", "Concepto", "Categoría", "Método", "Nota", "Tipo", "Monto"],
          state.data.transactions.map((item) => [
            formatDate(item.date),
            item.description,
            item.category,
            item.channel,
            item.note || "",
            item.type === "income" ? "Ingreso" : "Egreso",
            formatCurrency(item.amount),
          ])
        )}

        <h2>Cuentas por cobrar</h2>
        ${buildExportTable(
          [
            "Cliente",
            "Documento",
            "Emisión",
            "Vencimiento",
            "Estado",
            "Monto total",
            "Abono",
            "Nota",
          ],
          state.data.receivables.map((item) => [
            item.client,
            item.document,
            formatDate(item.issueDate),
            formatDate(item.dueDate),
            labelStatus(item.status),
            formatCurrency(item.amount),
            formatCurrency(getPartialAmount(item)),
            item.note || "",
          ])
        )}

        <h2>Facturas por pagar</h2>
        ${buildExportTable(
          [
            "Proveedor",
            "Factura",
            "Emisión",
            "Vencimiento",
            "Estado",
            "Monto total",
            "Abono",
            "Nota",
          ],
          state.data.payables.map((item) => [
            item.vendor,
            item.document,
            formatDate(item.issueDate),
            formatDate(item.dueDate),
            labelStatus(item.status),
            formatCurrency(item.amount),
            formatCurrency(getPartialAmount(item)),
            item.note || "",
          ])
        )}
      </body>
    </html>
  `);

  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
}

function buildMonthlySummaryRows() {
  const monthlyData = {};

  state.data.transactions.forEach((item) => {
    const month = item.date.slice(0, 7);
    if (!monthlyData[month]) {
      monthlyData[month] = { income: 0, expense: 0, receivable: 0, payable: 0 };
    }
    monthlyData[month][item.type] += item.amount;
  });

  state.data.receivables
    .filter((item) => item.status !== "paid")
    .forEach((item) => {
      const month = item.dueDate.slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0, receivable: 0, payable: 0 };
      }
      monthlyData[month].receivable += getOutstandingAmount(item);
    });

  state.data.payables
    .filter((item) => item.status !== "paid")
    .forEach((item) => {
      const month = item.dueDate.slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0, receivable: 0, payable: 0 };
      }
      monthlyData[month].payable += getOutstandingAmount(item);
    });

  return Object.entries(monthlyData).sort(([monthA], [monthB]) =>
    monthB.localeCompare(monthA)
  );
}

function buildExportTable(headers, rows) {
  return `
    <table>
      <thead>
        <tr>${headers.map((header) => `<th>${escapeHtml(String(header))}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${
          rows.length
            ? rows
                .map(
                  (row) =>
                    `<tr>${row
                      .map((cell) => `<td>${escapeHtml(String(cell))}</td>`)
                      .join("")}</tr>`
                )
                .join("")
            : `<tr><td colspan="${headers.length}">Sin datos</td></tr>`
        }
      </tbody>
    </table>
  `;
}

function downloadFile(filename, mimeType, content) {
  const blob = new Blob(["\ufeff", content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
