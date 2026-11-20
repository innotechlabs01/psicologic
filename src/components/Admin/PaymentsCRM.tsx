"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  Search,
  RefreshCw,
  CreditCard,
  Users,
} from "lucide-react";

interface PaymentSummary {
  revenueToday: number;
  revenueMonth: number;
  revenueTotal: number;
  activeMemberships: number;
  expiringSoonCount: number;
  expiredCount: number;
  trialCount: number;
  noRecordCount: number;
  totalTransactions: number;
}

interface MembershipRow {
  userId: string;
  name: string;
  email: string;
  accountStatus: string;
  tenure: "Nuevo" | "Antiguo";
  registeredAt: string | null;
  planName: string;
  paymentStatus: string;
  membershipState: "active" | "expiring" | "expired" | "trial" | "none";
  amount: number;
  lastPaymentDate: string | null;
  nextPaymentDate: string | null;
  blockedPaymentDate: string | null;
  daysRemaining: number | null;
}

interface TransactionRow {
  id: string;
  paymentId: string;
  userId: string;
  name: string;
  email: string;
  amount: number;
  status: string;
  paymentDate: string | null;
  nextPaymentDate: string | null;
}

type ViewTab = "memberships" | "transactions";
type MembershipFilter = "all" | "expiring" | "expired" | "active" | "trial" | "none";

const STATE_BADGE: Record<MembershipRow["membershipState"], { label: string; cls: string }> = {
  active: { label: "Al día", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  expiring: { label: "Por vencer", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  expired: { label: "Vencida", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  trial: { label: "Prueba", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  none: { label: "Sin registro", cls: "bg-gray-100 text-gray-600 border-gray-200" },
};

const TX_BADGE: Record<string, { label: string; cls: string }> = {
  approved: { label: "Aprobado", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  trial: { label: "Prueba", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  pending: { label: "Pendiente", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  rejected: { label: "Rechazado", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  failed: { label: "Fallido", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
};

export function PaymentsCRM() {
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewTab>("memberships");
  const [filter, setFilter] = useState<MembershipFilter>("all");
  const [search, setSearch] = useState("");

  const loadPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/payment", { credentials: "include" });
      if (!res.ok) throw new Error("No se pudo cargar la información financiera");
      const data = await res.json();
      setSummary(data.summary);
      setMemberships(data.memberships || []);
      setTransactions(data.transactions || []);
    } catch (err: any) {
      setError(err?.message || "Error cargando pagos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const filteredMemberships = useMemo(() => {
    const q = search.trim().toLowerCase();
    return memberships.filter((m) => {
      const matches = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
      if (!matches) return false;
      if (filter === "all") return true;
      return m.membershipState === filter;
    });
  }, [memberships, search, filter]);

  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.paymentId.toLowerCase().includes(q)
      );
    });
  }, [transactions, search]);

  if (loading && !summary) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800" />
          ))}
        </div>
        <div className="h-96 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center justify-between gap-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium">
          <span>{error}</span>
          <button
            onClick={loadPayments}
            className="px-3 py-1 bg-white border border-rose-200 rounded-lg text-xs font-semibold"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Financial KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              Hoy
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ingresos del Día</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {formatCOP(summary?.revenueToday ?? 0)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarDays className="w-5 h-5" />
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              Mes actual
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ingresos del Mes</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {formatCOP(summary?.revenueMonth ?? 0)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
              <TrendingUp className="w-5 h-5" />
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {summary?.totalTransactions ?? 0} movs
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ingresos Históricos</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {formatCOP(summary?.revenueTotal ?? 0)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700">
              {summary?.expiredCount ?? 0} vencidas
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Por Vencer (≤7d)</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              {summary?.expiringSoonCount ?? 0}
            </span>
            <span className="text-xs text-gray-400">
              ({summary?.activeMemberships ?? 0} al día · {summary?.trialCount ?? 0} prueba)
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
            <button
              onClick={() => setView("memberships")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                view === "memberships"
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Membresías ({memberships.length})
            </button>
            <button
              onClick={() => setView("transactions")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                view === "transactions"
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Transacciones ({transactions.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar psicólogo, correo o ID..."
                className="pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              />
            </div>
            <button
              onClick={loadPayments}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </button>
          </div>
        </div>

        {view === "memberships" && (
          <>
            <div className="px-5 py-3 bg-gray-50/60 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800 flex flex-wrap gap-2">
              {(
                [
                  { key: "all", label: `Todos (${memberships.length})` },
                  { key: "expiring", label: `Por vencer (${summary?.expiringSoonCount ?? 0})` },
                  { key: "expired", label: `Vencidas (${summary?.expiredCount ?? 0})` },
                  { key: "active", label: `Al día (${summary?.activeMemberships ?? 0})` },
                  { key: "trial", label: `Prueba (${summary?.trialCount ?? 0})` },
                  { key: "none", label: `Sin registro (${summary?.noRecordCount ?? 0})` },
                ] as { key: MembershipFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    filter === tab.key
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="py-3.5 px-5">Psicólogo</th>
                    <th className="py-3.5 px-4">Plan / Tipo</th>
                    <th className="py-3.5 px-4">Estado Membresía</th>
                    <th className="py-3.5 px-4 text-right">Último Monto</th>
                    <th className="py-3.5 px-4">Último Pago</th>
                    <th className="py-3.5 px-4">Vencimiento</th>
                    <th className="py-3.5 px-5 text-right">Días Restantes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                  {filteredMemberships.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-gray-400 text-sm">
                        No hay membresías que coincidan con el filtro.
                      </td>
                    </tr>
                  ) : (
                    filteredMemberships.map((m) => {
                      const badge = STATE_BADGE[m.membershipState];
                      return (
                        <tr key={m.userId} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-900 dark:text-white">{m.name}</p>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                m.tenure === "Nuevo"
                                  ? "bg-indigo-50 text-indigo-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                                {m.tenure}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">{m.email}</p>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {m.planName}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-gray-800 dark:text-gray-200">
                            {m.amount > 0 ? formatCOP(m.amount) : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-gray-600 dark:text-gray-400">
                            {formatDate(m.lastPaymentDate)}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-gray-600 dark:text-gray-400">
                            {formatDate(m.nextPaymentDate)}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            {m.daysRemaining === null ? (
                              <span className="text-xs text-gray-400">—</span>
                            ) : m.daysRemaining <= 0 ? (
                              <span className="text-xs font-bold text-rose-600">
                                Vencida hace {Math.abs(m.daysRemaining)}d
                              </span>
                            ) : m.daysRemaining <= 7 ? (
                              <span className="text-xs font-bold text-amber-600">
                                {m.daysRemaining} días
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-emerald-600">
                                {m.daysRemaining} días
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {view === "transactions" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="py-3.5 px-5">Psicólogo</th>
                  <th className="py-3.5 px-4">ID Transacción</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-5 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-400 text-sm">
                      No hay transacciones registradas.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => {
                    const badge = TX_BADGE[t.status] || {
                      label: t.status,
                      cls: "bg-gray-100 text-gray-600 border-gray-200",
                    };
                    return (
                      <tr key={t.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40">
                        <td className="py-3.5 px-5">
                          <p className="font-bold text-gray-900 dark:text-white">{t.name}</p>
                          <p className="text-xs text-gray-500">{t.email}</p>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-gray-500">
                          {t.paymentId || "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-600 dark:text-gray-400">
                          {formatDate(t.paymentDate)}
                        </td>
                        <td className="py-3.5 px-5 text-right font-bold text-gray-900 dark:text-white">
                          {formatCOP(t.amount)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
