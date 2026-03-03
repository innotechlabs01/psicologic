"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

interface Patient {
    id: string;
    name: string;
    document: string;
    email: string | null;
    marital_status: string | null;
    membership_paid: number;
    created_at: string;
    status: string;
}

export function UserManagementReact() {
    const [search, setSearch] = useState("");
    const [showInactive, setShowInactive] = useState(false);
    const [page, setPage] = useState(1);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Modals state
    const [showFormModal, setShowFormModal] = useState(false);
    const [showReactivateModal, setShowReactivateModal] = useState(false);
    const [editModeId, setEditModeId] = useState<string | null>(null);
    const [pendingReactivate, setPendingReactivate] = useState<{ id: string; name: string } | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        cedula: "",
        email: "",
        marital_status: "soltero"
    });

    const limit = 10;

    const fetchPatients = useCallback(async () => {
        setLoading(true);
        try {
            const q = encodeURIComponent(search);
            const includeInactive = showInactive ? 1 : 0;
            const url = `/api/client/patients/list?page=${page}&limit=${limit}&q=${q}&include_inactive=${includeInactive}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error("Error fetching patients");

            const json = await res.json();
            setPatients(json.data || []);
            setTotal(json.total || 0);
            setTotalPages(json.totalPages || 1);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar pacientes");
        } finally {
            setLoading(false);
        }
    }, [page, search, showInactive]);

    useEffect(() => {
        fetchPatients();
    }, [fetchPatients]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleInactiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setShowInactive(e.target.checked);
        setPage(1);
    };

    const openCreateModal = () => {
        setEditModeId(null);
        setFormData({ name: "", cedula: "", email: "", marital_status: "soltero" });
        setShowFormModal(true);
    };

    const openEditModal = async (id: string) => {
        try {
            const res = await fetch(`/api/client/patients/${id}`);
            if (!res.ok) throw new Error("Could not fetch patient");
            const json = await res.json();
            const p = json.data;
            setFormData({
                name: p.name || "",
                cedula: p.document || "",
                email: p.email || "",
                marital_status: p.marital_status || "soltero"
            });
            setEditModeId(id);
            setShowFormModal(true);
        } catch (e) {
            console.error(e);
            toast.error("Error al cargar datos del paciente");
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editModeId) {
                const res = await fetch(`/api/client/patients/${editModeId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData)
                });
                if (!res.ok) throw new Error("Error actualizando");
                toast.success("Paciente actualizado");
            } else {
                const payload = { ...formData, membership_paid: 0 };
                const res = await fetch("/api/client/patients/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error("Error al guardar");
                toast.success("Paciente registrado");
            }
            setShowFormModal(false);
            setPage(1);
            fetchPatients();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar paciente");
        }
    };

    const confirmDeactivate = async (id: string) => {
        if (!confirm("¿Marcar paciente como inactivo?")) return;
        try {
            const res = await fetch(`/api/client/patients/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "inactive" })
            });
            if (!res.ok) throw new Error("Error desactivando");
            toast.success("Paciente marcado inactivo");
            fetchPatients();
        } catch (error) {
            console.error(error);
            toast.error("Error al desactivar");
        }
    };

    const confirmReactivate = async () => {
        if (!pendingReactivate) return;
        try {
            const res = await fetch("/api/client/patients/reactivate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: pendingReactivate.id })
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || "Error reactivando");
            toast.success("Paciente reactivado");
            setShowReactivateModal(false);
            fetchPatients();
        } catch (error) {
            console.error(error);
            toast.error("Error al reactivar paciente");
        }
    };

    return (
        <div className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-[var(--color-azul-oscuro)]">
                        Pacientes agregados
                    </h2>
                    <p className="text-sm text-[var(--color-azul-oscuro)]/70">
                        Ver y administrar los pacientes que has agregado para jugar
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, cédula o email"
                        value={search}
                        onChange={handleSearchChange}
                        className="px-3 py-2 rounded-md border border-[var(--color-gris-claro)] w-full sm:w-auto text-sm"
                    />
                    <label className="flex items-center gap-2 text-sm text-[var(--color-azul-oscuro)] cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={handleInactiveChange}
                        />
                        <span>Mostrar inactivos</span>
                    </label>
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 rounded-md bg-gradient-to-r from-[var(--color-azul-principal)] to-[var(--color-morado-principal)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        Nuevo paciente
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto bg-white rounded-md shadow-sm border border-border">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 font-medium">Nombre</th>
                            <th className="px-4 py-3 font-medium">Cédula</th>
                            <th className="px-4 py-3 font-medium">Email</th>
                            <th className="px-4 py-3 font-medium">Estado civil</th>
                            <th className="px-4 py-3 font-medium">Membresía</th>
                            <th className="px-4 py-3 font-medium">Ingresado</th>
                            <th className="px-4 py-3 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    <td colSpan={7} className="px-4 py-3">
                                        <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
                                    </td>
                                </tr>
                            ))
                        ) : patients.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                    No se encontraron pacientes.
                                </td>
                            </tr>
                        ) : (
                            patients.map(p => (
                                <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-4 py-3 font-medium">{p.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{p.document}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                                    <td className="px-4 py-3 capitalize text-muted-foreground">{p.marital_status}</td>
                                    <td className="px-4 py-3">
                                        {p.membership_paid ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                Pagado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                No pagado
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(p.id)}
                                                className="px-3 py-1 rounded text-xs font-medium border border-[var(--color-azul-principal)] text-[var(--color-azul-oscuro)] hover:bg-[var(--color-azul-principal)]/10 transition-colors"
                                            >
                                                Editar
                                            </button>
                                            {p.status === "inactive" ? (
                                                <button
                                                    onClick={() => {
                                                        setPendingReactivate({ id: p.id, name: p.name });
                                                        setShowReactivateModal(true);
                                                    }}
                                                    className="px-3 py-1 rounded text-xs font-medium bg-gradient-to-r from-[var(--color-azul-principal)] to-[var(--color-morado-principal)] text-white hover:opacity-90 transition-opacity"
                                                >
                                                    Reactivar
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => confirmDeactivate(p.id)}
                                                    className="px-3 py-1 rounded text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    Desactivar
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                <div className="text-sm text-muted-foreground">
                    Página {page} de {totalPages} — {total} pacientes
                </div>
                <div className="flex gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1.5 rounded-md text-sm border border-border bg-background disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                    >
                        Anterior
                    </button>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1.5 rounded-md text-sm border border-border bg-background disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            {/* Form Modal */}
            {showFormModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-border">
                            <h3 className="text-lg font-bold text-[var(--color-azul-oscuro)]">
                                {editModeId ? "Editar paciente" : "Registrar paciente"}
                            </h3>
                        </div>
                        <form onSubmit={handleFormSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-azul-principal)]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.cedula}
                                        onChange={e => setFormData({ ...formData, cedula: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-azul-principal)]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-azul-principal)]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado civil</label>
                                    <select
                                        required
                                        value={formData.marital_status}
                                        onChange={e => setFormData({ ...formData, marital_status: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-azul-principal)]"
                                    >
                                        <option value="soltero">Soltero(a)</option>
                                        <option value="casado">Casado(a)</option>
                                        <option value="union">Unión libre</option>
                                        <option value="divorciado">Divorciado(a)</option>
                                        <option value="viudo">Viudo(a)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowFormModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-md bg-gradient-to-r from-[var(--color-azul-principal)] to-[var(--color-morado-principal)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reactivate Modal */}
            {showReactivateModal && pendingReactivate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-[var(--color-azul-oscuro)] mb-2">
                                Confirmar reactivación
                            </h3>
                            <p className="text-gray-600 mb-6">
                                ¿Estás seguro que deseas reactivar al paciente <strong>{pendingReactivate.name}</strong>?
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowReactivateModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmReactivate}
                                    className="px-4 py-2 rounded-md bg-gradient-to-r from-[var(--color-azul-principal)] to-[var(--color-morado-principal)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                                >
                                    Reactivar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
