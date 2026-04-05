(() => {
  /*
   * ARCHIVO MAESTRO DE TEXTOS
   *
   * Edita aquí los textos visibles de la app.
   * Regla simple:
   * - Cambia solo el texto a la derecha de los ":".
   * - No cambies los nombres de las claves, porque la app las usa para encontrar cada texto.
   * - Los textos con {amount}, {count}, {month}, etc. se completan automáticamente.
   *
   * Ejemplo:
   * spend: "Puedes gastar hasta {amount} esta semana"
   */
  const APP_COPY = {
    // General
    app: {
      documentTitle: "Flujo Claro | Tu dinero claro. Sin estrés.",
    },

    // Acceso
    auth: {
      eyebrow: "Acceso privado",
      title: "Entra a Flujo Claro",
      body: "Crea tu cuenta o inicia sesión para guardar tu plata en la nube y ver solo tu información.",
      processing: "Procesando...",
      signUpSuccess:
        "Cuenta creada. Revisa tu correo si Supabase pide confirmación y luego inicia sesión.",
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
      title: "Tu dinero claro. Sin estrés.",
    },

    // Estado de conexión
    connection: {
      offline: {
        title: "Sin conexión",
        body: "Puedes seguir usando la app. Guardaremos los cambios automáticamente.",
      },
      syncing: {
        title: "Sincronizando",
        body: "Estamos subiendo los cambios guardados.",
      },
      pending: {
        title: "Pendiente por sincronizar",
        body: "Tus cambios ya están guardados aquí. Puedes seguir usando la app.",
        action: "Sincronizar",
      },
    },

    // Pantalla principal: Inicio
    home: {
      error: {
        title: "Ups, algo no funcionó",
        retry: "Reintentar",
        retrying: "Reintentando...",
      },
      emptyTitle: "Aún no tienes datos",
      today: {
        available: "Hoy tienes disponible",
        low: "Hoy te falta plata",
        start: "Empieza registrando tu plata de hoy",
        empty: "Empieza agregando tu primer movimiento para ver tu situación real",
        learning: "Aún estamos aprendiendo de tu dinero",
        risk: "Te estás quedando sin dinero",
        positive: "Vas bien",
      },
      monthEnd: {
        label: "Fin de mes:",
        empty: "Sin datos",
      },
      advice: {
        initial: "Agrega tu primer ingreso o gasto para ver recomendaciones claras.",
        starter: "Agrega tu primer ingreso o gasto y te diré cuánto puedes mover esta semana.",
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
        addOneMore: "Agrega {count} movimiento más para ver tu proyección",
        addManyMore: "Agrega {count} movimientos más para ver tu proyección",
      },
      risk: {
        today: "Hoy podrías tener problemas",
        inDays: "En {count} día podrías tener problemas",
        inManyDays: "En {count} días podrías tener problemas",
        month: "Si sigues así, podrías quedarte sin dinero este mes",
        soon: "Si sigues así, podrías quedarte sin dinero muy pronto",
      },
      positive: {
        hold: "Vas bien. Mantén ese margen esta semana.",
        spend: "Puedes gastar hasta {amount} esta semana",
        invest: "Vas bien. Puedes invertir {amount} sin quedar bajo tu mínimo seguro.",
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
      offlineShort: "Sin conexión. Puedes seguir usando la app.",
      offlineAutoSave: "Sin conexión. Tus cambios se guardarán automáticamente.",
      savedLocal: "Tus cambios se guardaron aquí y se subirán después.",
      synced: "Tus cambios ya quedaron sincronizados.",
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

    // Pantalla de proyección y simulador
    projection: {
      empty: "Aún no hay movimientos para proyectar.",
      criticalDay: "Día {day}: te quedas bajo tu mínimo seguro de {amount}.",
      scenarioPrompt: "Ingresa un monto para simular una venta o un gasto.",
      scenario: {
        income: "Si vendes",
        expense: "Si gastas",
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
        invalid: "Revisa tu correo y tu clave, y vuelve a intentarlo.",
        emailNotConfirmed: "Primero confirma tu correo y después vuelve a entrar.",
        registered: "Ese correo ya tiene cuenta. Prueba iniciando sesión.",
        password: "Tu clave debe tener al menos 6 caracteres.",
        fallback: "No pudimos entrar ahora. Inténtalo de nuevo.",
      },
      logoSize: "Ese logo es muy pesado. Súbelo más liviano.",
      invoiceFileType: "Sube una foto de la factura en JPG, PNG o similar.",
      invoiceImageHeavy: "Esa foto es muy pesada. Súbela más liviana o recortada.",
      invoiceImageFallback: "No pudimos cargar esa foto. Prueba con otra imagen.",
      invoiceOcrUnavailable: "No pude leer la factura ahora. Revisa tu conexión e inténtalo de nuevo.",
      invoiceOcrRead:
        "No pude leer la factura automáticamente. Puedes completar los datos a mano.",
      partialAmount: "Revisa el abono: debe ser mayor a 0 y menor que el monto total.",
      saveSync: "No pudimos guardar en la nube ahora. Vuelve a intentarlo en un momento.",
      loadData: "No pudimos cargar tu información ahora. Inténtalo de nuevo.",
      pdfPopup: "No pude abrir el PDF. Activa las ventanas emergentes e inténtalo de nuevo.",
      fallback: "No pudimos completar eso ahora. Inténtalo de nuevo.",
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
        risk: "No te alcanza",
        warn: "Ajustado",
        ok: "Vas bien",
        neutral: "Sin datos",
      },
      descriptions: {
        risk: "Ojo: te estás quedando sin caja para cerrar el mes con calma.",
        warn: "Te alcanza, pero vas justo. Conviene cuidar gastos esta semana.",
        ok: "Vas bien: tienes margen para operar y decidir sin tanta presión.",
        neutral: "Agrega tu primer movimiento para ver si te alcanza este mes.",
      },
      home: {
        ok: "Vas bien",
        warn: "Vas ajustada",
        risk: "Te falta plata",
        neutral: "Sin datos",
      },
    },

    // Asistente financiero
    advice: {
      lowCash:
        "Te estás quedando sin caja. Prioriza cobrar y frenar gastos no urgentes esta semana.",
      negativeNet: "Reduce gastos en {category} esta semana para no cerrar el mes apretado.",
      payablesHeavy:
        "Tus pagos comprometidos pesan más que tus cobros. Revisa compras nuevas antes de comprometer más plata.",
      recurring: "Puedes gastar hasta {amount} esta semana sin bajar tu mínimo seguro.",
      invest: "Vas bien. Puedes invertir {amount} sin quedar bajo tu mínimo seguro.",
    },

    // Desbloqueo progresivo de funciones
    featureUnlocks: {
      projectionTitle: "Proyección",
      projectionOne: "Agrega {count} movimiento más y verás cómo cierras el mes.",
      projectionMany: "Agrega {count} movimientos más y verás cómo cierras el mes.",
      projectionFallback: "Sigue registrando movimientos para activar tu proyección.",
      detailTitle: "Detalle",
      detailRecurring: "Tu análisis avanzado se activará al seguir registrando movimientos.",
      detailLocked: "Marca un movimiento como recurrente o agrega {count} más para abrir análisis más profundos.",
      detailFallback: "Marca un movimiento como recurrente para abrir análisis más profundos.",
      categoriesTitle: "Categorías",
      categoriesRecurring: "Tus categorías avanzadas se activarán solas con más uso.",
      categoriesLocked: "Marca un movimiento como recurrente o agrega {count} más para ver análisis por categoría.",
      categoriesFallback: "Marca un movimiento como recurrente para ver análisis por categoría.",
      summaryLocked:
        "Sigue registrando movimientos para desbloquear este nivel cuando de verdad te haga falta.",
      summaryWarm:
        "Ya abriste el detalle. Cuando uses movimientos recurrentes o tengas más uso, activaremos categorías y análisis más profundos.",
      summaryReady: "Mira ingresos, gastos y compromisos del mes con más contexto.",
    },

    // Bloque de mínimo seguro
    cashFloor: {
      define: "Define tu mínimo seguro para activar alertas.",
      waiting: "Cuando cargues movimientos, te avisaré si bajas de tu mínimo seguro.",
      alertProjection: "Alerta: la plata proyectada baja de tu mínimo seguro de {amount}.",
      alertWeek: "Alerta: {label} baja a {amount}, bajo tu mínimo seguro.",
      safe: "Tu proyección se mantiene sobre tu mínimo seguro de {amount}.",
    },

    // Recomendaciones útiles y alertas
    tips: {
      belowCashFloor:
        "Tu plata proyectada está bajo tu mínimo seguro de {amount}. Prioriza cobrar pendientes o frenar pagos no urgentes.",
      lowCashWeek:
        "{label} bajarías a {amount}, bajo tu mínimo seguro de {cashFloor}. Ajusta pagos o refuerza cobranza antes de esa semana.",
      negativeNet:
        "Tus gastos del mes superan tus ingresos. Revisa precios, frecuencia de compra o gastos que puedas postergar.",
      recurring:
        "Ya tienes varios pagos repetidos. Conviene distinguir fijos y variables para anticipar semanas más apretadas.",
      lowAvailable:
        "La plata disponible está baja para operar con holgura. Considera guardar una reserva mínima para compras y despachos.",
      overdueReceivables:
        "Tienes cuentas por cobrar vencidas. Prioriza seguimiento de clientes antes de comprometer nuevas compras.",
      dueTomorrow: "Mañana vence {document} de {name}.",
      nearPayables:
        "Hay facturas por pagar con vencimiento cercano. Programa esos pagos para evitar recargos o tensión con proveedores.",
      stable:
        "Tu plata se ve más estable este mes. Puede ser buen momento para definir cuánto invertir sin apretarte.",
      empty:
        "Carga más movimientos y vencimientos para que la aplicación pueda detectar patrones y darte recomendaciones más precisas.",
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
    "#homeTodayHint": "home.today.available",
    ".home-month-label": "home.monthEnd.label",
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
