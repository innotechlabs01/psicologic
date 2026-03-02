import React, { useState, useEffect, useCallback } from 'react';

interface ClinicalEntry {
  id: string;
  patient_id: string;
  template_id: string;
  answers: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface Patient {
  id: string;
  name: string;
  document: string;
  email: string;
}

interface Template {
  id: string;
  name: string;
  template: string;
}

function formatLabel(str: string): string {
  return str.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Fecha no disponible';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );
}

function EntryCard({ entry, template, onView, onEdit, onDelete }: { 
  entry: ClinicalEntry; 
  template: Template | null;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const parsedAnswers = entry.answers ? JSON.parse(JSON.stringify(entry.answers)) : {};
  const fields = Object.entries(parsedAnswers).slice(0, 3);
  
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-foreground">
            {template?.name || 'Historia Clínica'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDate(entry.created_at)}
          </p>
        </div>
        <div className="flex gap-1">
          <button onClick={onView} className="p-2 hover:bg-muted rounded-lg transition-colors" title="Ver">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button onClick={onEdit} className="p-2 hover:bg-muted rounded-lg transition-colors" title="Editar">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button onClick={onDelete} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors" title="Eliminar">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      {fields.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {fields.map(([key, value]) => (
              <div key={key}>
                <span className="text-xs text-muted-foreground">{formatLabel(key)}: </span>
                <span className="text-foreground">{String(value).substring(0, 30)}{String(value).length > 30 ? '...' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EntryForm({ template, answers, onSubmit, onCancel, submitLabel = 'Guardar' }: { 
  template: Template; 
  answers?: Record<string, any>;
  onSubmit: (answers: Record<string, any>) => void;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [formData, setFormData] = useState<Record<string, any>>(answers || {});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit(formData);
    setSaving(false);
  };

  let templateObj = null;
  try {
    templateObj = typeof template.template === 'string' ? JSON.parse(template.template) : template.template;
  } catch {
    templateObj = null;
  }

  const components = templateObj?.components || [];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold">{template.name || 'Historia Clínica'}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Completa los datos de la evaluación
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          {components.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay campos definidos en la plantilla
            </div>
          ) : (
            components.map((field: any) => (
              <div key={field.id} className="space-y-1.5">
                <label className="block text-sm font-medium">
                  {field.label}
                </label>

                {field.type === 'text' && (
                  <input
                    type="text"
                    value={formData[field.id] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    value={formData[field.id] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                  />
                )}

                {field.type === 'bool' && (
                  <select
                    value={formData[field.id] === true ? 'true' : formData[field.id] === false ? 'false' : ''}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value === 'true' })}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                )}

                {field.type === 'select' && (
                  <select
                    value={formData[field.id] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  >
                    <option value="">Seleccionar...</option>
                    {(field.options || []).map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
              </div>
            ))
          )}
        </form>
        
        <div className="p-6 border-t border-border flex gap-3">
          <button 
            type="button" 
            onClick={onCancel} 
            className="flex-1 px-4 py-2.5 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function EntryViewModal({ entry, template, onClose }: { 
  entry: ClinicalEntry; 
  template: Template | null;
  onClose: () => void;
}) {
  let templateObj = null;
  try {
    templateObj = template?.template ? JSON.parse(template.template) : null;
  } catch {
    templateObj = null;
  }

  const components = templateObj?.components || [];
  const answers = entry.answers || {};

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{template?.name || 'Historia Clínica'}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Fecha: {formatDate(entry.created_at)}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {components.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay campos definidos
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {components.map((field: any) => {
                const value = answers[field.id];
                const displayValue = value === undefined || value === null 
                  ? 'Sin respuesta' 
                  : typeof value === 'boolean' 
                    ? (value ? 'Sí' : 'No')
                    : String(value);

                return (
                  <div key={field.id} className="bg-muted/50 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                      {field.label}
                    </h3>
                    <p className="text-foreground whitespace-pre-wrap">{displayValue}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-border">
          <button 
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-muted rounded-lg text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClinicalHistoryManager({ patientId }: { patientId: string }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [entries, setEntries] = useState<ClinicalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [template, setTemplate] = useState<Template | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  
  const [viewEntry, setViewEntry] = useState<ClinicalEntry | null>(null);
  const [viewTemplate, setViewTemplate] = useState<Template | null>(null);
  
  const [editEntry, setEditEntry] = useState<ClinicalEntry | null>(null);
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/client/clinical/${patientId}`);
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Error al cargar');
        return;
      }
      
      setPatient(data.patient);
      setEntries(data.entries || []);
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateClick = async () => {
    setTemplateLoading(true);
    try {
      const res = await fetch('/api/client/clinical/template');
      const data = await res.json();
      
      if (data.ok) {
        setTemplate(data.template);
        setShowCreateModal(true);
      } else {
        const needsTemplate = confirm(
          `${data.message || 'No tienes un template configurado.'}\n\n¿Deseas crear uno ahora?`
        );
        if (needsTemplate) {
          window.location.href = '/client/settings/template';
        }
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error al cargar plantilla');
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleCreateSubmit = async (answers: Record<string, any>) => {
    try {
      const res = await fetch('/api/client/clinical/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId, answers })
      });
      
      const data = await res.json();
      
      if (data.ok) {
        setShowCreateModal(false);
        setTemplate(null);
        fetchData();
      } else if (data.error === 'patient_without_document') {
        const editPatient = confirm(`${data.message}\n\n¿Deseas editar el paciente ahora?`);
        if (editPatient) {
          window.location.href = `/client/users?edit=${patientId}`;
        }
      } else {
        alert(data.message || data.error || 'Error al guardar');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error de conexión');
    }
  };

  const handleViewClick = async (entry: ClinicalEntry) => {
    setViewEntry(entry);
    setViewTemplate(null);
    
    try {
      const res = await fetch(`/api/client/clinical/entry/${entry.id}`);
      const data = await res.json();
      
      if (data.ok) {
        setViewTemplate(data.template);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleEditClick = async (entry: ClinicalEntry) => {
    setEditEntry(entry);
    setEditTemplate(null);
    
    try {
      const res = await fetch(`/api/client/clinical/entry/${entry.id}`);
      const data = await res.json();
      
      if (data.ok) {
        setEditTemplate(data.template);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleEditSubmit = async (answers: Record<string, any>) => {
    if (!editEntry) return;
    
    try {
      const res = await fetch(`/api/client/clinical/entry/${editEntry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      
      const data = await res.json();
      
      if (data.ok) {
        setEditEntry(null);
        setEditTemplate(null);
        fetchData();
      } else {
        alert(data.error || 'Error al guardar');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error de conexión');
    }
  };

  const handleDelete = async (entry: ClinicalEntry) => {
    if (!confirm('¿Estás seguro de eliminar esta historia clínica?')) return;
    
    try {
      const res = await fetch(`/api/client/clinical/entry/${entry.id}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      
      if (data.ok) {
        fetchData();
      } else {
        alert(data.error || 'Error al eliminar');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error de conexión');
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-xl p-8">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Patient Header */}
      {patient && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
              {patient.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold">{patient.name}</h2>
              <p className="text-sm text-muted-foreground">
                {patient.document && `Documento: ${patient.document} • `}
                {patient.email || 'Sin correo'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Historiales Clínicos</h3>
        <button 
          onClick={handleCreateClick}
          disabled={templateLoading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {templateLoading ? (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )}
          Nueva Historia
        </button>
      </div>

      {/* Entries Grid */}
      {entries.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-4 text-muted-foreground">
            No hay historias clínicas registradas
          </p>
          <button 
            onClick={handleCreateClick}
            className="mt-4 px-4 py-2 text-primary hover:underline"
          >
            Crear primera historia
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              template={null}
              onView={() => handleViewClick(entry)}
              onEdit={() => handleEditClick(entry)}
              onDelete={() => handleDelete(entry)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && template && (
        <EntryForm
          template={template}
          onSubmit={handleCreateSubmit}
          onCancel={() => { setShowCreateModal(false); setTemplate(null); }}
          submitLabel="Crear Historia"
        />
      )}

      {/* View Modal */}
      {viewEntry && (
        <EntryViewModal
          entry={viewEntry}
          template={viewTemplate}
          onClose={() => { setViewEntry(null); setViewTemplate(null); }}
        />
      )}

      {/* Edit Modal */}
      {editEntry && editTemplate && (
        <EntryForm
          template={editTemplate}
          answers={editEntry.answers}
          onSubmit={handleEditSubmit}
          onCancel={() => { setEditEntry(null); setEditTemplate(null); }}
          submitLabel="Actualizar"
        />
      )}
    </div>
  );
}
