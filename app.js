const STORAGE_KEY = "cashflow-emprendedores-data-v2";
const SUPABASE_URL = "https://pmrbxgnpdxqkeihcinvj.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_-sACG1yR0TURwqX70-XwTA_1Q9QPJ0w";
const SUPABASE_STATE_TABLE = "cashflow_user_data";
const MAX_INVOICE_IMAGE_BYTES = 850 * 1024;
const INVOICE_IMAGE_MAX_WIDTH = 1400;
const copyText = window.copyText || ((path) => String(path || ""));
const copyValue = window.copyValue || (() => undefined);
const applyStaticCopy = window.applyStaticCopy || (() => {});
const UX_RULES = {
  maxMainBlocksPerScreen: 3,
  feedbackDurationMs: 2600,
  feedbackExitMs: 260,
  criticalProjectionAmount: 100000,
  progressiveVisibility: {
    projectionTransactions: 3,
    detailTransactions: 6,
    categoriesTransactions: 8,
  },
  simpleCopyMap: [
    [/\bflujo de caja\b/gi, "plata"],
    [/\bbalance\b/gi, "plata"],
    [/\bsaldo\b/gi, "plata"],
    [/\begresos\b/gi, "gastos"],
    [/\begreso\b/gi, "gasto"],
  ],
};

const categoryMap = copyValue("categories") || {
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
  appError: false,
  appErrorMessage: "",
  offline: typeof navigator !== "undefined" ? navigator.onLine === false : false,
  syncPending: false,
  syncingPending: false,
  authMode: "signIn",
  activePage: "home",
  activeDetailTab: "summary",
  visibility: createInitialVisibilityState(),
  smartNotifications: [],
  lastMovementImpact: "",
  latestScenarioBalance: 0,
  payableInvoiceDraft: {
    image: "",
    ocrText: "",
  },
};

const animatedCurrencyHandles = new WeakMap();

const authScreen = document.querySelector("#authScreen");
const appShell = document.querySelector("#appShell");
const connectionBanner = document.querySelector("#connectionBanner");
const connectionBannerTitle = document.querySelector("#connectionBannerTitle");
const connectionBannerText = document.querySelector("#connectionBannerText");
const connectionBannerBtn = document.querySelector("#connectionBannerBtn");
const authForm = document.querySelector("#authForm");
const authMessage = document.querySelector("#authMessage");
const authSubmitBtn = document.querySelector("#authSubmitBtn");
const toggleAuthModeBtn = document.querySelector("#toggleAuthModeBtn");
const appHeaderCashValue = document.querySelector("#appHeaderCashValue");
const userEmailLabel = document.querySelector("#userEmailLabel");
const logoutBtn = document.querySelector("#logoutBtn");
const mobileLogoutBtn = document.querySelector("#mobileLogoutBtn");
const dynamicFavicon = document.querySelector("#dynamicFavicon");
const logoSettingsToggle = document.querySelector("#logoSettingsToggle");
const logoSettingsPanel = document.querySelector("#logoSettingsPanel");
const brandLogoPreview = document.querySelector("#brandLogoPreview");
const brandLogoFallback = document.querySelector("#brandLogoFallback");
const mobileBrandLogoPreview = document.querySelector("#mobileBrandLogoPreview");
const mobileBrandLogoFallback = document.querySelector("#mobileBrandLogoFallback");
const companyLogoInput = document.querySelector("#companyLogoInput");
const removeLogoBtn = document.querySelector("#removeLogoBtn");
const cashFloorInput = document.querySelector("#cashFloorInput");
const projectionCashFloorInput = document.querySelector("#projectionCashFloorInput");
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
const bottomNavigation = document.querySelector(".bottom-navigation");
const featureUnlockPanel = document.querySelector("#featureUnlockPanel");
const featureUnlockList = document.querySelector("#featureUnlockList");
const detailSummaryCopy = document.querySelector("#detailSummaryCopy");
const homeErrorState = document.querySelector("#homeErrorState");
const homeErrorHint = document.querySelector("#homeErrorHint");
const retryHomeBtn = document.querySelector("#retryHomeBtn");
const homeHeroPanel = document.querySelector("#homeHeroPanel");
const homeBalanceCard = document.querySelector("#homeBalanceCard");
const homeTodayCash = document.querySelector("#homeTodayCash");
const homeTodayHint = document.querySelector("#homeTodayHint");
const homeProgressNote = document.querySelector("#homeProgressNote");
const homeMonthEndCash = document.querySelector("#homeMonthEndCash");
const homeMonthEndCard = document.querySelector("#homeMonthEndCard");
const homeMonthEndHint = document.querySelector("#homeMonthEndHint");
const homeMonthEndDot = document.querySelector("#homeMonthEndDot");
const homeAdviceCard = document.querySelector("#homeAdviceCard");
const homeTodayPanel = document.querySelector("#homeTodayPanel");
const todayMovementList = document.querySelector("#todayMovementList");
const homeQuickGrid = document.querySelector("#homeQuickGrid");
const quickIncomeBtn = document.querySelector("#quickIncomeBtn");
const quickExpenseBtn = document.querySelector("#quickExpenseBtn");
const quickIncomeLabel = document.querySelector("#quickIncomeLabel");
const quickExpenseLabel = document.querySelector("#quickExpenseLabel");
const quickTypeButtons = [...document.querySelectorAll("[data-quick-type]")];
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
const uxToast = document.querySelector("#uxToast");

let uxToastTimer = null;
let uxToastHideTimer = null;
let smartNotificationTimer = null;

applyStaticCopy();

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
applyUXComponentRules({ resetProgressiveDisclosure: true });
render();
initializeAuth();

transactionFields.type.addEventListener("change", (event) => {
  renderCategoryOptions(event.target.value);
  syncTransactionTypeButtons();
  updateMovementImpactPreview();
});

quickTypeButtons.forEach((typeButton) => {
  typeButton.addEventListener("click", () => {
    transactionFields.type.value = typeButton.dataset.quickType;
    renderCategoryOptions(typeButton.dataset.quickType);
    syncTransactionTypeButtons();
    updateMovementImpactPreview();
    focusTransactionAmount();
  });
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
  authSubmitBtn.textContent =
    state.authMode === "signIn"
      ? copyText("auth.actions.signIn")
      : copyText("auth.actions.signUp");
  toggleAuthModeBtn.textContent =
    state.authMode === "signIn"
      ? copyText("auth.actions.switchToSignUp")
      : copyText("auth.actions.switchToSignIn");
});

logoutBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
});

mobileLogoutBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
});

quickIncomeBtn.addEventListener("click", () => {
  if (isHomeLearningState()) {
    openTransactionModal();
    return;
  }

  openTransactionModal("income");
});

quickExpenseBtn.addEventListener("click", () => {
  openTransactionModal("expense");
});

openTransactionModalBtn.addEventListener("click", () => {
  openTransactionModal();
});

connectionBannerBtn.addEventListener("click", async () => {
  await syncPendingLocalData({ showFeedback: true });
});

retryHomeBtn.addEventListener("click", async () => {
  if (!state.session?.user) {
    return;
  }

  retryHomeBtn.disabled = true;
  retryHomeBtn.textContent = copyText("home.error.retrying");

  try {
    await syncSessionView();
  } finally {
    retryHomeBtn.disabled = false;
    retryHomeBtn.textContent = copyText("home.error.retry");
  }
});

window.addEventListener("offline", () => {
  const wasOffline = state.offline;
  state.offline = true;
  render();

  if (!wasOffline) {
    showUXFeedback(copyText("feedback.offlineShort"), "warn");
  }
});

window.addEventListener("online", async () => {
  state.offline = false;
  render();
  await syncPendingLocalData({ showFeedback: true });
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
    movementImpactText.textContent = copyText("movement.repeat.empty");
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
    showUXFeedback(getFriendlyErrorMessage("logo_size"), "warn");
    companyLogoInput.value = "";
    return;
  }

  state.data.companyLogo = await readFileAsDataUrl(file);
  companyLogoInput.value = "";
  await saveData();
  applyCompanyLogo();
  showUXFeedback(copyText("feedback.logoUpdated"), "ok");
});

removeLogoBtn.addEventListener("click", async () => {
  state.data.companyLogo = "";
  await saveData();
  applyCompanyLogo();
  showUXFeedback(copyText("feedback.logoRemoved"), "warn");
});

cashFloorInput.addEventListener("change", async (event) => {
  await updateCashFloorValue(event.target.value);
});

projectionCashFloorInput.addEventListener("change", async (event) => {
  await updateCashFloorValue(event.target.value);
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
    showUXFeedback(getFriendlyErrorMessage("invoice_file_type"), "warn");
    invoicePhotoInput.value = "";
    return;
  }

  try {
    setInvoiceReadStatus(copyText("invoice.processingImage"));
    state.payableInvoiceDraft.image = await resizeImageToDataUrl(
      file,
      INVOICE_IMAGE_MAX_WIDTH,
      MAX_INVOICE_IMAGE_BYTES
    );
    state.payableInvoiceDraft.ocrText = "";
    invoicePhotoInput.value = "";
    updateInvoiceAttachmentPreview();
    setInvoiceReadStatus(copyText("invoice.photoReady"));
  } catch (error) {
    showUXFeedback(getFriendlyErrorMessage("invoice_image", error), "warn");
    state.payableInvoiceDraft = { image: "", ocrText: "" };
    invoicePhotoInput.value = "";
    updateInvoiceAttachmentPreview();
    setInvoiceReadStatus(copyText("invoice.uploadHint"));
  }
});

removeInvoicePhotoBtn.addEventListener("click", () => {
  state.payableInvoiceDraft = { image: "", ocrText: "" };
  invoicePhotoInput.value = "";
  updateInvoiceAttachmentPreview();
  setInvoiceReadStatus(copyText("invoice.uploadHint"));
});

readInvoiceBtn.addEventListener("click", async () => {
  if (!state.payableInvoiceDraft.image) {
    setInvoiceReadStatus(copyText("invoice.uploadFirst"));
    return;
  }

  if (!window.Tesseract?.recognize) {
    setInvoiceReadStatus(getFriendlyErrorMessage("invoice_ocr_unavailable"));
    return;
  }

  readInvoiceBtn.disabled = true;
  readInvoiceBtn.textContent = copyText("invoice.readingButton");
  setInvoiceReadStatus(copyText("invoice.readingStatus"));

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
        ? copyText(
            filledFields === 1 ? "invoice.readSuccessOne" : "invoice.readSuccessMany",
            { count: filledFields }
          )
        : copyText("invoice.readLowConfidence")
    );
  } catch (error) {
    setInvoiceReadStatus(getFriendlyErrorMessage("invoice_ocr_read", error));
  } finally {
    readInvoiceBtn.disabled = false;
    readInvoiceBtn.textContent = copyText("invoice.readButton");
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
    const feedback = createMovementFeedback(transaction.date.slice(0, 7), "updated", transaction.type);
    showUXFeedback(feedback.message, feedback.tone);
    return;
  }

  transactionFields.transactionId.value = "";
  transactionFields.amount.value = "";
  transactionFields.description.value = "";
  transactionFields.note.value = "";
  transactionFields.date.value = today();
  transactionFields.recurring.checked = false;
  movementExtraDetails.open = false;
  saveTransactionBtn.textContent = copyText("movement.save");
  cancelTransactionEditBtn.hidden = true;
  movementImpactText.textContent = impactCopy;
  const feedback = createMovementFeedback(transaction.date.slice(0, 7), "saved", transaction.type);
  showUXFeedback(feedback.message, feedback.tone);
  transactionFields.amount.focus();
});

receivableForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(receivableForm);
  const amount = Number(formData.get("amount"));
  const partialAmount = Number(formData.get("pendingAmount"));
  const status = formData.get("status");

  if (status === "partial" && (partialAmount <= 0 || partialAmount >= amount)) {
    showUXFeedback(getFriendlyErrorMessage("partial_amount"), "warn");
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
  const receivableFeedback = createActionFeedback(
    copyText(isEditing ? "feedback.receivableUpdated" : "feedback.receivableSaved"),
    receivable.dueDate.slice(0, 7)
  );
  showUXFeedback(receivableFeedback.message, receivableFeedback.tone);
});

payableForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(payableForm);
  const amount = Number(formData.get("amount"));
  const partialAmount = Number(formData.get("pendingAmount"));
  const status = formData.get("status");

  if (status === "partial" && (partialAmount <= 0 || partialAmount >= amount)) {
    showUXFeedback(getFriendlyErrorMessage("partial_amount"), "warn");
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
  const payableFeedback = createActionFeedback(
    copyText(isEditing ? "feedback.payableUpdated" : "feedback.payableSaved"),
    payable.dueDate.slice(0, 7)
  );
  showUXFeedback(payableFeedback.message, payableFeedback.tone);
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

  const deletedTransaction = state.data.transactions.find(
    (item) => item.id === button.dataset.deleteTransaction
  );
  state.data.transactions = state.data.transactions.filter(
    (item) => item.id !== button.dataset.deleteTransaction
  );
  await saveData();
  resetTransactionForm();
  render();
  const transactionFeedback = createMovementFeedback(
    deletedTransaction?.date?.slice(0, 7) || currentMonth(),
    "deleted",
    deletedTransaction?.type || "expense"
  );
  state.lastMovementImpact = transactionFeedback.message;
  showUXFeedback(transactionFeedback.message, transactionFeedback.tone);
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

  const deletedReceivable = state.data.receivables.find(
    (item) => item.id === button.dataset.deleteReceivable
  );
  state.data.receivables = state.data.receivables.filter(
    (item) => item.id !== button.dataset.deleteReceivable
  );
  await saveData();
  resetReceivableForm();
  render();
  const receivableFeedback = createActionFeedback(
    copyText("feedback.receivableDeleted"),
    deletedReceivable?.dueDate?.slice(0, 7) || currentMonth()
  );
  showUXFeedback(receivableFeedback.message, receivableFeedback.tone);
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

  const deletedPayable = state.data.payables.find(
    (item) => item.id === button.dataset.deletePayable
  );
  state.data.payables = state.data.payables.filter(
    (item) => item.id !== button.dataset.deletePayable
  );
  await saveData();
  resetPayableForm();
  render();
  const payableFeedback = createActionFeedback(
    copyText("feedback.payableDeleted"),
    deletedPayable?.dueDate?.slice(0, 7) || currentMonth()
  );
  showUXFeedback(payableFeedback.message, payableFeedback.tone);
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
  confirmResetModalBtn.textContent = copyText("common.deleting");
  state.data = cloneSeedState();
  state.filterMonth = currentMonth();
  monthFilter.value = state.filterMonth;
  syncCashFloorInputs("");
  await saveData();
  resetTransactionForm();
  resetReceivableForm();
  resetPayableForm();
  resetConfirmModal.hidden = true;
  confirmResetModalBtn.disabled = false;
  confirmResetModalBtn.textContent = copyText("common.acceptDelete");
  render();
  showUXFeedback(copyText("feedback.resetDone"), "risk");
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
  authMessage.textContent = copyText("auth.processing");

  const authResponse =
    state.authMode === "signIn"
      ? await supabaseClient.auth.signInWithPassword({ email, password })
      : await supabaseClient.auth.signUp({ email, password });

  authSubmitBtn.disabled = false;

  if (authResponse.error) {
    authMessage.textContent = getFriendlyErrorMessage("auth", authResponse.error);
    return;
  }

  if (state.authMode === "signUp" && !authResponse.data.session) {
    authMessage.classList.add("success");
    authMessage.textContent = copyText("auth.signUpSuccess");
    state.authMode = "signIn";
    authSubmitBtn.textContent = copyText("auth.actions.signIn");
    toggleAuthModeBtn.textContent = copyText("auth.actions.switchToSignUp");
    authForm.reset();
    return;
  }

  authMessage.textContent = "";
  authForm.reset();
}

async function syncSessionView() {
  if (!state.session?.user) {
    state.appError = false;
    state.appErrorMessage = "";
    state.offline = !hasNetworkConnection();
    state.syncPending = false;
    state.syncingPending = false;
    switchPage("home");
    switchDetailTab("summary");
    appShell.hidden = true;
    authScreen.hidden = false;
    userEmailLabel.textContent = "-";
    state.data = cloneSeedState();
    state.filterMonth = currentMonth();
    monthFilter.value = state.filterMonth;
    syncCashFloorInputs("");
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
  state.offline = !hasNetworkConnection();
  try {
    state.data = await loadData();
    state.appError = false;
    state.appErrorMessage = "";
  } catch {
    state.data = cloneSeedState();
    state.appError = true;
    state.appErrorMessage = getFriendlyErrorMessage("load_data");
  }
  state.filterMonth = currentMonth();
  monthFilter.value = state.filterMonth;
  state.syncPending = readPendingSyncFlag();
  state.syncingPending = false;
  syncCashFloorInputs(state.data.cashFloor);
  resetTransactionForm();
  resetReceivableForm();
  resetPayableForm();
  render();

  if (state.syncPending && hasNetworkConnection()) {
    await syncPendingLocalData({ showFeedback: false });
  }
}

function switchPage(pageName) {
  if (!isPageAccessible(pageName)) {
    pageName = "home";
  }

  state.activePage = pageName;

  appPages.forEach((page) => {
    const isActive = page.dataset.appPage === pageName;
    page.hidden = !isActive;
    page.classList.toggle("is-active", isActive);
  });

  navLinks.forEach((navLink) => {
    navLink.classList.toggle("is-active", navLink.dataset.pageTarget === pageName);
  });

  applyUXComponentRules();
}

function switchDetailTab(tabName) {
  if (!isDetailTabAccessible(tabName)) {
    tabName = "summary";
  }

  state.activeDetailTab = tabName;

  detailTabButtons.forEach((tabButton) => {
    tabButton.classList.toggle("is-active", tabButton.dataset.detailTab === tabName);
  });

  detailTabPanels.forEach((panel) => {
    const isActive = panel.dataset.detailPanel === tabName;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
  });

  applyUXComponentRules();
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
    saveTransactionBtn.textContent = copyText("movement.save");
    cancelTransactionEditBtn.hidden = true;
  }

  syncTransactionTypeButtons();
  applyUXComponentRules({ resetProgressiveDisclosure: !options.preserveForm });
  focusTransactionAmount();
}

function renderTodayMovements(transactions) {
  if (!todayMovementList) {
    return;
  }

  const todayTransactions = transactions
    .filter((item) => item.date === today())
    .slice(0, 3);

  if (!todayTransactions.length) {
    todayMovementList.innerHTML =
      '<div class="recent-empty">Hoy todavía no hay movimientos.</div>';
    return;
  }

  todayMovementList.innerHTML = todayTransactions
    .map((item) => {
      const sign = item.type === "income" ? "+" : "-";
      const toneClass = item.type === "income" ? "income" : "expense";
      const label = item.description || item.category || item.channel || "Movimiento";

      return `
        <article class="recent-movement-row">
          <div class="recent-movement-copy">
            <strong>${escapeHtml(label)}</strong>
          </div>
          <span class="recent-movement-amount ${toneClass}">${sign}${formatCurrency(item.amount)}</span>
        </article>
      `;
    })
    .join("");
}

function isHomeLearningState() {
  const transactionsCount = state.data.transactions.length;
  return (
    transactionsCount > 0 &&
    transactionsCount < UX_RULES.progressiveVisibility.projectionTransactions
  );
}

function isHomeOnboardingState() {
  return state.data.transactions.length < UX_RULES.progressiveVisibility.projectionTransactions;
}

function getHomeViewState() {
  if (state.appError) {
    return "error";
  }

  if (isHomeOnboardingState()) {
    return "onboarding";
  }

  return "normal";
}

function syncHomeViewVisibility(homeViewState) {
  const isErrorState = homeViewState === "error";
  const errorMessage = state.appErrorMessage || copyText("errors.loadData");

  if (homeErrorState) {
    homeErrorState.hidden = !isErrorState;
  }

  if (homeErrorHint) {
    homeErrorHint.hidden = !isErrorState;
    homeErrorHint.textContent = isErrorState ? errorMessage : "";
  }

  if (homeHeroPanel) {
    homeHeroPanel.hidden = isErrorState;
  }

  if (homeQuickGrid) {
    homeQuickGrid.hidden = isErrorState;
  }

  if (homeTodayPanel) {
    homeTodayPanel.hidden = isErrorState || homeViewState !== "normal";
  }

  if (homeMonthEndCard) {
    homeMonthEndCard.hidden = isErrorState || homeViewState !== "normal";
  }

  if (homeAdviceCard) {
    homeAdviceCard.hidden = isErrorState || homeViewState !== "normal";
  }

  if (openTransactionModalBtn) {
    openTransactionModalBtn.hidden = isErrorState;
  }

  if (featureUnlockPanel && isErrorState) {
    featureUnlockPanel.hidden = true;
  }
}

function getWeeklySpendBudget(projectedBalance, cashFloor = 0) {
  const safeReserve = cashFloor > 0 ? cashFloor : 100000;
  return Math.max(0, Math.floor((projectedBalance - safeReserve) / 4 / 1000) * 1000);
}

function isProjectionCritical(projectedBalance) {
  return projectedBalance <= UX_RULES.criticalProjectionAmount;
}

function isHomeRiskState(projectedBalance) {
  return !isHomeOnboardingState() && isProjectionCritical(projectedBalance);
}

function isHomePositiveState(health, projectedBalance) {
  return !isHomeOnboardingState() && !isProjectionCritical(projectedBalance) && health?.tone === "ok";
}

function buildHomeRiskCopy(criticalCashDate, projectedBalance) {
  if (criticalCashDate) {
    const days = daysUntil(criticalCashDate);

    if (days <= 0) {
      return copyText("home.risk.today");
    }

    return copyText(days === 1 ? "home.risk.inDays" : "home.risk.inManyDays", {
      count: days,
    });
  }

  if (projectedBalance <= 0) {
    return copyText("home.risk.month");
  }

  return copyText("home.risk.soon");
}

function buildHomePositiveCopy(projectedBalance, cashFloor) {
  const weeklySpend = getWeeklySpendBudget(projectedBalance, cashFloor);

  if (!weeklySpend) {
    return copyText("home.positive.hold");
  }

  return copyText("home.positive.spend", { amount: formatCurrency(weeklySpend) });
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
    return copyText("projection.empty");
  }

  if (criticalCashDate) {
    return copyText("projection.criticalDay", {
      day: Number(criticalCashDate.slice(8, 10)),
      amount: formatCurrency(cashFloor),
    });
  }

  return fallbackDescription;
}

function renderScenarioResult() {
  const scenarioDelta = Number(scenarioAmount.value) || 0;
  if (!scenarioDelta) {
    scenarioResultText.className = "scenario-result";
    scenarioResultText.textContent = copyText("projection.scenarioPrompt");
    return;
  }

  const sign = scenarioType.value === "income" ? 1 : -1;
  const simulatedBalance = state.latestScenarioBalance + scenarioDelta * sign;
  const tone = getForecastTone(simulatedBalance, Number(state.data.cashFloor) || 0);
  const scenarioLabel = copyText(
    scenarioType.value === "income" ? "projection.scenario.income" : "projection.scenario.expense"
  );

  scenarioResultText.className = `scenario-result ${tone}`;
  const scenarioCopyKey =
    scenarioType.value === "income"
      ? tone === "risk"
        ? "projection.scenarioResult.incomeRisk"
        : tone === "warn"
          ? "projection.scenarioResult.incomeWarn"
          : "projection.scenarioResult.incomeOk"
      : tone === "risk"
        ? "projection.scenarioResult.expenseRisk"
        : tone === "warn"
          ? "projection.scenarioResult.expenseWarn"
          : "projection.scenarioResult.expenseOk";

  scenarioResultText.textContent = copyText(scenarioCopyKey, {
    label: scenarioLabel,
    amount: formatCurrency(scenarioDelta),
    balance: formatCurrency(simulatedBalance),
  });
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
  movementImpactText.textContent =
    targetMonth === currentMonth()
      ? `Si lo guardas, ${createRemainingMoneySentence(projectedBalance, targetMonth, "")}`
      : `Si lo guardas, quedará registrado para ${formatMonthLabel(targetMonth)}.`;
}

function createMovementImpactMessage(targetMonth = currentMonth()) {
  if (targetMonth !== currentMonth()) {
    return copyText("movement.impact.savedFuture", { month: formatMonthLabel(targetMonth) });
  }

  return createRemainingMoneySentence(
    estimateProjectedBalanceForCurrentMonth(targetMonth),
    targetMonth,
    "Ahora"
  );
}

function createMovementFeedbackTitle(action = "saved", movementType = "expense") {
  if (action === "deleted") {
    return copyText("movement.titles.deleted");
  }

  if (action === "updated") {
    return copyText("movement.titles.updated");
  }

  return movementType === "income"
    ? copyText("movement.titles.income")
    : copyText("movement.titles.expense");
}

function createMovementFeedback(targetMonth = currentMonth(), action = "saved", movementType = "expense") {
  const impactMessage = createMovementImpactMessage(targetMonth);

  return {
    message: `${createMovementFeedbackTitle(action, movementType)}\n\n${impactMessage}`,
    tone:
      targetMonth === currentMonth()
        ? getForecastTone(
            estimateProjectedBalanceForCurrentMonth(targetMonth),
            Number(state.data.cashFloor) || 0
          )
        : "ok",
  };
}

function createMovementImpactCopy(transaction, action = "saved") {
  return createMovementImpactMessage(transaction.date.slice(0, 7));
}

async function updateCashFloorValue(value) {
  state.data.cashFloor = Math.max(0, Number(value) || 0);
  syncCashFloorInputs(state.data.cashFloor);
  await saveData();
  render();
  const feedback = state.data.cashFloor
    ? createActionFeedback(
        copyText("feedback.cashFloorReady", {
          amount: formatCurrency(state.data.cashFloor),
        })
      )
    : { message: copyText("feedback.cashFloorOff"), tone: "warn" };
  showUXFeedback(feedback.message, feedback.tone);
}

function syncCashFloorInputs(value) {
  const safeValue = Number(value) || "";
  cashFloorInput.value = safeValue;
  projectionCashFloorInput.value = safeValue;
}

function estimateProjectedBalanceForCurrentMonth(targetMonth = currentMonth()) {
  return calculateProjectedMonthEndCash(calculateAvailableCashToday(), targetMonth);
}

function createRemainingMoneySentence(projectedBalance, targetMonth = currentMonth(), prefix = "Ahora") {
  const intro = prefix ? `${prefix.trim()} ` : "";
  const periodLabel = targetMonth === currentMonth() ? "este mes" : `en ${formatMonthLabel(targetMonth)}`;

  if (projectedBalance < 0) {
    return copyText("movement.impact.missing", {
      prefix: intro,
      amount: formatCurrency(Math.abs(projectedBalance)),
      period: periodLabel,
    });
  }

  if (projectedBalance === 0) {
    return copyText("movement.impact.zero", {
      prefix: intro,
      amount: formatCurrency(0),
      period: periodLabel,
    });
  }

  return copyText("movement.impact.remaining", {
    prefix: intro,
    amount: formatCurrency(projectedBalance),
    period: periodLabel,
  });
}

function createActionFeedback(actionLabel, targetMonth = currentMonth()) {
  if (targetMonth !== currentMonth()) {
    return {
      message: copyText("feedback.futureAction", {
        action: actionLabel,
        month: formatMonthLabel(targetMonth),
      }),
      tone: "ok",
    };
  }

  const projectedBalance = estimateProjectedBalanceForCurrentMonth(targetMonth);

  return {
    message: `${actionLabel} ${createRemainingMoneySentence(projectedBalance, targetMonth)}`,
    tone: getForecastTone(projectedBalance, Number(state.data.cashFloor) || 0),
  };
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
  syncProgressiveVisibility();

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
  const hasMovements = state.data.transactions.length > 0;
  const isLearningState = isHomeLearningState();
  const homeViewState = getHomeViewState();
  const isOnboardingState = homeViewState === "onboarding";
  const isNormalState = homeViewState === "normal";

  syncHomeViewVisibility(homeViewState);

  const hasAnyData =
    hasMovements ||
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
        label: copyText("health.labels.neutral"),
        tone: "neutral",
        description: copyText("health.descriptions.neutral"),
      };
  const isRiskState = isNormalState && isHomeRiskState(projectedBalance);
  const isPositiveState = isNormalState && isHomePositiveState(health, projectedBalance);
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
  syncSmartNotifications({
    currentBalance,
    projectedBalance,
    forecastWeeks,
    lowCashWeek,
    criticalCashDate,
    latestTransactions: state.data.transactions.slice(0, 5),
    usageMetrics: state.visibility.metrics,
    health,
    cashFloor,
  });

  text("#incomeTotal", formatCurrency(liveIncomeTotal));
  text("#expenseTotal", formatCurrency(liveExpenseTotal));
  text("#receivableTotal", formatCurrency(liveReceivableTotal));
  text("#payableTotal", formatCurrency(livePayableTotal));
  text("#monthlyVatTotal", formatCurrency(monthlyVatTotal));
  text("#monthlyVatCreditTotal", formatCurrency(monthlyVatCreditTotal));
  text("#netTotal", formatCurrency(liveIncomeTotal - liveExpenseTotal));
  setAnimatedCurrency("#sidebarBalance", currentBalance);
  setAnimatedCurrency("#appHeaderCashValue", currentBalance);
  text("#sidebarHealth", health.description);
  if (hasMovements) {
    setAnimatedCurrency("#homeTodayCash", currentBalance);
  } else {
    text("#homeTodayCash", copyText("home.emptyTitle"));
  }
  text(
    "#homeTodayHint",
    isOnboardingState
      ? hasMovements
        ? copyText("home.today.learning")
        : copyText("home.today.empty")
      : isRiskState
        ? copyText("home.today.risk")
        : isPositiveState
          ? copyText("home.today.positive")
      : isNormalState && hasMovements
        ? currentBalance > 0
          ? copyText("home.today.available")
          : currentBalance < 0
            ? copyText("home.today.low")
            : copyText("home.today.start")
        : copyText("home.today.empty")
  );
  setAnimatedCurrency("#homeMonthEndCash", projectedBalance);
  setAnimatedCurrency("#projectionMonthEndValue", projectedBalance);
  text(
    "#projectionAlertText",
    buildProjectionAlertCopy(hasAnyData, health.description, criticalCashDate, cashFloor)
  );
  text("#recurringCount", `${liveRecurring.length} movimientos`);
  text("#avgIncome", formatCurrency(averageIncome));
  text("#topCategory", liveTopCategory);
  text("#nextCommitment", formatCurrency(nextCommitment));
  text(
    "#adviceText",
    isOnboardingState
      ? copyText(
          UX_RULES.progressiveVisibility.projectionTransactions - state.data.transactions.length === 1
            ? "home.onboarding.addOneMore"
            : "home.onboarding.addManyMore",
          {
            count:
              UX_RULES.progressiveVisibility.projectionTransactions -
              state.data.transactions.length,
          }
        )
      : isRiskState
        ? buildHomeRiskCopy(criticalCashDate, projectedBalance)
        : isPositiveState
          ? buildHomePositiveCopy(projectedBalance, cashFloor)
      : assistantMessage ||
          copyText("home.advice.starter")
  );
  if (homeProgressNote) {
    homeProgressNote.hidden = !isOnboardingState;
    homeProgressNote.textContent = isOnboardingState
      ? copyText("home.onboarding.progress", {
          current: state.data.transactions.length,
          target: UX_RULES.progressiveVisibility.projectionTransactions,
        })
      : "";
  }
  text("#receivablePill", `${openReceivables.length} pendientes`);
  text("#payablePill", `${openPayables.length} pendientes`);
  if (detailSummaryCopy) {
    detailSummaryCopy.textContent = buildDetailSummaryCopy();
  }

  const healthPill = document.querySelector("#healthPill");
  healthPill.textContent = health.label;
  healthPill.className = `pill ${health.tone}`;
  homeMonthEndCard.className = `home-month-summary ${health.tone}`;
  homeMonthEndHint.textContent = getHomeHealthCopy(health);
  homeMonthEndDot.className = `home-month-dot ${health.tone}`;
  projectionStatusCard.className = `projection-status-card ${health.tone}`;
  if (connectionBanner) {
    const showConnectionBanner = state.offline || state.syncPending || state.syncingPending;
    connectionBanner.hidden = !showConnectionBanner;

    if (showConnectionBanner) {
      if (state.offline) {
        connectionBanner.className = "app-connection-banner offline";
        connectionBannerTitle.textContent = copyText("connection.offline.title");
        connectionBannerText.textContent = copyText("connection.offline.body");
        connectionBannerBtn.hidden = true;
      } else if (state.syncingPending) {
        connectionBanner.className = "app-connection-banner syncing";
        connectionBannerTitle.textContent = copyText("connection.syncing.title");
        connectionBannerText.textContent = copyText("connection.syncing.body");
        connectionBannerBtn.hidden = true;
      } else {
        connectionBanner.className = "app-connection-banner pending";
        connectionBannerTitle.textContent = copyText("connection.pending.title");
        connectionBannerText.textContent = copyText("connection.pending.body");
        connectionBannerBtn.hidden = false;
        connectionBannerBtn.textContent = copyText("connection.pending.action");
      }
    }
  }
  homeBalanceCard.classList.toggle("is-empty", !hasMovements && isOnboardingState);
  homeBalanceCard.classList.toggle("is-learning", hasMovements && isOnboardingState);
  homeBalanceCard.classList.toggle("is-risk", isRiskState);
  homeBalanceCard.classList.toggle("is-ok", isPositiveState);
  homeAdviceCard.classList.toggle("is-learning", isOnboardingState);
  homeAdviceCard.classList.toggle("is-risk", isRiskState);
  homeAdviceCard.classList.toggle("is-ok", isPositiveState);
  homeQuickGrid.classList.toggle("is-single", isLearningState);
  quickExpenseBtn.hidden = hasMovements && isOnboardingState;
  if (quickIncomeLabel) {
    quickIncomeLabel.textContent = !hasMovements
      ? copyText("home.quick.addIncome")
      : isLearningState
        ? copyText("home.quick.add")
        : copyText("home.quick.income");
  }
  if (quickExpenseLabel) {
    quickExpenseLabel.textContent = hasMovements
      ? copyText("home.quick.expense")
      : copyText("home.quick.addExpense");
  }
  state.latestScenarioBalance = projectedBalance;

  applyCompanyLogo();

  renderTodayMovements(state.data.transactions);
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

  switchPage(state.activePage);
  switchDetailTab(state.activeDetailTab);
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
  const weeks = Array.from({ length: 4 }, (_, index) => {
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
  if (!weeks.length) {
    forecastList.innerHTML = `<p class="forecast-empty">${copyText("projection.weekly.empty")}</p>`;
    return;
  }

  const zones = weeks.reduce((acc, week, index) => {
    const zoneTone = week.tone === "ok" ? "stable" : "critical";
    const previous = acc[acc.length - 1];

    if (!previous || previous.zoneTone !== zoneTone) {
      acc.push({
        zoneTone,
        startIndex: index,
        endIndex: index,
        weeks: [week],
      });
      return acc;
    }

    previous.endIndex = index;
    previous.weeks.push(week);
    return acc;
  }, []);

  const firstCritical = zones.find((zone) => zone.zoneTone === "critical");
  const firstCriticalIndex = firstCritical ? zones.indexOf(firstCritical) : -1;
  const recoveryZone =
    firstCriticalIndex >= 0
      ? zones.slice(firstCriticalIndex + 1).find((zone) => zone.zoneTone === "stable")
      : null;
  const lastZone = zones[zones.length - 1];
  const summaryAmount = firstCritical
    ? firstCritical.weeks[firstCritical.weeks.length - 1].amount
    : lastZone.weeks[lastZone.weeks.length - 1].amount;
  const firstCriticalStartWeek = firstCritical ? firstCritical.startIndex + 1 : null;
  const firstCriticalEndWeek = firstCritical ? firstCritical.endIndex + 1 : null;
  const criticalRangeLabel = firstCritical
    ? firstCriticalStartWeek === firstCriticalEndWeek
      ? `Semana ${firstCriticalStartWeek} crítica`
      : `Semanas ${firstCriticalStartWeek}&ndash;${firstCriticalEndWeek} críticas`
    : "";
  const stableRangeLabel =
    lastZone.startIndex + 1 === lastZone.endIndex + 1
      ? `Semana ${lastZone.startIndex + 1} estable`
      : `Semanas ${lastZone.startIndex + 1}&ndash;${lastZone.endIndex + 1} estables`;

  const summaryTitle = firstCritical
    ? firstCritical.startIndex === 0
      ? copyText("projection.weekly.summaryCriticalNow")
      : copyText("projection.weekly.summaryCriticalLater")
    : copyText("projection.weekly.summaryStable");
  const summaryRange = firstCritical ? criticalRangeLabel : stableRangeLabel;
  const summaryContext = firstCritical
    ? recoveryZone
      ? copyText("projection.weekly.summaryRecovery", {
          week: recoveryZone.startIndex + 1,
        })
      : copyText("projection.weekly.summaryHold")
    : copyText("projection.weekly.summarySafe");

  forecastList.innerHTML = `
    <article class="forecast-summary ${firstCritical ? "critical" : "stable"}">
      <div class="forecast-summary-copy">
        <h4>${summaryTitle}</h4>
        <p class="forecast-summary-range">${summaryRange}</p>
      </div>
      <strong class="forecast-summary-amount">${formatCurrency(summaryAmount)}</strong>
      <p class="forecast-summary-context">${summaryContext}</p>
    </article>
    <div class="forecast-lines">
      ${zones
        .map((zone, index) => {
          const startWeek = zone.startIndex + 1;
          const endWeek = zone.endIndex + 1;
          const rangeLabel =
            startWeek === endWeek ? `Semana ${startWeek}` : `Semanas ${startWeek} a ${endWeek}`;
          const finalWeek = zone.weeks[zone.weeks.length - 1];
          const recoveredAfterCritical =
            zone.zoneTone === "stable" &&
            zones.slice(0, index).some((item) => item.zoneTone === "critical");

          const title =
            zone.zoneTone === "critical"
              ? copyText("projection.weekly.lineCriticalTitle")
              : recoveredAfterCritical
                ? copyText("projection.weekly.lineRecoveryTitle")
                : copyText("projection.weekly.lineStableTitle");

          const copy =
            zone.zoneTone === "critical"
              ? cashFloor > 0
                ? copyText("projection.weekly.lineCriticalCopy")
                : copyText("projection.weekly.lineCriticalNoFloor")
              : recoveredAfterCritical
                ? copyText("projection.weekly.lineRecoveryCopy")
                : copyText("projection.weekly.lineStableCopy");

          return `
            <div class="forecast-line ${zone.zoneTone}">
              <div class="forecast-line-copy">
                <span class="forecast-line-range">${rangeLabel}</span>
                <strong>${title}</strong>
                <p>${copy}</p>
              </div>
              <div class="forecast-line-amount">
                <span>Si sigues así</span>
                <strong>${formatCurrency(finalWeek.amount)}</strong>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderCashFloorStatus(balance, cashFloor, lowCashWeek, hasAnyData) {
  if (!cashFloor) {
    cashFloorAlert.className = "cash-floor-alert";
    cashFloorAlert.textContent = copyText("cashFloor.define");
    return;
  }

  if (!hasAnyData) {
    cashFloorAlert.className = "cash-floor-alert warn";
    cashFloorAlert.textContent = copyText("cashFloor.waiting");
    return;
  }

  if (balance < cashFloor) {
    cashFloorAlert.className = "cash-floor-alert risk";
    cashFloorAlert.textContent = copyText("cashFloor.alertProjection", {
      amount: formatCurrency(cashFloor),
    });
    return;
  }

  if (lowCashWeek) {
    cashFloorAlert.className = "cash-floor-alert warn";
    cashFloorAlert.textContent = copyText("cashFloor.alertWeek", {
      label: lowCashWeek.label,
      amount: formatCurrency(lowCashWeek.amount),
    });
    return;
  }

  cashFloorAlert.className = "cash-floor-alert ok";
  cashFloorAlert.textContent = copyText("cashFloor.safe", {
    amount: formatCurrency(cashFloor),
  });
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
    tips.push(copyText("tips.belowCashFloor", { amount: formatCurrency(cashFloor) }));
  } else if (lowCashWeek) {
    tips.push(
      copyText("tips.lowCashWeek", {
        label: lowCashWeek.label,
        amount: formatCurrency(lowCashWeek.amount),
        cashFloor: formatCurrency(cashFloor),
      })
    );
  }

  if (expenseTotal > incomeTotal) {
    tips.push(copyText("tips.negativeNet"));
  }

  if (recurring.length >= 3) {
    tips.push(copyText("tips.recurring"));
  }

  if (balance < 150000) {
    tips.push(copyText("tips.lowAvailable"));
  }

  const receivablesDueTomorrow = openReceivables.filter(
    (item) => daysUntil(item.dueDate) === 1
  );
  const payablesDueTomorrow = openPayables.filter((item) => daysUntil(item.dueDate) === 1);

  if (openReceivables.some((item) => daysUntil(item.dueDate) < 0)) {
    tips.push(copyText("tips.overdueReceivables"));
  }

  if (receivablesDueTomorrow.length) {
    receivablesDueTomorrow.forEach((item) => {
      tips.push(copyText("tips.dueTomorrow", { document: item.document, name: item.client }));
    });
  }

  if (payablesDueTomorrow.length) {
    payablesDueTomorrow.forEach((item) => {
      tips.push(copyText("tips.dueTomorrow", { document: item.document, name: item.vendor }));
    });
  }

  if (openPayables.some((item) => daysUntil(item.dueDate) <= 7)) {
    tips.push(copyText("tips.nearPayables"));
  }

  if (incomeTotal > expenseTotal && balance >= 150000) {
    tips.push(copyText("tips.stable"));
  }

  if (!tips.length) {
    tips.push(copyText("tips.empty"));
  }

  const visibleTips = [...new Set(tips)].slice(0, 4);
  tipsList.innerHTML = visibleTips.map((tip) => `<li>${tip}</li>`).join("");
}

async function loadData() {
  if (!state.session?.user) {
    return cloneSeedState();
  }

  const storageKey = getUserStorageKey();
  const localBackup = localStorage.getItem(storageKey);
  const hasPendingLocalSync = readPendingSyncFlag();

  if (hasPendingLocalSync && localBackup) {
    try {
      return normalizeStatePayload(JSON.parse(localBackup));
    } catch {
      setPendingSyncFlag(false);
    }
  }

  if (!hasNetworkConnection()) {
    state.offline = true;

    if (localBackup) {
      try {
        return normalizeStatePayload(JSON.parse(localBackup));
      } catch {
        return cloneSeedState();
      }
    }

    return cloneSeedState();
  }

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
  } catch (error) {
    if (isConnectivityError(error)) {
      state.offline = true;

      if (localBackup) {
        try {
          return normalizeStatePayload(JSON.parse(localBackup));
        } catch {
          return cloneSeedState();
        }
      }

      return cloneSeedState();
    }

    if (localBackup) {
      try {
        return normalizeStatePayload(JSON.parse(localBackup));
      } catch {
        throw new Error("No se pudo recuperar el respaldo local.");
      }
    }

    throw new Error("No se pudo cargar la información.");
  }
}

async function saveData() {
  if (!state.session?.user) {
    return;
  }

  const normalizedData = normalizeStatePayload(state.data);
  state.data = normalizedData;
  localStorage.setItem(getUserStorageKey(), JSON.stringify(normalizedData));

  if (!hasNetworkConnection()) {
    const wasPending = state.syncPending;
    state.offline = true;
    setPendingSyncFlag(true);
    render();

    if (!wasPending) {
      showUXFeedback(copyText("feedback.offlineAutoSave"), "warn");
    }

    return;
  }

  try {
    await saveDataToSupabase(normalizedData);
    state.offline = false;
    setPendingSyncFlag(false);
  } catch (error) {
    console.warn("No se pudo sincronizar con Supabase:", error.message);
    if (isConnectivityError(error)) {
      const wasPending = state.syncPending;
      state.offline = !hasNetworkConnection();
      setPendingSyncFlag(true);
      render();

      if (!wasPending) {
        showUXFeedback(copyText("feedback.savedLocal"), "warn");
      }

      return;
    }

    showUXFeedback(getFriendlyErrorMessage("save_sync", error), "warn");
  }
}

function getHealth(incomeTotal, expenseTotal, balance, cashFloor = 0) {
  const minimumBalance = cashFloor > 0 ? cashFloor : 100000;
  const cautionBalance = cashFloor > 0 ? cashFloor * 1.35 : 350000;

  if (balance <= minimumBalance || expenseTotal > incomeTotal) {
    return {
      label: copyText("health.labels.risk"),
      tone: "risk",
      description: copyText("health.descriptions.risk"),
    };
  }

  if (balance <= cautionBalance || expenseTotal > incomeTotal * 0.8) {
    return {
      label: copyText("health.labels.warn"),
      tone: "warn",
      description: copyText("health.descriptions.warn"),
    };
  }

  return {
    label: copyText("health.labels.ok"),
    tone: "ok",
    description: copyText("health.descriptions.ok"),
  };
}

function getHealthToneRank(tone) {
  const toneOrder = {
    neutral: 0,
    risk: 1,
    warn: 2,
    ok: 3,
  };

  return toneOrder[tone] ?? 0;
}

function getNotificationPriority(type) {
  const priorityMap = {
    critical: 0,
    preventive: 1,
    positive: 2,
    onboarding: 3,
  };

  return priorityMap[type] ?? 9;
}

function getUserNotificationMetaKey() {
  return `${getUserStorageKey()}-notifications-meta`;
}

function createInitialNotificationMeta() {
  return {
    lastActiveDate: "",
    activeDays: [],
    lastProjectedBalance: null,
    lastHealthTone: "neutral",
    lastMovementId: "",
    pendingNotifications: [],
  };
}

function normalizePendingNotification(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const normalized = {
    id: String(item.id || ""),
    type: String(item.type || ""),
    trigger: String(item.trigger || ""),
    message: String(item.message || ""),
    readyAt: Number(item.readyAt),
  };

  if (
    !normalized.id ||
    !normalized.type ||
    !normalized.trigger ||
    !normalized.message ||
    !Number.isFinite(normalized.readyAt)
  ) {
    return null;
  }

  return normalized;
}

function normalizeNotificationMeta(meta) {
  const activeDays = Array.isArray(meta?.activeDays)
    ? [...new Set(meta.activeDays.filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value))))]
        .sort()
        .slice(-14)
    : [];
  const pendingNotifications = Array.isArray(meta?.pendingNotifications)
    ? meta.pendingNotifications.map(normalizePendingNotification).filter(Boolean).slice(-12)
    : [];

  return {
    lastActiveDate:
      typeof meta?.lastActiveDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(meta.lastActiveDate)
        ? meta.lastActiveDate
        : "",
    activeDays,
    lastProjectedBalance: Number.isFinite(Number(meta?.lastProjectedBalance))
      ? Number(meta.lastProjectedBalance)
      : null,
    lastHealthTone: typeof meta?.lastHealthTone === "string" ? meta.lastHealthTone : "neutral",
    lastMovementId: meta?.lastMovementId ? String(meta.lastMovementId) : "",
    pendingNotifications,
  };
}

function readNotificationMeta() {
  if (!state.session?.user) {
    return createInitialNotificationMeta();
  }

  try {
    const rawValue = localStorage.getItem(getUserNotificationMetaKey());
    return rawValue
      ? normalizeNotificationMeta(JSON.parse(rawValue))
      : createInitialNotificationMeta();
  } catch {
    return createInitialNotificationMeta();
  }
}

function writeNotificationMeta(meta) {
  if (!state.session?.user) {
    return;
  }

  localStorage.setItem(
    getUserNotificationMetaKey(),
    JSON.stringify(normalizeNotificationMeta(meta))
  );
}

function getRecentUsageDays(meta) {
  const cutoff = addDays(-6);
  return [...new Set([...(meta.activeDays || []), today()])].filter((value) => value >= cutoff)
    .length;
}

function getDaysSinceLastActive(lastActiveDate) {
  if (!lastActiveDate) {
    return 0;
  }

  return Math.max(0, -daysUntil(lastActiveDate));
}

function buildNotificationActiveDays(previousMeta) {
  const cutoff = addDays(-6);
  return [...new Set([...(previousMeta.activeDays || []), today()])]
    .filter((value) => value >= cutoff)
    .sort();
}

function buildScheduledNotification(type, trigger, reference, message, delayMs) {
  return {
    id: `${type}:${trigger}:${reference}`,
    type,
    trigger,
    message,
    readyAt: Date.now() + delayMs,
  };
}

function mergePendingNotifications(existingNotifications, scheduledNotifications) {
  const merged = [...existingNotifications];
  const knownIds = new Set(existingNotifications.map((item) => item.id));

  scheduledNotifications.forEach((item) => {
    if (!knownIds.has(item.id)) {
      merged.push(item);
      knownIds.add(item.id);
    }
  });

  return merged
    .filter((item) => item.readyAt > Date.now() - 24 * 60 * 60 * 1000)
    .sort((left, right) => left.readyAt - right.readyAt)
    .slice(-12);
}

function splitPendingNotifications(notifications) {
  const now = Date.now();

  return notifications.reduce(
    (acc, item) => {
      if (item.readyAt <= now) {
        acc.due.push(item);
      } else {
        acc.upcoming.push(item);
      }

      return acc;
    },
    { due: [], upcoming: [] }
  );
}

function clearSmartNotificationTimer() {
  if (smartNotificationTimer) {
    clearTimeout(smartNotificationTimer);
    smartNotificationTimer = null;
  }
}

function scheduleSmartNotificationTimer(pendingNotifications) {
  clearSmartNotificationTimer();

  if (!pendingNotifications.length) {
    return;
  }

  const nextReadyAt = pendingNotifications[0].readyAt;
  const waitMs = Math.max(500, nextReadyAt - Date.now());

  smartNotificationTimer = window.setTimeout(() => {
    smartNotificationTimer = null;
    render();
  }, waitMs);
}

function getHighExpenseThreshold(expenses, currentBalance, cashFloor = 0) {
  const averageExpense = expenses.length ? sum(expenses) / expenses.length : 0;
  return Math.max(75000, averageExpense * 1.8, currentBalance * 0.18, cashFloor * 0.2);
}

function getNotificationLabel(rawValue, fallback = "ese movimiento") {
  const label = String(rawValue || "").trim();

  if (!label) {
    return fallback;
  }

  return label.length > 28 ? `${label.slice(0, 25).trim()}...` : label;
}

function buildSmartNotifications(context, previousMeta = createInitialNotificationMeta()) {
  const {
    currentBalance,
    projectedBalance,
    forecastWeeks,
    lowCashWeek,
    criticalCashDate,
    latestTransactions,
    usageMetrics,
    health,
    cashFloor,
  } = context;
  const immediateNotifications = [];
  const scheduledNotifications = [];
  const latestMovement = latestTransactions[0] || null;
  const latestExpense = latestMovement?.type === "expense" ? latestMovement : null;
  const daysSinceLastActive = getDaysSinceLastActive(previousMeta.lastActiveDate);
  const usageDays = getRecentUsageDays(previousMeta);
  const movementExpenses = latestTransactions.filter((item) => item.type === "expense");
  const expenseThreshold = getHighExpenseThreshold(movementExpenses, currentBalance, cashFloor);
  const projectionDelta =
    previousMeta.lastProjectedBalance === null
      ? 0
      : Math.round(projectedBalance - previousMeta.lastProjectedBalance);
  const projectedCashFloor = cashFloor || UX_RULES.criticalProjectionAmount;
  const daysToCritical =
    criticalCashDate && daysUntil(criticalCashDate) >= 0
      ? Math.max(1, daysUntil(criticalCashDate))
      : null;

  if (
    previousMeta.lastMovementId &&
    latestExpense &&
    String(latestExpense.id) !== previousMeta.lastMovementId &&
    latestExpense.amount >= expenseThreshold
  ) {
    scheduledNotifications.push(
      buildScheduledNotification(
        projectedBalance <= projectedCashFloor || Boolean(lowCashWeek) ? "critical" : "preventive",
        "high_expense",
        latestExpense.id,
        projectedBalance <= projectedCashFloor || Boolean(lowCashWeek)
          ? copyText("notifications.critical.highExpense", {
              amount: formatCurrency(latestExpense.amount),
              label: getNotificationLabel(latestExpense.description),
            })
          : copyText("notifications.preventive.highExpense", {
              amount: formatCurrency(latestExpense.amount),
              label: getNotificationLabel(latestExpense.description),
            }),
        10 * 60 * 1000
      )
    );
  }

  if (
    previousMeta.lastHealthTone !== "risk" &&
    (Boolean(lowCashWeek) || (daysToCritical !== null && daysToCritical <= 10))
  ) {
    immediateNotifications.push({
      type: "critical",
      trigger: "cash_floor",
      message: copyText("notifications.critical.cashFloor", {
        days: daysToCritical ?? 10,
      }),
    });
  }

  if (previousMeta.lastProjectedBalance !== null && projectionDelta <= -50000) {
    immediateNotifications.push({
      type:
        projectedBalance <= projectedCashFloor || Boolean(lowCashWeek) ? "critical" : "preventive",
      trigger: "projection_drop",
      message:
        projectedBalance <= projectedCashFloor || Boolean(lowCashWeek)
          ? copyText("notifications.critical.projectionDrop")
          : copyText("notifications.preventive.projectionDrop", {
              amount: formatCurrency(Math.abs(projectionDelta)),
            }),
    });
  }

  if (daysSinceLastActive >= 1) {
    immediateNotifications.push({
      type:
        usageMetrics.transactionsCount < UX_RULES.progressiveVisibility.projectionTransactions ||
        usageDays <= 1
          ? "onboarding"
          : "preventive",
      trigger: "inactivity",
      message:
        usageMetrics.transactionsCount < UX_RULES.progressiveVisibility.projectionTransactions ||
        usageDays <= 1
          ? copyText("notifications.onboarding.inactive")
          : copyText("notifications.preventive.inactivity", {
              days: daysSinceLastActive,
              suffix: daysSinceLastActive === 1 ? "" : "s",
            }),
    });
  }

  if (
    previousMeta.lastHealthTone &&
    getHealthToneRank(health.tone) > getHealthToneRank(previousMeta.lastHealthTone)
  ) {
    immediateNotifications.push({
      type: "positive",
      trigger: "improved_state",
      message:
        projectionDelta >= 50000
          ? copyText("notifications.positive.projectionUp", {
              amount: formatCurrency(projectionDelta),
            })
          : lowCashWeek || daysToCritical !== null
            ? copyText("notifications.positive.recovery")
            : copyText("notifications.positive.improved"),
    });
  }

  if (
    !immediateNotifications.length &&
    usageMetrics.transactionsCount < UX_RULES.progressiveVisibility.projectionTransactions
  ) {
    immediateNotifications.push({
      type: "onboarding",
      trigger: "first_steps",
      message: copyText("notifications.onboarding.firstSteps", {
        remaining: Math.max(
          1,
          UX_RULES.progressiveVisibility.projectionTransactions - usageMetrics.transactionsCount
        ),
      }),
    });
  } else if (!immediateNotifications.length && health.tone === "warn") {
    immediateNotifications.push({
      type: "preventive",
      trigger: "tight_week",
      message: copyText("notifications.preventive.tightWeek"),
    });
  } else if (!immediateNotifications.length && health.tone === "ok") {
    immediateNotifications.push({
      type: "positive",
      trigger: "good_margin",
      message: copyText("notifications.positive.goodMargin"),
    });
  }

  return {
    immediateNotifications: immediateNotifications
      .filter(
        (item, index, collection) =>
          collection.findIndex(
            (candidate) => candidate.type === item.type && candidate.trigger === item.trigger
          ) === index
      )
      .sort(
        (left, right) => getNotificationPriority(left.type) - getNotificationPriority(right.type)
      )
      .slice(0, 4),
    scheduledNotifications,
  };
}

function syncSmartNotifications(context) {
  const previousMeta = readNotificationMeta();
  const { immediateNotifications, scheduledNotifications } = buildSmartNotifications(
    context,
    previousMeta
  );
  const mergedPending = mergePendingNotifications(
    previousMeta.pendingNotifications || [],
    scheduledNotifications
  );
  const { due, upcoming } = splitPendingNotifications(mergedPending);
  const notifications = [...due, ...immediateNotifications]
    .filter(
      (item, index, collection) =>
        collection.findIndex(
          (candidate) => candidate.type === item.type && candidate.trigger === item.trigger
        ) === index
    )
    .sort((left, right) => getNotificationPriority(left.type) - getNotificationPriority(right.type))
    .slice(0, 4);

  state.smartNotifications = notifications;
  window.getSmartNotificationQueue = () => state.smartNotifications.map((item) => item.message);
  window.getPrimarySmartNotification = () => state.smartNotifications[0]?.message || "";
  window.getSmartNotificationPayloads = () => state.smartNotifications.map((item) => ({ ...item }));

  writeNotificationMeta({
    lastActiveDate: today(),
    activeDays: buildNotificationActiveDays(previousMeta),
    lastProjectedBalance: context.projectedBalance,
    lastHealthTone: context.health?.tone || "neutral",
    lastMovementId: context.latestTransactions[0]?.id ? String(context.latestTransactions[0].id) : "",
    pendingNotifications: upcoming,
  });
  scheduleSmartNotificationTimer(upcoming);

  return notifications;
}

function getHomeHealthCopy(health) {
  const copyMap = copyValue("health.home") || {
    ok: "Puedes gastar hoy",
    warn: "Mejor espera antes de gastar",
    risk: "Evita gastar hoy",
    neutral: "Agrega un movimiento",
  };

  return copyMap[health?.tone] || health?.label || "Agrega un movimiento";
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
    return copyText("common.noMovements");
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
  const weeklySpend = getWeeklySpendBudget(projectedBalance, cashFloor);

  if (projectedBalance <= safeReserve || lowCashWeek) {
    return copyText("advice.lowCash");
  }

  if (netTotal < 0) {
    return copyText("advice.negativeNet", { category: topCategory });
  }

  if (payableTotal > receivableTotal) {
    return copyText("advice.payablesHeavy");
  }

  if (recurringCount > 0) {
    return copyText("advice.recurring", { amount: formatCurrency(weeklySpend) });
  }

  return copyText("advice.invest", { amount: formatCurrency(weeklySpend) });
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
  const labels = copyValue("statuses") || {
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

function createInitialVisibilityState() {
  return {
    projection: false,
    detail: false,
    detailTabs: {
      summary: true,
      categories: false,
      history: false,
    },
    hints: [],
    metrics: {
      transactionsCount: 0,
      recurringCount: 0,
    },
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

function getUsageMetrics() {
  const transactionsCount = state.data.transactions.length;
  const recurringCount = state.data.transactions.filter((item) => item.recurring).length;

  return {
    transactionsCount,
    recurringCount,
  };
}

function buildVisibilityHints(visibility) {
  const { transactionsCount, recurringCount } = visibility.metrics;
  const hints = [];

  if (!visibility.projection) {
    const missingTransactions =
      UX_RULES.progressiveVisibility.projectionTransactions - transactionsCount;
    hints.push({
      title: copyText("featureUnlocks.projectionTitle"),
      copy:
        missingTransactions > 0
          ? copyText(
              missingTransactions === 1
                ? "featureUnlocks.projectionOne"
                : "featureUnlocks.projectionMany",
              { count: missingTransactions }
            )
          : copyText("featureUnlocks.projectionFallback"),
      progress: Math.min(
        100,
        (transactionsCount / UX_RULES.progressiveVisibility.projectionTransactions) * 100
      ),
    });
  }

  if (!visibility.detail) {
    const missingTransactions =
      UX_RULES.progressiveVisibility.detailTransactions - transactionsCount;
    hints.push({
      title: copyText("featureUnlocks.detailTitle"),
      copy:
        recurringCount > 0
          ? copyText("featureUnlocks.detailRecurring")
          : missingTransactions > 0
            ? copyText("featureUnlocks.detailLocked", { count: missingTransactions })
            : copyText("featureUnlocks.detailFallback"),
      progress: Math.min(
        100,
        Math.max(
          (transactionsCount / UX_RULES.progressiveVisibility.detailTransactions) * 100,
          recurringCount > 0 ? 100 : 0
        )
      ),
    });
  } else if (!visibility.detailTabs.categories) {
    const missingTransactions =
      UX_RULES.progressiveVisibility.categoriesTransactions - transactionsCount;
    hints.push({
      title: copyText("featureUnlocks.categoriesTitle"),
      copy:
        recurringCount > 0
          ? copyText("featureUnlocks.categoriesRecurring")
          : missingTransactions > 0
            ? copyText("featureUnlocks.categoriesLocked", { count: missingTransactions })
            : copyText("featureUnlocks.categoriesFallback"),
      progress: Math.min(
        100,
        Math.max(
          (transactionsCount / UX_RULES.progressiveVisibility.categoriesTransactions) * 100,
          recurringCount > 0 ? 100 : 0
        )
      ),
    });
  }

  return hints.slice(0, 2);
}

function syncProgressiveVisibility() {
  const metrics = getUsageMetrics();
  const projection =
    metrics.transactionsCount >= UX_RULES.progressiveVisibility.projectionTransactions;
  const detail =
    metrics.transactionsCount >= UX_RULES.progressiveVisibility.detailTransactions ||
    metrics.recurringCount > 0;
  const categories =
    metrics.recurringCount > 0 ||
    metrics.transactionsCount >= UX_RULES.progressiveVisibility.categoriesTransactions;

  state.visibility = {
    projection,
    detail,
    detailTabs: {
      summary: detail,
      history: detail,
      categories: detail && categories,
    },
    metrics,
    hints: [],
  };

  state.visibility.hints = buildVisibilityHints(state.visibility);
  applyProgressiveVisibility();
}

function isPageAccessible(pageName) {
  if (pageName === "home") {
    return true;
  }

  if (pageName === "projection") {
    return state.visibility.projection;
  }

  if (pageName === "detail") {
    return state.visibility.detail;
  }

  return true;
}

function isDetailTabAccessible(tabName) {
  if (tabName === "summary") {
    return true;
  }

  return Boolean(state.visibility.detailTabs?.[tabName]);
}

function applyProgressiveVisibility() {
  navLinks.forEach((navLink) => {
    const pageTarget = navLink.dataset.pageTarget;
    navLink.hidden = !isPageAccessible(pageTarget);
  });

  if (bottomNavigation) {
    const visibleBottomButtons = [...bottomNavigation.querySelectorAll("[data-page-target]")].filter(
      (button) => !button.hidden
    ).length;
    bottomNavigation.style.setProperty("--bottom-nav-count", String(Math.max(1, visibleBottomButtons)));
  }

  detailTabButtons.forEach((tabButton) => {
    tabButton.hidden = !isDetailTabAccessible(tabButton.dataset.detailTab);
  });

  renderFeatureUnlocks();

  if (!isPageAccessible(state.activePage)) {
    state.activePage = "home";
  }

  if (!isDetailTabAccessible(state.activeDetailTab)) {
    state.activeDetailTab = "summary";
  }
}

function renderFeatureUnlocks() {
  if (!featureUnlockPanel || !featureUnlockList) {
    return;
  }

  if (state.appError) {
    featureUnlockPanel.hidden = true;
    featureUnlockList.innerHTML = "";
    return;
  }

  if (
    state.data.transactions.length < UX_RULES.progressiveVisibility.projectionTransactions ||
    !state.visibility.hints.length
  ) {
    featureUnlockPanel.hidden = true;
    featureUnlockList.innerHTML = "";
    return;
  }

  featureUnlockPanel.hidden = false;
  featureUnlockList.innerHTML = state.visibility.hints
    .map(
      (hint) => `
        <article class="feature-unlock-item">
          <div class="feature-unlock-copy">
            <strong>${escapeHtml(hint.title)}</strong>
            <p>${escapeHtml(hint.copy)}</p>
          </div>
          <div class="feature-unlock-track" aria-hidden="true">
            <span class="feature-unlock-fill" style="width:${Math.max(8, Math.round(hint.progress))}%"></span>
          </div>
        </article>
      `
    )
    .join("");
}

function buildDetailSummaryCopy() {
  if (!state.visibility.detail) {
    return copyText("featureUnlocks.summaryLocked");
  }

  if (!state.visibility.detailTabs.categories) {
    return copyText("featureUnlocks.summaryWarm");
  }

  return copyText("featureUnlocks.summaryReady");
}

function getUserStorageKey() {
  return `${STORAGE_KEY}-${state.session.user.id}`;
}

function getUserPendingSyncKey() {
  return `${getUserStorageKey()}-pending-sync`;
}

function readPendingSyncFlag() {
  if (!state.session?.user) {
    return false;
  }

  return localStorage.getItem(getUserPendingSyncKey()) === "1";
}

function setPendingSyncFlag(value) {
  state.syncPending = value;

  if (!state.session?.user) {
    return;
  }

  if (value) {
    localStorage.setItem(getUserPendingSyncKey(), "1");
    return;
  }

  localStorage.removeItem(getUserPendingSyncKey());
}

function hasNetworkConnection() {
  return typeof navigator === "undefined" ? true : navigator.onLine !== false;
}

function isConnectivityError(error) {
  const rawMessage = String(error?.message || "").toLowerCase();
  return (
    !hasNetworkConnection() ||
    rawMessage.includes("failed to fetch") ||
    rawMessage.includes("network") ||
    rawMessage.includes("fetch")
  );
}

async function syncPendingLocalData(options = {}) {
  if (!state.session?.user || !state.syncPending || !hasNetworkConnection()) {
    state.offline = !hasNetworkConnection();
    render();
    return false;
  }

  state.syncingPending = true;
  render();

  try {
    await saveDataToSupabase(normalizeStatePayload(state.data));
    setPendingSyncFlag(false);
    state.offline = false;
    state.syncingPending = false;
    render();

    if (options.showFeedback !== false) {
      showUXFeedback(copyText("feedback.synced"), "ok");
    }

    return true;
  } catch (error) {
    state.syncingPending = false;
    state.offline = !hasNetworkConnection();
    render();

    if (!isConnectivityError(error)) {
      showUXFeedback(getFriendlyErrorMessage("save_sync", error), "warn");
    }

    return false;
  }
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
  const element = document.querySelector(selector);
  if (!element) {
    return;
  }

  element.textContent = value;
}

function setAnimatedCurrency(selector, value, options = {}) {
  const element = document.querySelector(selector);
  if (!element) {
    return;
  }

  if (!Number.isFinite(value)) {
    element.textContent = String(value);
    delete element.dataset.currencyValue;
    const activeHandle = animatedCurrencyHandles.get(element);
    if (activeHandle) {
      cancelAnimationFrame(activeHandle);
      animatedCurrencyHandles.delete(element);
    }
    return;
  }

  const nextValue = Math.round(value);
  const previousValue = Number(element.dataset.currencyValue);
  const shouldAnimate = options.animate !== false && Number.isFinite(previousValue);

  if (!shouldAnimate || previousValue === nextValue) {
    element.textContent = formatCurrency(nextValue);
    element.dataset.currencyValue = String(nextValue);
    return;
  }

  const activeHandle = animatedCurrencyHandles.get(element);
  if (activeHandle) {
    cancelAnimationFrame(activeHandle);
  }

  const duration = options.durationMs || 360;
  const startTime = performance.now();
  const startValue = previousValue;
  const delta = nextValue - startValue;

  const tick = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(startValue + delta * eased);
    element.textContent = formatCurrency(currentValue);

    if (progress < 1) {
      const handle = requestAnimationFrame(tick);
      animatedCurrencyHandles.set(element, handle);
      return;
    }

    element.dataset.currencyValue = String(nextValue);
    animatedCurrencyHandles.delete(element);
  };

  const handle = requestAnimationFrame(tick);
  animatedCurrencyHandles.set(element, handle);
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
    ? copyText("movement.repeat.template")
    : "";
  saveTransactionBtn.textContent = asTemplate
    ? copyText("movement.save")
    : copyText("forms.saveChanges");
  cancelTransactionEditBtn.hidden = asTemplate;
  syncTransactionTypeButtons();
  openTransactionModal(transaction.type, { preserveForm: true });
}

function resetTransactionForm() {
  transactionForm.reset();
  transactionFields.transactionId.value = "";
  transactionFields.date.value = today();
  transactionFields.type.value = "income";
  renderCategoryOptions("income");
  syncTransactionTypeButtons();
  movementExtraDetails.open = false;
  movementImpactText.textContent = "";
  saveTransactionBtn.textContent = copyText("movement.save");
  cancelTransactionEditBtn.hidden = true;
  transactionModal.hidden = true;
  applyUXComponentRules();
}

function syncTransactionTypeButtons() {
  quickTypeButtons.forEach((typeButton) => {
    const isActive = typeButton.dataset.quickType === transactionFields.type.value;
    typeButton.classList.toggle("is-active", isActive);
    typeButton.setAttribute("aria-pressed", String(isActive));
  });
}

function focusTransactionAmount() {
  transactionFields.amount.focus({ preventScroll: true });

  try {
    transactionFields.amount.select();
  } catch {
    return;
  }
}

function applyUXComponentRules(options = {}) {
  simplifyUXCopy();
  enforcePrimaryFocus();
  enforceMainBlockLimit();

  if (options.resetProgressiveDisclosure) {
    resetProgressiveComponents();
  }
}

function simplifyUXCopy() {
  document.querySelectorAll("[data-ux-copy]").forEach((copyNode) => {
    UX_RULES.simpleCopyMap.forEach(([pattern, replacement]) => {
      copyNode.textContent = copyNode.textContent.replace(pattern, replacement);
    });
  });
}

function enforcePrimaryFocus() {
  const activePage = appPages.find((page) => !page.hidden);
  if (!activePage) {
    return;
  }

  const focusBlocks = [...activePage.querySelectorAll("[data-ux-focus]")].filter(isElementVisible);
  const firstPrimary = focusBlocks.find((block) => block.dataset.uxFocus === "primary");

  focusBlocks.forEach((block) => {
    block.classList.remove("ux-focus-primary", "ux-focus-secondary");
    block.classList.add(
      firstPrimary && block === firstPrimary ? "ux-focus-primary" : "ux-focus-secondary"
    );
  });
}

function enforceMainBlockLimit() {
  const activePage = appPages.find((page) => !page.hidden);
  if (!activePage) {
    return;
  }

  const visibleBlocks = [...activePage.querySelectorAll("[data-ux-block]")].filter(
    isElementVisible
  );

  visibleBlocks.forEach((block, index) => {
    block.classList.toggle(
      "ux-over-budget-hidden",
      index >= UX_RULES.maxMainBlocksPerScreen
    );
  });
}

function resetProgressiveComponents() {
  document.querySelectorAll("[data-ux-progressive]").forEach((element) => {
    if (element.tagName === "DETAILS") {
      element.open = false;
      return;
    }

    if (element.dataset.detailPanel && element.classList.contains("is-active")) {
      return;
    }

    element.hidden = true;
  });
}

function isElementVisible(element) {
  return !element.hidden && !element.closest("[hidden]");
}

function showUXFeedback(message, tone = "ok") {
  if (!uxToast || !message) {
    return;
  }

  clearTimeout(uxToastTimer);
  clearTimeout(uxToastHideTimer);
  uxToast.hidden = false;
  uxToast.className = `ux-toast ${tone}`;
  uxToast.textContent = message;
  void uxToast.offsetWidth;
  uxToast.classList.add("is-visible");

  uxToastTimer = window.setTimeout(() => {
    uxToast.classList.remove("is-visible");
    uxToast.classList.add("is-hiding");

    uxToastHideTimer = window.setTimeout(() => {
      uxToast.hidden = true;
      uxToast.className = "ux-toast";
    }, UX_RULES.feedbackExitMs);
  }, UX_RULES.feedbackDurationMs);
}

function getFriendlyErrorMessage(context, error) {
  const rawMessage = String(error?.message || "").toLowerCase();

  if (context === "auth") {
    if (rawMessage.includes("invalid login credentials")) {
      return copyText("errors.auth.invalid");
    }

    if (rawMessage.includes("email not confirmed")) {
      return copyText("errors.auth.emailNotConfirmed");
    }

    if (rawMessage.includes("user already registered")) {
      return copyText("errors.auth.registered");
    }

    if (rawMessage.includes("password")) {
      return copyText("errors.auth.password");
    }

    return copyText("errors.auth.fallback");
  }

  if (context === "logo_size") {
    return copyText("errors.logoSize");
  }

  if (context === "invoice_file_type") {
    return copyText("errors.invoiceFileType");
  }

  if (context === "invoice_image") {
    if (rawMessage.includes("pesada")) {
      return copyText("errors.invoiceImageHeavy");
    }

    return copyText("errors.invoiceImageFallback");
  }

  if (context === "invoice_ocr_unavailable") {
    return copyText("errors.invoiceOcrUnavailable");
  }

  if (context === "invoice_ocr_read") {
    return copyText("errors.invoiceOcrRead");
  }

  if (context === "partial_amount") {
    return copyText("errors.partialAmount");
  }

  if (context === "save_sync") {
    return copyText("errors.saveSync");
  }

  if (context === "load_data") {
    return copyText("errors.loadData");
  }

  if (context === "pdf_popup") {
    return copyText("errors.pdfPopup");
  }

  return copyText("errors.fallback");
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
  saveReceivableBtn.textContent = copyText("forms.saveChanges");
  cancelReceivableEditBtn.hidden = false;
  receivableForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetReceivableForm() {
  receivableForm.reset();
  receivableFields.receivableId.value = "";
  receivableFields.issueDate.value = today();
  receivableFields.dueDate.value = addDays(10);
  togglePartialAmountField(receivableFields, receivablePartialField);
  saveReceivableBtn.textContent = copyText("forms.receivableSave");
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
      ? copyText("invoice.replaceHint")
      : copyText("invoice.uploadHint")
  );
  togglePartialAmountField(payableFields, payablePartialField);
  savePayableBtn.textContent = copyText("forms.saveChanges");
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
  setInvoiceReadStatus(copyText("invoice.uploadHint"));
  togglePartialAmountField(payableFields, payablePartialField);
  savePayableBtn.textContent = copyText("forms.payableSave");
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
  mobileBrandLogoPreview.hidden = !logoData;
  mobileBrandLogoFallback.hidden = Boolean(logoData);

  if (logoData) {
    brandLogoPreview.src = logoData;
    mobileBrandLogoPreview.src = logoData;
  } else {
    brandLogoPreview.removeAttribute("src");
    mobileBrandLogoPreview.removeAttribute("src");
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
    showUXFeedback(getFriendlyErrorMessage("pdf_popup"), "warn");
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
