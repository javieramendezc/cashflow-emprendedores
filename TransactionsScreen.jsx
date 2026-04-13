"use client"

import { formatCurrencySigned } from "./formatCurrency"

const sampleTransactions = [
  { id: 1, name: "Uber", amount: -8000, time: "Hace 2 horas", date: "hoy" },
  { id: 2, name: "Venta", amount: 120000, time: "Ayer", date: "ayer" },
  { id: 3, name: "Cafe", amount: -2500, time: "Ayer", date: "ayer" },
];

function getAverageTicket(transactions) {
  const validTransactions = transactions.filter((transaction) => Number(transaction.amount));

  if (!validTransactions.length) {
    return 0;
  }

  const totalAbsoluteAmount = validTransactions.reduce(
    (total, transaction) => total + Math.abs(transaction.amount),
    0
  );

  return totalAbsoluteAmount / validTransactions.length;
}

function getImpactThreshold(transaction, averageTicket) {
  const userScale = transaction.userType === "high-volume" ? 1.35 : 1;
  const baseThreshold = averageTicket > 0 ? averageTicket * 0.45 : 20000;
  return Math.max(12000, Math.round(baseThreshold * userScale));
}

function impactLabel(transaction, averageTicket) {
  if (transaction.amount < 0) {
    if (Math.abs(transaction.amount) >= getImpactThreshold(transaction, averageTicket)) {
      return "Reduce tu margen";
    }

    return "Impacto bajo";
  }

  return "Mejora tu proyeccion";
}

function impactTone(transaction) {
  if (transaction.amount < 0) {
    return "text-gray-500";
  }

  return "text-green-600";
}

export default function TransactionsScreen({ transactions = sampleTransactions }) {
  const todayTransactions = transactions.filter((transaction) => transaction.date === "hoy");
  const yesterdayTransactions = transactions.filter((transaction) => transaction.date === "ayer");
  const averageTicket = getAverageTicket(transactions);
  const biggestExpense = todayTransactions
    .filter((transaction) => transaction.amount < 0)
    .sort((left, right) => left.amount - right.amount)[0];

  return (
    <div className="min-h-screen max-w-md mx-auto bg-[#FAFAF9] px-5 py-8">
      {biggestExpense ? (
        <div className="mb-6">
          <p className="font-medium text-gray-900">
            {"\u26a0\ufe0f"} Este gasto impacta tu semana
          </p>
          <p className="text-sm text-gray-500">
            {biggestExpense.name} {formatCurrencySigned(biggestExpense.amount, "expense")}
          </p>
        </div>
      ) : null}

      <Section title="Hoy" items={todayTransactions} averageTicket={averageTicket} />
      <Section title="Ayer" items={yesterdayTransactions} averageTicket={averageTicket} />
    </div>
  );
}

function Section({ title, items, averageTicket }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="mb-6">
      <p className="mb-3 text-xs uppercase tracking-wide text-gray-400">{title}</p>

      <div className="space-y-4">
        {items.map((transaction) => (
          <div key={transaction.id} className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-gray-900">{transaction.name}</p>
              <p className="text-xs text-gray-400">{transaction.time}</p>
              <p className={`mt-1 text-xs ${impactTone(transaction)}`}>
                {impactLabel(transaction, averageTicket)}
              </p>
            </div>

            <p
              className={`shrink-0 font-medium ${
                transaction.amount > 0 ? "text-green-600" : "text-gray-900"
              }`}
            >
              {formatCurrencySigned(
                transaction.amount,
                transaction.amount > 0 ? "income" : "expense"
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
