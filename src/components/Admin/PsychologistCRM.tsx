"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Calendar,
  HeartHandshake,
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
  CreditCard,
  MessageSquare,
  RefreshCw,
  UserCheck,
  UserX,
  Gamepad2,
  Star,
  CalendarX,
} from "lucide-react";

interface CrmKpis {
  totalPsychologists: number;
  activePsychologists: number;
  pendingApproval: number;
  deniedOrInactive: number;
  withoutSchedule: number;
  retainedPsychologists: number;
  totalPatients: number;
  totalGameUsers: number;
  totalGrantedGames: number;
  totalPaidGames: number;
  totalSessions: number;
  upcomingSessions: number;
  cancelledSessions: number;
  cancellationRate: number;
  openTickets: number;
  closedTickets: number;
  expiringSoon: number;
}

interface TopGame {
  route: string;
  name: string;
  hits: number;
}

interface FeedbackSummary {
  total: number;
  negativeCount: number;
  avgRating: number | null;
}

interface PsychologistRow {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: string;
  role: string;
  patientsCount: number;
  gameUsersCount: number;
  gameUsersPaidCount: number;
  grantedGamesCount: number;
  paidGamesCount: number;
  sessionsCount: number;
  upcomingCount: number;
  cancelledCount: number;
  hasSchedule: boolean;
  daysPending: number | null;
  paymentStatus: string;
  nextPaymentDate: string | null;
  daysToPayment: number | null;
  isPaymentExpiring: boolean;
  lastUpdated: string | null;
  createdAt: string | null;
}

type FilterKey = "all" | "active" | "pending" | "expiring" | "onboarding";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  approved: { label: "Activo", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  active: { label: "Activo", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending_approval: { label: "Pendiente", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  denied: { label: "Bloqueado", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  rejected: { label: "Rechazado", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  suspended: { label: "Suspendido", cls: "bg-zinc-100 text-zinc-700 border-zinc-200" },
};

export function PsychologistCRM() {
  const [kpis, setKpis] = useState<CrmKpis | null>(null);
  const [topGames, setTopGames] = useState<TopGame[]>([]);
  const [feedback, setFeedback] = useState<FeedbackSummary | null>(null);
  const [psychologists, setPsychologists] = useState<PsychologistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/crm", { credentials: "include" });
      if (!res.ok) throw new Error("No se pudieron cargar las métricas del CRM");
      const data = await res.json();
      setKpis(data.kpis);
      setTopGames(data.topGames || []);
      setFeedback(data.feedback || null);
      setPsychologists(data.psychologists || []);
    } catch (err: any) {
      setError(err?.message || "Error cargando CRM");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUserAction = async (userId: string, action: "approve" | "reject") => {
    setActionBusyId(userId);
    try {
      const res = await fetch(`/api/users/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("No se pudo actualizar el estado");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Error al actualizar psicólogo");
    } finally {
      setActionBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return psychologists.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (filter === "active") return p.status === "approved" || p.status === "active";
      if (filter === "pending") return p.status === "pending_approval";
      if (filter === "expiring") return p.isPaymentExpiring;
      if (filter === "onboarding") return p.patientsCount === 0 && p.sessionsCount === 0;
      return true;
    });
  }, [psychologists, search, filter]);

  const avgPatients =
    kpis && kpis.activePsychologists > 0
      ? (kpis.totalPatients / kpis.activePsychologists).toFixed(1)
      : "0";

  if (loading && !kpis) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6" />
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
            onClick={loadData}
            className="px-3 py-1 bg-white border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* KPI Grid (Etapas 1, 3, 4, 6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-5 h-5" />
            </span>
            {kpis && kpis.pendingApproval > 0 ? (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {kpis.pendingApproval} por aprobar
              </span>
            ) : (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                {kpis?.retainedPsychologists ?? 0} alta retención
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Psicólogos Activos</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-gray-900 dark:text-white">
              {kpis?.activePsychologists ?? 0}
            </span>
            <span className="text-xs font-medium text-gray-400">
              / {kpis?.totalPsychologists ?? 0} registrados
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <HeartHandshake className="w-5 h-5" />
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {avgPatients} / psicólogo
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pacientes en Plataforma</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-gray-900 dark:text-white">
              {kpis?.totalPatients ?? 0}
            </span>
            <span className="text-xs font-medium text-gray-400">
              ({kpis?.retainedPsychologists ?? 0} con &gt;3)
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
              <Calendar className="w-5 h-5" />
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700">
              {kpis?.upcomingSessions ?? 0} próximas
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sesiones Agendadas</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-gray-900 dark:text-white">
              {kpis?.totalSessions ?? 0}
            </span>
            <span className="text-xs font-medium text-gray-400">
              {kpis?.cancellationRate ?? 0}% cancelación
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {kpis?.openTickets ?? 0} tickets abiertos
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Renovaciones (≤7 días)</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-gray-900 dark:text-white">
              {kpis?.expiringSoon ?? 0}
            </span>
            <span className="text-xs font-medium text-gray-400">requieren seguimiento</span>
          </div>
        </div>
      </div>

      {/* Señales de Producto y Fricción */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Onboarding · Sin Actividad</span>
              <CalendarX className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {psychologists.filter((p) => p.patientsCount === 0 && p.sessionsCount === 0).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Psicólogos registrados que aún no han creado su primer paciente ni cita.
            </p>
          </div>
          <button
            onClick={() => setFilter("onboarding")}
            className="mt-3 text-left text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            Filtrar sin actividad →
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Etapa 5 · Juegos y Usuarios</span>
            <Gamepad2 className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xs text-gray-500 mb-2">
            <strong className="text-gray-900 dark:text-white">{kpis?.totalGameUsers ?? 0}</strong> pacientes de juegos ·{" "}
            <strong className="text-emerald-600">{kpis?.totalPaidGames ?? 0}</strong>/{kpis?.totalGrantedGames ?? 0} accesos pagados
          </p>
          {topGames.length === 0 ? (
            <p className="text-xs text-gray-400 py-3">Sin registros de uso en juegos aún.</p>
          ) : (
            <ul className="space-y-2">
              {topGames.map((g) => (
                <li key={g.route} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 capitalize">{g.name}</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold">
                    {g.hits} usos
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Etapa 6 · Feedback</span>
              <Star className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-gray-900 dark:text-white">
                {feedback?.avgRating !== null && feedback?.avgRating !== undefined ? `${feedback.avgRating} / 5` : "—"}
              </p>
              <span className="text-xs text-gray-400">({feedback?.total ?? 0} opiniones)</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {feedback && feedback.negativeCount > 0
                ? `${feedback.negativeCount} calificación(es) negativa(s) (≤2★).`
                : "Sin feedback negativo registrado."}
            </p>
          </div>
          <a href="/dashboard/feedback" className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800">
            Revisar feedback →
          </a>
        </div>
      </div>

      {/* Actionable Alerts Strip */}
      {kpis && (kpis.pendingApproval > 0 || kpis.expiringSoon > 0 || kpis.openTickets > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kpis.pendingApproval > 0 && (
            <a
              href="/admin/users"
              className="flex items-center justify-between p-4 rounded-xl bg-amber-50/70 border border-amber-200 hover:bg-amber-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-900">
                    {kpis.pendingApproval} psicólogo(s) por aprobar
                  </p>
                  <p className="text-xs text-amber-700">Revisar solicitudes de ingreso</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-800">Gestionar →</span>
            </a>
          )}

          {kpis.expiringSoon > 0 && (
            <a
              href="/dashboard/payments"
              className="flex items-center justify-between p-4 rounded-xl bg-rose-50/70 border border-rose-200 hover:bg-rose-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-rose-900">
                    {kpis.expiringSoon} suscripción(es) por vencer
                  </p>
                  <p className="text-xs text-rose-700">Revisar pagos y renovaciones</p>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-800">Ver pagos →</span>
            </a>
          )}

          {kpis.openTickets > 0 && (
            <a
              href="/dashboard/message"
              className="flex items-center justify-between p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 hover:bg-indigo-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-indigo-900">
                    {kpis.openTickets} ticket(s) de soporte abiertos
                  </p>
                  <p className="text-xs text-indigo-700">Atender consultas de psicólogos</p>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-800">Responder →</span>
            </a>
          )}
        </div>
      )}

      {/* CRM Psychologist Directory & Follow-up Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
              Seguimiento de Psicólogos
            </h2>
            <p className="text-xs text-gray-500">
              Actividad clínica agregada, configuración de horario, retención y renovación.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o correo..."
                className="pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              />
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl transition-colors"
              title="Actualizar métricas"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-5 py-3 bg-gray-50/60 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800 flex flex-wrap gap-2">
          {(
            [
              { key: "all", label: `Todos (${psychologists.length})` },
              {
                key: "active",
                label: `Activos (${psychologists.filter((p) => p.status === "approved" || p.status === "active").length})`,
              },
              {
                key: "pending",
                label: `Pendientes (${psychologists.filter((p) => p.status === "pending_approval").length})`,
              },
              {
                key: "expiring",
                label: `Por vencer (${psychologists.filter((p) => p.isPaymentExpiring).length})`,
              },
              {
                key: "onboarding",
                label: `Sin actividad (${psychologists.filter((p) => p.patientsCount === 0 && p.sessionsCount === 0).length})`,
              },
            ] as { key: FilterKey; label: string }[]
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-3.5 px-5">Psicólogo</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Pacientes</th>
                <th className="py-3.5 px-4 text-right">Usu. Juegos</th>
                <th className="py-3.5 px-4 text-right">Citas (Próx.)</th>
                <th className="py-3.5 px-4">Suscripción</th>
                <th className="py-3.5 px-5 text-right">Seguimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400 text-sm">
                    No hay psicólogos que coincidan con el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const badge = STATUS_BADGE[p.status] || {
                    label: p.status,
                    cls: "bg-gray-100 text-gray-700 border-gray-200",
                  };
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          {p.avatarUrl ? (
                            <img
                              src={p.avatarUrl}
                              alt={p.name}
                              className="w-9 h-9 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
                              {p.name.slice(0, 2)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-900 dark:text-white truncate">{p.name}</p>
                              {p.patientsCount > 3 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Alta retención
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{p.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}>
                            {badge.label}
                          </span>
                          {p.daysPending !== null && (
                            <span className="text-[11px] text-amber-700 font-medium">
                              {p.daysPending}d esperando
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-gray-800 dark:text-gray-200">
                        {p.patientsCount}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{p.gameUsersCount}</span>
                        {p.grantedGamesCount > 0 && (
                          <span className="ml-1.5 text-[11px] font-semibold text-emerald-600">
                            ({p.paidGamesCount}/{p.grantedGamesCount} pag.)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{p.sessionsCount}</span>
                        {p.upcomingCount > 0 && (
                          <span className="ml-1.5 text-xs font-semibold text-indigo-600">
                            ({p.upcomingCount})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.daysToPayment !== null ? (
                          <span
                            className={`text-xs font-semibold ${
                              p.daysToPayment <= 0
                                ? "text-rose-600"
                                : p.daysToPayment <= 7
                                ? "text-amber-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {p.daysToPayment <= 0
                              ? `Vencido (${Math.abs(p.daysToPayment)}d)`
                              : `En ${p.daysToPayment} días`}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-gray-300" />
                            Sin registro pago
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {p.status === "pending_approval" ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              disabled={actionBusyId === p.id}
                              onClick={() => handleUserAction(p.id, "approve")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Aprobar
                            </button>
                            <button
                              disabled={actionBusyId === p.id}
                              onClick={() => handleUserAction(p.id, "reject")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-50"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              Rechazar
                            </button>
                          </div>
                        ) : (
                          <a
                            href="/dashboard/payments"
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            Ver historial →
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
