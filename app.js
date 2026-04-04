const STORAGE_KEY = "cashflow-emprendedores-data-v2";
const SUPABASE_URL = "https://pmrbxgnpdxqkeihcinvj.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_-sACG1yR0TURwqX70-XwTA_1Q9QPJ0w";
const SUPABASE_STATE_TABLE = "cashflow_user_data";
const MAX_INVOICE_IMAGE_BYTES = 850 * 1024;
const INVOICE_IMAGE_MAX_WIDTH = 1400;

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

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);

const state = {
  data: cloneSeedState(),
  filterMonth: currentMonth(),
  session: null,
  authMode: "signIn",
  activePage: "home",
  activeDetailTab: "summary",
  lastMovementImpact: "",
  latestScenarioBalance: 0,
  payableInvoiceDraft: {
    image: "",
    ocrText: "",
  },
};

const authScreen = document.querySelector("#authScreen");
const appShell = document.querySelector("#appShell");
const authForm = document.querySelector("#authForm");
const authMessage = document.querySelector("#authMessage");
const authSubmitBtn = document.querySelector("#authSubmitBtn");
const toggleAuthModeBtn = document.querySelector("#toggleAuthModeBtn");
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
const appPages = [...document.querySelectorAll("[data-app-page]")];
const navLinks = [...document.querySelectorAll("[data-page-target]")];
const detailTabButtons = [...document.querySelectorAll("[data-detail-tab]")];
const detailTabPanels = [...document.querySelectorAll("[data-detail-panel]")];
const homeTodayCash = document.querySelector("#homeTodayCash");
const homeMonthEndCash = document.querySelector("#homeMonthEndCash");
const homeMonthEndCard = document.querySelector("#homeMonthEndCard");
const homeMonthEndHint = document.querySelector("#homeMonthEndHint");
const recentMovementList = document.querySelector("#recentMovementList");
const quickIncomeBtn = document.querySelector("#quickIncomeBtn");
const quickExpenseBtn = document.querySelector("#quickExpenseBtn");
const openTransactionModalBtn = document.querySelector("#openTransactionModalBtn");
const transactionModal = document.querySelector("#transactionModal");
const closeTransactionModalBtn = document.querySelector("#closeTransactionModalBtn");
const repeatLastMovementBtn = document.querySelector("#repeatLastMovementBtn");
const movementExtraDetails = document.querySelector("#movementExtraDetails");
const movementImpactText = document.querySelector("#movementImpactText");
const projectionStatusCard = document.querySelector("#projectionStatusCard");
const projectionMonthEndValue = document.querySelector("#projectionMonthEndValue");
const projectionAlertText = document.querySelector("#projectionAlertText");
const moneyCurveChart = document.querySelector("#moneyCurveChart");
const scenarioType = document.querySelector("#scenarioType");
const scenarioAmount = document.querySelector("#scenarioAmount");
const runScenarioBtn = document.querySelector("#runScenarioBtn");
const scenarioResultText = document.querySelector("#scenarioResultText");
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
const saveTransactionBtn = document.querySelector("#saveTransactionBtn");
const cancelTransactionEditBtn = document.querySelector("#cancelTransactionEditBtn");
const saveReceivableBtn = document.querySelector("#saveReceivableBtn");
const cancelReceivableEditBtn = document.querySelector("#cancelReceivableEditBtn");
const savePayableBtn = document.querySelector("#savePayableBtn");
const cancelPayableEditBtn = document.querySelector("#cancelPayableEditBtn");
const receivablePartialField = document.querySelector("#receivablePartialField");
const payablePartialField = document.querySelector("#payablePartialField");
const invoicePhotoInput = document.querySelector("#invoicePhotoInput");
const invoicePreview = document.querySelector("#invoicePreview");
const invoiceReadStatus = document.querySelector("#invoiceReadStatus");
const readInvoiceBtn = document.querySelector("#readInvoiceBtn");
const removeInvoicePhotoBtn = document.querySelector("#removeInvoicePhotoBtn");
const resetDataBtn = document.querySelector("#resetDataBtn");
const resetConfirmModal = document.querySelector("#resetConfirmModal");
const cancelResetModalBtn = document.querySelector("#cancelResetModalBtn");
const confirmResetModalBtn = document.querySelector("#confirmResetModalBtn");

transactionFields.date.value = today();
receivableFields.issueDate.value = today();
receivableFields.dueDate.value = addDays(10);
payableFields.issueDate.value = today();
payableFields.dueDate.value = addDays(7);
monthFilter.value = state.filterMonth;

renderCategoryOptions(transactionFields.type.value);
togglePartialAmountField(receivableFields, receivablePartialField);
togglePartialAmountField(payableFields, payablePartialField);
switchPage(state.activePage);
switchDetailTab(state.activeDetailTab);
render();
initializeAuth();

transactionFields.type.addEventListener("change", (event) => {
  renderCategoryOptions(event.target.value);
  updateMovementImpactPreview();
});

navLinks.forEach((navLink) => {
  navLink.addEventListener("click", () => {
    switchPage(navLink.dataset.pageTarget);
  });
});

detailTabButtons.forEach((tabButton) => {
  tabButton.addEventListener("click", () => {
    switchDetailTab(tabButton.dataset.detailTab);
  });
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await handleAuthSubmit();
});

toggleAuthModeBtn.addEventListener("click", () => {
  state.authMode = state.authMode === "signIn" ? "signUp" : "signIn";
  authMessage.textContent = "";
  authMessage.classList.remove("success");
  authSubmitBtn.textContent = state.authMode === "signIn" ? "Iniciar sesión" : "Crear cuenta";
  toggleAuthModeBtn.textContent = state.authMode === "signIn" ? "Crear cuenta" : "Ya tengo cuenta";
});

logoutBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
});

quickIncomeBtn.addEventListener("click", () => {
  openTransactionModal("income");
});

quickExpenseBtn.addEventListener("click", () => {
  openTransactionModal("expense");
});

openTransactionModalBtn.addEventListener("click", () => {
  openTransactionModal();
});

closeTransactionModalBtn.addEventListener("click", () => {
  resetTransactionForm();
});

transactionModal.addEventListener("click", (event) => {
  if (event.target === transactionModal) {
    resetTransactionForm();
  }
});

repeatLastMovementBtn.addEventListener("click", () => {
  const lastTransaction = state.data.transactions[0];

  if (!lastTransaction) {
    movementImpactText.textContent = "Todavía no hay un movimiento anterior para repetir.";
    return;
  }

  fillTransactionForm({ ...lastTransaction, id: "" }, true);
});

transactionFields.amount.addEventListener("input", () => {
  updateMovementImpactPreview();
});

runScenarioBtn.addEventListener("click", () => {
  renderScenarioResult();
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

invoicePhotoInput.addEventListener("change", async () => {
  const file = invoicePhotoInput.files?.[0];
  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("Sube una imagen de la factura en formato JPG, PNG o similar.");
    invoicePhotoInput.value = "";
    return;
  }

  try {
    setInvoiceReadStatus("Procesando imagen...");
    state.payableInvoiceDraft.image = await resizeImageToDataUrl(
      file,
      INVOICE_IMAGE_MAX_WIDTH,
      MAX_INVOICE_IMAGE_BYTES
    );
    state.payableInvoiceDraft.ocrText = "";
    invoicePhotoInput.value = "";
    updateInvoiceAttachmentPreview();
    setInvoiceReadStatus("Foto adjunta. Presiona “Leer factura” para intentar autocompletar datos.");
  } catch (error) {
    alert(error.message || "No se pudo cargar la imagen de la factura.");
    state.payableInvoiceDraft = { image: "", ocrText: "" };
    invoicePhotoInput.value = "";
    updateInvoiceAttachmentPreview();
    setInvoiceReadStatus("Sube una foto nítida y presiona “Leer factura”.");
  }
});

removeInvoicePhotoBtn.addEventListener("click", () => {
  state.payableInvoiceDraft = { image: "", ocrText: "" };
  invoicePhotoInput.value = "";
  updateInvoiceAttachmentPreview();
  setInvoiceReadStatus("Sube una foto nítida y presiona “Leer factura”.");
});

readInvoiceBtn.addEventListener("click", async () => {
  if (!state.payableInvoiceDraft.image) {
    setInvoiceReadStatus("Primero sube una foto de la factura.");
    return;
  }

  if (!window.Tesseract?.recognize) {
    setInvoiceReadStatus("No se pudo cargar el lector OCR. Revisa tu conexión y vuelve a intentar.");
    return;
  }

  readInvoiceBtn.disabled = true;
  readInvoiceBtn.textContent = "Leyendo...";
  setInvoiceReadStatus("Leyendo la factura, puede tardar algunos segundos...");

  try {
    const {
      data: { text: invoiceText = "" },
    } = await window.Tesseract.recognize(state.payableInvoiceDraft.image, "spa+eng");

    state.payableInvoiceDraft.ocrText = invoiceText.trim();
    const extractedData = extractPayableInvoiceData(invoiceText);
    applyExtractedPayableData(extractedData);

    const filledFields = Object.values(extractedData).filter(Boolean).length;
    setInvoiceReadStatus(
      filledFields
        ? `Lectura lista: completé ${filledFields} dato${filledFields === 1 ? "" : "s"}. Revisa antes de registrar.`
        : "La lectura terminó, pero no pude detectar datos con confianza. Puedes completar el formulario manualmente."
    );
  } catch (error) {
    setInvoiceReadStatus(
      `No pude leer la factura automáticamente. Puedes registrarla manualmente. Detalle: ${
        error.message || "OCR no disponible"
      }`
    );
  } finally {
    readInvoiceBtn.disabled = false;
    readInvoiceBtn.textContent = "Leer factura";
  }
});

transactionForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(transactionForm);
  const movementType = formData.get("type");
  const movementCategory =
    formData.get("category") || categoryMap[movementType]?.[0] || "Sin categoría";
  const transaction = {
    id: formData.get("transactionId") || crypto.randomUUID(),
    type: movementType,
    description:
      String(formData.get("description") || "").trim() ||
      `${movementType === "income" ? "Ingreso" : "Gasto"} · ${movementCategory}`,
    note: String(formData.get("note") || "").trim(),
    amount: Number(formData.get("amount")),
    date: formData.get("date"),
    category: movementCategory,
    channel: formData.get("channel") || "Transferencia",
    recurring: formData.get("recurring") === "on",
  };

  if (!transaction.amount || !transaction.date) {
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
  render();

  const impactCopy = createMovementImpactCopy(transaction);
  state.lastMovementImpact = impactCopy;

  if (isEditing) {
    resetTransactionForm();
    return;
  }

  transactionFields.transactionId.value = "";
  transactionFields.amount.value = "";
  transactionFields.description.value = "";
  transactionFields.note.value = "";
  transactionFields.date.value = today();
  transactionFields.recurring.checked = false;
  movementExtraDetails.open = false;
  saveTransactionBtn.textContent = "Guardar movimiento";
  cancelTransactionEditBtn.hidden = true;
  movementImpactText.textContent = impactCopy;
  transactionFields.amount.focus();
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
    invoicePhoto: state.payableInvoiceDraft.image,
    invoiceText: state.payableInvoiceDraft.ocrText,
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
  resetConfirmModal.hidden = false;
});

cancelResetModalBtn.addEventListener("click", () => {
  resetConfirmModal.hidden = true;
});

resetConfirmModal.addEventListener("click", (event) => {
  if (event.target === resetConfirmModal) {
    resetConfirmModal.hidden = true;
  }
});

confirmResetModalBtn.addEventListener("click", async () => {
  confirmResetModalBtn.disabled = true;
  confirmResetModalBtn.textContent = "Borrando...";
  state.data = cloneSeedState();
  state.filterMonth = currentMonth();
  monthFilter.value = state.filterMonth;
  cashFloorInput.value = "";
  await saveData();
  resetTransactionForm();
  resetReceivableForm();
  resetPayableForm();
  resetConfirmModal.hidden = true;
  confirmResetModalBtn.disabled = false;
  confirmResetModalBtn.textContent = "Aceptar borrado";
  render();
});

async function initializeAuth() {
  try {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    state.session = session;
    await syncSessionView();
  } catch {
    state.session = null;
    await syncSessionView();
  }

  supabaseClient.auth.onAuthStateChange(async (_event, sessionState) => {
    state.session = sessionState;
    await syncSessionView();
  });
}

async function handleAuthSubmit() {
  const formData = new FormData(authForm);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  authSubmitBtn.disabled = true;
  authMessage.classList.remove("success");
  authMessage.textContent = "Procesando...";

  const authResponse =
    state.authMode === "signIn"
      ? await supabaseClient.auth.signInWithPassword({ email, password })
      : await supabaseClient.auth.signUp({ email, password });

  authSubmitBtn.disabled = false;

  if (authResponse.error) {
    authMessage.textContent = authResponse.error.message;
    return;
  }

  if (state.authMode === "signUp" && !authResponse.data.session) {
    authMessage.classList.add("success");
    authMessage.textContent =
      "Cuenta creada. Revisa tu correo si Supabase pide confirmación y luego inicia sesión.";
    state.authMode = "signIn";
    authSubmitBtn.textContent = "Iniciar sesión";
    toggleAuthModeBtn.textContent = "Crear cuenta";
    authForm.reset();
    return;
  }

  authMessage.textContent = "";
  authForm.reset();
}

async function syncSessionView() {
  if (!state.session?.user) {
    switchPage("home");
    switchDetailTab("summary");
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
  switchPage("home");
  switchDetailTab("summary");
  state.data = await loadData();
  state.filterMonth = currentMonth();
  monthFilter.value = state.filterMonth;
  cashFloorInput.value = state.data.cashFloor || "";
  resetTransactionForm();
  resetReceivableForm();
  resetPayableForm();
  render();
}

function switchPage(pageName) {
  state.activePage = pageName;

  appPages.forEach((page) => {
    const isActive = page.dataset.appPage === pageName;
    page.hidden = !isActive;
    page.classList.toggle("is-active", isActive);
  });

  navLinks.forEach((navLink) => {
    navLink.classList.toggle("is-active", navLink.dataset.pageTarget === pageName);
  });
}

function switchDetailTab(tabName) {
  state.activeDetailTab = tabName;

  detailTabButtons.forEach((tabButton) => {
    tabButton.classList.toggle("is-active", tabButton.dataset.detailTab === tabName);
  });

  detailTabPanels.forEach((panel) => {
    const isActive = panel.dataset.detailPanel === tabName;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
  });
}

function openTransactionModal(preferredType = "", options = {}) {
  transactionModal.hidden = false;

  if (!options.preserveForm && preferredType) {
    transactionFields.type.value = preferredType;
    renderCategoryOptions(preferredType);
  }

  if (!options.preserveForm) {
    transactionFields.amount.value = "";
    transactionFields.description.value = "";
    transactionFields.note.value = "";
    transactionFields.date.value = today();
    transactionFields.transactionId.value = "";
    transactionFields.recurring.checked = false;
    movementExtraDetails.open = false;
    movementImpactText.textContent = "";
    saveTransactionBtn.textContent = "Guardar movimiento";
    cancelTransactionEditBtn.hidden = true;
  }

  transactionFields.amount.focus();
}

function renderRecentMovements(transactions) {
  const recentTransactions = transactions.slice(0, 6);

  if (!recentTransactions.length) {
    recentMovementList.innerHTML =
      '<div class="recent-empty">Aún no hay movimientos. Toca + para agregar el primero.</div>';
    return;
  }

  recentMovementList.innerHTML = recentTransactions
    .map((item) => {
      const sign = item.type === "income" ? "+" : "-";
      const toneClass = item.type === "income" ? "income" : "expense";

      return `
        <article class="recent-movement-row">
          <div class="recent-movement-copy">
            <strong>${escapeHtml(item.description)}</strong>
            <small>${formatDate(item.date)} · ${escapeHtml(item.channel || "Sin cuenta")}</small>
          </div>
          <span class="recent-movement-amount ${toneClass}">${sign}${formatCurrency(item.amount)}</span>
        </article>
      `;
    })
    .join("");
}

function renderMoneyCurveChart(currentBalance, cashFloor) {
  const points = buildMoneyCurvePoints(currentBalance, cashFloor);
  const width = 640;
  const height = 220;
  const values = points.map((point) => point.amount);
  const minAmount = Math.min(...values, cashFloor || 0);
  const maxAmount = Math.max(...values, cashFloor || 0, 1);
  const range = Math.max(maxAmount - minAmount, 1);
  const stepX = points.length > 1 ? width / (points.length - 1) : width;

  const svgPoints = points
    .map((point, index) => {
      const x = index * stepX;
      const y = height - ((point.amount - minAmount) / range) * 160 - 30;
      return `${x},${y}`;
    })
    .join(" ");

  const minLineY = cashFloor
    ? height - ((cashFloor - minAmount) / range) * 160 - 30
    : null;

  moneyCurveChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="money-curve-svg" aria-label="Curva de dinero">
      ${
        minLineY
          ? `<line x1="0" y1="${minLineY}" x2="${width}" y2="${minLineY}" class="money-floor-line" />`
          : ""
      }
      <polyline points="${svgPoints}" class="money-curve-line"></polyline>
      ${points
        .map((point, index) => {
          const x = index * stepX;
          const y = height - ((point.amount - minAmount) / range) * 160 - 30;
          return `<circle cx="${x}" cy="${y}" r="7" class="money-curve-dot ${point.tone}"></circle>`;
        })
        .join("")}
    </svg>
    <div class="money-curve-labels">
      <span>Hoy</span>
      <span>${points[points.length - 1]?.label || "Fin de mes"}</span>
    </div>
  `;
}

function buildMoneyCurvePoints(currentBalance, cashFloor) {
  const baseDate = new Date(`${today()}T12:00:00`);
  const endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 12, 0, 0);
  const points = [
    {
      label: formatDate(toISODate(baseDate)),
      amount: Math.round(currentBalance),
      tone: getForecastTone(currentBalance, cashFloor),
    },
  ];
  let rollingAmount = currentBalance;
  const todayIso = toISODate(baseDate);

  state.data.receivables
    .filter((item) => item.status !== "paid" && item.dueDate === todayIso)
    .forEach((item) => {
      rollingAmount += getOutstandingAmount(item);
    });

  state.data.payables
    .filter((item) => item.status !== "paid" && item.dueDate === todayIso)
    .forEach((item) => {
      rollingAmount -= getOutstandingAmount(item);
    });

  const cursorDate = new Date(baseDate);
  cursorDate.setDate(cursorDate.getDate() + 1);

  for (let date = cursorDate; date <= endDate; date.setDate(date.getDate() + 1)) {
    const isoDate = toISODate(date);

    state.data.transactions
      .filter((item) => item.date === isoDate)
      .forEach((item) => {
        rollingAmount += item.type === "income" ? item.amount : -item.amount;
      });

    state.data.receivables
      .filter((item) => item.status !== "paid" && item.dueDate === isoDate)
      .forEach((item) => {
        rollingAmount += getOutstandingAmount(item);
      });

    state.data.payables
      .filter((item) => item.status !== "paid" && item.dueDate === isoDate)
      .forEach((item) => {
        rollingAmount -= getOutstandingAmount(item);
      });

    const isKeyPoint =
      date.getTime() === endDate.getTime() ||
      date.getDate() % 5 === 0;

    if (isKeyPoint) {
      points.push({
        label: formatDate(isoDate),
        amount: Math.round(rollingAmount),
        tone: getForecastTone(rollingAmount, cashFloor),
      });
    }
  }

  return points.length ? points : [{ label: "Hoy", amount: currentBalance, tone: "warn" }];
}

function findCriticalCashDate(currentBalance, cashFloor) {
  if (!cashFloor) {
    return "";
  }

  const baseDate = new Date(`${today()}T12:00:00`);
  const endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 12, 0, 0);
  let rollingAmount = currentBalance;

  for (let date = new Date(baseDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const isoDate = toISODate(date);

    if (isoDate > today()) {
      state.data.transactions
        .filter((item) => item.date === isoDate)
        .forEach((item) => {
          rollingAmount += item.type === "income" ? item.amount : -item.amount;
        });
    }

    state.data.receivables
      .filter((item) => item.status !== "paid" && item.dueDate === isoDate)
      .forEach((item) => {
        rollingAmount += getOutstandingAmount(item);
      });

    state.data.payables
      .filter((item) => item.status !== "paid" && item.dueDate === isoDate)
      .forEach((item) => {
        rollingAmount -= getOutstandingAmount(item);
      });

    if (rollingAmount < cashFloor) {
      return isoDate;
    }
  }

  return "";
}

function buildProjectionAlertCopy(hasAnyData, fallbackDescription, criticalCashDate, cashFloor) {
  if (!hasAnyData) {
    return "Aún no hay movimientos para proyectar.";
  }

  if (criticalCashDate) {
    return `Día ${Number(criticalCashDate.slice(8, 10))}: te quedas bajo tu caja mínima de ${formatCurrency(cashFloor)}.`;
  }

  return fallbackDescription;
}

function renderScenarioResult() {
  const scenarioDelta = Number(scenarioAmount.value) || 0;
  if (!scenarioDelta) {
    scenarioResultText.className = "scenario-result";
    scenarioResultText.textContent = "Ingresa un monto para simular una venta o un gasto.";
    return;
  }

  const sign = scenarioType.value === "income" ? 1 : -1;
  const simulatedBalance = state.latestScenarioBalance + scenarioDelta * sign;
  const tone = getForecastTone(simulatedBalance, Number(state.data.cashFloor) || 0);
  const scenarioLabel = scenarioType.value === "income" ? "Si vendes" : "Si gastas";

  scenarioResultText.className = `scenario-result ${tone}`;
  scenarioResultText.textContent = `${scenarioLabel} ${formatCurrency(
    scenarioDelta
  )}, a fin de mes quedarías con ${formatCurrency(simulatedBalance)}.`;
}

function updateMovementImpactPreview() {
  const amount = Number(transactionFields.amount.value) || 0;
  if (!amount) {
    movementImpactText.textContent = state.lastMovementImpact || "";
    return;
  }

  const sign = transactionFields.type.value === "income" ? 1 : -1;
  const targetMonth = (transactionFields.date.value || today()).slice(0, 7);
  const projectedBalance = estimateProjectedBalanceForCurrentMonth(targetMonth) + amount * sign;
  movementImpactText.textContent = `Si guardas esto, a fin de mes te quedarían ${formatCurrency(
    projectedBalance
  )}.`;
}

function createMovementImpactCopy(transaction) {
  const projectedBalance = estimateProjectedBalanceForCurrentMonth(transaction.date.slice(0, 7));

  if (transaction.type === "income") {
    return `Ingreso guardado. Ahora podrías cerrar el mes con ${formatCurrency(projectedBalance)}.`;
  }

  return `Gasto guardado. Ahora te quedan ${formatCurrency(projectedBalance)} estimados para fin de mes.`;
}

function estimateProjectedBalanceForCurrentMonth(targetMonth = currentMonth()) {
  return calculateProjectedMonthEndCash(calculateAvailableCashToday(), targetMonth);
}

function calculateAvailableCashToday() {
  const todayIso = today();

  return state.data.transactions.reduce((total, item) => {
    if (item.date > todayIso) {
      return total;
    }

    return total + (item.type === "income" ? item.amount : -item.amount);
  }, 0);
}

function calculateProjectedMonthEndCash(currentCash, targetMonth) {
  const todayIso = today();
  const futureTransactions = state.data.transactions
    .filter((item) => item.date > todayIso && item.date.startsWith(targetMonth))
    .reduce(
      (total, item) => total + (item.type === "income" ? item.amount : -item.amount),
      0
    );
  const futureReceivables = state.data.receivables
    .filter(
      (item) =>
        item.status !== "paid" &&
        item.dueDate >= todayIso &&
        item.dueDate.startsWith(targetMonth)
    )
    .reduce((total, item) => total + getOutstandingAmount(item), 0);
  const futurePayables = state.data.payables
    .filter(
      (item) =>
        item.status !== "paid" &&
        item.dueDate >= todayIso &&
        item.dueDate.startsWith(targetMonth)
    )
    .reduce((total, item) => total + getOutstandingAmount(item), 0);

  return currentCash + futureTransactions + futureReceivables - futurePayables;
}

function render() {
  const currentMonthKey = currentMonth();
  const transactions = state.data.transactions.filter((item) =>
    item.date.startsWith(state.filterMonth)
  );
  const receivables = state.data.receivables.filter((item) =>
    item.dueDate.startsWith(state.filterMonth)
  );
  const payables = state.data.payables.filter((item) =>
    item.dueDate.startsWith(state.filterMonth)
  );
  const liveTransactions = state.data.transactions.filter((item) =>
    item.date.startsWith(currentMonthKey)
  );
  const liveReceivables = state.data.receivables.filter((item) =>
    item.dueDate.startsWith(currentMonthKey)
  );
  const livePayables = state.data.payables.filter((item) =>
    item.dueDate.startsWith(currentMonthKey)
  );
  const cashFloor = Number(state.data.cashFloor) || 0;

  const incomes = transactions.filter((item) => item.type === "income");
  const expenses = transactions.filter((item) => item.type === "expense");
  const openReceivables = receivables.filter((item) => item.status !== "paid");
  const openPayables = payables.filter((item) => item.status !== "paid");
  const liveIncomes = liveTransactions.filter((item) => item.type === "income");
  const liveSalesIncomes = liveIncomes.filter((item) => item.category === "Ventas");
  const liveExpenses = liveTransactions.filter((item) => item.type === "expense");
  const liveOpenReceivables = liveReceivables.filter((item) => item.status !== "paid");
  const liveOpenPayables = livePayables.filter((item) => item.status !== "paid");

  const incomeTotal = sum(incomes);
  const liveIncomeTotal = sum(liveIncomes);
  const monthlyVatTotal = calculateIncludedVat(sum(liveSalesIncomes));
  const monthlyVatCreditTotal = calculateIncludedVat(
    livePayables.reduce((total, item) => total + Number(item.amount || 0), 0)
  );
  const expenseTotal = sum(expenses);
  const liveExpenseTotal = sum(liveExpenses);
  const receivableTotal = sum(openReceivables);
  const payableTotal = sum(openPayables);
  const liveReceivableTotal = sum(liveOpenReceivables);
  const livePayableTotal = sum(liveOpenPayables);
  const netTotal = incomeTotal - expenseTotal;
  const currentBalance = calculateAvailableCashToday();
  const projectedBalance = calculateProjectedMonthEndCash(currentBalance, currentMonthKey);
  const recurring = transactions.filter((item) => item.recurring);
  const liveRecurring = liveTransactions.filter((item) => item.recurring);
  const averageIncome = liveIncomes.length
    ? Math.round(liveIncomeTotal / liveIncomes.length)
    : 0;
  const liveTopCategory = findTopExpenseCategory(liveExpenses);
  const hasAnyData =
    state.data.transactions.length > 0 ||
    state.data.receivables.length > 0 ||
    state.data.payables.length > 0;
  const nextCommitment = sum(
    state.data.payables.filter((item) => item.status !== "paid" && daysUntil(item.dueDate) <= 30)
  );
  const forecastWeeks = createForecastWeeks(
    currentBalance,
    liveRecurring,
    liveIncomes,
    liveExpenses,
    liveReceivableTotal,
    livePayableTotal,
    cashFloor
  );
  const lowCashWeek = cashFloor
    ? forecastWeeks.find((week) => week.amount < cashFloor)
    : null;
  const criticalCashDate = findCriticalCashDate(currentBalance, cashFloor);
  const health = hasAnyData
    ? getHealth(liveIncomeTotal, liveExpenseTotal, projectedBalance, cashFloor)
    : {
        label: "Sin datos",
        tone: "neutral",
        description: "Agrega tu primer movimiento para ver si te alcanza este mes.",
      };
  const assistantMessage = createAdvice(
    liveIncomeTotal - liveExpenseTotal,
    liveRecurring.length,
    liveTopCategory,
    liveReceivableTotal,
    livePayableTotal,
    hasAnyData,
    projectedBalance,
    cashFloor,
    lowCashWeek
  );

  text("#incomeTotal", formatCurrency(liveIncomeTotal));
  text("#expenseTotal", formatCurrency(liveExpenseTotal));
  text("#receivableTotal", formatCurrency(liveReceivableTotal));
  text("#payableTotal", formatCurrency(livePayableTotal));
  text("#monthlyVatTotal", formatCurrency(monthlyVatTotal));
  text("#monthlyVatCreditTotal", formatCurrency(monthlyVatCreditTotal));
  text("#netTotal", formatCurrency(liveIncomeTotal - liveExpenseTotal));
  text("#sidebarBalance", formatCurrency(currentBalance));
  text("#sidebarHealth", health.description);
  text("#homeTodayCash", formatCurrency(currentBalance));
  text("#homeMonthEndCash", formatCurrency(projectedBalance));
  text("#projectionMonthEndValue", formatCurrency(projectedBalance));
  text(
    "#projectionAlertText",
    buildProjectionAlertCopy(hasAnyData, health.description, criticalCashDate, cashFloor)
  );
  text("#recurringCount", `${liveRecurring.length} movimientos`);
  text("#avgIncome", formatCurrency(averageIncome));
  text("#topCategory", liveTopCategory);
  text("#nextCommitment", formatCurrency(nextCommitment));
  text("#adviceText", assistantMessage);
  text("#receivablePill", `${openReceivables.length} pendientes`);
  text("#payablePill", `${openPayables.length} pendientes`);

  const healthPill = document.querySelector("#healthPill");
  healthPill.textContent = health.label;
  healthPill.className = `pill ${health.tone}`;
  homeMonthEndCard.className = `money-main-card month-end-card ${health.tone}`;
  homeMonthEndHint.textContent = health.description;
  projectionStatusCard.className = `projection-status-card ${health.tone}`;
  state.latestScenarioBalance = projectedBalance;

  applyCompanyLogo();

  renderRecentMovements(state.data.transactions);
  renderTable(transactions);
  renderReceivables(receivables);
  renderPayables(payables);
  renderMoneyCurveChart(currentBalance, cashFloor);
  renderMonthlySummary();
  renderBreakdown(liveExpenses);
  renderForecast(forecastWeeks, cashFloor);
  renderCashFloorStatus(projectedBalance, cashFloor, lowCashWeek, hasAnyData);
  renderTips(
    liveIncomeTotal,
    liveExpenseTotal,
    liveRecurring,
    projectedBalance,
    liveOpenReceivables,
    liveOpenPayables,
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
          <td><span class="type-badge ${item.type}">${item.type === "income" ? "Ingreso" : "Gasto"}</span></td>
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
      '<tr><td colspan="9">No hay facturas por pagar registradas.</td></tr>';
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
          <td>${renderPayableInvoiceLink(item)}</td>
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
              <span class="flow-legend-item"><i class="flow-dot expense"></i>Gastos</span>
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
    cashFloorAlert.textContent = `Alerta: la plata proyectada baja de tu caja mínima de ${formatCurrency(cashFloor)}.`;
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
      `Tu plata proyectada está bajo tu caja mínima de ${formatCurrency(cashFloor)}. Prioriza cobrar pendientes o frenar pagos no urgentes.`
    );
  } else if (lowCashWeek) {
    tips.push(
      `${lowCashWeek.label} bajarías a ${formatCurrency(lowCashWeek.amount)}, bajo tu caja mínima de ${formatCurrency(cashFloor)}. Ajusta pagos o refuerza cobranza antes de esa semana.`
    );
  }

  if (expenseTotal > incomeTotal) {
    tips.push(
      "Tus gastos del mes superan tus ingresos. Revisa precios, frecuencia de compra o gastos que puedas postergar."
    );
  }

  if (recurring.length >= 3) {
    tips.push(
      "Ya tienes varios pagos repetidos. Conviene distinguir fijos y variables para anticipar semanas más apretadas."
    );
  }

  if (balance < 150000) {
    tips.push(
      "La plata disponible está baja para operar con holgura. Considera guardar una reserva mínima para compras y despachos."
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
      "Tu plata se ve más estable este mes. Puede ser buen momento para definir cuánto invertir sin apretarte."
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
  const localBackup = localStorage.getItem(storageKey);

  try {
    const { data, error } = await supabaseClient
      .from(SUPABASE_STATE_TABLE)
      .select("payload")
      .eq("user_id", state.session.user.id)
      .limit(1);

    if (error) {
      throw error;
    }

    if (data?.[0]?.payload) {
      const parsedRemote = normalizeStatePayload(data[0].payload);
      localStorage.setItem(storageKey, JSON.stringify(parsedRemote));
      return parsedRemote;
    }

    if (localBackup) {
      const parsedLocal = normalizeStatePayload(JSON.parse(localBackup));
      await saveDataToSupabase(parsedLocal);
      return parsedLocal;
    }

    const seed = cloneSeedState();
    await saveDataToSupabase(seed);
    localStorage.setItem(storageKey, JSON.stringify(seed));
    return seed;
  } catch {
    if (localBackup) {
      try {
        return normalizeStatePayload(JSON.parse(localBackup));
      } catch {
        return cloneSeedState();
      }
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
  localStorage.setItem(getUserStorageKey(), JSON.stringify(normalizedData));

  try {
    await saveDataToSupabase(normalizedData);
  } catch (error) {
    console.warn("No se pudo sincronizar con Supabase:", error.message);
  }
}

function getHealth(incomeTotal, expenseTotal, balance, cashFloor = 0) {
  const minimumBalance = cashFloor > 0 ? cashFloor : 100000;
  const cautionBalance = cashFloor > 0 ? cashFloor * 1.35 : 350000;

  if (balance <= minimumBalance || expenseTotal > incomeTotal) {
    return {
      label: "No te alcanza",
      tone: "risk",
      description: "Ojo: te estás quedando sin caja para cerrar el mes con calma.",
    };
  }

  if (balance <= cautionBalance || expenseTotal > incomeTotal * 0.8) {
    return {
      label: "Ajustado",
      tone: "warn",
      description: "Te alcanza, pero vas justo. Conviene cuidar gastos esta semana.",
    };
  }

  return {
    label: "Vas bien",
    tone: "ok",
    description: "Vas bien: tienes margen para operar y decidir sin tanta presión.",
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
  hasAnyData,
  projectedBalance = 0,
  cashFloor = 0,
  lowCashWeek = null
) {
  if (!hasAnyData) {
    return "";
  }

  const safeReserve = cashFloor > 0 ? cashFloor : 100000;
  const weeklySpend = Math.max(
    0,
    Math.floor((projectedBalance - safeReserve) / 4 / 1000) * 1000
  );

  if (projectedBalance <= safeReserve || lowCashWeek) {
    return "Te estás quedando sin caja. Prioriza cobrar y frenar gastos no urgentes esta semana.";
  }

  if (netTotal < 0) {
    return `Reduce gastos en ${topCategory} esta semana para no cerrar el mes apretado.`;
  }

  if (payableTotal > receivableTotal) {
    return "Tus pagos comprometidos pesan más que tus cobros. Revisa compras nuevas antes de comprometer más plata.";
  }

  if (recurringCount > 0) {
    return `Puedes gastar hasta ${formatCurrency(weeklySpend)} esta semana sin bajar tu caja mínima.`;
  }

  return `Vas bien. Puedes invertir ${formatCurrency(weeklySpend)} sin quedar bajo tu caja mínima.`;
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

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
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

function fillTransactionForm(transaction, asTemplate = false) {
  transactionFields.transactionId.value = asTemplate ? "" : transaction.id;
  transactionFields.type.value = transaction.type;
  renderCategoryOptions(transaction.type);
  transactionFields.description.value = transaction.description;
  transactionFields.note.value = transaction.note || "";
  transactionFields.amount.value = transaction.amount;
  transactionFields.date.value = asTemplate ? today() : transaction.date;
  transactionFields.category.value = transaction.category;
  transactionFields.channel.value = transaction.channel;
  transactionFields.recurring.checked = Boolean(transaction.recurring);
  movementExtraDetails.open = true;
  movementImpactText.textContent = asTemplate
    ? "Revisa el monto y guarda para repetir el último movimiento."
    : "";
  saveTransactionBtn.textContent = asTemplate ? "Guardar movimiento" : "Guardar cambios";
  cancelTransactionEditBtn.hidden = asTemplate;
  openTransactionModal(transaction.type, { preserveForm: true });
}

function resetTransactionForm() {
  transactionForm.reset();
  transactionFields.transactionId.value = "";
  transactionFields.date.value = today();
  transactionFields.type.value = "income";
  renderCategoryOptions("income");
  movementExtraDetails.open = false;
  movementImpactText.textContent = "";
  saveTransactionBtn.textContent = "Guardar movimiento";
  cancelTransactionEditBtn.hidden = true;
  transactionModal.hidden = true;
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
  state.payableInvoiceDraft = {
    image: payable.invoicePhoto || "",
    ocrText: payable.invoiceText || "",
  };
  updateInvoiceAttachmentPreview();
  setInvoiceReadStatus(
    payable.invoicePhoto
      ? "Esta factura ya tiene foto adjunta. Puedes reemplazarla o volver a leerla."
      : "Sube una foto nítida y presiona “Leer factura”."
  );
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
  state.payableInvoiceDraft = { image: "", ocrText: "" };
  invoicePhotoInput.value = "";
  updateInvoiceAttachmentPreview();
  setInvoiceReadStatus("Sube una foto nítida y presiona “Leer factura”.");
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
    invoicePhoto: typeof item.invoicePhoto === "string" ? item.invoicePhoto : "",
    invoiceText: typeof item.invoiceText === "string" ? item.invoiceText : "",
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

function updateInvoiceAttachmentPreview() {
  const hasImage = Boolean(state.payableInvoiceDraft.image);
  invoicePreview.hidden = !hasImage;
  removeInvoicePhotoBtn.hidden = !hasImage;
  invoicePreview.src = hasImage ? state.payableInvoiceDraft.image : "";
}

function setInvoiceReadStatus(message) {
  invoiceReadStatus.textContent = message;
}

function renderPayableInvoiceLink(item) {
  if (!item.invoicePhoto) {
    return "-";
  }

  return `<a class="invoice-link" href="${item.invoicePhoto}" target="_blank" rel="noopener noreferrer">Ver foto</a>`;
}

function applyExtractedPayableData(data) {
  if (data.vendor) {
    payableFields.vendor.value = data.vendor;
  }

  if (data.document) {
    payableFields.document.value = data.document;
  }

  if (data.amount) {
    payableFields.amount.value = data.amount;
  }

  if (data.issueDate) {
    payableFields.issueDate.value = data.issueDate;
  }

  if (data.dueDate) {
    payableFields.dueDate.value = data.dueDate;
  }
}

function extractPayableInvoiceData(rawText) {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const fullText = lines.join(" ");

  return {
    vendor: extractInvoiceVendor(lines),
    document: extractInvoiceDocument(fullText),
    amount: extractInvoiceAmount(lines, fullText),
    issueDate: extractInvoiceDate(fullText, ["emisión", "emision", "fecha"]),
    dueDate: extractInvoiceDate(fullText, ["vencimiento", "vence", "pago"]),
  };
}

function extractInvoiceVendor(lines) {
  const ignoredWords = [
    "factura",
    "rut",
    "giro",
    "direccion",
    "dirección",
    "fecha",
    "total",
    "telefono",
    "teléfono",
    "mail",
    "www",
    "sii",
  ];

  const candidate = lines.find((line) => {
    const cleanLine = line.toLowerCase();
    return (
      line.length >= 4 &&
      line.length <= 60 &&
      /[a-záéíóúñ]/i.test(line) &&
      !/\d{2,}/.test(line) &&
      !ignoredWords.some((word) => cleanLine.includes(word))
    );
  });

  return candidate || "";
}

function extractInvoiceDocument(text) {
  const patterns = [
    /factura\s*(?:n[°ºo.]*)?\s*([a-z0-9-]{3,})/i,
    /(?:folio|n[°ºo.])\s*[:#-]?\s*([a-z0-9-]{3,})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].toUpperCase();
    }
  }

  return "";
}

function extractInvoiceAmount(lines, text) {
  const totalLine = lines.find((line) => /total|monto\s*total/i.test(line));
  const totalValue = totalLine ? parseInvoiceAmount(totalLine) : 0;
  if (totalValue > 0) {
    return totalValue;
  }

  const matches = [...text.matchAll(/\$?\s*((?:\d{1,3}(?:[.,]\d{3})+)|\d{4,})(?:,\d{2})?/g)]
    .map((match) => parseInvoiceAmount(match[1]))
    .filter((value) => value > 0);

  return matches.length ? Math.max(...matches) : "";
}

function extractInvoiceDate(text, keywords) {
  const normalizedText = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  for (const keyword of keywords) {
    const normalizedKeyword = keyword
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const index = normalizedText.indexOf(normalizedKeyword);
    if (index >= 0) {
      const nearbyText = text.slice(index, index + 80);
      const nearbyDate = parseInvoiceDate(nearbyText);
      if (nearbyDate) {
        return nearbyDate;
      }
    }
  }

  return parseInvoiceDate(text);
}

function parseInvoiceDate(text) {
  const match = text.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (!match) {
    return "";
  }

  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];

  if (Number(month) < 1 || Number(month) > 12 || Number(day) < 1 || Number(day) > 31) {
    return "";
  }

  return `${year}-${month}-${day}`;
}

function parseInvoiceAmount(value) {
  const digitsOnly = String(value).replace(/[^\d]/g, "");
  return Number(digitsOnly) || 0;
}

async function resizeImageToDataUrl(file, maxWidth, maxBytes) {
  const image = await loadImageFromFile(file);
  const scale = Math.min(1, maxWidth / image.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const qualities = [0.82, 0.72, 0.62, 0.52];
  let dataUrl = canvas.toDataURL("image/jpeg", qualities[0]);

  for (const quality of qualities) {
    dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (estimateDataUrlBytes(dataUrl) <= maxBytes) {
      return dataUrl;
    }
  }

  throw new Error("La imagen sigue siendo muy pesada. Sube una foto más liviana o recortada.");
}

async function loadImageFromFile(file) {
  const dataUrl = await readFileAsDataUrl(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo procesar la imagen de la factura."));
    image.src = dataUrl;
  });
}

function estimateDataUrlBytes(dataUrl) {
  const base64Data = dataUrl.split(",")[1] || "";
  return Math.ceil((base64Data.length * 3) / 4);
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
