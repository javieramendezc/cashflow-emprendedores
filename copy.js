(() => {
  /*
   * ARCHIVO MAESTRO DE TEXTOS
   *
   * SISTEMA DE MICROCOPY
   * - Máximo 2 líneas por mensaje
   * - Lenguaje humano, no técnico
   * - Sin tono negativo fuerte
   * - Sin explicaciones largas
   * - Cada mensaje debe empujar una acción
   *
   * Edita aquí los textos visibles de la app.
   * Regla simple:
   * - Cambia solo el texto a la derecha de los ":".
   * - No cambies los nombres de las claves, porque la app las usa para encontrar cada texto.
   * - Los textos con {amount}, {count}, {month}, etc. se completan automáticamente.
   *
   * Ejemplo:
   * spend: "Puedes gastar hasta {amount} esta semana"
   *
   * TEXTOS MAS USADOS
   *
   * HOME
   * - APP_COPY.home.emptyTitle
   * - APP_COPY.home.today.available
   * - APP_COPY.home.today.learning
   * - APP_COPY.home.today.risk
   * - APP_COPY.home.today.positive
   * - APP_COPY.home.monthEnd.label
   * - APP_COPY.home.advice.initial
   *
   * BOTONES
   * - APP_COPY.home.quick.income
   * - APP_COPY.home.quick.expense
   * - APP_COPY.home.quick.addIncome
   * - APP_COPY.home.quick.addExpense
   * - APP_COPY.movement.save
   * - APP_COPY.forms.saveChanges
   *
   * ERRORES
   * - APP_COPY.home.error.title
   * - APP_COPY.home.error.retry
   * - APP_COPY.errors.auth.invalid
   * - APP_COPY.errors.loadData
   * - APP_COPY.errors.fallback
   *
   * FEEDBACK
   * - APP_COPY.movement.titles.income
   * - APP_COPY.movement.titles.expense
   * - APP_COPY.movement.impact.remaining
   * - APP_COPY.feedback.synced
   * - APP_COPY.feedback.savedLocal
   */
  const APP_COPY = {
    // General
    app: {
      documentTitle: "Flujo Claro | Tu Caja Sin Estrés.",
    },

    // Guía editorial interna de la app
    microcopy: {
      rules: {
        length: "Máximo 2 líneas por mensaje",
        language: "Humano y directo",
        tone: "Claro, sin dramatizar",
        action: "Cada mensaje debe empujar una acción",
      },
      states: {
        positive: "Tranquilidad",
        alert: "Preventiva",
        critical: "Urgencia controlada",
        onboarding: "Guía simple",
      },
    },

    // Acceso
    auth: {
      eyebrow: "Acceso privado",
      title: "Entra a Flujo Claro",
      body: "Crea tu cuenta o inicia sesión para guardar tu plata en la nube y ver solo tu información.",
      processing: "Procesando...",
      signUpSuccess:
        "Cuenta creada. Revisa tu correo si Supabase pide confirmación y luego inicia sesión.",
      labels: {
        password: "Contraseña",
        newPassword: "Nueva clave",
      },
      recovery: {
        title: "Crea tu nueva clave",
        body: "Elige una clave nueva para volver a entrar sin problemas.",
        action: "Olvidé mi clave",
        cancel: "Volver",
        submit: "Guardar nueva clave",
        sent: "Te mandé un correo para cambiar tu clave.",
        updated: "Clave actualizada. Ya puedes entrar.",
        sending: "Enviando correo...",
        updating: "Guardando tu nueva clave...",
      },
      actions: {
        signIn: "Iniciar sesión",
        signUp: "Crear cuenta",
        switchToSignUp: "Crear cuenta",
        switchToSignIn: "Ya tengo cuenta",
      },
    },

    // Header fijo
    header: {
      title: "Tu dinero",
      logout: "Salir",
      closeSession: "Cerrar sesión",
    },

    // Textos comunes reutilizados en varias pantallas
    common: {
      noMovements: "Sin movimientos",
      deleting: "Borrando...",
      acceptDelete: "Aceptar borrado",
    },

    // Marca / identidad visual
    brand: {
      eyebrow: "Flujo claro",
      title: "Tu Caja Sin Estrés.",
    },

    // Estado de conexión
    connection: {
      offline: {
        title: "Sin conexión",
        body: "Puedes seguir. Guardamos por ti.",
      },
      syncing: {
        title: "Sincronizando",
        body: "Subiendo tus cambios.",
      },
      pending: {
        title: "Pendiente por sincronizar",
        body: "Tus cambios ya están aquí. Falta subirlos.",
        action: "Sincronizar",
      },
    },

    // Pantalla principal: Inicio
    home: {
      error: {
        title: "Ups, no salió bien",
        retry: "Reintentar",
        retrying: "Probando de nuevo...",
      },
      emptyTitle: "Aún no hay movimientos",
      today: {
        available: "Hoy tienes disponible",
        low: "Mejor espera antes de gastar",
        start: "Registra lo de hoy",
        empty: "Agrega tu primer movimiento",
        learning: "Ya partimos. Registra uno más.",
        risk: "Evita gastar hoy",
        positive: "Puedes gastar hoy",
      },
      monthEnd: {
        label: "Fin de mes:",
        empty: "Sin datos",
      },
      advice: {
        initial: "Agrega un movimiento y te digo qué conviene.",
        starter: "Agrega uno más y te digo si conviene gastar.",
      },
      quick: {
        income: "Ingreso",
        expense: "Gasto",
        addIncome: "Agregar ingreso",
        addExpense: "Agregar gasto",
        add: "Agregar",
      },
      todaySection: "Hoy",
      onboarding: {
        progress: "{current} de {target} movimientos",
        addOneMore: "Agrega {count} más y te digo qué hacer",
        addManyMore: "Agrega {count} más y te digo qué hacer",
      },
      risk: {
        today: "Si gastas hoy, empeoras tu semana.",
        inDays: "En {count} día podrías quedar justa. Cuida gastos.",
        inManyDays: "En {count} días podrías quedar justa. Cuida gastos.",
        month: "Este mes conviene apretarse. Evita gastos nuevos.",
        soon: "Se aprieta pronto. Mejor espera antes de gastar.",
      },
      positive: {
        hold: "Vas bien. No te salgas hoy.",
        spend: "Puedes usar {amount} esta semana.",
        invest: "Vas bien. Puedes mover {amount} sin tocar tu mínimo.",
      },
    },

    // Modal y feedback de movimientos
    movement: {
      titles: {
        deleted: "✔️ Movimiento eliminado",
        updated: "✔️ Movimiento actualizado",
        income: "✔️ Ingreso registrado",
        expense: "✔️ Gasto registrado",
      },
      impact: {
        missing: "{prefix}te faltan {amount} {period}.",
        zero: "{prefix}quedas justo en {amount} {period}.",
        remaining: "{prefix}te quedan {amount} {period}.",
        savedFuture: "Listo. Quedó guardado para {month}.",
        updatedFuture: "Actualicé ese movimiento para {month}.",
        deletedFuture: "Quité ese movimiento de {month}.",
      },
      repeat: {
        empty: "Todavía no hay un movimiento anterior para repetir.",
        template: "Revisa el monto y guarda para repetir el último movimiento.",
      },
      save: "Guardar movimiento",
    },

    // Formularios secundarios
    forms: {
      saveChanges: "Guardar cambios",
      receivableSave: "Registrar cuenta por cobrar",
      payableSave: "Registrar factura por pagar",
    },

    // Mensajes cortos después de guardar, borrar o sincronizar
    feedback: {
      offlineShort: "Sin conexión. Puedes seguir.",
      offlineAutoSave: "Sin conexión. Guardamos por ti.",
      savedLocal: "Tus cambios quedaron aquí. Se subirán después.",
      synced: "Tus cambios ya están arriba.",
      futureAction: "{action} Quedó registrado para {month}.",
      receivableSaved: "Cuenta por cobrar guardada.",
      receivableUpdated: "Cuenta por cobrar actualizada.",
      receivableDeleted: "Cuenta por cobrar borrada.",
      payableSaved: "Factura por pagar guardada.",
      payableUpdated: "Factura por pagar actualizada.",
      payableDeleted: "Factura por pagar borrada.",
      logoUpdated: "Logo actualizado.",
      logoRemoved: "Logo quitado.",
      resetDone: "Todo quedó en cero.",
      cashFloorOff: "Mínimo seguro desactivado.",
      cashFloorReady: "Mínimo seguro listo en {amount}.",
    },

    // Notificaciones inteligentes listas para push
    notifications: {
      critical: {
        highExpense: "⚠️ Este gasto cambia tu semana\nEvita otro gasto grande hoy.",
        projectionDrop: "⚠️ Ojo: tu margen baja esta semana\nMejor espera antes de gastar.",
        cashFloor: "⚠️ Podrías quedar corta en {days} días\nFrena gastos y revisa cobros.",
      },
      preventive: {
        highExpense: "👀 Aún vas bien, pero ojo\nCuida lo que gastas hoy.",
        projectionDrop: "💡 Tu proyección bajó {amount}\nCuida lo que queda de semana.",
        tightWeek: "💡 Vas justo esta semana\nHaz un ajuste antes de gastar.",
        inactivity: "👀 Hace {days} día{suffix} que no registras\nActualiza tu plata de hoy.",
      },
      positive: {
        goodMargin: "✔️ Vas con buen margen\nPuedes gastar sin problema hoy.",
        projectionUp: "📈 Tu proyección subió {amount}\nPuedes gastar con más aire hoy.",
        improved: "📈 Vas mejor que la semana pasada\nMantén este ritmo.",
        recovery: "✔️ Ya te recuperas\nPuedes moverte con más calma.",
      },
      onboarding: {
        firstSteps: "✨ En {remaining} movimientos te digo qué conviene\nTe falta poco.",
        inactive: "✨ Falta poco para entender tu plata\nAgrega lo de hoy.",
      },
    },

    // Pantalla de proyección y simulador
    projection: {
      empty: "Agrega más datos. Y te digo qué hacer.",
      criticalDay: "Día {day}: si no ajustas, podrías bajar de {amount}.",
      scenarioPrompt: "Prueba una decisión antes de hacerla.",
      scenario: {
        income: "Si vendes",
        expense: "Si gastas",
      },
      scenarioResult: {
        incomeRisk: "Si vendes {amount}, alivias el mes: {balance}.",
        incomeWarn: "Si vendes {amount}, ganas algo de aire: {balance}.",
        incomeOk: "Si vendes {amount}, puedes seguir con aire: {balance}.",
        expenseRisk: "Si gastas {amount}, mejor espera: cerrarías en {balance}.",
        expenseWarn: "Si gastas {amount}, mejor espera: tu cierre queda en {balance}.",
        expenseOk: "Si gastas {amount}, sigues bien: cerrarías en {balance}.",
      },
      weekly: {
        empty: "Todavía no hay suficiente para decirte qué hacer estas semanas.",
        summaryCriticalNow: "Cuida esta semana",
        summaryCriticalLater: "Prepárate para frenar",
        summaryStable: "Puedes seguir así",
        summaryRecovery: "Desde semana {week} puedes soltar un poco",
        summaryHold: "Evita gastos nuevos hasta cerrar el mes",
        summarySafe: "Por ahora no necesitas ajustar",
        lineCriticalTitle: "Frena aquí",
        lineCriticalCopy: "Evita gastos nuevos en este tramo.",
        lineCriticalNoFloor: "No sumes gastos grandes en este tramo.",
        lineRecoveryTitle: "Aquí vuelves a respirar",
        lineRecoveryCopy: "Desde aquí puedes moverte con más calma.",
        lineStableTitle: "Aquí puedes seguir",
        lineStableCopy: "Aquí puedes seguir sin apurarte.",
      },
    },

    // Facturas por pagar con foto / lectura automática
    invoice: {
      processingImage: "Procesando imagen...",
      photoReady: "Foto adjunta. Presiona “Leer factura” para intentar autocompletar datos.",
      uploadHint: "Sube una foto nítida y presiona “Leer factura”.",
      uploadFirst: "Primero sube una foto de la factura.",
      readingButton: "Leyendo...",
      readingStatus: "Leyendo la factura, puede tardar algunos segundos...",
      readButton: "Leer factura",
      readSuccessOne: "Lectura lista: completé {count} dato. Revisa antes de registrar.",
      readSuccessMany: "Lectura lista: completé {count} datos. Revisa antes de registrar.",
      readLowConfidence:
        "La lectura terminó, pero no pude detectar datos con confianza. Puedes completar los datos manualmente.",
      replaceHint:
        "Esta factura ya tiene foto adjunta. Puedes reemplazarla o volver a leerla.",
    },

    // Errores en lenguaje humano
    errors: {
      auth: {
        invalid: "Revisa correo y clave. Y vuelve a intentar.",
        emailNotConfirmed: "Confirma tu correo. Luego vuelve a entrar.",
        registered: "Ese correo ya existe. Prueba iniciar sesión.",
        emailInvalid: "Escribe un correo válido para continuar.",
        password: "La clave es muy corta. Usa 6 o más.",
        emailRequired: "Escribe tu correo. Y te mando el link.",
        passwordMismatch: "Las claves no coinciden. Revísalas.",
        samePassword: "Elige una clave distinta a la anterior.",
        recoveryExpired: "Ese enlace venció. Pide otro.",
        resetFallback: "No pude enviar el correo ahora. Inténtalo de nuevo.",
        updateFallback: "No pude cambiar la clave ahora. Pide otro link.",
        fallback: "No pudimos entrar. Inténtalo de nuevo.",
      },
      logoSize: "Ese logo es muy pesado. Súbelo más liviano.",
      invoiceFileType: "Sube una foto en JPG o PNG.",
      invoiceImageHeavy: "Esa foto pesa mucho. Súbela más liviana.",
      invoiceImageFallback: "No pudimos cargar esa foto. Prueba otra.",
      invoiceOcrUnavailable: "No pude leer la factura ahora. Inténtalo de nuevo.",
      invoiceOcrRead: "No la pude leer bien. Completa los datos a mano.",
      partialAmount: "Revisa el abono. Debe ser válido.",
      saveSync: "No se pudo guardar ahora. Inténtalo de nuevo.",
      loadData: "No pudimos cargar tus datos. Reintenta.",
      pdfPopup: "No se abrió el PDF. Activa ventanas emergentes.",
      fallback: "No salió como esperábamos. Inténtalo de nuevo.",
    },

    // Estados de cuentas por cobrar / pagar
    statuses: {
      pending: "Pendiente",
      partial: "Abono parcial",
      scheduled: "Programada",
      paid: "Pagada",
    },

    // Categorías del formulario de movimientos
    categories: {
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
    },

    // Estados de salud del dinero
    health: {
      labels: {
        risk: "Vas justa",
        warn: "Ajustado",
        ok: "Vas bien",
        neutral: "Sin datos",
      },
      descriptions: {
        risk: "Evita gastos nuevos hoy.",
        warn: "Mejor espera antes de gastar.",
        ok: "Puedes gastar sin problema hoy.",
        neutral: "Agrega un movimiento. Y te digo qué hacer.",
      },
      home: {
        ok: "Puedes gastar hoy",
        warn: "Mejor espera antes de gastar",
        risk: "Evita gastar hoy",
        neutral: "Agrega un movimiento",
      },
    },

    // Asistente financiero
    advice: {
      lowCash: "Prioriza cobrar antes de gastar.",
      negativeNet: "Frena {category} antes de gastar más.",
      payablesHeavy: "Ordena pagos primero. Luego decide.",
      recurring: "Puedes usar {amount} esta semana. No más.",
      invest: "Puedes mover {amount}. Sin tocar tu mínimo.",
    },

    // Desbloqueo progresivo de funciones
    featureUnlocks: {
      projectionTitle: "Proyección",
      projectionOne: "Agrega {count} más y te digo cómo cerrar el mes.",
      projectionMany: "Agrega {count} más y te digo cómo cerrar el mes.",
      projectionFallback: "Sigue registrando y te diré si conviene gastar.",
      detailTitle: "Detalle",
      detailRecurring: "Sigue registrando y te muestro dónde ajustar.",
      detailLocked: "Marca un recurrente o agrega {count} más.",
      detailFallback: "Marca un recurrente y verás dónde ajustar.",
      categoriesTitle: "Categorías",
      categoriesRecurring: "Con más uso verás qué gasto frenar.",
      categoriesLocked: "Marca un recurrente o agrega {count} más.",
      categoriesFallback: "Marca un recurrente y verás qué revisar.",
      summaryLocked: "Sigue registrando y abrimos este nivel.",
      summaryWarm: "Ya abriste detalle. Con más uso verás qué ajustar.",
      summaryReady: "Aquí ves qué conviene hacer con más contexto.",
    },

    // Bloque de mínimo seguro
    cashFloor: {
      define: "Define tu mínimo. Y te aviso cuándo frenar.",
      waiting: "Agrega más movimientos. Y te aviso a tiempo.",
      alertProjection: "Podrías bajar de {amount}. Frena gastos hoy.",
      alertWeek: "{label}: podrías bajar de {amount}.",
      safe: "Sigues sobre {amount}. Puedes seguir así hoy.",
    },

    // Recomendaciones útiles y alertas
    tips: {
      belowCashFloor: "Podrías bajar de {amount}. Cobra antes de gastar.",
      lowCashWeek: "{label}: podrías quedar en {amount}. Ajusta esa semana ahora.",
      negativeNet: "Está saliendo más de lo que entra. Frena algo hoy.",
      recurring: "Ya tienes pagos repetidos. Revísalos antes de sumar otro.",
      lowAvailable: "Hoy hay poco margen. Evita compras nuevas.",
      overdueReceivables: "Hay cobros atrasados. Escríbeles hoy.",
      dueTomorrow: "Mañana vence {document} de {name}. Déjalo listo hoy.",
      nearPayables: "Hay pagos cerca. Ordénalos antes de gastar.",
      stable: "Tu mes se ve firme. Puedes seguir así.",
      empty: "Agrega movimientos. Y te digo qué conviene.",
    },
  };

  // Estos textos se cargan automáticamente en elementos fijos del HTML.
  const STATIC_BINDINGS = {
    title: "app.documentTitle",
    ".auth-card .eyebrow": "auth.eyebrow",
    ".auth-card h1": "auth.title",
    ".auth-copy": "auth.body",
    "#authSubmitBtn": "auth.actions.signIn",
    "#toggleAuthModeBtn": "auth.actions.switchToSignUp",
    "#appHeaderScreenTitle": "header.title",
    "#mobileLogoutBtn": "header.logout",
    "#logoutBtn": "header.closeSession",
    "#connectionBannerTitle": "connection.offline.title",
    "#connectionBannerText": "connection.offline.body",
    "#connectionBannerBtn": "connection.pending.action",
    ".brand-block .eyebrow": "brand.eyebrow",
    ".brand-block h1": "brand.title",
    "#homeErrorState strong": "home.error.title",
    "#retryHomeBtn": "home.error.retry",
    "#cashFloorAlert": "cashFloor.define",
    "#homeTodayHint": "home.today.available",
    ".home-month-label": "home.monthEnd.label",
    "#projectionAlertText": "projection.empty",
    "#homeMonthEndHint": "home.monthEnd.empty",
    "#adviceText": "home.advice.initial",
    "#quickIncomeLabel": "home.quick.income",
    "#quickExpenseLabel": "home.quick.expense",
    ".home-today-header .section-label": "home.todaySection",
  };

  // Busca un texto dentro del objeto usando rutas tipo "home.today.available".
  function getValue(path) {
    return String(path || "")
      .split(".")
      .reduce((acc, key) => (acc && key in acc ? acc[key] : undefined), APP_COPY);
  }

  // Reemplaza variables dinámicas como {amount}, {count}, {month}.
  function interpolate(template, vars = {}) {
    return String(template).replace(/\{(\w+)\}/g, (_, key) =>
      Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : ""
    );
  }

  // Devuelve un texto listo para mostrarse en pantalla.
  function copyText(path, vars = {}) {
    const value = getValue(path);
    if (typeof value !== "string") {
      return "";
    }

    return interpolate(value, vars);
  }

  // Aplica textos fijos al cargar la app.
  function applyStaticCopy(root = document) {
    Object.entries(STATIC_BINDINGS).forEach(([selector, path]) => {
      const value = copyText(path);
      if (!value) {
        return;
      }

      if (selector === "title") {
        document.title = value;
        return;
      }

      const node = root.querySelector(selector);
      if (node) {
        node.textContent = value;
      }
    });
  }

  window.APP_COPY = APP_COPY;
  window.copyText = copyText;
  window.copyValue = getValue;
  window.applyStaticCopy = applyStaticCopy;
})();
