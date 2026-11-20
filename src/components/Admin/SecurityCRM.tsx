"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  RefreshCw,
  AlertTriangle,
  Activity,
} from "lucide-react";

interface SecurityAlert {
  id: string | number;
  title: string;
  message: string;
  severity: string;
  created_at: string;
}

interface DeniedLog {
  id?: string | number;
  email?: string;
  route?: string;
  created_at: string;
}

interface PsychUser {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  status: string;
  role: string;
}

export function SecurityCRM() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [deniedLogs, setDeniedLogs] = useState<DeniedLog[]>([]);
  const [users, setUsers] = useState<PsychUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [alertsRes, logsRes, usersRes] = await Promise.all([
        fetch("/api/security/admin", { credentials: "include" }),
        fetch(`/api/security/admin?since=${encodeURIComponent(since)}`, { credentials: "include" }),
        fetch("/api/users/list", { credentials: "include" }),
      ]);

      if (alertsRes.ok) {
        const aData = await alertsRes.json();
        setAlerts(aData.alerts || []);
      }
      if (logsRes.ok) {
        const lData = await logsRes.json();
        setDeniedLogs(lData.deniedLogs || []);
      }
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsers((uData.users || []).filter((u: PsychUser) => u.role !== "org:admin"));
      }
      setLastUpdated(new Date());
    } catch (e) {
      console.error("SecurityCRM error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    const timer = setInterval(loadAll, 15000);
    return () => clearInterval(timer);
  }, [loadAll]);

  const toggleAccess = async (userId: string, action: "suspend" | "approve") => {
    setBusyId(userId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/users/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Error actualizando acceso");
      setFeedback({
        type: "success",
        text: action === "suspend" ? "Acceso suspendido en tiempo real" : "Acceso reactivado",
      });
      await loadAll();
    } catch {
      setFeedback({ type: "error", text: "No se pudo cambiar el acceso del usuario" });
    } finally {
      setBusyId(null);
    }
  };

  const blockedCount = users.filter((u) => ["suspended", "denied", "rejected"].includes(u.status)).length;

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          role="alert"
          className={`px-4 py-3 rounded-xl text-sm font-semibold border ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Live Bar + KPIs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-gray-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Monitoreo en tiempo real (15s)</span>
          {lastUpdated && (
            <span className="text-gray-400 font-normal">
              · Última lectura: {lastUpdated.toLocaleTimeString("es-CO")}
            </span>
          )}
        </div>
        <button
          onClick={loadAll}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-300"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Alertas Activas</span>
            <ShieldAlert className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{alerts.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Accesos Denegados (7d)</span>
            <Activity className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{deniedLogs.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Cuentas Bloqueadas</span>
            <Lock className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{blockedCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas Activas */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <h3 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Alertas Activas
          </h3>
          {alerts.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
              <span>Sin alertas activas en el sistema.</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className={`p-4 rounded-xl border ${
                    a.severity === "high"
                      ? "bg-rose-50 border-rose-200"
                      : "bg-amber-50 border-amber-200"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-sm text-gray-900">{a.title}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        a.severity === "high" ? "bg-rose-600 text-white" : "bg-amber-600 text-white"
                      }`}
                    >
                      {a.severity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{a.message}</p>
                  <p className="text-[11px] text-gray-400 mt-2">
                    {new Date(a.created_at).toLocaleString("es-CO")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accesos Denegados */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <h3 className="text-base font-black text-gray-900 dark:text-white mb-4">
            Accesos Denegados Recientes (7 días)
          </h3>
          {deniedLogs.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No hay accesos denegados recientes.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-80 overflow-y-auto">
              {deniedLogs.map((l, idx) => (
                <div key={l.id ?? idx} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {l.email || "Usuario sin email"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {l.route || "/"} · {new Date(l.created_at).toLocaleString("es-CO")}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 shrink-0">
                    Denegado
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Control Rápido de Acceso por Psicólogo */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-base font-black text-gray-900 dark:text-white">
            Control Rápido de Acceso por Psicólogo
          </h3>
          <p className="text-xs text-gray-500">
            Suspende o reactiva el acceso de cualquier psicólogo de forma inmediata.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-[11px] font-bold uppercase text-gray-400">
                <th className="py-3 px-5">Psicólogo</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-5 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {users.map((u) => {
                const name =
                  [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
                  u.username ||
                  u.email;
                const isBlocked = ["suspended", "denied", "rejected"].includes(u.status);
                return (
                  <tr key={u.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                    <td className="py-3 px-5">
                      <p className="font-bold text-gray-900 dark:text-white">{name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          isBlocked
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {isBlocked ? "Bloqueado" : "Activo"}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      {isBlocked ? (
                        <button
                          disabled={busyId === u.id}
                          onClick={() => toggleAccess(u.id, "approve")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          Reactivar
                        </button>
                      ) : (
                        <button
                          disabled={busyId === u.id}
                          onClick={() => toggleAccess(u.id, "suspend")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-50"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Bloquear
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
