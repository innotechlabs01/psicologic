import React, { useState, useEffect, useCallback } from 'react';

interface Patient {
    id: string;
    name: string;
    document: string;
    email: string;
    marital_status: string;
    status: string;
    membership_paid: number;
    created_at: string;
}

interface ApiResponse {
    data: Patient[];
    total: number;
    page: number;
    totalPages: number;
    error?: string;
}

function PatientCard({ patient, onEdit, onToggleStatus, onViewHistory }: { 
    patient: Patient; 
    onEdit: (p: Patient) => void;
    onToggleStatus: (p: Patient) => void;
    onViewHistory: (p: Patient) => void;
}) {
    const isActive = patient.status === 'active' || !patient.status;
    const hasMembership = patient.membership_paid === 1;

    return (
        <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {patient.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">{patient.name || 'Sin nombre'}</h3>
                        <p className="text-xs text-muted-foreground font-mono">{patient.document || 'Sin documento'}</p>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => onViewHistory(patient)} className="p-2 hover:bg-muted rounded-lg transition-colors" title="Historia Clínica">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </button>
                    <button onClick={() => onEdit(patient)} className="p-2 hover:bg-muted rounded-lg transition-colors" title="Editar">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                    <button onClick={() => onToggleStatus(patient)} className={`p-2 rounded-lg transition-colors ${isActive ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-500'}`} title={isActive ? 'Inactivar' : 'Activar'}>
                        {isActive ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-sm">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {isActive ? 'Activo' : 'Inactivo'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${hasMembership ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                    {hasMembership ? 'Suscripción activa' : 'Sin suscripción'}
                </span>
            </div>
            
            {patient.email && (
                <p className="mt-3 text-xs text-muted-foreground truncate">{patient.email}</p>
            )}
        </div>
    );
}

function PatientForm({ patient, onSubmit, onCancel }: { 
    patient?: Patient | null; 
    onSubmit: (data: any) => void; 
    onCancel: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: patient?.name || '',
        document: patient?.document || '',
        email: patient?.email || '',
        marital_status: patient?.marital_status || 'soltero'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSubmit(formData);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold">{patient ? 'Editar paciente' : 'Nuevo paciente'}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {patient ? 'Actualiza los datos del paciente' : 'Ingresa los datos del nuevo paciente'}
                    </p>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Nombre completo *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="Ej. Juan Pérez"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Documento *</label>
                            <input
                                type="text"
                                value={formData.document}
                                onChange={(e) => setFormData({...formData, document: e.target.value})}
                                required
                                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                placeholder="1045987123"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Estado civil</label>
                            <select
                                value={formData.marital_status}
                                onChange={(e) => setFormData({...formData, marital_status: e.target.value})}
                                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            >
                                <option value="soltero">Soltero(a)</option>
                                <option value="casado">Casado(a)</option>
                                <option value="union">Unión libre</option>
                                <option value="divorciado">Divorciado(a)</option>
                                <option value="viudo">Viudo(a)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Correo electrónico *</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="correo@ejemplo.com"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                            {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function PatientManager() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

    const fetchPatients = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '12',
                q: search,
                include_inactive: showInactive ? '1' : '0'
            });
            
            const res = await fetch(`/api/client/patients/list?${params}`);
            const data: ApiResponse = await res.json();
            
            if (!res.ok) {
                setError(data.error || 'Error al cargar');
                return;
            }
            
            setPatients(data.data || []);
            setTotalPages(data.totalPages || 1);
            setTotal(data.total || 0);
        } catch (err) {
            console.error('Error:', err);
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    }, [page, search, showInactive]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchPatients();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, showInactive]);

    useEffect(() => {
        fetchPatients();
    }, [page]);

    const handleSubmit = async (data: any) => {
        try {
            const endpoint = editingPatient 
                ? `/api/client/patients/${editingPatient.id}`
                : '/api/client/patients/create';
            
            const method = editingPatient ? 'PATCH' : 'POST';
            
            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (res.ok) {
                setModalOpen(false);
                setEditingPatient(null);
                fetchPatients();
            } else {
                const result = await res.json();
                alert(result.error || 'Error al guardar');
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Error de conexión');
        }
    };

    const handleEdit = (patient: Patient) => {
        setEditingPatient(patient);
        setModalOpen(true);
    };

    const handleToggleStatus = async (patient: Patient) => {
        const newStatus = patient.status === 'active' ? 'inactive' : 'active';
        const action = newStatus === 'inactive' ? 'inactivar' : 'activar';
        
        if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} este paciente?`)) return;
        
        try {
            if (newStatus === 'inactive') {
                await fetch(`/api/client/patients/${patient.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'inactive' })
                });
            } else {
                await fetch('/api/client/patients/reactivate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: patient.id })
                });
            }
            fetchPatients();
        } catch (err) {
            console.error('Error:', err);
            alert('Error al cambiar estado');
        }
    };

    const handleViewHistory = (patient: Patient) => {
        window.location.href = `/client/history/historias?patient=${patient.id}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-3 flex-1 w-full">
                    <div className="relative flex-1 max-w-md">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Buscar pacientes..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                        />
                    </div>
                    
                    <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background cursor-pointer hover:bg-muted text-sm whitespace-nowrap">
                        <input 
                            type="checkbox" 
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                            className="w-4 h-4 rounded" 
                        />
                        Ver inactivos
                    </label>
                </div>

                <button 
                    onClick={() => { setEditingPatient(null); setModalOpen(true); }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Nuevo paciente
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 flex-1">{error}</p>
                    <button onClick={fetchPatients} className="text-red-600 underline text-sm">Reintentar</button>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-muted"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-muted rounded w-32"></div>
                                    <div className="h-3 bg-muted rounded w-20"></div>
                                </div>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <div className="h-5 bg-muted rounded w-16"></div>
                                <div className="h-5 bg-muted rounded w-20"></div>
                            </div>
                        </div>
                    ))
                ) : patients.length === 0 ? (
                    <div className="col-span-full py-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="mt-4 text-muted-foreground">
                            {error ? 'Error al cargar' : 'No hay pacientes registrados'}
                        </p>
                    </div>
                ) : (
                    patients.map((patient) => (
                        <PatientCard 
                            key={patient.id} 
                            patient={patient} 
                            onEdit={handleEdit}
                            onToggleStatus={handleToggleStatus}
                            onViewHistory={handleViewHistory}
                        />
                    ))
                )}
            </div>

            {/* Pagination */}
            {!loading && total > 0 && (
                <div className="flex items-center justify-between border-t border-border pt-4">
                    <p className="text-sm text-muted-foreground">
                        Mostrando {patients.length} de {total} pacientes
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                        >
                            Anterior
                        </button>
                        <span className="px-3 py-1.5 text-sm">
                            {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <PatientForm 
                    patient={editingPatient} 
                    onSubmit={handleSubmit}
                    onCancel={() => { setModalOpen(false); setEditingPatient(null); }}
                />
            )}
        </div>
    );
}
